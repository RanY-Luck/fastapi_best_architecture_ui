import type { TestCaseStreamEvent } from '#/plugins/api_testing/api/types';

export interface ExecutionSummary {
  currentStepName: string;
  failSteps: number;
  reportId: null | number;
  successSteps: number;
  totalSteps: number;
}

export interface FormattedExecutionEvent {
  description: string;
  title: string;
}

export function buildExecutionSummary(
  events: TestCaseStreamEvent[],
): ExecutionSummary {
  const totalSteps =
    Number(events.find((event) => event.type === 'run_start')?.total_steps ?? 0) ||
    0;
  const stepEndEvents = events.filter((event) => event.type === 'step_end');
  const currentStepName = String(
    [...events].reverse().find((event) => event.step_name)?.step_name ?? '',
  );

  return {
    currentStepName,
    failSteps: stepEndEvents.filter((event) => event.success === false).length,
    reportId:
      Number(events.find((event) => event.type === 'run_end')?.report_id ?? 0) ||
      null,
    successSteps: stepEndEvents.filter((event) => event.success === true).length,
    totalSteps,
  };
}

function buildStepLabel(event: TestCaseStreamEvent) {
  return String(event.step_name ?? '').trim();
}

export function formatExecutionEvent(
  event: TestCaseStreamEvent,
): FormattedExecutionEvent {
  switch (event.type) {
    case 'run_start': {
      const totalSteps = Number(event.total_steps ?? 0) || 0;
      return {
        description: `共 ${totalSteps} 个步骤`,
        title: '开始执行',
      };
    }
    case 'run_end': {
      const reportId = Number(event.report_id ?? 0) || 0;
      return {
        description: reportId ? `已生成报告 #${reportId}` : '执行已结束',
        title: event.success === false ? '执行结束' : '执行完成',
      };
    }
    case 'step_start':
      return {
        description: buildStepLabel(event) || '准备执行步骤',
        title: '开始步骤',
      };
    case 'step_request':
      return {
        description:
          typeof event.message === 'string' && event.message
            ? event.message
            : buildStepLabel(event) || '已发送请求',
        title: '发送请求',
      };
    case 'step_response':
      return {
        description:
          typeof event.message === 'string' && event.message
            ? event.message
            : buildStepLabel(event) || '已收到响应',
        title: event.success === false ? '请求失败' : '收到响应',
      };
    case 'step_assertion':
      return {
        description:
          typeof event.message === 'string' && event.message
            ? event.message
            : buildStepLabel(event) || '断言结果已更新',
        title: event.success === false ? '断言失败' : '断言通过',
      };
    case 'step_sql':
      return {
        description:
          typeof event.message === 'string' && event.message
            ? event.message
            : String(event.sql_name ?? buildStepLabel(event) ?? 'SQL 已执行'),
        title: event.success === false ? 'SQL 校验失败' : 'SQL 校验通过',
      };
    case 'step_extract':
      return {
        description:
          typeof event.variable_name === 'string' && event.variable_name
            ? `变量 ${event.variable_name}`
            : typeof event.message === 'string' && event.message
              ? event.message
              : '变量提取结果已更新',
        title: event.success === false ? '变量提取失败' : '变量提取成功',
      };
    case 'step_end': {
      const duration = Number(event.duration ?? 0) || 0;
      const stepLabel = buildStepLabel(event);
      return {
        description: stepLabel
          ? `${stepLabel} · 耗时 ${duration}ms`
          : `耗时 ${duration}ms`,
        title: event.success === false ? '步骤失败' : '步骤完成',
      };
    }
    case 'error': {
      const parts = [event.error_type, event.message]
        .map((item) => String(item ?? '').trim())
        .filter(Boolean);
      return {
        description: parts.join(' · ') || '执行过程中发生异常',
        title: '执行异常',
      };
    }
    default:
      return {
        description:
          typeof event.message === 'string' && event.message
            ? event.message
            : buildStepLabel(event),
        title: event.type,
      };
  }
}
