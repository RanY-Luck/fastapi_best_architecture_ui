<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { TestCase } from '#/plugins/api_testing/api/types';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createTestCaseApi,
  deleteTestCaseApi,
  executeTestCaseApi,
  getTestCaseListApi,
  updateTestCaseApi,
} from '#/plugins/api_testing/api/test-case';

import { querySchema, testCaseFormSchema, useColumns } from './data';

defineOptions({
  name: 'ApiTestingTestCase',
});

const router = useRouter();

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
const gridOptions: VxeTableGridOptions<TestCase> = {
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
        return await getTestCaseListApi({
          page: page.currentPage,
          size: page.pageSize,
          ...formValues,
        });
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

// 创建/编辑用例表单
const [TestCaseForm, testCaseFormApi] = useVbenForm({
  schema: testCaseFormSchema,
});

// 创建用例模态框
const [CreateModal, createModalApi] = useVbenModal({
  title: '创建测试用例',
  onConfirm: async () => {
    const values = await testCaseFormApi.validate();
    if (values) {
      await createTestCaseApi(values);
      message.success('测试用例创建成功');
      onRefresh();
      return true;
    }
    return false;
  },
  onOpenChange: (isOpen) => {
    if (!isOpen) {
      testCaseFormApi.resetForm();
    }
  },
});

// 编辑用例模态框
const editingCaseId = ref<null | number>(null);
const [EditModal, editModalApi] = useVbenModal({
  title: '编辑测试用例',
  onConfirm: async () => {
    const values = await testCaseFormApi.validate();
    if (values && editingCaseId.value) {
      await updateTestCaseApi(editingCaseId.value, values);
      message.success('测试用例更新成功');
      onRefresh();
      return true;
    }
    return false;
  },
  onOpenChange: (isOpen) => {
    if (!isOpen) {
      testCaseFormApi.resetForm();
      editingCaseId.value = null;
    }
  },
});

// 操作处理
function onActionClick({ code, row }: OnActionClickParams<TestCase>) {
  switch (code) {
    case 'delete': {
      deleteTestCaseApi(row.id).then(() => {
        message.success('测试用例删除成功');
        onRefresh();
      });
      break;
    }
    case 'edit': {
      editingCaseId.value = row.id;
      testCaseFormApi.setValues(row);
      editModalApi.open();
      break;
    }
    case 'execute': {
      message.loading('正在执行测试用例...', 0);
      executeTestCaseApi(row.id)
        .then(() => {
          message.destroy();
          message.success('测试用例执行完成');
          // 可以跳转到报告页面查看结果
          router.push({
            name: 'ApiTestingTestReport',
            query: { test_case_id: row.id },
          });
        })
        .catch(() => {
          message.destroy();
          message.error('测试用例执行失败');
        });
      break;
    }
    case 'steps': {
      // 跳转到测试步骤管理页面
      router.push({
        name: 'ApiTestingTestStep',
        query: { test_case_id: row.id },
      });
      break;
    }
  }
}

// 刷新表格
function onRefresh() {
  gridApi.query();
}

// 创建用例
function handleCreate() {
  createModalApi.open();
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-actions>
        <VbenButton @click="handleCreate">
          <MaterialSymbolsAdd class="size-5" />
          创建测试用例
        </VbenButton>
      </template>
    </Grid>

    <!-- 创建用例模态框 -->
    <CreateModal>
      <TestCaseForm />
    </CreateModal>

    <!-- 编辑用例模态框 -->
    <EditModal>
      <TestCaseForm />
    </EditModal>
  </Page>
</template>
