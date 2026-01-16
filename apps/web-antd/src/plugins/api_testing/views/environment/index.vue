<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { Environment } from '#/plugins/api_testing/api/types';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createEnvironmentApi,
  deleteEnvironmentApi,
  getEnvironmentListApi,
  setDefaultEnvironmentApi,
  updateEnvironmentApi,
} from '#/plugins/api_testing/api/environment';

import { environmentFormSchema, querySchema, useColumns } from './data';

defineOptions({
  name: 'ApiTestingEnvironment',
});

const router = useRouter();

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
        // 1. 过滤掉空字符串、null 和 undefined
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

        // 2. 直接调用接口，将过滤后的参数传给后端
        // 后端现在支持：{ project_id?, name?, status? }
        // 即使 filteredParams 为空对象，后端也会返回所有环境列表
        const data = await getEnvironmentListApi(filteredParams);

        // 3. 返回表格数据格式
        return {
          items: data,
          total: data.length,
          page: page.currentPage,
          size: page.pageSize,
        };
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
const transformFormData = (formValues: any) => {
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
    ...formValues,
    variables: parseJSON(formValues.variables),
  };
};

// 转换响应数据为表单格式
const transformResponseToForm = (data: any) => {
  return {
    ...data,
    variables: data.variables ? JSON.stringify(data.variables, null, 2) : '',
  };
};

// 创建环境模态框
const [CreateModal, createModalApi] = useVbenModal({
  closeOnClickModal: false,
  title: '创建环境',
  class: 'w-[800px]',
  onConfirm: async () => {
    try {
      const values = await environmentFormApi.getValues(true);
      if (values && Object.keys(values).length > 0) {
        const requestData = transformFormData(values);
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
  onOpenChange: (isOpen) => {
    if (isOpen) {
      environmentFormApi.resetForm();
    } else {
      environmentFormApi.resetForm();
    }
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
      const values = await environmentFormApi.getValues(true);
      const requestData = transformFormData(values);
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
