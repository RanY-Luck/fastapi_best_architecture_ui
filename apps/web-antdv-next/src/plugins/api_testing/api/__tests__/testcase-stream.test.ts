import { afterEach, describe, expect, it, vi } from 'vitest';

const accessStoreMock = vi.hoisted(() => ({
  accessToken: 'token' as null | string,
  accessSessionUuid: null as null | string,
  setAccessSessionUuid: vi.fn((sessionUuid: null | string) => {
    accessStoreMock.accessSessionUuid = sessionUuid;
  }),
  setAccessToken: vi.fn((token: null | string) => {
    accessStoreMock.accessToken = token;
  }),
}));

const requestClientMock = vi.hoisted(() => ({
  getBaseUrl: vi.fn(),
  instance: {
    defaults: {
      withCredentials: false,
    },
  },
}));

const authApiMocks = vi.hoisted(() => ({
  refreshTokenApi: vi.fn(),
}));

vi.mock('@vben/preferences', () => ({
  preferences: {
    app: {
      enableRefreshToken: true,
      locale: 'zh-CN',
    },
  },
}));

vi.mock('@vben/stores', () => ({
  useAccessStore: () => accessStoreMock,
}));

vi.mock('#/api/request', () => ({
  requestClient: requestClientMock,
}));

vi.mock('#/api/core/auth', () => ({
  refreshTokenApi: authApiMocks.refreshTokenApi,
}));

import { executeTestCaseStreamApi } from '../testcase';

