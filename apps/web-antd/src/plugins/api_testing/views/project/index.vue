<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { ApiProject } from '#/plugins/api_testing/api';

import { ref } from 'vue';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createApiProjectApi,
  deleteApiProjectApi,
  getApiProjectListApi,
  updateApiProjectApi,
} from '#/plugins/api_testing/api/project';

import { projectFormSchema, querySchema, useColumns } from './data';

defineOptions({
  name: 'ApiTestingProject',
});

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
const gridOptions: VxeTableGridOptions<ApiProject> = {
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
    custom: true,
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
        return await getApiProjectListApi({
          page: page.currentPage,
          size: page.pageSize,
          ...filteredParams,
        });
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

// 创建/编辑项目表单
const [ProjectForm, projectFormApi] = useVbenForm({
  schema: projectFormSchema,
  // 移除默认按钮
  showDefaultActions: false,
});

// 创建项目模态框
const [CreateModal, createModalApi] = useVbenModal({
  title: '创建项目',
  onConfirm: async () => {
    try {
      // 先验证并获取值（true 表示验证后获取）
      const values = await projectFormApi.getValues(true);
      if (values && Object.keys(values).length > 0) {
        // 额外检查非空
        await createApiProjectApi(values);
        message.success('项目创建成功');
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
      projectFormApi.resetForm(); // 打开时重置为空（创建模式）
    } else {
      projectFormApi.resetForm(); // 关闭时也重置（可选，防残留）
    }
  },
});

// 编辑项目模态框
const editingProjectId = ref<null | number>(null);
const [EditModal, editModalApi] = useVbenModal({
  title: '编辑项目',
  width: 600,
  onConfirm: async () => {
    try {
      if (!editingProjectId.value) {
        message.error('编辑 ID 无效');
        return false;
      }
      // 先验证并获取值
      const values = await projectFormApi.getValues(true);
      await updateApiProjectApi(editingProjectId.value, values);
      message.success('项目更新成功');
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
      if (editingProjectId.value) {
        // 编辑模式
        projectFormApi.resetForm(); // 先重置
        projectFormApi.setValues(record || {}); // setValues 支持直接传入 record（如果有）
      } else {
        projectFormApi.resetForm(); // 如果有查看模式等
      }
    } else {
      projectFormApi.resetForm();
      editingProjectId.value = null;
    }
  },
});

// 操作处理
function onActionClick({ code, row }: OnActionClickParams<ApiProject>) {
  switch (code) {
    case 'delete': {
      deleteApiProjectApi(row.id).then(() => {
        message.success('项目删除成功');
        onRefresh();
      });
      break;
    }
    case 'edit': {
      editingProjectId.value = row.id;
      projectFormApi.setValues(row);
      editModalApi.open();
      break;
    }
  }
}

// 刷新表格
function onRefresh() {
  gridApi.query();
}

// 创建项目
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
          创建项目
        </VbenButton>
      </template>
    </Grid>

    <!-- 创建项目模态框 -->
    <CreateModal>
      <ProjectForm />
    </CreateModal>

    <!-- 编辑项目模态框 -->
    <EditModal>
      <ProjectForm />
    </EditModal>
  </Page>
</template>
