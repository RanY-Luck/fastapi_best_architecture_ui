import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { describe, expect, it, vi } from 'vitest';

const routerPush = vi.fn();

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: routerPush,
  }),
}));

vi.mock('#/locales', () => ({
  $t: (key: string) => key,
}));

vi.mock('antdv-next', () => ({
  message: {
    destroy: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('#/plugins/api_testing/api/testcase', () => ({
  createTestCaseApi: vi.fn(),
  deleteTestCaseApi: vi.fn(),
  getTestCaseListApi: vi.fn(),
  updateTestCaseApi: vi.fn(),
}));

vi.mock('#/plugins/api_testing/utils', () => ({
  filterEmptyParams: (value: unknown) => value,
}));

vi.mock('../data', () => ({
  querySchema: [],
  testCaseFormSchema: [],
  useColumns: (onActionClick: (payload: any) => void) => [
    {
      cellRender: {
        attrs: {
          onClick: onActionClick,
        },
        options: [
          { code: 'steps' },
          { code: 'execute' },
        ],
      },
      field: 'operation',
    },
  ],
}));

vi.mock('#/adapter/form', () => {
  const formApi = {
    getValues: vi.fn(),
    resetForm: vi.fn(),
    setValues: vi.fn(),
  };

  return {
    useVbenForm: () => {
      const Form = defineComponent({
        name: 'MockTestCaseForm',
        setup() {
          return () => h('div', { 'data-test-id': 'testcase-form' });
        },
      });

      return [Form, formApi];
    },
  };
});

vi.mock('#/adapter/vxe-table', () => ({
  useVbenVxeGrid: ({ gridOptions }: any) => {
    const Grid = defineComponent({
      name: 'MockGrid',
      setup(_, { slots }) {
        const onClick =
          gridOptions.columns.find((column: any) => column.field === 'operation')
            ?.cellRender?.attrs?.onClick;
        const row = { id: 7 };

        return () =>
          h('div', [
            h(
              'button',
              {
                'data-test-id': 'execute-action',
                onClick: () => onClick?.({ code: 'execute', row }),
              },
              'execute',
            ),
            h(
              'button',
              {
                'data-test-id': 'steps-action',
                onClick: () => onClick?.({ code: 'steps', row }),
              },
              'steps',
            ),
            slots['toolbar-actions']?.(),
          ]);
      },
    });

    return [Grid, { query: vi.fn() }];
  },
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
    setup(_, { attrs, slots }) {
      return () => h('button', attrs, slots.default?.());
    },
  });

  return {
    Page,
    VbenButton,
    useVbenModal: () => {
      const Modal = defineComponent({
        name: 'MockModal',
        setup(_, { slots }) {
          return () => h('div', slots.default?.());
        },
      });

      return [
        Modal,
        {
          close: vi.fn(),
          open: vi.fn(),
        },
      ];
    },
  };
});

vi.mock('@vben/icons', () => ({
  MaterialSymbolsAdd: defineComponent({
    name: 'MockMaterialSymbolsAdd',
    setup() {
      return () => h('span', { 'data-icon': 'add' });
    },
  }),
}));

import TestCasePage from '../index.vue';

describe('testcase page', () => {
  it('routes execute actions to the execution stream page', async () => {
    const wrapper = mount(TestCasePage);

    await wrapper.get('[data-test-id="execute-action"]').trigger('click');

    expect(routerPush).toHaveBeenCalledWith({
      name: 'ApiTestingExecutionStream',
      query: { case_id: 7 },
    });
  });

  it('routes step actions to the testcase step management page', async () => {
    const wrapper = mount(TestCasePage);

    await wrapper.get('[data-test-id="steps-action"]').trigger('click');

    expect(routerPush).toHaveBeenCalledWith({
      name: 'ApiTestingTestStep',
      query: { test_case_id: 7 },
    });
  });
});
