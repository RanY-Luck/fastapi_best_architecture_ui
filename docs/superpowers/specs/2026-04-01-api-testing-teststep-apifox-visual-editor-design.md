# API Testing TestStep Apifox Visual Editor Design

## Background

Current API testing steps are edited through raw JSON text fields for `headers`, `params`, `body`, `files`, `auth`, `extract`, `validations`, and `sql_queries`. This causes three problems:

1. Step authoring is slow and error-prone.
2. Frontend editing semantics and backend execution semantics are only loosely aligned.
3. New request modes such as `form-data`, `binary`, and richer auth/file workflows cannot be expressed cleanly.

The target is to replace the current text-first step editor with an Apifox-style visual editor and upgrade backend step storage/execution around the same unified protocol.

## Scope

This change covers both repositories:

- Frontend: `F:\gitpush\fastapi_best_architecture_ui`
- Backend: `F:\gitpush\fastapi_best_architecture`

Included in scope:

- Visual editing for `headers`, `query`, `body`, `files`, `auth`, `extract`, `assertions`, and `sql`
- Request body modes: `none`, `json`, `form-data`, `x-www-form-urlencoded`, `raw-text`, `xml`, `binary`
- File source modes: `upload`, `path`, `variable`
- New backend step protocol and execution compile layer
- New backend temporary upload flow required by the visual editor

Explicitly out of scope for this iteration:

- Backward compatibility or migration for legacy step payloads
- Automatic conversion of old step records into the new protocol
- Full redesign of report rendering beyond minimum compatibility needed by execution

## Goals

- Make step authoring visual-first by default, with per-section JSON fallback
- Use one canonical step configuration schema across frontend, storage, and execution
- Compile the canonical schema into HTTP client and SQL executor inputs at runtime
- Avoid keeping the old fragmented request model as the primary contract

## Non-Goals

- Supporting legacy saved step data
- Preserving old API payload shapes for create/update
- Refactoring unrelated API testing modules

## Recommended Approach

Use a unified step configuration protocol stored in a new JSON field, with the frontend editor and backend execution runner both centered on that protocol.

This is preferred over keeping the current scattered JSON columns because body modes, files, auth, and assertion semantics become much easier to express, validate, and execute consistently.

## High-Level Architecture

### Step Model

Keep core step metadata as top-level fields:

- `name`
- `test_case_id`
- `url`
- `method`
- `timeout`
- `retry`
- `retry_interval`
- `order`
- `status`

Store all request/execution detail in a new canonical JSON field:

- `config`

The old fragmented fields (`headers`, `params`, `body`, `files`, `auth`, `extract`, `validate`, `sql_queries`) become deprecated and should be removed from the create/update/detail contract for this feature branch.

### Canonical Config Shape

`config` contains:

- `headers: StepParamRow[]`
- `query: StepParamRow[]`
- `body: StepBodyConfig`
- `files: StepFileRow[]`
- `auth: StepAuthConfig`
- `extract: StepExtractRow[]`
- `assertions: StepAssertionRow[]`
- `sql: StepSqlRow[]`

Shared row semantics:

- Each editable list item is array-based, not object-map based
- Each row has a stable `id`
- Each row has `enabled`
- Each row is explicit about value typing where needed

### Frontend Editor Structure

The test step modal is split into sections:

- Base Info
- Request Config
- Execution Rules

Request Config:

- Headers
- Query
- Body
- Files
- Auth

Execution Rules:

- Extract
- Assertions
- SQL

Each section defaults to visual mode and exposes a section-local JSON fallback toggle. There is no global raw JSON mode for the whole step.

## Protocol Detail

### Shared Param Row

Used by `headers`, `query`, and parts of `body`.

Suggested fields:

- `id: string`
- `name: string`
- `value: string`
- `value_type: 'string' | 'number' | 'boolean' | 'json'`
- `description?: string`
- `enabled: boolean`

### Body Config

Suggested shape:

```json
{
  "mode": "json",
  "content_type": "application/json",
  "json_items": [],
  "form_data": [],
  "urlencoded": [],
  "raw_text": "",
  "raw_text_type": "text",
  "binary": null
}
```

`mode` supports:

- `none`
- `json`
- `form-data`
- `x-www-form-urlencoded`
- `raw-text`
- `xml`
- `binary`

### File Rows

Suggested shape per file row:

- `id`
- `field_name`
- `source_mode: 'upload' | 'path' | 'variable'`
- `file_id?`
- `file_path?`
- `variable_expr?`
- `content_type?`
- `enabled`

### Auth Config

Suggested `type` values:

- `none`
- `bearer`
- `basic`
- `api-key`

Sub-config examples:

- `bearer.token`
- `basic.username/password`
- `api_key.key/value/in`

### Extract Rows

- `id`
- `name`
- `source`
- `expression`
- `default_value?`
- `enabled`

Supported extract sources in first iteration:

- `response_json`
- `response_text`
- `response_header`
- `status_code`

### Assertion Rows

- `id`
- `source`
- `path`
- `operator`
- `expected`
- `expected_type`
- `enabled`

Initial operators:

- `eq`
- `ne`
- `contains`
- `not_contains`
- `gt`
- `gte`
- `lt`
- `lte`
- `exists`
- `not_exists`

### SQL Rows

- `id`
- `name`
- `query`
- `db_config?`
- `extract?`
- `assertions?`
- `enabled`

## Backend Changes

### Database

`ApiTestStep` needs a new JSON column:

- `config`

The backend branch can treat this as the authoritative step protocol for this feature. If keeping the legacy columns temporarily is operationally easier during rollout, they should no longer drive request creation or update validation once `config` is introduced.

