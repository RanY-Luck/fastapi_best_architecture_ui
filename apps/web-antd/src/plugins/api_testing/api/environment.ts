import type {
  Environment,
  EnvironmentCreateParams,
  EnvironmentUpdateParams,
  ProcessTemplateParams,
  ProcessTemplateResult,
  Variable,
  VariableCreateParams,
  VariableScope,
} from './types';

/**
 * 环境和变量管理相关接口
 */
import { requestClient } from '#/api/request';

const API_PREFIX = '/api/v1/api_testing/environments';

// ==================== 环境管理接口 ====================

/**
 * 创建环境
 */
export async function createEnvironmentApi(data: EnvironmentCreateParams) {
  return requestClient.post<Environment>(API_PREFIX, data);
}

/**
 * 获取环境信息
 */
export async function getEnvironmentDetailApi(id: number) {
  return requestClient.get<Environment>(`${API_PREFIX}/${id}`);
}

/**
 * 更新环境信息
 */
export async function updateEnvironmentApi(
  id: number,
  data: EnvironmentUpdateParams,
) {
  return requestClient.put<Environment>(`${API_PREFIX}/${id}`, data);
}

/**
 * 删除环境
 */
export async function deleteEnvironmentApi(id: number) {
  return requestClient.delete<string>(`${API_PREFIX}/${id}`);
}

/**
 * 获取环境列表
 */
export async function getEnvironmentListApi(projectId: number) {
  return requestClient.get<Environment[]>(API_PREFIX, {
    params: { project_id: projectId },
  });
}

/**
 * 获取默认环境
 */
export async function getDefaultEnvironmentApi(projectId: number) {
  return requestClient.get<Environment>(`${API_PREFIX}/default/${projectId}`);
}

/**
 * 设置默认环境
 */
export async function setDefaultEnvironmentApi(
  projectId: number,
  environmentId: number,
) {
  return requestClient.put<string>(
    `${API_PREFIX}/${environmentId}/default`,
    null,
    { params: { project_id: projectId } },
  );
}

// ==================== 变量管理接口 ====================

/**
 * 创建变量
 */
export async function createVariableApi(data: VariableCreateParams) {
  return requestClient.post<Variable>(`${API_PREFIX}/variables`, data);
}

/**
 * 获取变量列表
 */
export async function getVariableListApi(params: {
  case_id?: number;
  environment_id?: number;
  project_id?: number;
  scope: VariableScope;
}) {
  return requestClient.get<Variable[]>(`${API_PREFIX}/variables/`, { params });
}

/**
 * 获取变量
 */
export async function getVariableDetailApi(params: {
  case_id?: number;
  environment_id?: number;
  name: string;
  project_id?: number;
  scope: VariableScope;
}) {
  return requestClient.get<Variable>(`${API_PREFIX}/variables/${params.name}`, {
    params: {
      scope: params.scope,
      project_id: params.project_id,
      environment_id: params.environment_id,
      case_id: params.case_id,
    },
  });
}

/**
 * 删除变量
 */
export async function deleteVariableApi(params: {
  case_id?: number;
  environment_id?: number;
  name: string;
  project_id?: number;
  scope: VariableScope;
}) {
  return requestClient.delete<string>(
    `${API_PREFIX}/variables/${params.name}`,
    {
      params: {
        scope: params.scope,
        project_id: params.project_id,
        environment_id: params.environment_id,
        case_id: params.case_id,
      },
    },
  );
}

/**
 * 处理变量模板
 */
export async function processTemplateApi(data: ProcessTemplateParams) {
  return requestClient.post<ProcessTemplateResult>(
    `${API_PREFIX}/variables/process-template`,
    data,
  );
}
