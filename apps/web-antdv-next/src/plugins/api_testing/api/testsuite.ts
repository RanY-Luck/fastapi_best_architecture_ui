import type {
  BatchExecutionParams,
  BatchExecutionReport,
  BatchExecutionReportParams,
  BatchExecutionResponse,
  PageResult,
  TestSuite,
  TestSuiteCreateParams,
  TestSuiteParams,
  TestSuiteUpdateParams,
} from './types';

import { requestClient } from '#/api/request';

const SUITE_API_PREFIX = '/api/v1/api_testing/test_suites';
const BATCH_REPORT_API_PREFIX = '/api/v1/api_testing/test_reports/batch';

export async function getTestSuiteListApi(params?: TestSuiteParams) {
  return requestClient.get<PageResult<TestSuite>>(SUITE_API_PREFIX, { params });
}

export async function getTestSuiteDetailApi(id: number) {
  return requestClient.get<TestSuite>(`${SUITE_API_PREFIX}/${id}`);
}

export async function createTestSuiteApi(data: TestSuiteCreateParams) {
  return requestClient.post<TestSuite>(SUITE_API_PREFIX, data);
}

export async function updateTestSuiteApi(
  id: number,
  data: TestSuiteUpdateParams,
) {
  return requestClient.put<TestSuite>(`${SUITE_API_PREFIX}/${id}`, data);
}

export async function deleteTestSuiteApi(id: number) {
  return requestClient.delete<string>(`${SUITE_API_PREFIX}/${id}`);
}

export async function executeTestSuiteApi(
  id: number,
  data: BatchExecutionParams,
) {
  return requestClient.post<BatchExecutionResponse>(
    `${SUITE_API_PREFIX}/${id}/execute`,
    data,
  );
}

export async function getBatchExecutionReportListApi(
  params?: BatchExecutionReportParams,
) {
  return requestClient.get<PageResult<BatchExecutionReport>>(
    BATCH_REPORT_API_PREFIX,
    { params },
  );
}

export async function getTestSuiteCasesApi(id: number) {
  return requestClient.get<Array<{ id: number; name: string; order: number; status: number }>>(
    `${SUITE_API_PREFIX}/${id}/cases`,
  );
}

export async function getBatchExecutionReportDetailApi(id: number) {
  return requestClient.get<BatchExecutionReport>(
    `${BATCH_REPORT_API_PREFIX}/${id}`,
  );
}
