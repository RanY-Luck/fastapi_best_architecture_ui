import { parseJsonInput, parseJsonInputOrRaw, stringifyJsonInput } from '#/plugins/api_testing/utils';

export type JsonEditorMode = 'json' | 'structured';
export type JsonEditorType =
  | 'auth'
  | 'body'
  | 'extract'
  | 'files'
  | 'headers'
  | 'object'
  | 'params'
  | 'sql'
  | 'validation';

export type AuthFormType = 'apiKey' | 'basic' | 'bearer' | 'none';
export type BodyFormMode = 'form-data' | 'json' | 'x-www-form-urlencoded';

export interface AuthFormState {
  apiKeyIn: string;
  apiKeyName: string;
  apiKeyValue: string;
  basicPassword: string;
  basicUsername: string;
  bearerToken: string;
  type: AuthFormType;
}

export interface BodyFormState {
  mode: BodyFormMode;
  rows: KeyValueRow[];
}

export interface KeyValueRow {
  enabled: boolean;
  id: number;
  key: string;
  value: string;
}

export interface ValidationRuleRow {
  expected: string;
  id: number;
  message: string;
  path: string;
  source: string;
  type: string;
}

export interface SqlDbConfigRow {
  database: string;
  host: string;
  password: string;
  port: string;
  type: string;
  username: string;
}

export interface SqlQueryRow {
  dbConfig: SqlDbConfigRow;
  extract: KeyValueRow[];
  id: number;
  name: string;
  query: string;
  useDefaultDb: boolean;
  validations: ValidationRuleRow[];
}

interface KeyValuePayload {
  enabled?: boolean;
  key?: string;
  value?: unknown;
}

interface BodyPayload {
  items?: KeyValuePayload[];
  mode?: BodyFormMode;
}

interface ValidationRulePayload {
  expected?: unknown;
  message?: string;
  path?: string;
  source?: string;
  type?: string;
}

interface SqlQueryPayload {
  db_config?: {
    database?: string;
    host?: string;
    password?: string;
    port?: number;
    type?: string;
    username?: string;
  };
  extract?: KeyValuePayload[] | Record<string, unknown>;
  name?: string;
  query?: string;
  use_default_db?: boolean;
  validations?: ValidationRulePayload[];
}

let nextRowId = 1;

function createRowId() {
  const id = nextRowId;
  nextRowId += 1;
  return id;
}

export function createEmptyKeyValueRow(): KeyValueRow {
  return { enabled: true, id: createRowId(), key: '', value: '' };
}

export function createEmptyValidationRow(): ValidationRuleRow {
  return {
    expected: '',
    id: createRowId(),
    message: '',
    path: '',
    source: 'json',
    type: 'equals',
  };
}

export function createEmptySqlDbConfigRow(): SqlDbConfigRow {
  return {
    database: '',
    host: '',
    password: '',
    port: '',
    type: 'mysql',
    username: '',
  };
}

export function createEmptySqlQueryRow(): SqlQueryRow {
  return {
    dbConfig: createEmptySqlDbConfigRow(),
    extract: [createEmptyKeyValueRow()],
    id: createRowId(),
    name: '',
    query: '',
    useDefaultDb: true,
    validations: [createEmptyValidationRow()],
  };
}

export function createEmptyAuthFormState(): AuthFormState {
  return {
    apiKeyIn: 'header',
    apiKeyName: '',
    apiKeyValue: '',
    basicPassword: '',
    basicUsername: '',
    bearerToken: '',
    type: 'none',
  };
}

export function createEmptyBodyFormState(): BodyFormState {
  return {
    mode: 'json',
    rows: [createEmptyKeyValueRow()],
  };
}

function isObjectEditorType(type: JsonEditorType) {
  return ['extract', 'files', 'headers', 'object', 'params'].includes(type);
}

function isKeyValuePayloadArray(value: unknown): value is KeyValuePayload[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'object' && item !== null);
}

function toRows(payload: KeyValuePayload[] | Record<string, unknown>) {
  if (isKeyValuePayloadArray(payload)) {
    const rows = payload.map((item) => ({
      enabled: item.enabled ?? true,
      id: createRowId(),
      key: item.key ?? '',
      value: stringifyJsonInput(item.value)?.toString() ?? '',
    }));
    return rows.length > 0 ? rows : [createEmptyKeyValueRow()];
  }

  const rows = Object.entries(payload).map(([key, value]) => ({
    enabled: true,
    id: createRowId(),
    key,
    value: stringifyJsonInput(value)?.toString() ?? '',
  }));
  return rows.length > 0 ? rows : [createEmptyKeyValueRow()];
}

function fromStructuredRows(rows: KeyValueRow[]) {
  const payload = rows
    .filter((row) => row.key.trim())
    .map((row) => ({
      enabled: row.enabled,
      key: row.key.trim(),
      value: parseJsonInputOrRaw(row.value) ?? row.value,
    }));
  return payload.length > 0 ? payload : undefined;
}

