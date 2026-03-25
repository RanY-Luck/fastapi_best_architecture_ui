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

const [VariableForm, variableFormApi] = useVbenForm({
  schema: variableFormSchema,
  showDefaultActions: false,
});

const transformFormData = (
  formValues: Record<string, unknown>,
  originalVariable?: null | Variable,
): VariableCreateParams => {
  const data: VariableCreateParams = {
    description: formValues.description as string | undefined,
    is_encrypted: Boolean(formValues.is_encrypted),
    name: String(formValues.name ?? ''),
    scope: formValues.scope as VariableScopeType,
    value: parseJsonInputOrRaw(formValues.value) ?? '',
  };

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

  if (originalVariable) {
    data.create_time = originalVariable.create_time;
    data.created_time = originalVariable.created_time;
    data.update_time = originalVariable.update_time;
    data.updated_time = new Date().toISOString();
  }

  return data;
};

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
      const requestData = transformFormData(values, editingVariable.value);

      await deleteVariableApi({
        name: editingVariable.value.name,
        scope: editingVariable.value.scope,
        project_id: editingVariable.value.project_id,
        environment_id: editingVariable.value.environment_id,
        case_id: editingVariable.value.case_id,
      } satisfies VariableDeleteParams);

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

function onRefresh() {
  gridApi.query();
}

function handleCreate() {
  createModalApi.open();
}

onMounted(() => {
  const environmentId = getRouteQueryNumber(route.query.environment_id);
  const projectId = getRouteQueryNumber(route.query.project_id);
  if (environmentId && projectId) {
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

    <CreateModal>
      <VariableForm />
    </CreateModal>

    <EditModal>
      <VariableForm />
    </EditModal>
  </Page>
</template>



