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
  headers?: Record<string, string>;
  params?: Record<string, any>;
  body?: Record<string, any>;
  files?: Record<string, string>;
  auth?: Record<string, string>;
  extract?: Record<string, string>;
  validate?: Array<Record<string, any>>;
  sql_queries?: Array<Record<string, any>>;
  timeout?: number;
  retry?: number;
  retry_interval?: number;
  order: number;
  status?: number;
}

export interface TestStepUpdateParams {
  name?: string;
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  body?: Record<string, any>;
  files?: Record<string, string>;
  auth?: Record<string, string>;
  extract?: Record<string, string>;
  validate?: Array<Record<string, any>>;
  sql_queries?: Array<Record<string, any>>;
  timeout?: number;
  retry?: number;
  retry_interval?: number;
  order?: number;
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
