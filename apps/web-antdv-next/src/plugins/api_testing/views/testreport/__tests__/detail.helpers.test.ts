import { describe, expect, it } from 'vitest';

import {
  buildReportSummaryStats,
  formatDuration,
  getInitialExpandedStepKeys,
  normalizeExecutionSteps,
} from '../detail.helpers';

describe('detail.helpers', () => {
  it('formats duration across ms, seconds, and minutes', () => {
    expect(formatDuration(450)).toBe('450ms');
    expect(formatDuration(3200)).toBe('3.2s');
    expect(formatDuration(90_000)).toBe('1.5min');
  });

  it('defaults failed steps to expanded keys', () => {
    expect(
      getInitialExpandedStepKeys([
        { id: 1, name: 'a', success: true },
        { id: 2, name: 'b', success: false },
      ]),
    ).toEqual(['2']);
  });

  it('normalizes missing report details into an empty step list', () => {
    expect(normalizeExecutionSteps(undefined)).toEqual([]);
  });

  it('builds summary stats for the report header', () => {
    expect(
      buildReportSummaryStats({
        duration: 3200,
        fail_steps: 1,
        success: false,
        success_steps: 3,
        total_steps: 4,
      }),
    ).toEqual({
      durationText: '3.2s',
      failedSteps: 1,
      statusText: '失败',
      statusTone: 'error',
      successRate: 75,
    });
  });
});