describe('executeTestCaseStreamApi', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    accessStoreMock.accessToken = 'token';
    accessStoreMock.accessSessionUuid = null;
    requestClientMock.getBaseUrl.mockReset();
    requestClientMock.instance.defaults.withCredentials = false;
  });

  it('parses ndjson events and preserves unicode/newlines', async () => {
    requestClientMock.getBaseUrl.mockReturnValue('http://localhost:8000');

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        [
          JSON.stringify({ type: 'run_start', total_steps: 1 }),
          JSON.stringify({ type: 'step_end', message: '完成\n下一行', label: '中文' }),
          JSON.stringify({ type: 'run_end', report_id: 99, success: true }),
        ].join('\n') + '\n',
        {
          status: 200,
          headers: { 'Content-Type': 'application/x-ndjson' },
        },
      ),
    );
    const body =
      [
        JSON.stringify({ type: 'run_start', total_steps: 1 }),
        JSON.stringify({ type: 'step_end', message: '完成\n下一行', label: '中文' }),
        JSON.stringify({ type: 'run_end', report_id: 99, success: true }),
      ].join('\n') + '\n';

    fetchMock.mockResolvedValueOnce(
      new Response(body, {
        status: 200,
        headers: { 'Content-Type': 'application/x-ndjson' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const events = await executeTestCaseStreamApi(7);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/api_testing/test_cases/7/execute/stream',
      expect.objectContaining({
        method: 'POST',
      }),
    );
    expect(events.map((event) => event.type)).toEqual([
      'run_start',
      'step_end',
      'run_end',
    ]);
    expect(events[1]?.message).toBe('完成\n下一行');
    expect(events[2]?.report_id).toBe(99);
    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer token');
    expect(headers.get('Accept-Language')).toBe('zh-CN');
  });

  it('throws when stream terminates with an error event', async () => {
    requestClientMock.getBaseUrl.mockReturnValue('http://localhost:8000');
    const body =
      `${JSON.stringify({ type: 'run_start' })}\n` +
      `${JSON.stringify({ type: 'error', message: 'boom', error_type: 'RuntimeError' })}\n`;

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(body, {
          status: 200,
          headers: { 'Content-Type': 'application/x-ndjson' },
        }),
      ),
    );

    await expect(executeTestCaseStreamApi(9)).rejects.toThrow('boom');
  });

  it('reports the terminal error event to the callback before rejecting', async () => {
    requestClientMock.getBaseUrl.mockReturnValue('http://localhost:8000');
    const onEvent = vi.fn();
    const body =
      `${JSON.stringify({ type: 'run_start', total_steps: 1 })}\n` +
      `${JSON.stringify({ type: 'error', message: 'boom', error_type: 'RuntimeError' })}\n`;

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(body, {
          status: 200,
          headers: { 'Content-Type': 'application/x-ndjson' },
        }),
      ),
    );

    await expect(executeTestCaseStreamApi(9, undefined, onEvent)).rejects.toThrow(
      'boom',
    );
    expect(onEvent.mock.calls.map(([event]) => event.type)).toEqual([
      'run_start',
      'error',
    ]);
    expect(onEvent.mock.calls[1]?.[0]).toMatchObject({
      error_type: 'RuntimeError',
      message: 'boom',
      type: 'error',
    });
  });

  it('reports streamed events to a callback and keeps the final line without a trailing newline', async () => {
    requestClientMock.getBaseUrl.mockReturnValue('http://localhost:8000');
    const onEvent = vi.fn();
    const body = [
      JSON.stringify({ type: 'run_start', total_steps: 1 }),
      JSON.stringify({ type: 'run_end', report_id: 100, success: true }),
    ].join('\n');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(body, {
          status: 200,
          headers: { 'Content-Type': 'application/x-ndjson' },
        }),
      ),
    );

    const events = await executeTestCaseStreamApi(7, undefined, onEvent);

    expect(events.map((event) => event.type)).toEqual(['run_start', 'run_end']);
    expect(events[1]?.report_id).toBe(100);
    expect(onEvent).toHaveBeenCalledTimes(2);
    expect(onEvent.mock.calls.map(([event]) => event.type)).toEqual([
      'run_start',
      'run_end',
    ]);
  });

  it('omits nullish headers resolved by request interceptors', async () => {
    requestClientMock.getBaseUrl.mockReturnValue('http://localhost:8000');
    accessStoreMock.accessToken = null;

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        `${JSON.stringify({ type: 'run_start' })}\n${JSON.stringify({ type: 'run_end', report_id: 1, success: true })}\n`,
        {
          status: 200,
          headers: { 'Content-Type': 'application/x-ndjson' },
        },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    await executeTestCaseStreamApi(7);

    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Headers;
    expect(headers.has('Authorization')).toBe(false);
    expect(headers.get('Accept-Language')).toBe('zh-CN');
  });

  it('passes an abort signal to fetch', async () => {
    requestClientMock.getBaseUrl.mockReturnValue('http://localhost:8000');
    const controller = new AbortController();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        `${JSON.stringify({ type: 'run_start' })}\n${JSON.stringify({ type: 'run_end', report_id: 1, success: true })}\n`,
        {
          status: 200,
          headers: { 'Content-Type': 'application/x-ndjson' },
        },
      ),
    );

    vi.stubGlobal('fetch', fetchMock);

    await executeTestCaseStreamApi(7, undefined, undefined, controller.signal);

    expect(fetchMock.mock.calls[0]?.[1]?.signal).toBe(controller.signal);
  });

  it('rejects when the stream ends before a terminal run_end event', async () => {
    requestClientMock.getBaseUrl.mockReturnValue('http://localhost:8000');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(`${JSON.stringify({ type: 'run_start' })}\n`, {
          status: 200,
          headers: { 'Content-Type': 'application/x-ndjson' },
        }),
      ),
    );

    await expect(executeTestCaseStreamApi(1)).rejects.toThrow(
      'Stream ended before completion',
    );
  });

  it('refreshes the token and retries once after a 401 response', async () => {
    requestClientMock.getBaseUrl.mockReturnValue('http://localhost:8000');
    authApiMocks.refreshTokenApi.mockResolvedValue({
      access_token: 'fresh-token',
      session_uuid: 'session-2',
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 401 }))
      .mockResolvedValueOnce(
        new Response(
          `${JSON.stringify({ type: 'run_start' })}\n${JSON.stringify({ type: 'run_end', report_id: 9, success: true })}\n`,
          {
            status: 200,
            headers: { 'Content-Type': 'application/x-ndjson' },
          },
        ),
      );

    vi.stubGlobal('fetch', fetchMock);

    const events = await executeTestCaseStreamApi(1);

    expect(authApiMocks.refreshTokenApi).toHaveBeenCalledTimes(1);
    expect(accessStoreMock.setAccessToken).toHaveBeenCalledWith('fresh-token');
    expect(accessStoreMock.setAccessSessionUuid).toHaveBeenCalledWith(
      'session-2',
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const retriedHeaders = fetchMock.mock.calls[1]?.[1]?.headers as Headers;
    expect(retriedHeaders.get('Authorization')).toBe('Bearer fresh-token');
    expect(events.at(-1)?.type).toBe('run_end');
  });

  it('clears stale auth state when token refresh fails', async () => {
    requestClientMock.getBaseUrl.mockReturnValue('http://localhost:8000');
    authApiMocks.refreshTokenApi.mockRejectedValue(new Error('refresh failed'));

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('', { status: 401 })),
    );

    await expect(executeTestCaseStreamApi(1)).rejects.toThrow(
      'Stream request failed: 401',
    );
    expect(accessStoreMock.setAccessToken).toHaveBeenCalledWith(null);
    expect(accessStoreMock.setAccessSessionUuid).toHaveBeenCalledWith(null);
  });

  it('rejects on malformed ndjson lines with a stable error message', async () => {
    requestClientMock.getBaseUrl.mockReturnValue('http://localhost:8000');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('{"type":"run_start"}\nnot-json\n', {
          status: 200,
          headers: { 'Content-Type': 'application/x-ndjson' },
        }),
      ),
    );

    await expect(executeTestCaseStreamApi(1)).rejects.toThrow(
      'Invalid stream payload',
    );
  });
});
