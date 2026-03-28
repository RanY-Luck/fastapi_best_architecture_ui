import type { BatchExecutionReport, BatchExecutionResultItem } from '#/plugins/api_testing/api/types';

interface BatchReportSummaryStats {
  durationText: string;
  failedCases: number;
  maxConcurrency: number;
  statusText: '失败' | '成功';
  successRate: number;
}

export function formatBatchDuration(duration = 0) {
  if (duration < 1000) {
    return `${duration}ms`;
  }
  if (duration < 60_000) {
    return `${(duration / 1000).toFixed(1)}s`;
  }
  return `${(duration / 60_000).toFixed(1)}min`;
}

export function buildBatchReportSummary(
  report: Partial<BatchExecutionReport>,
): BatchReportSummaryStats {
  const totalCases = report.total_cases ?? 0;
  const successCases = report.success_cases ?? 0;

  return {
    durationText: formatBatchDuration(report.duration ?? 0),
    failedCases: report.fail_cases ?? 0,
    maxConcurrency: report.max_concurrency ?? 1,
    statusText: report.success ? '成功' : '失败',
    successRate:
      totalCases > 0 ? Math.round((successCases / totalCases) * 100) : 0,
  };
}

export function normalizeBatchCaseResults(
  details?: { results?: BatchExecutionResultItem[] | null | unknown },
) {
  if (!Array.isArray(details?.results)) {
    return [];
  }

  return details.results.map((item) => ({
    caseId: item.case_id,
    duration: item.duration ?? 0,
    durationText: formatBatchDuration(item.duration ?? 0),
    error: item.error,
    reportId: item.report_id ?? null,
    success: Boolean(item.success),
    testCaseName: item.test_case_name ?? `用例 #${item.case_id}`,
  }));
}
