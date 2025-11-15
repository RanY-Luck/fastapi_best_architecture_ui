import type {
  PageResult,
  StepReorderParams,
  TestStep,
  TestStepCreateParams,
  TestStepParams,
  TestStepUpdateParams,
} from './types';

/**
 * 测试步骤管理相关接口
 */
import { requestClient } from '#/api/request';

const API_PREFIX = '/api/v1/api_testing/test_steps';

/**
 * 获取测试步骤列表
 */
export async function getTestStepListApi(params?: TestStepParams) {
  return requestClient.get<PageResult<TestStep>>(API_PREFIX, { params });
}

/**
 * 获取测试步骤详情
 */
export async function getTestStepDetailApi(id: number) {
  return requestClient.get<TestStep>(`${API_PREFIX}/${id}`);
}

/**
 * 创建测试步骤
 */
export async function createTestStepApi(data: TestStepCreateParams) {
  return requestClient.post<TestStep>(API_PREFIX, data);
}

/**
 * 更新测试步骤
 */
export async function updateTestStepApi(
  id: number,
  data: TestStepUpdateParams,
) {
  return requestClient.put<TestStep>(`${API_PREFIX}/${id}`, data);
}

/**
 * 删除测试步骤
 */
export async function deleteTestStepApi(id: number) {
  return requestClient.delete<string>(`${API_PREFIX}/${id}`);
}

/**
 * 根据测试用例ID获取测试步骤列表
 */
export async function getTestStepsByCaseApi(caseId: number) {
  return requestClient.get<TestStep[]>(`${API_PREFIX}`, {
    params: { test_case_id: caseId, status: 1, size: 1000 },
  });
}

/**
 * 重新排序测试步骤
 */
export async function reorderTestStepsApi(data: StepReorderParams) {
  return requestClient.post<string>(`${API_PREFIX}/reorder`, data);
}

/**
 * 执行单个测试步骤
 */
export async function executeTestStepApi(id: number) {
  return requestClient.post<any>(`${API_PREFIX}/${id}/execute`);
}
