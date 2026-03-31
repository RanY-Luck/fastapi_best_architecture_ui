import { beforeEach, describe, expect, it, vi } from 'vitest';

const requestMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock('#/api/request', () => ({
  requestClient: requestMocks,
}));

import { executeBatchSqlQueryApi, executeSqlQueryApi, getSqlTaskStatusApi } from '../sql';

describe('sql api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('posts sql execution requests to the async endpoint', async () => {
    requestMocks.post.mockResolvedValueOnce({ task_id: 'task-1' });

    await executeSqlQueryApi({
      name: 'users',
      query: 'SELECT 1',
      use_default_db: true,
    });

    expect(requestMocks.post).toHaveBeenCalledWith('/api/v1/api_testing/sql/execute', {
      name: 'users',
      query: 'SELECT 1',
      use_default_db: true,
    });
  });

  it('posts batch sql execution requests to the async batch endpoint', async () => {
    requestMocks.post.mockResolvedValueOnce({ results: [] });

    await executeBatchSqlQueryApi([
      { name: 'users-1', query: 'SELECT 1', use_default_db: true },
      { name: 'users-2', query: 'SELECT 2', use_default_db: true },
    ]);

    expect(requestMocks.post).toHaveBeenCalledWith('/api/v1/api_testing/sql/batch-execute', [
      { name: 'users-1', query: 'SELECT 1', use_default_db: true },
      { name: 'users-2', query: 'SELECT 2', use_default_db: true },
    ]);
  });

  it('queries task status from the async sql task endpoint', async () => {
    requestMocks.get.mockResolvedValueOnce({ status: 'running' });

    await getSqlTaskStatusApi('task-1');

    expect(requestMocks.get).toHaveBeenCalledWith('/api/v1/api_testing/sql/tasks/task-1');
  });
});
