interface ReportSummaryInput {
  duration?: number;
  fail_steps?: number;
  success?: boolean;
  success_steps?: number;
  total_steps?: number;
}

interface StepExpansionInput {
  id?: number | string;
  success?: boolean;
}

export function formatDuration(duration = 0) {
  if (duration < 1000) {
    return `${duration}ms`;
  }
  if (duration < 60_000) {
    return `${(duration / 1000).toFixed(1)}s`;
  }
  return `${(duration / 60_000).toFixed(1)}min`;
}

export function normalizeExecutionSteps<T>(details?: { steps?: T[] | unknown }) {
  return Array.isArray(details?.steps) ? details.steps : [];
}

export function getInitialExpandedStepKeys(steps: StepExpansionInput[]) {
  return steps
    .filter((step) => step.success === false)
    .map((step) => String(step.id ?? ''));
}

export function buildReportSummaryStats(report: ReportSummaryInput) {
  const totalSteps = report.total_steps ?? 0;
  const successSteps = report.success_steps ?? 0;

  return {
    durationText: formatDuration(report.duration ?? 0),
    failedSteps: report.fail_steps ?? 0,
    statusText: report.success ? '成功' : '失败',
    statusTone: report.success ? 'success' : 'error',
    successRate:
      totalSteps > 0 ? Math.round((successSteps / totalSteps) * 100) : 0,
  };
}
