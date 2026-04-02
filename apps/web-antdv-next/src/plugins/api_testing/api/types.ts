export interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  message: string;
}

export interface PageParams {
  page?: number;
  size?: number;
}

export interface PageResult<T> {
  items: T[];
  links?: unknown;
  page: number;
  size: number;
  total: number;
  total_pages?: number;
}

export type SqlTaskStatus = 'failed' | 'pending' | 'running' | 'success';

export interface SqlExecutionRequest {
  db_config?: Record<string, unknown> | null;
  extract?: Record<string, string> | null;
  name: string;
  query: string;
  use_default_db?: boolean;
  validations?: Array<Record<string, unknown>> | null;
}

export interface SqlExecutionResult {
  affected_rows?: number | null;
  data?: Array<Record<string, unknown>> | null;
  error?: null | string;
  extracted_variables?: null | Record<string, unknown>;
  name: string;
  query: string;
  success: boolean;
  validation_results?: Array<Record<string, unknown>> | null;
}

export interface SqlTaskSubmitResponse {
  celery_task_id?: null | string;
  name: string;
  status: SqlTaskStatus;
  task_id: string;
}

export interface SqlTaskStatusResponse extends SqlTaskSubmitResponse {
  duration?: null | number;
  end_time?: null | string;
  error?: null | string;
  result?: null | SqlExecutionResult;
  start_time?: null | string;
}

export interface ApiProject {
  base_url: string;
  created_time: string;
  description?: string;
  headers?: Record<string, string> | null;
  id: number;
  name: string;
  status: number;
  updated_time: string;
  variables?: Record<string, unknown> | null;
}

export interface ApiProjectCreateParams {
  base_url: string;
  description?: string;
  headers?: Record<string, string> | null;
  name: string;
  status?: number;
  variables?: Record<string, unknown> | null;
}

export interface ApiProjectUpdateParams {
  base_url?: string;
  description?: string;
  headers?: Record<string, string> | null;
  name?: string;
  status?: number;
  variables?: Record<string, unknown> | null;
}

export interface ApiProjectParams extends PageParams {
  name?: string;
  status?: number;
}

export interface TestCase {
  create_time?: string;
  created_time?: string;
  description?: string;
  id: number;
  name: string;
  post_script?: string | null;
  pre_script?: string | null;
  project?: ApiProject;
  project_id: number;
  project_name?: string;
  status: number;
  update_time?: string;
  updated_time?: string;
}

export interface TestCaseCreateParams {
  description?: string;
  name: string;
  post_script?: string | null;
  pre_script?: string | null;
  project_id: number;
  status?: number;
}

export interface TestCaseUpdateParams {
  description?: string;
  name?: string;
  post_script?: string | null;
  pre_script?: string | null;
  project_id?: number;
  status?: number;
}

export interface TestCaseParams extends PageParams {
  name?: string;
  project_id?: number;
  status?: number;
}

export interface ValidationRule {
  description?: string;
  expected: unknown;
  field: string;
  operator: string;
}

export interface ExtractRule {
  description?: string;
  expression: string;
  name: string;
}

export interface SqlQuery {
  database?: string;
  description?: string;
  name: string;
  sql: string;
}

export interface TestStep {
  auth?: Record<string, unknown> | null;
  body?: Record<string, unknown> | null;
  create_time?: string;
  created_time?: string;
  extract?: ExtractRule[] | Record<string, unknown> | null;
  files?: Record<string, string> | null;
  headers?: Record<string, string> | null;
  id: number;
  method: string;
  name: string;
  order: number;
  params?: Record<string, unknown> | null;
  retry: number;
  retry_interval: number;
  status: number;
  test_case?: TestCase;
  test_case_id: number;
  test_case_name?: string;
  timeout: number;
  update_time?: string;
  updated_time?: string;
  url: string;
  validate?: ValidationRule[] | null;
  validations?: ValidationRule[] | null;
  sql_queries?: SqlQuery[] | Record<string, unknown>[] | null;
}

