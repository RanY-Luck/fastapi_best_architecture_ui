import type {
  PageResult,
  TestCase,
  TestCaseCreateParams,
  TestCaseParams,
  TestCaseStreamEvent,
  TestCaseUpdateParams,
} from './types';

/**
 * 测试用例管理相关接口
 */
import { preferences } from '@vben/preferences';
import { useAccessStore } from '@vben/stores';

import { refreshTokenApi } from '#/api/core/auth';
import { requestClient } from '#/api/request';

const API_PREFIX = '/api/v1/api_testing/test_cases';

function joinRequestUrl(baseUrl: string | undefined, url: string) {
  if (!baseUrl) {
    return url;
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  if (/^https?:\/\//i.test(baseUrl)) {
    return new URL(url, baseUrl).toString();
  }

  return `${baseUrl.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`;
}

function formatToken(token: null | string) {
  return token ? `Bearer ${token}` : null;
}

function buildRequestHeaders() {
  const accessStore = useAccessStore();
  const headers = new Headers();
  const authorization = formatToken(accessStore.accessToken);

  if (authorization) {
    headers.set('Authorization', authorization);
  }

  headers.set('Accept-Language', preferences.app.locale);

  return headers;
}

function clearAuthState() {
  const accessStore = useAccessStore();
  accessStore.setAccessToken(null);
  accessStore.setAccessSessionUuid(null);
}

async function fetchStreamResponse(url: URL, signal?: AbortSignal) {
  return await fetch(url.toString(), {
    credentials: requestClient.instance.defaults.withCredentials
      ? 'include'
      : 'same-origin',
    headers: buildRequestHeaders(),
    method: 'POST',
    signal,
  });
}

function parseStreamEvent(line: string) {
  try {
    return JSON.parse(line) as TestCaseStreamEvent;
  } catch {
    throw new Error('Invalid stream payload');
  }
}

function emitStreamEvent(
  event: TestCaseStreamEvent,
  events: TestCaseStreamEvent[],
  onEvent?: (event: TestCaseStreamEvent) => void,
) {
  events.push(event);
  onEvent?.(event);

  if (event.type === 'error') {
    throw new Error(String(event.message ?? 'Stream execution failed'));
  }
}

/**
 * 获取测试用例列表
 */
export async function getTestCaseListApi(params?: TestCaseParams) {
  return requestClient.get<PageResult<TestCase>>(API_PREFIX, { params });
}

/**
 * 获取测试用例详情
 */
export async function getTestCaseDetailApi(id: number) {
  return requestClient.get<TestCase>(`${API_PREFIX}/${id}`);
}

/**
 * 创建测试用例
 */
export async function createTestCaseApi(data: TestCaseCreateParams) {
  return requestClient.post<TestCase>(API_PREFIX, data);
}

/**
 * 更新测试用例
 */
export async function updateTestCaseApi(
  id: number,
  data: TestCaseUpdateParams,
) {
  return requestClient.put<TestCase>(`${API_PREFIX}/${id}`, data);
}

/**
 * 删除测试用例
 */
export async function deleteTestCaseApi(id: number) {
  return requestClient.delete<string>(`${API_PREFIX}/${id}`);
}

/**
 * 根据项目ID获取测试用例列表
 */
export async function getTestCasesByProjectApi(projectId: number) {
  return requestClient.get<TestCase[]>(`${API_PREFIX}`, {
    params: { project_id: projectId, status: 1, limit: 1000 },
  });
}

/**
 * 执行测试用例
 */
export async function executeTestCaseApi(id: number) {
  return requestClient.post<any>(`${API_PREFIX}/${id}/execute`);
}

/**
 * 流式执行测试用例
 */
export async function executeTestCaseStreamApi(
  id: number,
  environmentId?: null | number,
  onEvent?: (event: TestCaseStreamEvent) => void,
  signal?: AbortSignal,
) {
  const streamPath = `${API_PREFIX}/${id}/execute/stream`;
  const accessStore = useAccessStore();
  const url = new URL(
    joinRequestUrl(requestClient.getBaseUrl(), streamPath),
    window.location.origin,
  );

  if (environmentId != null) {
    url.searchParams.set('environment_id', String(environmentId));
  }

  let response = await fetchStreamResponse(url, signal);

  if (response.status === 401 && preferences.app.enableRefreshToken) {
    try {
      const refreshResult = await refreshTokenApi();
      accessStore.setAccessToken(refreshResult.access_token);
      accessStore.setAccessSessionUuid(refreshResult.session_uuid);
    } catch {
      clearAuthState();
      throw new Error('Stream request failed: 401');
    }

    response = await fetchStreamResponse(url, signal);

    if (response.status === 401) {
      clearAuthState();
    }
  }

  if (!response.ok || !response.body) {
    throw new Error(`Stream request failed: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const events: TestCaseStreamEvent[] = [];
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });

    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim()) {
        continue;
      }

      const event = parseStreamEvent(line);
      emitStreamEvent(event, events, onEvent);
    }

    if (done) {
      if (buffer.trim()) {
        const event = parseStreamEvent(buffer);
        emitStreamEvent(event, events, onEvent);
      }

      if (!events.some((event) => event.type === 'run_end')) {
        throw new Error('Stream ended before completion');
      }

      break;
    }
  }

  return events;
}

/**
 * 获取所有启用的测试用例（用于下拉选择）
 */
export async function getAllEnabledTestCasesApi() {
  return requestClient.get<TestCase[]>(`${API_PREFIX}`, {
    params: { status: 1, size: 1000 },
  });
}