function fromObjectRows(rows: KeyValueRow[]) {
  const payload = rows.reduce<Record<string, unknown>>((acc, row) => {
    if (!row.enabled) {
      return acc;
    }
    const key = row.key.trim();
    if (!key) {
      return acc;
    }
    acc[key] = parseJsonInputOrRaw(row.value) ?? row.value;
    return acc;
  }, {});
  return Object.keys(payload).length > 0 ? payload : undefined;
}

function toValidationRows(rules: ValidationRulePayload[]) {
  const rows = rules.map((rule) => ({
    expected: stringifyJsonInput(rule.expected)?.toString() ?? '',
    id: createRowId(),
    message: rule.message ?? '',
    path: rule.path ?? '',
    source: rule.source ?? 'json',
    type: rule.type ?? 'equals',
  }));
  return rows.length > 0 ? rows : [createEmptyValidationRow()];
}

function fromValidationRows(rows: ValidationRuleRow[]) {
  const payload = rows
    .filter((row) => row.path.trim() || row.type.trim() || row.expected.trim())
    .map((row) => ({
      expected: parseJsonInputOrRaw(row.expected) ?? row.expected,
      ...(row.message.trim() ? { message: row.message.trim() } : {}),
      ...(row.path.trim() ? { path: row.path.trim() } : {}),
      source: row.source.trim() || 'json',
      type: row.type.trim() || 'equals',
    }));
  return payload.length > 0 ? payload : undefined;
}

function toSqlDbConfigRow(config?: SqlQueryPayload['db_config']): SqlDbConfigRow {
  return {
    database: config?.database ?? '',
    host: config?.host ?? '',
    password: config?.password ?? '',
    port: config?.port?.toString() ?? '',
    type: config?.type ?? 'mysql',
    username: config?.username ?? '',
  };
}

function fromSqlDbConfigRow(config: SqlDbConfigRow) {
  if (
    !config.database.trim() &&
    !config.host.trim() &&
    !config.password.trim() &&
    !config.port.trim() &&
    !config.username.trim()
  ) {
    return undefined;
  }

  return {
    database: config.database.trim(),
    host: config.host.trim(),
    password: config.password,
    port: config.port ? Number(config.port) : undefined,
    type: config.type.trim() || 'mysql',
    username: config.username.trim(),
  };
}

function toSqlRows(queries: SqlQueryPayload[]) {
  const rows = queries.map((query) => ({
    dbConfig: toSqlDbConfigRow(query.db_config),
    extract: toRows(query.extract ?? {}),
    id: createRowId(),
    name: query.name ?? '',
    query: query.query ?? '',
    useDefaultDb: query.use_default_db ?? true,
    validations: toValidationRows(query.validations ?? []),
  }));
  return rows.length > 0 ? rows : [createEmptySqlQueryRow()];
}

function fromSqlRows(rows: SqlQueryRow[]) {
  const payload = rows
    .filter((row) => row.name.trim() || row.query.trim())
    .map((row) => {
      const dbConfig = fromSqlDbConfigRow(row.dbConfig);
      const extract = fromObjectRows(row.extract);
      const validations = fromValidationRows(row.validations);
      return {
        ...(dbConfig ? { db_config: dbConfig } : {}),
        ...(extract ? { extract } : {}),
        name: row.name.trim(),
        query: row.query.trim(),
        use_default_db: row.useDefaultDb,
        ...(validations ? { validations } : {}),
      };
    });
  return payload.length > 0 ? payload : undefined;
}

function toAuthFormState(payload?: Record<string, unknown>): AuthFormState {
  const state = createEmptyAuthFormState();
  if (!payload || Object.keys(payload).length === 0) {
    return state;
  }

  const type = String(payload.type ?? payload.auth_type ?? '').toLowerCase();
  if ((type === 'bearer' || 'token' in payload) && typeof payload.token === 'string') {
    state.type = 'bearer';
    state.bearerToken = payload.token;
    return state;
  }

  if ('username' in payload || 'password' in payload) {
    state.type = 'basic';
    state.basicUsername = String(payload.username ?? '');
    state.basicPassword = String(payload.password ?? '');
    return state;
  }

  if (type === 'apikey' || 'key' in payload || 'value' in payload) {
    state.type = 'apiKey';
    state.apiKeyName = String(payload.key ?? payload.name ?? '');
    state.apiKeyValue = String(payload.value ?? '');
    state.apiKeyIn = String(payload.in ?? payload.location ?? 'header');
    return state;
  }

  return state;
}

function fromAuthFormState(state: AuthFormState) {
  if (state.type === 'none') {
    return undefined;
  }

  if (state.type === 'bearer') {
    if (!state.bearerToken.trim()) {
      return undefined;
    }
    return {
      token: state.bearerToken.trim(),
      type: 'Bearer',
    };
  }

  if (state.type === 'basic') {
    if (!state.basicUsername.trim() && !state.basicPassword.trim()) {
      return undefined;
    }
    return {
      password: state.basicPassword,
      type: 'basic',
      username: state.basicUsername.trim(),
    };
  }

  if (!state.apiKeyName.trim() && !state.apiKeyValue.trim()) {
    return undefined;
  }
  return {
    in: state.apiKeyIn || 'header',
    key: state.apiKeyName.trim(),
    type: 'apiKey',
    value: state.apiKeyValue,
  };
}

