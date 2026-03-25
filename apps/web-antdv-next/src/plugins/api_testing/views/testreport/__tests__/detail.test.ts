import { flushPromises, mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { describe, expect, it, vi } from 'vitest';

const routeState = {
  params: { id: '32' },
};

const reportFixture = {
  created_time: '2026-03-25T08:00:00.000Z',
  details: {
    steps: [],
  },
  duration: 2100,
  end_time: '2026-03-25T08:01:00.000Z',
  fail_steps: 1,
  id: 32,
  name: '登录流程巡检',
  start_time: '2026-03-25T08:00:00.000Z',
  success: false,
  success_steps: 3,
  test_case_id: 10,
  test_case_name: 'Login smoke',
  total_steps: 4,
};

const apiMocks = vi.hoisted(() => ({
  exportTestReportApi: vi.fn(),
  getTestReportDetailApi: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRoute: () => routeState,
  useRouter: () => ({
    back: vi.fn(),
  }),
}));

vi.mock('#/plugins/api_testing/api/testreport', () => ({
  exportTestReportApi: apiMocks.exportTestReportApi,
  getTestReportDetailApi: apiMocks.getTestReportDetailApi,
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

vi.mock('@vben/icons', () => {
  const icon = (name: string) =>
    defineComponent({
      name,
      setup() {
        return () => h('span', { 'data-icon': name });
      },
    });

  return {
    ArrowLeft: icon('ArrowLeft'),
    Download: icon('Download'),
    RefreshCw: icon('RefreshCw'),
  };
});

vi.mock('antdv-next', () => {
  const passthrough = (name: string) =>
    defineComponent({
      name,
      inheritAttrs: false,
      props: {
        title: {
          default: undefined,
          type: String,
        },
        value: {
          default: undefined,
          type: [Number, String],
        },
        suffix: {
          default: undefined,
          type: String,
        },
      },
      setup(props, { attrs, slots }) {
        return () =>
          h(
            'div',
            {
              ...attrs,
              'data-component': name,
            },
            [
              props.title ? h('div', props.title) : null,
              props.value !== undefined ? h('div', `${props.value}${props.suffix ?? ''}`) : null,
              slots.default?.(),
            ],
          );
      },
    });

  return {
    Card: passthrough('Card'),
    Col: passthrough('Col'),
    Progress: passthrough('Progress'),
    Row: passthrough('Row'),
    Statistic: passthrough('Statistic'),
    Tag: passthrough('Tag'),
    message: {
      destroy: vi.fn(),
      error: vi.fn(),
      loading: vi.fn(),
      success: vi.fn(),
    },
  };
});

import DetailPage from '../detail.vue';

async function mountDetailPageWithReport(reportOverrides = {}) {
  apiMocks.getTestReportDetailApi.mockResolvedValueOnce({
    ...reportFixture,
    ...reportOverrides,
  });

  const wrapper = mount(DetailPage);
  await flushPromises();
  return wrapper;
}

describe('testreport detail page', () => {
  it('renders monitoring summary cards and metadata for the loaded report', async () => {
    const wrapper = await mountDetailPageWithReport({
      duration: 2100,
      fail_steps: 1,
      success: false,
      success_steps: 3,
      test_case_name: 'Login smoke',
      total_steps: 4,
    });

    expect(wrapper.findAll('[data-test-id="report-summary-card"]')).toHaveLength(4);
    expect(wrapper.find('[data-test-id="report-health-panel"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Login smoke');
    expect(wrapper.text()).toContain('失败步骤');
  });

  it('expands failed steps by default and keeps successful steps collapsed', async () => {
    const wrapper = await mountDetailPageWithReport({
      details: {
        steps: [
          {
            duration: 12,
            id: 1,
            name: 'prepare token',
            request_data: { method: 'GET', url: '/token' },
            success: true,
          },
          {
            duration: 21,
            error_message: '500 error',
            id: 2,
            name: 'call login',
            request_data: { method: 'POST', url: '/login' },
            success: false,
          },
        ],
      },
    });

    expect(wrapper.find('[data-test-id="step-body-2"]').exists()).toBe(true);
    expect(wrapper.find('[data-test-id="step-error-2"]').text()).toContain(
      '500 error',
    );
    expect(wrapper.find('[data-test-id="step-body-1"]').exists()).toBe(false);
  });

  it('renders a diagnostic empty state when no execution steps exist', async () => {
    const wrapper = await mountDetailPageWithReport({
      details: {},
    });

    expect(wrapper.text()).toContain('暂无可展示的步骤明细');
  });

  it('omits empty request and response blocks when step payloads are missing', async () => {
    const wrapper = await mountDetailPageWithReport({
      details: {
        steps: [
          {
            error_message: 'timeout',
            id: 2,
            name: 'health check',
            success: false,
          },
        ],
      },
    });

    expect(wrapper.text()).not.toContain('请求数据');
    expect(wrapper.text()).not.toContain('响应数据');
  });

  it('renders bounded diagnostic code blocks for payload sections', async () => {
    const wrapper = await mountDetailPageWithReport({
      details: {
        steps: [
          {
            id: 2,
            name: 'health check',
            request_data: { method: 'GET', url: '/health' },
            response: {
              json: { ok: true },
            },
            success: false,
          },
        ],
      },
    });

    const codeBlocks = wrapper.findAll('[data-test-id="report-code-block"]');
    expect(codeBlocks.length).toBe(2);
    expect(codeBlocks[0]?.find('pre').classes()).toContain('max-h-72');
  });
});
