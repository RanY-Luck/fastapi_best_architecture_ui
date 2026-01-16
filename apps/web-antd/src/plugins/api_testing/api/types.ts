/**
 * API测试相关类型定义
 */

// 基础响应类型
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

// 分页参数
export interface PageParams {
  page?: number;
  size?: number;
}

// 分页响应
export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

// API项目相关类型
export interface ApiProject {
  id: number;
  name: string;
  description?: string;
  base_url: string;
  headers?: Record<string, string>;
  variables?: Record<string, any>;
  status: number;
  created_time: string;
  updated_time: string;
}

export interface ApiProjectCreateParams {
  name: string;
  description?: string;
  base_url: string;
  headers?: Record<string, string>;
  variables?: Record<string, any>;
  status?: number;
}

export interface ApiProjectUpdateParams {
  name?: string;
  description?: string;
  base_url?: string;
  headers?: Record<string, string>;
  variables?: Record<string, any>;
  status?: number;
}

export interface ApiProjectParams extends PageParams {
  name?: string;
  status?: number;
}

// 测试用例相关类型
export interface TestCase {
  id: number;
  name: string;
  project_id: number;
  description?: string;
  pre_script?: string;
  post_script?: string;
  status: number;
  create_time: string;
  update_time: string;
  project?: ApiProject;
}

export interface TestCaseCreateParams {
  name: { required: true; type: 'string' };
  project_id: { required: true; type: 'number' };
  description: { required: false; type: 'string' };
  pre_script: { required: false; type: 'string' };
  post_script: { required: false; type: 'string' };
  status: { required: false; type: 'number' };
}

export interface TestCaseUpdateParams {
  name?: string;
  description?: string;
  pre_script?: string;
  post_script?: string;
  status?: number;
}

export interface TestCaseParams extends PageParams {
  name?: string;
  project_id?: number;
  status?: number;
}

// 测试步骤相关类型
export interface TestStep {
  id: number;
  name: string;
  test_case_id: number;
  url: string;
  method: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  body?: Record<string, any>;
  files?: Record<string, string>;
  auth?: Record<string, string>;
  extract?: Record<string, string>;
  validate?: Array<Record<string, any>>;
  sql_queries?: Array<Record<string, any>>;
  timeout: number;
  retry: number;
  retry_interval: number;
  order: number;
  status: number;
  create_time: string;
  update_time: string;
  test_case?: TestCase;
}

export interface TestStepCreateParams {
  name: string;
  test_case_id: number;
  url: string;
  method: string;
  headers?: null | Record<string, string>;
  params?: null | Record<string, any>;
  body?: null | Record<string, any>;
  files?: null | Record<string, string>;
  auth?: null | Record<string, string>;
  extract?: null | Record<string, string>;
  validations?: Array<Record<string, any>> | null;
  sql_queries?: Array<Record<string, any>> | null;
  timeout?: number;
  retry?: number;
  retry_interval?: number;
  order: number;
  status?: number;
}

export interface TestStepUpdateParams {
  name: string;
  url: string;
  method: string;
  headers?: null | Record<string, string>;
  params?: null | Record<string, any>;
  body?: null | Record<string, any>;
  files?: null | Record<string, string>;
  auth?: null | Record<string, string>;
  extract?: null | Record<string, string>;
  validations?: Array<Record<string, any>> | null;
  sql_queries?: Array<Record<string, any>> | null;
  timeout?: number;
  retry?: number;
  retry_interval?: number;
  order: number;
  status?: number;
}

export interface TestStepParams extends PageParams {
  name?: string;
  test_case_id?: number;
  status?: number;
}

// 测试报告相关类型
export interface TestReport {
  id: number;
  test_case_id: number;
  test_case_name: string;
  report_id?: number;
  name: string;
  success: boolean;
  total_steps: number;
  success_steps: number;
  fail_steps: number;
  start_time: string;
  end_time: string;
  duration: number;
  details: Record<string, any>;
  create_time: string;
  test_case?: TestCase;
}

export interface TestReportParams extends PageParams {
  test_case_id?: number;
  report_id?: number;
  success?: boolean;
  start_date?: string;
  end_date?: string;
  success_only: string;
}

// HTTP方法枚举
export enum HttpMethod {
  DELETE = 'DELETE',
  GET = 'GET',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
  PATCH = 'PATCH',
  POST = 'POST',
  PUT = 'PUT',
}

// 状态枚举
export enum Status {
  DISABLED = 0,
  ENABLED = 1,
}

// 断言类型
export interface ValidationRule {
  field: string;
  operator: string;
  expected: any;
  description?: string;
}

// 变量提取规则
export interface ExtractRule {
  name: string;
  expression: string;
  description?: string;
}

// SQL查询配置
export interface SqlQuery {
  name: string;
  sql: string;
  database?: string;
  description?: string;
}

// 测试执行结果
export interface TestExecutionResult {
  step_id: number;
  step_name: string;
  success: boolean;
  response_time: number;
  status_code?: number;
  response_data?: any;
  error_message?: string;
  validations?: Array<{
    actual?: any;
    message?: string;
    rule: ValidationRule;
    success: boolean;
  }>;
}

// 步骤重排序参数
export interface StepReorderParams {
  step_orders: Array<{
    order: number;
    step_id: number;
  }>;
}

