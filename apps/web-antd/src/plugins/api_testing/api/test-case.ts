import type {
  PageResult,
  TestCase,
  TestCaseCreateParams,
  TestCaseParams,
  TestCaseUpdateParams,
} from './types';

/**
 * 测试用例管理相关接口
 */
import { requestClient } from '#/api/request';

const API_PREFIX = '/api/v1/api_testing/test_cases';

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
    params: { project_id: projectId, status: 1, size: 1000 },
  });
}

/**
 * 执行测试用例
 */
export async function executeTestCaseApi(id: number) {
  return requestClient.post<any>(`${API_PREFIX}/${id}/execute`);
}
