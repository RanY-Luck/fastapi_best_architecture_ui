<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { Variable } from '#/plugins/api_testing/api/types';

import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createVariableApi,
  deleteVariableApi,
  getVariableListApi,
} from '#/plugins/api_testing/api/environment';

import { querySchema, useColumns, variableFormSchema } from './data';

defineOptions({
  name: 'ApiTestingVariable',
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
const gridOptions: VxeTableGridOptions<Variable> = {
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

        // 必须有 scope 参数
        if (!filteredParams.scope) {
          return {
            items: [],
            total: 0,
            page: page.currentPage,
            size: page.pageSize,
          };
        }

        const data = await getVariableListApi(filteredParams);
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

// 创建/编辑变量表单
const [VariableForm, variableFormApi] = useVbenForm({
  schema: variableFormSchema,
  showDefaultActions: false,
});

// 转换表单数据
const transformFormData = (formValues: any) => {
  const parseValue = (value: any) => {
    if (!value || value === '') return '';
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value; // 如果不是JSON，直接返回字符串
      }
    }
    return value;
  };

  const data: any = {
    name: formValues.name,
    value: parseValue(formValues.value),
    scope: formValues.scope,
    description: formValues.description,
    is_encrypted: formValues.is_encrypted || false,
  };

  // 根据作用域添加相应的ID
  if (['case', 'environment', 'project'].includes(formValues.scope)) {
    data.project_id = formValues.project_id;
  }
  if (formValues.scope === 'environment') {
    data.environment_id = formValues.environment_id;
  }
  if (formValues.scope === 'case') {
    data.case_id = formValues.case_id;
  }

  return data;
};

// 转换响应数据为表单格式
const transformResponseToForm = (data: any) => {
  return {
    name: data.name,
    value:
      typeof data.value === 'object'
        ? JSON.stringify(data.value, null, 2)
        : data.value,
    scope: data.scope,
    project_id: data.project_id,
    environment_id: data.environment_id,
    case_id: data.case_id,
    description: data.description,
    is_encrypted: data.is_encrypted,
  };
};

// 创建变量模态框
const [CreateModal, createModalApi] = useVbenModal({
  closeOnClickModal: false,
  title: '创建变量',
  class: 'w-[800px]',
  onConfirm: async () => {
    try {
      const values = await variableFormApi.getValues(true);
      if (values && Object.keys(values).length > 0) {
        const requestData = transformFormData(values);
        await createVariableApi(requestData);
        message.success('变量创建成功');
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
        message.error('JSON格式错误，请检查变量值格式');
      } else {
        message.error('表单验证失败，请检查必填项');
      }
      return false;
    }
  },
  onOpenChange: (isOpen) => {
    if (isOpen) {
      // 如果从环境管理页面跳转过来，自动填充相关信息
      const environmentId = route.query.environment_id;
      const projectId = route.query.project_id;
      if (environmentId && projectId) {
        variableFormApi.setValues({
          scope: 'environment',
          environment_id: Number(environmentId),
          project_id: Number(projectId),
        });
      } else {
        variableFormApi.resetForm();
      }
    } else {
      variableFormApi.resetForm();
    }
  },
});

// 编辑变量（注意：变量是通过 name + scope 等组合唯一标识的，不是 id）
const editingVariable = ref<any>(null);
const [EditModal, editModalApi] = useVbenModal({
  closeOnClickModal: false,
  title: '编辑变量',
  class: 'w-[800px]',
  onConfirm: async () => {
    try {
      if (!editingVariable.value) {
        message.error('编辑变量信息无效');
        return false;
      }
      const values = await variableFormApi.getValues(true);
      const requestData = transformFormData(values);

      // 先删除旧变量
      await deleteVariableApi({
        name: editingVariable.value.name,
        scope: editingVariable.value.scope,
        project_id: editingVariable.value.project_id,
        environment_id: editingVariable.value.environment_id,
        case_id: editingVariable.value.case_id,
      });

      // 再创建新变量
      await createVariableApi(requestData);
      message.success('变量更新成功');
      onRefresh();
      editModalApi.close();
      return true;
    } catch (error) {
      console.error('表单验证失败:', error);
      if (error instanceof SyntaxError) {
        message.error('JSON格式错误，请检查变量值格式');
      } else {
        message.error('表单验证失败，请检查必填项');
      }
      return false;
    }
  },
  onOpenChange: async (isOpen) => {
    if (!isOpen) {
      variableFormApi.resetForm();
      editingVariable.value = null;
    }
  },
});

// 操作处理
function onActionClick({ code, row }: OnActionClickParams<Variable>) {
  switch (code) {
    case 'delete': {
      deleteVariableApi({
        name: row.name,
        scope: row.scope,
        project_id: row.project_id,
        environment_id: row.environment_id,
        case_id: row.case_id,
      }).then(() => {
        message.success('变量删除成功');
        onRefresh();
      });
      break;
    }
    case 'edit': {
      editingVariable.value = row;
      const formData = transformResponseToForm(row);
      variableFormApi.setValues(formData);
      editModalApi.open();
      break;
    }
  }
}

// 刷新表格
function onRefresh() {
  gridApi.query();
}

// 创建变量
function handleCreate() {
  createModalApi.open();
}

// 初始化时如果有environment_id参数，设置到查询表单中
onMounted(() => {
  const environmentId = route.query.environment_id;
  const projectId = route.query.project_id;
  if (environmentId && projectId) {
    // 设置查询表单的默认值
    gridApi.query({
      scope: 'environment',
      environment_id: Number(environmentId),
      project_id: Number(projectId),
    });
  }
});
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-actions>
        <VbenButton @click="handleCreate">
          <MaterialSymbolsAdd class="size-5" />
          创建变量
        </VbenButton>
      </template>
    </Grid>

    <!-- 创建变量模态框 -->
    <CreateModal>
      <VariableForm />
    </CreateModal>

    <!-- 编辑变量模态框 -->
    <EditModal>
      <VariableForm />
    </EditModal>
  </Page>
</template>
