import { beforeEach, describe, expect, it, vi } from 'vitest';

const requestMocks = vi.hoisted(() => ({
  delete: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
}));

vi.mock('#/api/request', () => ({
  requestClient: requestMocks,
}));

import {
  executeTestSuiteApi,
  getBatchExecutionReportListApi,
  getTestSuiteListApi,
} from '../index';

describe('testsuite api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requests suite list from the suite endpoint', async () => {
    requestMocks.get.mockResolvedValueOnce({ items: [] });

    await getTestSuiteListApi({ project_id: 3, size: 20 });

    expect(requestMocks.get).toHaveBeenCalledWith(
      '/api/v1/api_testing/test_suites',
      {
        params: { project_id: 3, size: 20 },
      },
    );
  });

  it('posts suite execution to the backend endpoint', async () => {
    requestMocks.post.mockResolvedValueOnce({ batch_report_id: 1 });

    await executeTestSuiteApi(7, { max_concurrency: 3 });

    expect(requestMocks.post).toHaveBeenCalledWith(
      '/api/v1/api_testing/test_suites/7/execute',
      { max_concurrency: 3 },
    );
  });

  it('queries batch execution reports from the batch report endpoint', async () => {
    requestMocks.get.mockResolvedValueOnce({ items: [] });

    await getBatchExecutionReportListApi({ project_id: 9, target_type: 'suite' });

    expect(requestMocks.get).toHaveBeenCalledWith(
      '/api/v1/api_testing/test_reports/batch',
      {
        params: { project_id: 9, target_type: 'suite' },
      },
    );
  });
});
