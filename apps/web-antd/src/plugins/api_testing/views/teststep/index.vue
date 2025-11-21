<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type {
  TestStep,
  TestStepCreateParams,
} from '#/plugins/api_testing/api/types';

import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { Page, useVbenForm, useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { createTestStepApi } from '#/plugins/api_testing/api';
import {
  deleteTestStepApi,
  executeTestStepApi,
  getTestStepListApi,
  updateTestStepApi,
} from '#/plugins/api_testing/api/teststep';

import { querySchema, testStepFormSchema, useColumns } from './data';

defineOptions({
  name: 'ApiTestingTestStep',
});

const route = useRoute();

// 表单配置
const formOptions: VbenFormProps = {
  collapsed: false,
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
        // 过滤掉空字符串和 null
        // eslint-disable-next-line unicorn/no-array-reduce
        const filteredParams = Object.entries(formValues).reduce<
          Record<string, any>
        >(
          (acc, [key, value]) => {
            if (value !== '' && value !== null && value !== undefined) {
              acc[key] = value;
            }
            return acc;
          },
          {}, // 初始值
        );
        return await getTestStepListApi({
          page: page.currentPage,
          size: page.pageSize,
          ...filteredParams,
        });
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

// 创建/编辑步骤表单
const [TestStepForm, testStepFormApi] = useVbenForm({
  schema: testStepFormSchema,
});

// 通用转换函数
const transformFormToRequest = (formValues: any): TestStepCreateParams => {
  const parseJSON = (value: any) => {
    if (!value || value === '') return undefined;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return undefined;
      }
    }
    return value;
  };

  return {
    name: formValues.name,
    test_case_id: Number(formValues.test_case_id),
    url: formValues.url,
    method: formValues.method,
    headers: parseJSON(formValues.headers),
    params: parseJSON(formValues.params),
    body: parseJSON(formValues.body),
    files: parseJSON(formValues.files),
    auth: parseJSON(formValues.auth),
    extract: parseJSON(formValues.extract),
    validations: parseJSON(formValues.validations),
    sql_queries: parseJSON(formValues.sql_queries),
    timeout: formValues.timeout,
    retry: formValues.retry,
    retry_interval: formValues.retry_interval,
    order: formValues.order,
    status: formValues.status,
  };
};

// 创建步骤模态框
const [CreateModal, createModalApi] = useVbenModal({
  title: '创建测试步骤',
  class: 'w-[900px]',
  onConfirm: async () => {
    try {
      const values = await testStepFormApi.getValues();
      if (values && Object.keys(values).length > 0) {
        const requestData = transformFormToRequest(values);
        await createTestStepApi(requestData);
        message.success('测试步骤创建成功');
        onRefresh();
        await createModalApi.close();
        return true;
      }
    } catch (error) {
      console.error('表单验证或提交失败:', error);
      if (error instanceof SyntaxError) {
        message.error('JSON格式错误，请检查输入格式');
      } else {
        message.error('表单验证失败，请检查必填项');
      }
      return false;
    }
  },
  onOpenChange: (isOpen) => {
    if (isOpen) {
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
  class: 'w-[900px]',
  onConfirm: async () => {
    try {
      if (!editingStepId.value) {
        message.error('编辑 ID 无效');
        return false;
      }
      const values = await testStepFormApi.getValues();
      if (values && Object.keys(values).length > 0) {
        const UpdateRequestData = transformFormToRequest(values);
        await updateTestStepApi(editingStepId.value, UpdateRequestData);
        message.success('测试步骤更新成功');
        onRefresh();
        await editModalApi.close();
        return true;
      }
    } catch (error) {
      console.error('表单验证失败:', error);
      message.error('表单验证失败，请检查必填项');
      return false;
    }
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
  class: 'w-[800px]',
  footer: false,
});

// 操作处理
function onActionClick({ code, row }: OnActionClickParams<TestStep>) {
  switch (code) {
    case 'copy': {
      const copyData = { ...row };
      delete (copyData as any).id;
      copyData.name = `${copyData.name}_副本`;
      copyData.order = copyData.order + 1;
      // 转换对象为字符串格式
      const formData = transformResponseToForm(copyData);
      testStepFormApi.setValues(formData);
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
      // ⭐ 转换对象为字符串格式
      const formData = transformResponseToForm(row);
      testStepFormApi.setValues(formData);
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

// 转换函数：将后端返回的对象转换为表单需要的字符串格式
const transformResponseToForm = (data: any) => {
  const stringify = (value: any) => {
    if (!value) return '';
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2); // 格式化显示，方便编辑
    }
    return value;
  };

  return {
    name: data.name,
    test_case_id: data.test_case_id,
    url: data.url,
    method: data.method,
    headers: stringify(data.headers),
    params: stringify(data.params),
    body: stringify(data.body),
    files: stringify(data.files),
    auth: stringify(data.auth),
    extract: stringify(data.extract),
    validations: stringify(data.validations),
    sql_queries: stringify(data.sql_queries),
    timeout: data.timeout,
    retry: data.retry,
    retry_interval: data.retry_interval,
    order: data.order,
    status: data.status,
  };
};

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
