<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type {
  Variable,
  VariableCreateParams,
  VariableDeleteParams,
  VariableQueryParams,
  VariableScopeType,
} from '#/plugins/api_testing/api/types';

import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { $t } from '#/locales';
import {
  createVariableApi,
  deleteVariableApi,
  getVariableListApi,
} from '#/plugins/api_testing/api/environment';
import {
  buildLocalPageResult,
  filterEmptyParams,
  getRouteQueryNumber,
  parseJsonInputOrRaw,
  stringifyJsonInput,
} from '#/plugins/api_testing/utils';

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
        const filteredParams = filterEmptyParams(formValues) as Partial<VariableQueryParams>;

        // 必须有 scope 参数
        if (!filteredParams.scope) {
          return buildLocalPageResult([], page.currentPage, page.pageSize);
        }

        const data = await getVariableListApi(filteredParams as VariableQueryParams);
        return buildLocalPageResult(data, page.currentPage, page.pageSize);
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
const transformFormData = (
  formValues: Record<string, unknown>,
): VariableCreateParams => {
  const data: VariableCreateParams = {
    description: formValues.description as string | undefined,
    is_encrypted: Boolean(formValues.is_encrypted),
    name: String(formValues.name ?? ''),
    scope: formValues.scope as VariableScopeType,
    value: parseJsonInputOrRaw(formValues.value) ?? '',
  };

  // 根据作用域添加相应的ID
  if (
    typeof formValues.scope === 'string' &&
    ['case', 'environment', 'project'].includes(formValues.scope)
  ) {
    data.project_id = formValues.project_id as number | undefined;
  }
  if (formValues.scope === 'environment') {
    data.environment_id = formValues.environment_id as number | undefined;
  }
  if (formValues.scope === 'case') {
    data.case_id = formValues.case_id as number | undefined;
  }

  return data;
};

// 转换响应数据为表单格式
const transformResponseToForm = (data: Variable) => {
  return {
    name: data.name,
    value: stringifyJsonInput(data.value),
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
      const values = await variableFormApi.getValues();
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
      const environmentId = getRouteQueryNumber(route.query.environment_id);
      const projectId = getRouteQueryNumber(route.query.project_id);
      if (environmentId && projectId) {
        variableFormApi.setValues({
          scope: 'environment',
          environment_id: environmentId,
          project_id: projectId,
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
const editingVariable = ref<null | Variable>(null);
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
      const values = await variableFormApi.getValues();
      const requestData = transformFormData(values);

      // 先删除旧变量
      await deleteVariableApi({
        name: editingVariable.value.name,
        scope: editingVariable.value.scope,
        project_id: editingVariable.value.project_id,
        environment_id: editingVariable.value.environment_id,
        case_id: editingVariable.value.case_id,
      } satisfies VariableDeleteParams);

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
  onOpenChange: (isOpen) => {
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
      } satisfies VariableDeleteParams).then(() => {
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
  const environmentId = getRouteQueryNumber(route.query.environment_id);
  const projectId = getRouteQueryNumber(route.query.project_id);
  if (environmentId && projectId) {
    // 设置查询表单的默认值
    gridApi.query({
      scope: 'environment',
      environment_id: environmentId,
      project_id: projectId,
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