export interface TestStepCreateParams {
  auth?: Record<string, unknown> | null;
  body?: Record<string, unknown> | null;
  extract?: ExtractRule[] | Record<string, unknown> | null;
  files?: Record<string, string> | null;
  headers?: Record<string, string> | null;
  method: string;
  name: string;
  order: number;
  params?: Record<string, unknown> | null;
  retry?: number;
  retry_interval?: number;
  sql_queries?: SqlQuery[] | Record<string, unknown>[] | null;
  status?: number;
  test_case_id: number;
  timeout?: number;
  url: string;
  validations?: ValidationRule[] | Record<string, unknown>[] | null;
}

export interface TestStepUpdateParams {
  auth?: Record<string, unknown> | null;
  body?: Record<string, unknown> | null;
  extract?: ExtractRule[] | Record<string, unknown> | null;
  files?: Record<string, string> | null;
  headers?: Record<string, string> | null;
  method?: string;
  name?: string;
  order?: number;
  params?: Record<string, unknown> | null;
  retry?: number;
  retry_interval?: number;
  sql_queries?: SqlQuery[] | Record<string, unknown>[] | null;
  status?: number;
  test_case_id?: number;
  timeout?: number;
  url?: string;
  validations?: ValidationRule[] | Record<string, unknown>[] | null;
}

export interface TestStepParams extends PageParams {
  name?: string;
  status?: number;
  test_case_id?: number;
}

export interface TestReport {
  create_time?: string;
  created_time?: string;
  details: Record<string, any>;
  duration: number;
  end_time: string;
  fail_steps: number;
  id: number;
  name: string;
  report_id?: number;
  start_time: string;
  success: boolean;
  success_steps: number;
  test_case?: TestCase;
  test_case_id: number;
  test_case_name: string;
  total_steps: number;
  update_time?: string;
  updated_time?: string;
}

export interface TestReportParams extends PageParams {
  end_date?: string;
  report_id?: number;
  start_date?: string;
  success?: boolean;
  success_only?: string;
  test_case_id?: number;
}

export interface BatchExecutionParams {
  environment_id?: number | null;
  max_concurrency: number;
}

export interface BatchExecutionResultItem {
  case_id: number;
  duration?: number;
  end_time?: string;
  error?: string;
  fail_steps?: number;
  report_id?: number | null;
  report_name?: string;
  start_time?: string;
  success: boolean;
  success_steps?: number;
  test_case_name?: string;
  total_steps?: number;
}

export interface BatchExecutionResponse {
  batch_report_id: number;
  duration: number;
  end_time: string;
  fail_cases: number;
  max_concurrency: number;
  name: string;
  project_id: number;
  report_ids: number[];
  results: BatchExecutionResultItem[];
  start_time: string;
  success: boolean;
  success_cases: number;
  suite_id?: number | null;
  target_id: number;
  target_type: 'project' | 'suite';
  total_cases: number;
}

export interface BatchExecutionReport extends BatchExecutionResponse {
  created_time: string;
  details: {
    report_ids?: number[];
    results?: BatchExecutionResultItem[];
    [key: string]: any;
  };
  id: number;
  project_name?: string;
  suite_name?: string;
}

export interface BatchExecutionReportParams extends PageParams {
  end_date?: string;
  project_id?: number;
  start_date?: string;
  success_only?: boolean | string;
  suite_id?: number;
  target_type?: 'project' | 'suite';
}

export type TestCaseStreamEventType =
  | 'error'
  | 'run_end'
  | 'run_start'
  | 'step_assertion'
  | 'step_end'
  | 'step_extract'
  | 'step_request'
  | 'step_response'
  | 'step_sql'
  | 'step_start';

export interface TestCaseStreamEvent {
  case_id?: number;
  duration?: number;
  environment_id?: null | number;
  error_type?: string;
  message?: string;
  report_id?: number;
  report_name?: string;
  step_name?: string;
  step_order?: number;
  success?: boolean;
  timestamp?: string;
  total_steps?: number;
  type: TestCaseStreamEventType;
  [key: string]: unknown;
}

