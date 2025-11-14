import type { PageResult, TestReport, TestReportParams } from './types';

/**
 * 测试报告管理相关接口
 */
import { requestClient } from '#/api/request';

const API_PREFIX = '/api/v1/api_testing/test_reports';

/**
 * 获取测试报告列表
 */
export async function getTestReportListApi(params?: TestReportParams) {
  return requestClient.get<PageResult<TestReport>>(API_PREFIX, { params });
}

/**
 * 获取测试报告详情
 */
export async function getTestReportDetailApi(id: number) {
  return requestClient.get<TestReport>(`${API_PREFIX}/${id}`);
}

/**
 * 删除测试报告
 */
export async function deleteTestReportApi(id: number) {
  return requestClient.delete<string>(`${API_PREFIX}/${id}`);
}

/**
 * 根据测试用例ID获取测试报告列表
 */
export async function getTestReportsByCaseApi(caseId: number) {
  return requestClient.get<TestReport[]>(`${API_PREFIX}`, {
    params: { test_case_id: caseId, size: 1000 },
  });
}

/**
 * 导出测试报告
 */
export async function exportTestReportApi(
  id: number,
  format: 'html' | 'pdf' = 'html',
) {
  return requestClient.get<Blob>(`${API_PREFIX}/${id}/export`, {
    params: { format },
    responseType: 'blob',
  });
}