function toBodyFormState(payload?: BodyPayload | Record<string, unknown>): BodyFormState {
  if (
    payload &&
    typeof payload === 'object' &&
    !Array.isArray(payload) &&
    'mode' in payload &&
    'items' in payload &&
    isKeyValuePayloadArray((payload as BodyPayload).items)
  ) {
    return {
      mode: (payload as BodyPayload).mode ?? 'json',
      rows: toRows((payload as BodyPayload).items ?? []),
    };
  }

  return {
    mode: 'json',
    rows: toRows((payload ?? {}) as Record<string, unknown>),
  };
}

function fromBodyFormState(state: BodyFormState) {
  return {
    items: fromStructuredRows(state.rows) ?? [],
    mode: state.mode,
  };
}

export function parseEditorState(type: JsonEditorType, value: string | undefined) {
  const rawText = typeof value === 'string' ? value : '';
  if (!rawText.trim()) {
    return {
      authForm: createEmptyAuthFormState(),
      bodyForm: createEmptyBodyFormState(),
      mode: 'structured' as JsonEditorMode,
      objectRows: [createEmptyKeyValueRow()],
      rawText: '',
      sqlRows: [createEmptySqlQueryRow()],
      validationRows: [createEmptyValidationRow()],
    };
  }

  const parsed = parseJsonInput(rawText);
  if (type === 'auth' && parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return {
      authForm: toAuthFormState(parsed as Record<string, unknown>),
      bodyForm: createEmptyBodyFormState(),
      mode: 'structured' as JsonEditorMode,
      objectRows: [createEmptyKeyValueRow()],
      rawText,
      sqlRows: [createEmptySqlQueryRow()],
      validationRows: [createEmptyValidationRow()],
    };
  }

  if (type === 'body' && parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return {
      authForm: createEmptyAuthFormState(),
      bodyForm: toBodyFormState(parsed as BodyPayload | Record<string, unknown>),
      mode: 'structured' as JsonEditorMode,
      objectRows: [createEmptyKeyValueRow()],
      rawText,
      sqlRows: [createEmptySqlQueryRow()],
      validationRows: [createEmptyValidationRow()],
    };
  }

  if (
    isObjectEditorType(type) &&
    ((parsed && typeof parsed === 'object' && !Array.isArray(parsed)) || isKeyValuePayloadArray(parsed))
  ) {
    return {
      authForm: createEmptyAuthFormState(),
      bodyForm: createEmptyBodyFormState(),
      mode: 'structured' as JsonEditorMode,
      objectRows: toRows((parsed ?? {}) as KeyValuePayload[] | Record<string, unknown>),
      rawText,
      sqlRows: [createEmptySqlQueryRow()],
      validationRows: [createEmptyValidationRow()],
    };
  }

  if (type === 'validation' && Array.isArray(parsed)) {
    return {
      authForm: createEmptyAuthFormState(),
      bodyForm: createEmptyBodyFormState(),
      mode: 'structured' as JsonEditorMode,
      objectRows: [createEmptyKeyValueRow()],
      rawText,
      sqlRows: [createEmptySqlQueryRow()],
      validationRows: toValidationRows(parsed as ValidationRulePayload[]),
    };
  }

  if (type === 'sql' && Array.isArray(parsed)) {
    return {
      authForm: createEmptyAuthFormState(),
      bodyForm: createEmptyBodyFormState(),
      mode: 'structured' as JsonEditorMode,
      objectRows: [createEmptyKeyValueRow()],
      rawText,
      sqlRows: toSqlRows(parsed as SqlQueryPayload[]),
      validationRows: [createEmptyValidationRow()],
    };
  }

  return {
    authForm: createEmptyAuthFormState(),
    bodyForm: createEmptyBodyFormState(),
    mode: 'json' as JsonEditorMode,
    objectRows: [createEmptyKeyValueRow()],
    rawText,
    sqlRows: [createEmptySqlQueryRow()],
    validationRows: [createEmptyValidationRow()],
  };
}

export function stringifyEditorState(input: {
  authForm: AuthFormState;
  bodyForm: BodyFormState;
  mode: JsonEditorMode;
  objectRows: KeyValueRow[];
  rawText: string;
  sqlRows: SqlQueryRow[];
  type: JsonEditorType;
  validationRows: ValidationRuleRow[];
}) {
  if (input.mode === 'json') {
    return input.rawText;
  }

  if (input.type === 'auth') {
    return stringifyJsonInput(fromAuthFormState(input.authForm))?.toString() ?? '';
  }

  if (input.type === 'body') {
    return stringifyJsonInput(fromBodyFormState(input.bodyForm))?.toString() ?? '';
  }

  if (isObjectEditorType(input.type)) {
    return stringifyJsonInput(fromStructuredRows(input.objectRows))?.toString() ?? '';
  }

  if (input.type === 'validation') {
    return stringifyJsonInput(fromValidationRows(input.validationRows))?.toString() ?? '';
  }

  return stringifyJsonInput(fromSqlRows(input.sqlRows))?.toString() ?? '';
}
