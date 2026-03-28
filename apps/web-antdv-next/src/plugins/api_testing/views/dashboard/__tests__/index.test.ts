import { flushPromises, mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { describe, expect, it, vi } from 'vitest';

const routerPush = vi.fn();

const apiMocks = vi.hoisted(() => ({
  getApiProjectListApi: vi.fn(),
  getTestCaseListApi: vi.fn(),
  getTestReportListApi: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: routerPush,
  }),
}));

vi.mock('#/plugins/api_testing/api/project', () => ({
  getApiProjectListApi: apiMocks.getApiProjectListApi,
}));

vi.mock('#/plugins/api_testing/api/testcase', () => ({
  getTestCaseListApi: apiMocks.getTestCaseListApi,
}));

vi.mock('#/plugins/api_testing/api/testreport', () => ({
  getTestReportListApi: apiMocks.getTestReportListApi,
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
    FxemojiBarChart: icon('FxemojiBarChart'),
    MdiFile: icon('MdiFile'),
    MdiPlay: icon('MdiPlay'),
    Plus: icon('Plus'),
  };
});

vi.mock('antdv-next', () => {
  const passthrough = (name: string) =>
    defineComponent({
      name,
      inheritAttrs: false,
      props: {
        description: {
          default: undefined,
          type: String,
        },
        loading: {
          default: false,
          type: Boolean,
        },
        percent: {
          default: undefined,
          type: Number,
        },
        title: {
          default: undefined,
          type: String,
        },
        value: {
          default: undefined,
          type: [Number, String],
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
              props.value !== undefined ? h('div', String(props.value)) : null,
              props.description ? h('div', props.description) : null,
              props.percent !== undefined ? h('div', `${props.percent}%`) : null,
              slots.default?.(),
              slots.prefix?.(),
            ],
          );
      },
    });

  return {
    Card: passthrough('Card'),
    Col: passthrough('Col'),
    Empty: passthrough('Empty'),
    Progress: passthrough('Progress'),
    Row: passthrough('Row'),
    Statistic: passthrough('Statistic'),
    message: {
      error: vi.fn(),
    },
  };
});

import DashboardPage from '../index.vue';

async function mountDashboardPage() {
  apiMocks.getApiProjectListApi.mockResolvedValueOnce({
    items: [
      {
        created_time: '2026-03-25T01:00:00.000Z',
        description: '支付链路冒烟与回归',
        id: 1,
        name: '支付中台',
        updated_time: '2026-03-28T01:00:00.000Z',
      },
    ],
    total: 1,
  });
  apiMocks.getTestCaseListApi.mockResolvedValueOnce({
    items: [
      {
        create_time: '2026-03-28T02:00:00.000Z',
        description: '验证登录返回 token',
        id: 2,
        name: '登录接口',
        update_time: '2026-03-28T03:00:00.000Z',
      },
    ],
    total: 1,
  });
  apiMocks.getTestReportListApi.mockResolvedValueOnce({
    items: [
      {
        created_time: '2026-03-28T04:00:00.000Z',
        id: 3,
        name: '登录巡检',
        success: true,
        success_steps: 4,
        total_steps: 4,
        updated_time: '2026-03-28T04:10:00.000Z',
      },
    ],
    total: 1,
  });

  const wrapper = mount(DashboardPage);
  await flushPromises();
  return wrapper;
}

describe('api testing dashboard page', () => {
  it('renders a product-style overview hero and grouped sections', async () => {
    const wrapper = await mountDashboardPage();

    expect(wrapper.find('[data-test-id="dashboard-hero"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('API 测试概览');
    expect(wrapper.text()).toContain('创建项目');
    expect(wrapper.text()).toContain('创建用例');
    expect(wrapper.findAll('[data-test-id="dashboard-stat-card"]')).toHaveLength(4);
    expect(wrapper.findAll('[data-test-id="dashboard-activity-card"]')).toHaveLength(3);
    expect(wrapper.findAll('[data-test-id="dashboard-quick-action"]')).toHaveLength(3);
  });
});
