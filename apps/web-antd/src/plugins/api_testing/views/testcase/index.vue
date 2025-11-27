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
} from '#/plugins/api_testing/api/testcase';

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
        // 过滤掉空字符串和 null
        // eslint-disable-next-line unicorn/no-array-reduce
        const filteredParams = Object.entries(formValues).reduce(
          (acc, [key, value]) => {
            if (value !== '' && value !== null && value !== undefined) {
              acc[key] = value;
            }
            return acc;
          },
          {},
        );
        return await getTestCaseListApi({
          page: page.currentPage,
          size: page.pageSize,
          ...filteredParams,
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
      const values = await testCaseFormApi.getValues(true);
      if (values && Object.keys(values).length > 0) {
        // 额外检查非空
        await createTestCaseApi(values);
        message.success('测试用例创建成功');
        onRefresh();
        createModalApi.close(); // 显式关闭
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
  onOpenChange: (isOpen) => {
    if (isOpen) {
      testCaseFormApi.resetForm(); // 打开时重置为空（创建模式）
    } else {
      testCaseFormApi.resetForm(); // 关闭时也重置（可选，防残留）
    }
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
      // 先验证并获取值
      const values = await testCaseFormApi.getValues(true);
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
  onOpenChange: async (isOpen, { record }) => {
    // 可选：用 record 传入数据
    if (isOpen) {
      if (editingCaseId.value) {
        // 编辑模式
        testCaseFormApi.resetForm(); // 先重置
        testCaseFormApi.setValues(record || {}); // setValues 支持直接传入 record（如果有）
      } else {
        testCaseFormApi.resetForm(); // 如果有查看模式等
      }
    } else {
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