export interface TestSuite {
  case_count: number;
  case_ids: number[];
  created_time: string;
  description?: string;
  id: number;
  name: string;
  project_id: number;
  project_name?: string;
  status: number;
  updated_time: string;
}

export interface TestSuiteCreateParams {
  case_ids: number[];
  description?: string;
  name: string;
  project_id: number;
  status?: number;
}

export interface TestSuiteUpdateParams {
  case_ids?: number[];
  description?: string;
  name?: string;
  project_id?: number;
  status?: number;
}

export interface TestSuiteParams extends PageParams {
  name?: string;
  project_id?: number;
  status?: number;
  skip?: number;
  limit?: number;
}

export enum HttpMethod {
  DELETE = 'DELETE',
  GET = 'GET',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
  PATCH = 'PATCH',
  POST = 'POST',
  PUT = 'PUT',
}

export enum Status {
  DISABLED = 0,
  ENABLED = 1,
}

export interface TestExecutionResult {
  error_message?: string;
  response_data?: unknown;
  response_time: number;
  status_code?: number;
  step_id: number;
  step_name: string;
  success: boolean;
  validations?: Array<{
    actual?: unknown;
    message?: string;
    rule: ValidationRule;
    success: boolean;
  }>;
}

export interface StepReorderParams {
  step_orders: Array<{
    order: number;
    step_id: number;
  }>;
}

export enum VariableScope {
  CASE = 'case',
  ENVIRONMENT = 'environment',
  GLOBAL = 'global',
  PROJECT = 'project',
}

export type VariableScopeType = 'case' | 'environment' | 'global' | 'project';

export interface Environment {
  created_time: string;
  description?: string;
  id: number;
  is_default: boolean;
  name: string;
  project_id: number;
  project_name?: string;
  status: number;
  updated_time: string;
  variable_count?: number;
  variables?: Record<string, unknown> | null;
}

export interface EnvironmentCreateParams {
  description?: string;
  is_default?: boolean;
  name: string;
  project_id: number;
  status?: number;
  variables?: Record<string, unknown> | null;
}

export interface EnvironmentUpdateParams {
  description?: string;
  is_default?: boolean;
  name?: string;
  project_id?: number;
  status?: number;
  variables?: Record<string, unknown> | null;
}

export interface EnvironmentListParams {
  name?: string;
  project_id?: number;
  status?: number;
}

export interface Variable {
  case_id?: number;
  create_time?: string;
  created_time?: string;
  description?: string;
  environment_id?: number;
  id: number;
  is_encrypted: boolean;
  name: string;
  project_id?: number;
  scope: VariableScope | VariableScopeType;
  update_time?: string;
  updated_time?: string;
  value: unknown;
}

export interface VariableCreateParams {
  case_id?: number;
  create_time?: string;
  created_time?: string;
  description?: string;
  environment_id?: number;
  is_encrypted?: boolean;
  name: string;
  project_id?: number;
  scope: VariableScope | VariableScopeType;
  update_time?: string;
  updated_time?: string;
  value: unknown;
}

export interface VariableQueryParams {
  case_id?: number;
  environment_id?: number;
  name?: string;
  project_id?: number;
  scope: VariableScope | VariableScopeType;
}

export interface VariableDeleteParams {
  case_id?: number;
  environment_id?: number;
  name: string;
  project_id?: number;
  scope: VariableScope | VariableScopeType;
}

export interface ProcessTemplateParams {
  case_id?: number;
  environment_id?: number;
  project_id?: number;
  template: string;
  temp_variables?: Record<string, unknown>;
}

export interface ProcessTemplateResult {
  result: string;
}

export interface VariableScopeOption {
  description?: string;
  label: string;
  value: VariableScope | VariableScopeType;
}

export interface EnvironmentVariable {
  description?: string;
  key: string;
  value: unknown;
}
