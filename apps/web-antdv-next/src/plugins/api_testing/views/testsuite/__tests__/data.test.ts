import { describe, expect, it, vi } from 'vitest';

vi.mock('#/locales', () => ({
  $t: (key: string) => key,
}));

vi.mock('#/plugins/api_testing/api/project', () => ({
  getAllEnabledApiProjectsApi: vi.fn(),
}));

import { querySchema, testSuiteFormSchema, useColumns } from '../data';

describe('testsuite data', () => {
  it('defines query filters for suite browsing', () => {
    expect(querySchema.map((item) => item.fieldName)).toEqual([
      'name',
      'project_id',
      'status',
    ]);
  });

  it('defines form fields for suite editing', () => {
    expect(testSuiteFormSchema.map((item) => item.fieldName)).toEqual([
      'name',
      'project_id',
      'case_ids',
      'description',
      'status',
    ]);
  });

  it('adds execute, edit, and delete row actions', () => {
    const operationColumn = (useColumns(vi.fn()) ?? []).find(
      (column) => column.field === 'operation',
    );
    const actionCodes =
      operationColumn?.cellRender &&
      'options' in operationColumn.cellRender &&
      operationColumn.cellRender.options
        ? operationColumn.cellRender.options.map((option) => option.code)
        : [];

    expect(actionCodes).toEqual(['execute', 'edit', 'delete']);
  });
});