### Schemas

Replace the current loose request models with explicit nested Pydantic models:

- `StepConfig`
- `StepParamRow`
- `StepBodyConfig`
- `StepFileRow`
- `StepAuthConfig`
- `StepExtractRow`
- `StepAssertionRow`
- `StepSqlRow`

`TestStepCreateRequest` and `TestStepUpdateRequest` should accept:

- base step fields
- `config`

`TestStepResponse` should also return `config`.

### Services

`TestStepService` becomes a persistence layer for:

- validating the step belongs to a valid test case
- storing base fields
- storing `config`

It should no longer translate visual config into legacy fragmented columns.

### Execution Compile Layer

Add a dedicated compile layer between stored step config and `send_request` / `SQLExecutor`.

Suggested module responsibility:

- `compile_step_request_config(step.config, runtime_context) -> CompiledRequest`

Compile outputs include:

- `headers`
- `params`
- `json_data`
- `data`
- `files`
- `auth`
- `content_type` adjustments

This compile layer is the most important backend boundary in the design. The execution runner should consume compiled request data, not raw editor config.

### File Upload Flow

Because the frontend must support direct file selection, the backend needs a temporary upload API for step assets.

Suggested flow:

1. Frontend uploads a local file to a temp endpoint.
2. Backend stores the file in a temporary area and returns `file_id`, metadata, and storage path.
3. Step config stores the returned `file_id`.
4. At execution time, `source_mode='upload'` resolves `file_id` to a readable file path/stream.

Path mode and variable mode do not require upload.

## Frontend Changes

### Test Step Editor

Replace the current JSON editor fields in `teststep/data.ts` and `teststep/index.vue` with a form schema that binds to the new `config` tree.

The new structured editor should expose dedicated subcomponents:

- `StepParamTableEditor`
- `StepBodyEditor`
- `StepFileEditor`
- `StepAuthEditor`
- `StepExtractEditor`
- `StepAssertionEditor`
- `StepSqlEditor`

The existing `StructuredJsonEditor` can be reused only if it still fits the new canonical protocol. If it remains tied to the old payload shape, it should be split into smaller, protocol-specific editors.

### Submission Flow

Frontend submit/patch payloads should send:

- base fields
- `config`

Do not transform back into the old fragmented request payload before submission.

### Editing Existing Records

This branch does not promise legacy compatibility. The frontend may assume that records edited through the new UI already contain the new config protocol.

## Data Flow

### Create / Update

1. User edits step visually.
2. Frontend builds canonical `config`.
3. Frontend submits base fields + `config`.
4. Backend validates schema and stores directly.

### Execute

1. Backend loads step and runtime context.
2. Compile layer resolves variables, enabled rows, body mode, auth, and file sources.
3. Execution runner sends HTTP request and runs SQL/assertion/extract stages.
4. Execution report stores compiled request/response details as needed.

## Error Handling

### Frontend

- Each section validates required fields locally
- Invalid row typing should be surfaced inline, not as generic JSON errors
- File upload failures should not silently clear selected files

### Backend

- Reject invalid `config` shapes at schema validation time
- Reject missing temp upload references for `upload` file source mode
- Reject unsupported body modes in the compile layer, not deep inside request sending
- Produce compile-time error messages that identify section and row when possible

## Testing Strategy

### Frontend

Cover:

- section editors produce canonical config
- section-level JSON fallback round-trips without data loss
- body mode switching behavior
- file source mode switching behavior
- create/update payload shape

### Backend

Cover:

- step create/update schema validation
- compile layer output for each body mode
- auth compilation
- file source resolution for `upload`, `path`, `variable`
- extract/assertion/sql execution compatibility with new protocol

### Integration

At minimum:

- create step with JSON body
- create step with form-data including file row
- create step with bearer auth
- execute step successfully through compile layer

## Risks

- `binary` and `form-data` may expose gaps in the current HTTP helper abstraction
- temp file lifecycle needs clear cleanup rules
- report detail pages may need follow-up work if they assume old request payload shapes
- removing legacy compatibility increases branch coupling between frontend and backend rollout

## Rollout Recommendation

Implement in this order:

1. Backend schema/model/compile layer and temp upload endpoint
2. Frontend canonical config form model
3. Section editors for headers/query/body/files/auth
4. Section editors for extract/assertions/sql
5. End-to-end execution and report verification

## Files Expected To Change

Frontend:

- `apps/web-antdv-next/src/plugins/api_testing/views/teststep/index.vue`
- `apps/web-antdv-next/src/plugins/api_testing/views/teststep/data.ts`
- `apps/web-antdv-next/src/plugins/api_testing/api/types.ts`
- `apps/web-antdv-next/src/plugins/api_testing/api/teststep.ts`
- new step editor components under `apps/web-antdv-next/src/plugins/api_testing/components/`

Backend:

- `backend/plugin/api_testing/model/models.py`
- `backend/plugin/api_testing/schema/request.py`
- `backend/plugin/api_testing/api/v1/test_step.py`
- `backend/plugin/api_testing/service/test_step_service.py`
- `backend/plugin/api_testing/service/test_case_execution_runner.py`
- new compile/file-resolution helpers under `backend/plugin/api_testing/service/` or `backend/plugin/api_testing/utils/`
- migration / SQL definition updates for `api_test_step`

## Approval

Approved design basis from user:

- all major request sections included
- request body includes `binary`
- file editor supports upload, path, and variable modes
- legacy compatibility is intentionally not required
- backend protocol can be changed together with the frontend
