import { describe, expect, it } from 'vitest';

import {
  buildExecutionSummary,
  formatExecutionEvent,
} from '../stream.helpers';

describe('buildExecutionSummary', () => {
  it('derives counts, active step, and report id from streamed events', () => {
    const summary = buildExecutionSummary([
      { type: 'run_start', total_steps: 2 },
      { type: 'step_start', step_name: 'step 1' },
      { type: 'step_end', success: true, step_name: 'step 1' },
      { type: 'step_start', step_name: 'step 2' },
    ]);

    expect(summary.currentStepName).toBe('step 2');
    expect(summary.totalSteps).toBe(2);
    expect(summary.successSteps).toBe(1);
    expect(summary.failSteps).toBe(0);
    expect(summary.reportId).toBeNull();
  });

  it('derives finished-run counts and report id', () => {
    const summary = buildExecutionSummary([
      { type: 'run_start', total_steps: 2 },
      { type: 'step_start', step_name: 'step 1' },
      { type: 'step_end', success: true, step_name: 'step 1' },
      { type: 'step_start', step_name: 'step 2' },
      { type: 'step_end', success: false, step_name: 'step 2' },
      { type: 'run_end', report_id: 42, success: false },
    ]);

    expect(summary.currentStepName).toBe('step 2');
    expect(summary.totalSteps).toBe(2);
    expect(summary.successSteps).toBe(1);
    expect(summary.failSteps).toBe(1);
    expect(summary.reportId).toBe(42);
  });

  it('formats common stream events into readable Chinese copy', () => {
    expect(
      formatExecutionEvent({
        total_steps: 2,
        type: 'run_start',
      }),
    ).toEqual({
      description: '共 2 个步骤',
      title: '开始执行',
    });

    expect(
      formatExecutionEvent({
        duration: 18,
        step_name: 'step 1',
        success: false,
        type: 'step_end',
      }),
    ).toEqual({
      description: 'step 1 · 耗时 18ms',
      title: '步骤失败',
    });

    expect(
      formatExecutionEvent({
        report_id: 42,
        success: true,
        type: 'run_end',
      }),
    ).toEqual({
      description: '已生成报告 #42',
      title: '执行完成',
    });
  });

  it('falls back to message-driven copy for error events', () => {
    expect(
      formatExecutionEvent({
        error_type: 'RuntimeError',
        message: 'boom',
        type: 'error',
      }),
    ).toEqual({
      description: 'RuntimeError · boom',
      title: '执行异常',
    });
  });
});