// ============================================================================
// 环境和变量管理相关类型定义
// ============================================================================

// ==================== 变量作用域 ====================

/**
 * 变量作用域枚举
 */
export enum VariableScope {
  CASE = 'case',
  ENVIRONMENT = 'environment',
  GLOBAL = 'global',
  PROJECT = 'project',
}

/**
 * 变量作用域类型（字符串字面量）
 */
export type VariableScopeType = 'case' | 'environment' | 'global' | 'project';

// ==================== 环境管理 ====================

/**
 * 环境实体
 */
export interface Environment {
  /** 环境ID */
  id: number;
  /** 环境名称 */
  name: string;
  /** 所属项目ID */
  project_id: number;
  /** 项目名称（用于列表显示，可选） */
  project_name?: string;
  /** 环境描述 */
  description?: string;
  /** 环境变量（JSON对象） */
  variables?: Record<string, any>;
  /** 是否为默认环境 */
  is_default: boolean;
  /** 状态：0-禁用，1-启用 */
  status: number;
  /** 创建时间 */
  created_time: string;
  /** 更新时间 */
  updated_time: string;
  /** 变量数量（计算字段，可选） */
  variable_count?: number;
}

/**
 * 创建环境参数
 */
export interface EnvironmentCreateParams {
  id: number;
  /** 环境名称 */
  name: string;
  /** 所属项目ID */
  project_id: number;
  /** 环境描述 */
  description?: string;
  /** 环境变量 */
  variables?: Record<string, any>;
  /** 是否为默认环境 */
  is_default?: boolean;
  /** 状态：0-禁用，1-启用 */
  status?: number;
}

/**
 * 更新环境参数
 */
export interface EnvironmentUpdateParams {
  /** 环境ID */
  id: number;
  /** 环境名称 */
  name?: string;
  /** 环境描述 */
  description?: string;
  /** 环境变量 */
  variables?: Record<string, any>;
  /** 是否为默认环境 */
  is_default?: boolean;
  /** 状态：0-禁用，1-启用 */
  status?: number;
}

/**
 * 环境列表查询参数
 */
export interface EnvironmentListParams {
  /** 项目ID */
  project_id: number;
  /** 环境名称（模糊查询） */
  name?: string;
  /** 状态筛选 */
  status?: number; // 1-启用, 0-停用
}

// ==================== 变量管理 ====================

/**
 * 变量实体
 */
export interface Variable {
  /** 变量ID */
  id: number;
  /** 变量名称 */
  name: string;
  /** 变量值（可以是任意类型） */
  value: any;
  /** 变量作用域 */
  scope: VariableScope | VariableScopeType;
  /** 所属项目ID（当scope为project/environment/case时） */
  project_id?: number;
  /** 所属环境ID（当scope为environment时） */
  environment_id?: number;
  /** 所属用例ID（当scope为case时） */
  case_id?: number;
  /** 变量描述 */
  description?: string;
  /** 是否加密存储 */
  is_encrypted: boolean;
  /** 创建时间 */
  created_time: string;
  /** 更新时间 */
  updated_time: string;
}

/**
 * 创建变量参数
 */
export interface VariableCreateParams {
  /** 变量名称 */
  name: string;
  /** 变量值 */
  value: any;
  /** 变量作用域 */
  scope: VariableScope | VariableScopeType;
  /** 所属项目ID */
  project_id?: number;
  /** 所属环境ID */
  environment_id?: number;
  /** 所属用例ID */
  case_id?: number;
  /** 变量描述 */
  description?: string;
  /** 是否加密存储 */
  is_encrypted?: boolean;
}

/**
 * 变量查询参数
 */
export interface VariableQueryParams {
  /** 变量作用域（必填） */
  scope: VariableScope | VariableScopeType;
  /** 所属项目ID */
  project_id?: number;
  /** 所属环境ID */
  environment_id?: number;
  /** 所属用例ID */
  case_id?: number;
  /** 变量名称（精确查询） */
  name?: string;
}

/**
 * 变量删除参数
 */
export interface VariableDeleteParams {
  /** 变量名称 */
  name: string;
  /** 变量作用域 */
  scope: VariableScope | VariableScopeType;
  /** 所属项目ID */
  project_id?: number;
  /** 所属环境ID */
  environment_id?: number;
  /** 所属用例ID */
  case_id?: number;
}

// ==================== 变量模板处理 ====================

/**
 * 处理变量模板参数
 */
export interface ProcessTemplateParams {
  /** 模板字符串（包含变量引用，如：{{variable_name}}） */
  template: string;
  /** 项目ID */
  project_id?: number;
  /** 环境ID */
  environment_id?: number;
  /** 用例ID */
  case_id?: number;
  /** 临时变量（优先级最高） */
  temp_variables?: Record<string, any>;
}

/**
 * 处理变量模板结果
 */
export interface ProcessTemplateResult {
  /** 处理后的结果字符串 */
  result: string;
}

// ==================== 辅助类型 ====================

/**
 * 变量作用域选项（用于下拉选择）
 */
export interface VariableScopeOption {
  label: string;
  value: VariableScope | VariableScopeType;
  description?: string;
}

/**
 * 环境变量键值对
 */
export interface EnvironmentVariable {
  key: string;
  value: any;
  description?: string;
}
