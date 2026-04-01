<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type {
  TestCase,
  TestCaseCreateParams,
  TestCaseParams,
  TestCaseUpdateParams,
} from '#/plugins/api_testing/api/types';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { $t } from '#/locales';
import {
  createTestCaseApi,
  deleteTestCaseApi,
  getTestCaseListApi,
  updateTestCaseApi,
} from '#/plugins/api_testing/api/testcase';
import { filterEmptyParams } from '#/plugins/api_testing/utils';

import { querySchema, testCaseFormSchema, useColumns } from './data';

defineOptions({
  name: 'ApiTestingTestCase',
});

const router = useRouter();

// 表单配置
const formOptions: VbenFormProps = {
  // 默认展开
  collapsed: false,
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
          ...(filterEmptyParams(formValues) as TestCaseParams),
        });
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

// 创建/编辑用例表单
const [TestCaseForm, testCaseFormApi] = useVbenForm({
  schema: testCaseFormSchema,
  // 移除默认按钮
  showDefaultActions: false,
});

// 创建用例模态框
const [CreateModal, createModalApi] = useVbenModal({
  closeOnClickModal: false, // 禁止点击遮罩关闭
  title: '创建测试用例',
  onConfirm: async () => {
    try {
      const values = (await testCaseFormApi.getValues()) as TestCaseCreateParams;
      if (values && Object.keys(values).length > 0) {
        await createTestCaseApi(values);
        message.success('测试用例创建成功');
        onRefresh();
        createModalApi.close();
        return true;
      } else {
        message.warning('表单数据为空，请填写必填项');
        return false;
      }
    } catch (error) {
      console.error('表单验证失败:', error);
      message.error('表单验证失败，请检查必填项');
      return false;
    }
  },
  onOpenChange: () => {
    testCaseFormApi.resetForm();
  },
});

// 编辑用例模态框
const editingCaseId = ref<null | number>(null);
const [EditModal, editModalApi] = useVbenModal({
  closeOnClickModal: false, // 禁止点击遮罩关闭
  title: '编辑测试用例',
  onConfirm: async () => {
    try {
      if (!editingCaseId.value) {
        message.error('编辑 ID 无效');
        return false;
      }
      const values = (await testCaseFormApi.getValues()) as TestCaseUpdateParams;
      await updateTestCaseApi(editingCaseId.value, values);
      message.success('测试用例更新成功');
      onRefresh();
      editModalApi.close();
      return true;
    } catch (error) {
      console.error('表单验证失败:', error);
      message.error('表单验证失败，请检查必填项');
      return false;
    }
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
      router.push({
        name: 'ApiTestingExecutionStream',
        query: { case_id: row.id },
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
        <VbenButton
          class="ml-2"
          variant="outline"
          @click="router.push({ name: 'ApiTestingTestSuite' })"
        >
          测试集合
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
