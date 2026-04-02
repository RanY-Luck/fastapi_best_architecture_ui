<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type {
  TestSuite,
  TestSuiteCreateParams,
  TestSuiteParams,
  TestSuiteUpdateParams,
} from '#/plugins/api_testing/api/types';

import { computed, h, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';

import { message, Modal, Table } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { $t } from '#/locales';
import { getTestCasesByProjectApi } from '#/plugins/api_testing/api/testcase';
import {
  createTestSuiteApi,
  deleteTestSuiteApi,
  executeTestSuiteApi,
  getTestSuiteCasesApi,
  getTestSuiteDetailApi,
  getTestSuiteListApi,
  updateTestSuiteApi,
} from '#/plugins/api_testing/api/testsuite';
import { filterEmptyParams } from '#/plugins/api_testing/utils';

import { querySchema, testSuiteFormSchema, useColumns } from './data';

defineOptions({
  name: 'ApiTestingTestSuite',
});

const DEFAULT_BATCH_MAX_CONCURRENCY = 3;

const router = useRouter();
const editingSuiteId = ref<null | number>(null);

const formOptions: VbenFormProps = {
  collapsed: false,
  showCollapseButton: true,
  submitButtonOptions: {
    content: $t('common.form.query'),
  },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<TestSuite> = {
  rowConfig: {
    keyField: 'id',
  },
  checkboxConfig: {
    highlight: true,
  },
  height: 'auto',
  exportConfig: {},
  printConfig: {},
  toolbarConfig: {
    export: true,
    print: true,
    refresh: { code: 'query' },
    custom: true,
    zoom: true,
  },
  columns: useColumns(onActionClick),
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        const { currentPage, pageSize } = page;
        return await getTestSuiteListApi({
          skip: (currentPage - 1) * pageSize,
          limit: pageSize,
          ...(filterEmptyParams(formValues) as TestSuiteParams),
        });
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

const [TestSuiteForm, testSuiteFormApi] = useVbenForm({
  schema: testSuiteFormSchema,
  showDefaultActions: false,
});

const modalTitle = computed(() => {
  return editingSuiteId.value ? '编辑测试集合' : '创建测试集合';
});

async function syncCaseFieldOptions(
  projectId?: number,
  caseIds: number[] = [],
) {
  if (!projectId) {
    testSuiteFormApi.updateSchema([
      {
        fieldName: 'case_ids',
        componentProps: {
          options: [],
          placeholder: '请先选择项目，再选择测试用例',
        },
      },
    ]);
    await testSuiteFormApi.setFieldValue('case_ids', []);
    return;
  }

  const response = (await getTestCasesByProjectApi(projectId)) as any;
  const cases =
    response && 'items' in response && Array.isArray(response.items)
      ? response.items
      : (Array.isArray(response)
        ? response
        : []);

  testSuiteFormApi.updateSchema([
    {
      fieldName: 'case_ids',
      componentProps: {
        options: cases.map((item: any) => ({
          label: item.name,
          value: item.id,
        })),
        placeholder:
          cases.length > 0 ? '请选择关联用例' : '当前项目下暂无启用测试用例',
      },
    },
  ]);
  await testSuiteFormApi.setFieldValue('case_ids', caseIds);
}

function bindProjectChangeHandler() {
  testSuiteFormApi.updateSchema([
    {
      fieldName: 'project_id',
      componentProps: {
        api: async () => {
          const { getAllEnabledApiProjectsApi } =
            await import('#/plugins/api_testing/api/project');
          const data = (await getAllEnabledApiProjectsApi()) as any;
          if (data && 'items' in data && Array.isArray(data.items))
            return data.items;
          return Array.isArray(data) ? data : [];
        },
        labelField: 'name',
        valueField: 'id',
        immediate: true,
        onChange: (value?: number) => {
          void syncCaseFieldOptions(value, []);
        },
      },
    },
  ]);
}

async function prepareModal(row?: null | TestSuite) {
  editingSuiteId.value = row?.id ?? null;
  testSuiteFormApi.resetForm();
  bindProjectChangeHandler();
  await syncCaseFieldOptions(undefined, []);

  if (!row?.id) {
    return;
  }

  const detail = await getTestSuiteDetailApi(row.id);
  await syncCaseFieldOptions(detail.project_id, detail.case_ids);
  testSuiteFormApi.setValues(detail);
}

const [SuiteModal, suiteModalApi] = useVbenModal({
  closeOnClickModal: false,
  class: 'w-[720px]',
  onConfirm: async () => {
    try {
      const values = (await testSuiteFormApi.getValues()) as
        | TestSuiteCreateParams
        | TestSuiteUpdateParams;

      if (editingSuiteId.value) {
        await updateTestSuiteApi(editingSuiteId.value, values);
        message.success('测试集合更新成功');
      } else {
        await createTestSuiteApi(values as TestSuiteCreateParams);
        message.success('测试集合创建成功');
      }

      suiteModalApi.close();
      onRefresh();
      return true;
    } catch (error) {
      console.error('测试集合表单提交失败:', error);
      message.error('表单验证失败，请检查必填项');
      return false;
    }
  },
  onOpenChange: async (isOpen) => {
    if (isOpen) {
      const modalData = suiteModalApi.getData<TestSuite>() as
        | null
        | TestSuite
        | undefined;
      await prepareModal(modalData ?? null);
      return;
    }

    editingSuiteId.value = null;
    testSuiteFormApi.resetForm();
  },
});

async function viewSuiteCases(row: TestSuite) {
  try {
    const cases = (await getTestSuiteCasesApi(row.id)) as any[];
    Modal.info({
      title: `「${row.name}」关联用例`,
      width: 800,
      content: () =>
        h(Table, {
          dataSource: cases,
          rowKey: 'id',
          size: 'small',
          pagination: false,
          columns: [
            { title: '顺序', dataIndex: 'order', width: 60 },
            { title: '用例名称', dataIndex: 'name' },
            {
              title: '状态',
              dataIndex: 'status',
              width: 80,
              customRender: ({ text }: any) => (text === 1 ? '启用' : '禁用'),
            },
          ] as any,
        }),
    });
  } catch (error) {
    console.error('获取关联用例失败:', error);
    message.error('获取关联用例失败');
  }
}

async function executeSuite(row: TestSuite) {
  message.loading('正在批量执行测试集合...', 0);
  try {
    const result = await executeTestSuiteApi(row.id, {
      max_concurrency: DEFAULT_BATCH_MAX_CONCURRENCY,
    });
    message.destroy();
    message.success('测试集合执行完成');
    router.push({
      name: 'ApiTestingBatchReport',
      query: {
        project_id: String(row.project_id),
        report_id: String(result.batch_report_id),
        suite_id: String(row.id),
        target_type: 'suite',
      },
    });
  } catch (error) {
    console.error('测试集合执行失败:', error);
    message.destroy();
    message.error('测试集合执行失败');
  }
}

function onActionClick({ code, row }: OnActionClickParams<TestSuite>) {
  switch (code) {
    case 'delete': {
      deleteTestSuiteApi(row.id).then(() => {
        message.success('测试集合删除成功');
        onRefresh();
      });
      break;
    }
    case 'edit': {
      suiteModalApi.setData(row).open();
      break;
    }
    case 'execute': {
      void executeSuite(row);
      break;
    }
    case 'view-cases': {
      void viewSuiteCases(row);
      break;
    }
  }
}

function onRefresh() {
  gridApi.query();
}

function handleCreate() {
  suiteModalApi.setData(null).open();
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-actions>
        <VbenButton @click="handleCreate">
          <MaterialSymbolsAdd class="size-5" />
          创建测试集合
        </VbenButton>
      </template>
    </Grid>

    <SuiteModal :title="modalTitle">
      <TestSuiteForm />
    </SuiteModal>
  </Page>
</template>
