<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { TestStep } from '#/api/api-testing';

import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createTestStepApi,
  deleteTestStepApi,
  executeTestStepApi,
  getTestStepListApi,
  updateTestStepApi,
} from '#/api/api-testing';

import { querySchema, testStepFormSchema, useColumns } from './data';

defineOptions({
  name: 'ApiTestingTestStep',
});

const route = useRoute();

// 表单配置
const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: {
    content: $t('common.form.query'),
  },
  schema: querySchema,
};

// 表格配置
const gridOptions: VxeTableGridOptions<TestStep> = {
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
        // 如果URL中有test_case_id参数，自动填充到查询条件中
        const testCaseId = route.query.test_case_id;
        const params = {
          page: page.currentPage,
          size: page.pageSize,
          ...formValues,
        };
        if (testCaseId) {
          params.test_case_id = Number(testCaseId);
        }
        return await getTestStepListApi(params);
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

// 创建/编辑步骤表单
const [TestStepForm, testStepFormApi] = useVbenForm({
  schema: testStepFormSchema,
});

// 创建步骤模态框
const [CreateModal, createModalApi] = useVbenModal({
  title: '创建测试步骤',
  width: 900,
  onConfirm: async () => {
    const values = await testStepFormApi.validate();
    if (values) {
      await createTestStepApi(values);
      message.success('测试步骤创建成功');
      onRefresh();
      return true;
    }
    return false;
  },
  onOpenChange: (isOpen) => {
    if (isOpen) {
      // 如果URL中有test_case_id参数，自动填充
      const testCaseId = route.query.test_case_id;
      if (testCaseId) {
        testStepFormApi.setValues({ test_case_id: Number(testCaseId) });
      }
    } else {
      testStepFormApi.resetForm();
    }
  },
});

// 编辑步骤模态框
const editingStepId = ref<null | number>(null);
const [EditModal, editModalApi] = useVbenModal({
  title: '编辑测试步骤',
  width: 900,
  onConfirm: async () => {
    const values = await testStepFormApi.validate();
    if (values && editingStepId.value) {
      await updateTestStepApi(editingStepId.value, values);
      message.success('测试步骤更新成功');
      onRefresh();
      return true;
    }
    return false;
  },
  onOpenChange: (isOpen) => {
    if (!isOpen) {
      testStepFormApi.resetForm();
      editingStepId.value = null;
    }
  },
});

// 执行结果模态框
const executionResult = ref<any>(null);
const [ResultModal, resultModalApi] = useVbenModal({
  title: '执行结果',
  width: 800,
  footer: false,
});

// 操作处理
function onActionClick({ code, row }: OnActionClickParams<TestStep>) {
  switch (code) {
    case 'copy': {
      const copyData = { ...row };
      delete copyData.id;
      copyData.name = `${copyData.name}_副本`;
      copyData.order = copyData.order + 1;
      testStepFormApi.setValues(copyData);
      createModalApi.open();
      break;
    }
    case 'delete': {
      deleteTestStepApi(row.id).then(() => {
        message.success('测试步骤删除成功');
        onRefresh();
      });
      break;
    }
    case 'edit': {
      editingStepId.value = row.id;
      testStepFormApi.setValues(row);
      editModalApi.open();
      break;
    }
    case 'execute': {
      message.loading('正在执行测试步骤...', 0);
      executeTestStepApi(row.id)
        .then((result) => {
          message.destroy();
          message.success('测试步骤执行完成');
          executionResult.value = result;
          resultModalApi.open();
        })
        .catch(() => {
          message.destroy();
          message.error('测试步骤执行失败');
        });
      break;
    }
  }
}

// 刷新表格
function onRefresh() {
  gridApi.query();
}

// 创建步骤
function handleCreate() {
  createModalApi.open();
}

// 初始化时如果有test_case_id参数，设置到查询表单中
onMounted(() => {
  const testCaseId = route.query.test_case_id;
  if (testCaseId) {
    // 设置查询表单的默认值
    gridApi.query({ test_case_id: Number(testCaseId) });
  }
});
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-actions>
        <VbenButton @click="handleCreate">
          <MaterialSymbolsAdd class="size-5" />
          创建测试步骤
        </VbenButton>
      </template>
    </Grid>

    <!-- 创建步骤模态框 -->
    <CreateModal>
      <TestStepForm />
    </CreateModal>

    <!-- 编辑步骤模态框 -->
    <EditModal>
      <TestStepForm />
    </EditModal>

    <!-- 执行结果模态框 -->
    <ResultModal>
      <div v-if="executionResult" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="mb-1 block text-sm font-medium">状态码:</label>
            <div class="rounded bg-gray-50 p-2">
              {{ executionResult.status_code }}
            </div>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium">响应时间:</label>
            <div class="rounded bg-gray-50 p-2">
              {{ executionResult.response_time }}ms
            </div>
          </div>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium">响应数据:</label>
          <pre class="max-h-96 overflow-auto rounded bg-gray-50 p-4 text-sm">{{
            JSON.stringify(executionResult.response_data, null, 2)
          }}</pre>
        </div>
        <div v-if="executionResult.error_message">
          <label class="mb-1 block text-sm font-medium text-red-600"
            >错误信息:</label
          >
          <div class="rounded bg-red-50 p-2 text-red-600">
            {{ executionResult.error_message }}
          </div>
        </div>
      </div>
    </ResultModal>
  </Page>
</template>
