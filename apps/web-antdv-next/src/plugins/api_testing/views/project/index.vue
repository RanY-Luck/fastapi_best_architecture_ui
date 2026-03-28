<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type {
  ApiProject,
  ApiProjectCreateParams,
  ApiProjectParams,
  ApiProjectUpdateParams,
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
  createApiProjectApi,
  deleteApiProjectApi,
  executeApiProjectApi,
  getApiProjectListApi,
  updateApiProjectApi,
} from '#/plugins/api_testing/api/project';
import { filterEmptyParams } from '#/plugins/api_testing/utils';

import { projectFormSchema, querySchema, useColumns } from './data';

defineOptions({
  name: 'ApiTestingProject',
});

const DEFAULT_BATCH_MAX_CONCURRENCY = 3;
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
        return await getApiProjectListApi({
          page: page.currentPage,
          size: page.pageSize,
          ...(filterEmptyParams(formValues) as ApiProjectParams),
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
  closeOnClickModal: false, // 禁止点击遮罩关闭
  title: '创建项目',
  onConfirm: async () => {
    try {
      const values = (await projectFormApi.getValues()) as ApiProjectCreateParams;
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
  onOpenChange: () => {
    projectFormApi.resetForm();
  },
});

// 编辑项目模态框
const editingProjectId = ref<null | number>(null);
const [EditModal, editModalApi] = useVbenModal({
  closeOnClickModal: false, // 禁止点击遮罩关闭
  title: '编辑项目',
  class: 'w-[600px]',
  onConfirm: async () => {
    try {
      if (!editingProjectId.value) {
        message.error('编辑 ID 无效');
        return false;
      }
      const values = (await projectFormApi.getValues()) as ApiProjectUpdateParams;
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
  onOpenChange: (isOpen) => {
    if (!isOpen) {
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
    case 'batchExecute': {
      message.loading('正在批量执行项目用例...', 0);
      executeApiProjectApi(row.id, {
        max_concurrency: DEFAULT_BATCH_MAX_CONCURRENCY,
      })
        .then((result) => {
          message.destroy();
          message.success('项目批量执行完成');
          router.push({
            name: 'ApiTestingBatchReport',
            query: {
              project_id: String(row.id),
              report_id: String(result.batch_report_id),
              target_type: 'project',
            },
          });
        })
        .catch((error) => {
          console.error('项目批量执行失败:', error);
          message.destroy();
          message.error('项目批量执行失败');
        });
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
