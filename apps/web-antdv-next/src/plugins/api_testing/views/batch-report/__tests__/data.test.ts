import { describe, expect, it, vi } from 'vitest';

vi.mock('#/locales', () => ({
  $t: (key: string) => key,
}));

vi.mock('#/plugins/api_testing/api/project', () => ({
  getAllEnabledApiProjectsApi: vi.fn(),
}));

vi.mock('#/plugins/api_testing/api/testsuite', () => ({
  getTestSuiteListApi: vi.fn(),
}));

import { querySchema, useColumns } from '../data';

describe('batch-report data', () => {
  it('defines query filters for batch report browsing', () => {
    expect(querySchema.map((item) => item.fieldName)).toEqual([
      'project_id',
      'suite_id',
      'target_type',
      'success_only',
      'start_date',
      'end_date',
    ]);
  });

  it('adds a drawer detail action for each batch report row', () => {
    const operationColumn = (useColumns(vi.fn()) ?? []).find(
      (column) => column.field === 'operation',
    );
    const actionCodes =
      operationColumn?.cellRender &&
      'options' in operationColumn.cellRender &&
      operationColumn.cellRender.options
        ? operationColumn.cellRender.options.map((option) => option.code)
        : [];

    expect(actionCodes).toEqual(['detail']);
  });
});
