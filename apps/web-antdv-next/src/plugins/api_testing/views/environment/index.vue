<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type {
  Environment,
  EnvironmentCreateParams,
  EnvironmentListParams,
  EnvironmentUpdateParams,
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
  createEnvironmentApi,
  deleteEnvironmentApi,
  getEnvironmentListApi,
  setDefaultEnvironmentApi,
  updateEnvironmentApi,
} from '#/plugins/api_testing/api/environment';
import { getApiProjectListApi } from '#/plugins/api_testing/api/project';
import {
  buildLocalPageResult,
  filterEmptyParams,
  parseJsonInput,
  stringifyJsonInput,
} from '#/plugins/api_testing/utils';

import { environmentFormSchema, querySchema, useColumns } from './data';

defineOptions({
  name: 'ApiTestingEnvironment',
});

const router = useRouter();

async function getEnvironmentRows(formValues: Record<string, unknown>) {
  const params = filterEmptyParams(formValues) as EnvironmentListParams;
  const [environments, projectResult] = await Promise.all([
    getEnvironmentListApi(params),
    getApiProjectListApi({ page: 1, size: 1000 }),
  ]);

  const projectNameMap = new Map(
    projectResult.items.map((project) => [project.id, project.name]),
  );

  return environments.map((environment) => ({
    ...environment,
    project_name:
      environment.project_name ??
      projectNameMap.get(environment.project_id) ??
      String(environment.project_id),
  }));
}

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
const gridOptions: VxeTableGridOptions<Environment> = {
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
        const data = await getEnvironmentRows(formValues);
        return buildLocalPageResult(data, page.currentPage, page.pageSize);
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

// 创建/编辑环境表单
const [EnvironmentForm, environmentFormApi] = useVbenForm({
  schema: environmentFormSchema,
  showDefaultActions: false,
});

// 转换表单数据
const transformFormData = (
  formValues: Record<string, unknown>,
): EnvironmentCreateParams | EnvironmentUpdateParams => {
  return {
    ...formValues,
    variables: parseJsonInput(formValues.variables) as
      | EnvironmentCreateParams['variables']
      | EnvironmentUpdateParams['variables'],
  };
};

// 转换响应数据为表单格式
const transformResponseToForm = (data: Environment) => {
  return {
    ...data,
    variables: stringifyJsonInput(data.variables),
  };
};

// 创建环境模态框
const [CreateModal, createModalApi] = useVbenModal({
  closeOnClickModal: false,
  title: '创建环境',
  class: 'w-[800px]',
  onConfirm: async () => {
    try {
      const values = await environmentFormApi.getValues();
      if (values && Object.keys(values).length > 0) {
        const requestData = transformFormData(values) as EnvironmentCreateParams;
        await createEnvironmentApi(requestData);
        message.success('环境创建成功');
        onRefresh();
        createModalApi.close();
        return true;
      } else {
        message.warning('表单数据为空，请填写必填项');
        return false;
      }
    } catch (error) {
      console.error('表单验证失败:', error);
      if (error instanceof SyntaxError) {
        message.error('JSON格式错误，请检查变量格式');
      } else {
        message.error('表单验证失败，请检查必填项');
      }
      return false;
    }
  },
  onOpenChange: () => {
    environmentFormApi.resetForm();
  },
});

// 编辑环境模态框
const editingEnvironmentId = ref<null | number>(null);
const [EditModal, editModalApi] = useVbenModal({
  closeOnClickModal: false,
  title: '编辑环境',
  class: 'w-[800px]',
  onConfirm: async () => {
    try {
      if (!editingEnvironmentId.value) {
        message.error('编辑 ID 无效');
        return false;
      }
      const values = await environmentFormApi.getValues();
      const requestData = transformFormData(values) as EnvironmentUpdateParams;
      await updateEnvironmentApi(editingEnvironmentId.value, requestData);
      message.success('环境更新成功');
      onRefresh();
      editModalApi.close();
      return true;
    } catch (error) {
      console.error('表单验证失败:', error);
      if (error instanceof SyntaxError) {
        message.error('JSON格式错误，请检查变量格式');
      } else {
        message.error('表单验证失败，请检查必填项');
      }
      return false;
    }
  },
  onOpenChange: async (isOpen) => {
    if (!isOpen) {
      environmentFormApi.resetForm();
      editingEnvironmentId.value = null;
    }
  },
});

// 操作处理
function onActionClick({ code, row }: OnActionClickParams<Environment>) {
  switch (code) {
    case 'delete': {
      deleteEnvironmentApi(row.id).then(() => {
        message.success('环境删除成功');
        onRefresh();
      });
      break;
    }
    case 'edit': {
      editingEnvironmentId.value = row.id;
      const formData = transformResponseToForm(row);
      environmentFormApi.setValues(formData);
      editModalApi.open();
      break;
    }
    case 'setDefault': {
      setDefaultEnvironmentApi(row.project_id, row.id).then(() => {
        message.success('设置默认环境成功');
        onRefresh();
      });
      break;
    }
    case 'variables': {
      // 跳转到变量管理页面
      router.push({
        name: 'ApiTestingVariable',
        query: { environment_id: row.id, project_id: row.project_id },
      });
      break;
    }
  }
}

// 刷新表格
function onRefresh() {
  gridApi.query();
}

// 创建环境
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
          创建环境
        </VbenButton>
      </template>
    </Grid>

    <!-- 创建环境模态框 -->
    <CreateModal>
      <EnvironmentForm />
    </CreateModal>

    <!-- 编辑环境模态框 -->
    <EditModal>
      <EnvironmentForm />
    </EditModal>
  </Page>
</template>
