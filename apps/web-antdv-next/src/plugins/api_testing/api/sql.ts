import type {
  SqlExecutionRequest,
  SqlTaskStatusResponse,
  SqlTaskSubmitResponse,
} from './types';

import { requestClient } from '#/api/request';

const API_PREFIX = '/api/v1/api_testing/sql';

export async function executeSqlQueryApi(data: SqlExecutionRequest) {
  return requestClient.post<SqlTaskSubmitResponse>(`${API_PREFIX}/execute`, data);
}

export async function executeBatchSqlQueryApi(data: SqlExecutionRequest[]) {
  return requestClient.post<{
    results: SqlTaskSubmitResponse[];
    summary: { pending: number; total: number };
  }>(`${API_PREFIX}/batch-execute`, data);
}

export async function getSqlTaskStatusApi(taskId: string) {
  return requestClient.get<SqlTaskStatusResponse>(`${API_PREFIX}/tasks/${taskId}`);
}
