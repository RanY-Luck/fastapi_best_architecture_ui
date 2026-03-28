import { describe, expect, it } from 'vitest';

import {
  buildBatchReportSummary,
  normalizeBatchCaseResults,
} from '../drawer.helpers';

describe('batch-report drawer helpers', () => {
  it('builds summary stats for the drawer header', () => {
    const summary = buildBatchReportSummary({
      duration: 32_500,
      fail_cases: 1,
      max_concurrency: 4,
      success: false,
      success_cases: 4,
      total_cases: 5,
    });

    expect(summary.statusText).toBe('失败');
    expect(summary.durationText).toBe('32.5s');
    expect(summary.successRate).toBe(80);
    expect(summary.maxConcurrency).toBe(4);
  });

  it('normalizes child case rows from report details', () => {
    const rows = normalizeBatchCaseResults({
      results: [
        {
          case_id: 9,
          duration: 1200,
          report_id: 88,
          success: true,
          test_case_name: '登录冒烟',
        },
      ],
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      caseId: 9,
      durationText: '1.2s',
      reportId: 88,
      success: true,
      testCaseName: '登录冒烟',
    });
  });

  it('returns an empty list when results are malformed', () => {
    expect(normalizeBatchCaseResults({ results: null })).toEqual([]);
  });
});
