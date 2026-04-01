import { flushPromises, mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';

const routeState = {
  query: { case_id: '7' },
};

const routerPush = vi.fn();

const apiMocks = vi.hoisted(() => ({
  executeTestCaseStreamApi: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRoute: () => routeState,
  useRouter: () => ({
    back: vi.fn(),
    push: routerPush,
  }),
}));

vi.mock('#/plugins/api_testing/api/testcase', () => ({
  executeTestCaseStreamApi: apiMocks.executeTestCaseStreamApi,
}));

vi.mock('@vben/common-ui', () => {
  const Page = defineComponent({
    name: 'MockPage',
    setup(_, { slots }) {
      return () => h('div', { class: 'mock-page' }, slots.default?.());
    },
  });

  const VbenButton = defineComponent({
    name: 'MockVbenButton',
    inheritAttrs: false,
    props: {
      type: {
        default: undefined,
        type: String,
      },
    },
    setup(props, { attrs, slots }) {
      return () =>
        h(
          'button',
          {
            ...attrs,
            'data-type': props.type,
          },
          slots.default?.(),
        );
    },
  });

  return {
    Page,
    VbenButton,
  };
});

import ExecutionStreamPage from '../index.vue';

describe('execution stream page', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders streamed events and report action', async () => {
    apiMocks.executeTestCaseStreamApi.mockImplementationOnce(
      async (_caseId: number, _environmentId: number | null | undefined, onEvent?: (event: any) => void) => {
        const events = [
          { type: 'run_start', total_steps: 1 },
          { type: 'step_end', step_name: 'step 1', success: true },
          { type: 'run_end', report_id: 11, success: true },
        ];

        events.forEach((event) => onEvent?.(event));

        return events;
      },
    );

    const wrapper = mount(ExecutionStreamPage);
    await flushPromises();

    expect(wrapper.text()).toContain('开始执行');
    expect(wrapper.text()).toContain('step 1');
    expect(wrapper.text()).toContain('查看报告');
    expect(wrapper.text()).toContain('已生成报告 #11');
    expect(wrapper.text()).toContain('查看原始事件');
    expect(wrapper.text()).not.toContain('"report_id": 11');
  });

  it('shows a failed final status when run_end reports failure', async () => {
    apiMocks.executeTestCaseStreamApi.mockImplementationOnce(
      async (_caseId: number, _environmentId: number | null | undefined, onEvent?: (event: any) => void) => {
        const events = [
          { type: 'run_start', total_steps: 1 },
          { type: 'step_start', step_name: 'step 1' },
          { type: 'run_end', report_id: 12, success: false },
        ];

        events.forEach((event) => onEvent?.(event));

        return events;
      },
    );

    const wrapper = mount(ExecutionStreamPage);
    await flushPromises();

    expect(wrapper.text()).toContain('执行失败');
    expect(wrapper.text()).not.toContain('当前步骤：');
  });

  it('aborts the in-flight stream on unmount', async () => {
    let capturedSignal: AbortSignal | undefined;

    apiMocks.executeTestCaseStreamApi.mockImplementationOnce(
      async (
        _caseId: number,
        _environmentId: number | null | undefined,
        _onEvent?: (event: any) => void,
        signal?: AbortSignal,
      ) => {
        capturedSignal = signal;
        return await new Promise(() => undefined);
      },
    );

    const wrapper = mount(ExecutionStreamPage);
    await flushPromises();

    wrapper.unmount();

    expect(capturedSignal?.aborted).toBe(true);
  });

  it('keeps streamed events visible when the stream ends with an error', async () => {
    apiMocks.executeTestCaseStreamApi.mockImplementationOnce(
      async (_caseId: number, _environmentId: number | null | undefined, onEvent?: (event: any) => void) => {
        onEvent?.({ type: 'run_start', total_steps: 1 });
        onEvent?.({ type: 'step_start', step_name: 'step 1' });
        throw new Error('boom');
      },
    );

    const wrapper = mount(ExecutionStreamPage);
    await flushPromises();

    expect(wrapper.text()).toContain('boom');
    expect(wrapper.text()).toContain('开始执行');
    expect(wrapper.text()).toContain('step 1');
  });

  it('renders the terminal error event in the timeline before showing the page error', async () => {
    apiMocks.executeTestCaseStreamApi.mockImplementationOnce(
      async (_caseId: number, _environmentId: number | null | undefined, onEvent?: (event: any) => void) => {
        onEvent?.({ type: 'run_start', total_steps: 1 });
        onEvent?.({
          type: 'error',
          error_type: 'RuntimeError',
          message: 'boom',
        });
        throw new Error('boom');
      },
    );

    const wrapper = mount(ExecutionStreamPage);
    await flushPromises();

    expect(wrapper.text()).toContain('执行异常');
    expect(wrapper.text()).toContain('RuntimeError');
    expect(wrapper.text()).toContain('boom');
  });

  it('scrolls the latest event into view as new stream events arrive', async () => {
    const scrollIntoView = vi.fn();
    vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(scrollIntoView);

    apiMocks.executeTestCaseStreamApi.mockImplementationOnce(
      async (_caseId: number, _environmentId: number | null | undefined, onEvent?: (event: any) => void) => {
        onEvent?.({ type: 'run_start', total_steps: 1 });
        onEvent?.({ type: 'step_end', step_name: 'step 1', success: true });
        onEvent?.({ type: 'run_end', report_id: 11, success: true });
        return [];
      },
    );

    mount(ExecutionStreamPage);
    await flushPromises();

    expect(scrollIntoView).toHaveBeenCalled();
  });

  it('highlights failed step events and terminal error events', async () => {
    apiMocks.executeTestCaseStreamApi.mockImplementationOnce(
      async (_caseId: number, _environmentId: number | null | undefined, onEvent?: (event: any) => void) => {
        onEvent?.({ type: 'run_start', total_steps: 1 });
        onEvent?.({ type: 'step_end', step_name: 'step 1', success: false });
        onEvent?.({
          type: 'error',
          error_type: 'RuntimeError',
          message: 'boom',
        });
        throw new Error('boom');
      },
    );

    const wrapper = mount(ExecutionStreamPage);
    await flushPromises();

    const cards = wrapper.findAll('[data-test-id="execution-event-card"]');
    expect(cards[1]?.classes()).toContain('border-rose-200');
    expect(cards[2]?.classes()).toContain('border-rose-200');
  });

  it('navigates to the saved report detail when the report action is clicked', async () => {
    apiMocks.executeTestCaseStreamApi.mockImplementationOnce(
      async (_caseId: number, _environmentId: number | null | undefined, onEvent?: (event: any) => void) => {
        const events = [
          { type: 'run_start', total_steps: 1 },
          { type: 'run_end', report_id: 11, success: true },
        ];

        events.forEach((event) => onEvent?.(event));
        return events;
      },
    );

    const wrapper = mount(ExecutionStreamPage);
    await flushPromises();

    await wrapper.get('button[data-type="primary"]').trigger('click');

    expect(routerPush).toHaveBeenCalledWith({
      name: 'ApiTestingTestReportDetail',
      params: { id: 11 },
    });
  });

  it('toggles raw event payload visibility on demand', async () => {
    apiMocks.executeTestCaseStreamApi.mockImplementationOnce(
      async (
        _caseId: number,
        _environmentId: number | null | undefined,
        onEvent?: (event: any) => void,
      ) => {
        const events = [
          { type: 'run_start', total_steps: 1 },
          { type: 'run_end', report_id: 11, success: true },
        ];

        events.forEach((event) => onEvent?.(event));
        return events;
      },
    );

    const wrapper = mount(ExecutionStreamPage);
    await flushPromises();

    const toggleButtons = wrapper.findAll('[data-test-id="toggle-raw-event"]');
    await toggleButtons[1]!.trigger('click');

    expect(wrapper.text()).toContain('收起原始事件');
    expect(wrapper.text()).toContain('"report_id": 11');

    await toggleButtons[1]!.trigger('click');

    expect(wrapper.text()).not.toContain('"report_id": 11');
  });
});
