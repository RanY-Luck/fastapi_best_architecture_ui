import type {
  ApiProject,
  ApiProjectCreateParams,
  ApiProjectParams,
  ApiProjectUpdateParams,
  PageResult,
} from './types';

/**
 * API项目管理相关接口
 */
import { requestClient } from '#/api/request';

const API_PREFIX = '/api/v1/api_testing/projects';

/**
 * 获取API项目列表
 */
export async function getApiProjectListApi(params?: ApiProjectParams) {
  return requestClient.get<PageResult<ApiProject>>(API_PREFIX, { params });
}

/**
 * 获取API项目详情
 */
export async function getApiProjectDetailApi(id: number) {
  return requestClient.get<ApiProject>(`${API_PREFIX}/${id}`);
}

/**
 * 创建API项目
 */
export async function createApiProjectApi(data: ApiProjectCreateParams) {
  return requestClient.post<ApiProject>(API_PREFIX, data);
}

/**
 * 更新API项目
 */
export async function updateApiProjectApi(
  id: number,
  data: ApiProjectUpdateParams,
) {
  return requestClient.put<ApiProject>(`${API_PREFIX}/${id}`, data);
}

/**
 * 删除API项目
 */
export async function deleteApiProjectApi(id: number) {
  return requestClient.delete<string>(`${API_PREFIX}/${id}`);
}

/**
 * 获取所有启用的API项目（用于下拉选择）
 */
export async function getAllEnabledApiProjectsApi() {
  return requestClient.get<ApiProject[]>(`${API_PREFIX}`, {
    params: { status: 1, size: 1000 },
  });
}
