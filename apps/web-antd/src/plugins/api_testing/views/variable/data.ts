import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeGridProps } from '#/adapter/vxe-table';
import type { Variable } from '#/plugins/api_testing/api/types';

import { $t } from '@vben/locales';

import { CodeMirror } from '#/components/CodeMirror';
import { getAllEnabledApiProjectsApi } from '#/plugins/api_testing/api/project';
import { getAllEnabledTestCasesApi } from '#/plugins/api_testing/api/testcase';

// 变量作用域选项
export const variableScopeOptions = [
  { label: '全局变量', value: 'global' },
  { label: '项目变量', value: 'project' },
  { label: '环境变量', value: 'environment' },
  { label: '用例变量', value: 'case' },
];

// 查询表单配置
export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'name',
    label: '变量名称',
    componentProps: {
      placeholder: '请输入变量名称',
    },
  },
  {
    component: 'Select',
    fieldName: 'scope',
    label: '作用域',
    rules: 'required',
    defaultValue: 'project',
    componentProps: {
      placeholder: '请选择作用域',
      options: variableScopeOptions,
    },
  },
  {
    component: 'ApiSelect',
    fieldName: 'project_id',
    label: '所属项目',
    dependencies: {
      triggerFields: ['scope'],
      condition: (values) => {
        return ['case', 'environment', 'project'].includes(values.scope);
      },
    },
    componentProps: {
      placeholder: '请选择项目',
      api: async () => {
        const data = (await getAllEnabledApiProjectsApi()) as any;
        if (data && 'items' in data && Array.isArray(data.items)) {
          return data.items;
        }
        return Array.isArray(data) ? data : [];
      },
      labelField: 'name',
      valueField: 'id',
      immediate: true,
    },
  },
  {
    component: 'InputNumber',
    fieldName: 'environment_id',
    label: '环境ID',
    dependencies: {
      triggerFields: ['scope'],
      condition: (values) => {
        return values.scope === 'environment';
      },
    },
    componentProps: {
      placeholder: '请输入环境ID',
    },
  },
  {
    component: 'ApiSelect',
    fieldName: 'case_id',
    label: '测试用例',
    dependencies: {
      triggerFields: ['scope'],
      condition: (values) => {
        return values.scope === 'case';
      },
    },
    componentProps: {
      placeholder: '请选择测试用例',
      api: async () => {
        const data = (await getAllEnabledTestCasesApi()) as any;
        if (data && 'items' in data && Array.isArray(data.items)) {
          return data.items;
        }
        return Array.isArray(data) ? data : [];
      },
      labelField: 'name',
      valueField: 'id',
      immediate: true,
    },
  },
];

// 变量表单配置
export const variableFormSchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'name',
    label: '变量名称',
    rules: 'required',
    componentProps: {
      placeholder: '请输入变量名称，如：api_token',
    },
  },
  {
    component: 'Select',
    fieldName: 'scope',
    label: '作用域',
    rules: 'required',
    defaultValue: 'project',
    componentProps: {
      placeholder: '请选择作用域',
      options: variableScopeOptions,
    },
  },
  {
    component: 'ApiSelect',
    fieldName: 'project_id',
    label: '所属项目',
    dependencies: {
      triggerFields: ['scope'],
      condition: (values) => {
        return ['case', 'environment', 'project'].includes(values.scope);
      },
      rules: (values) => {
        return ['case', 'environment', 'project'].includes(values.scope)
          ? 'required'
          : '';
      },
    },
    componentProps: {
      placeholder: '请选择项目',
      api: async () => {
        const data = (await getAllEnabledApiProjectsApi()) as any;
        if (data && 'items' in data && Array.isArray(data.items)) {
          return data.items;
        }
        return Array.isArray(data) ? data : [];
      },
      labelField: 'name',
      valueField: 'id',
      immediate: true,
    },
  },
  {
    component: 'InputNumber',
    fieldName: 'environment_id',
    label: '环境ID',
    dependencies: {
      triggerFields: ['scope'],
      condition: (values) => {
        return values.scope === 'environment';
      },
      rules: (values) => {
        return values.scope === 'environment' ? 'required' : '';
      },
    },
    componentProps: {
      placeholder: '请输入环境ID',
    },
  },
  {
    component: 'ApiSelect',
    fieldName: 'case_id',
    label: '测试用例',
    dependencies: {
      triggerFields: ['scope'],
      condition: (values) => {
        return values.scope === 'case';
      },
      rules: (values) => {
        return values.scope === 'case' ? 'required' : '';
      },
    },
    componentProps: {
      placeholder: '请选择测试用例',
      api: async () => {
        const data = (await getAllEnabledTestCasesApi()) as any;
        if (data && 'items' in data && Array.isArray(data.items)) {
          return data.items;
        }
        return Array.isArray(data) ? data : [];
      },
      labelField: 'name',
      valueField: 'id',
      immediate: true,
    },
  },
  {
    component: CodeMirror,
    fieldName: 'value',
    label: '变量值',
    rules: 'required',
    componentProps: {
      placeholder: '请输入变量值，支持JSON格式',
      language: 'json',
      height: 200,
      theme: 'light',
      lineNumbers: true,
      lineWrapping: true,
      tabSize: 2,
    },
  },
  {
    component: 'Textarea',
    fieldName: 'description',
    label: '变量描述',
    componentProps: {
      placeholder: '请输入变量描述',
      rows: 3,
    },
  },
  {
    component: 'Switch',
    fieldName: 'is_encrypted',
    label: '加密存储',
    defaultValue: false,
    componentProps: {
      checkedChildren: '是',
      unCheckedChildren: '否',
    },
  },
];

// 表格列配置
export function useColumns(
  onActionClick: OnActionClickFn<Variable>,
): VxeGridProps<Variable>['columns'] {
  return [
    {
      type: 'checkbox',
      width: 50,
    },
    {
      field: 'seq',
      title: $t('common.table.id'),
      type: 'seq',
      width: 50,
    },
    {
      title: '变量名称',
      field: 'name',
      minWidth: 150,
    },
    {
      title: '作用域',
      field: 'scope',
      width: 120,
      cellRender: {
        name: 'CellTag',
        options: [
          { label: '全局', value: 'global', color: 'purple' },
          { label: '项目', value: 'project', color: 'blue' },
          { label: '环境', value: 'environment', color: 'green' },
          { label: '用例', value: 'case', color: 'orange' },
        ],
      },
    },
    {
      title: '变量值',
      field: 'value',
      minWidth: 200,
      showOverflow: 'tooltip',
      formatter: ({ row }) => {
        if (row.is_encrypted) {
          return '******';
        }
        return typeof row.value === 'object'
          ? JSON.stringify(row.value)
          : row.value;
      },
    },
    {
      title: '描述',
      field: 'description',
      minWidth: 200,
      showOverflow: 'tooltip',
    },
    {
      title: '是否加密',
      field: 'is_encrypted',
      width: 100,
      cellRender: {
        name: 'CellTag',
        options: [
          { label: '是', value: true, color: 'success' },
          { label: '否', value: false, color: 'default' },
        ],
      },
    },
    {
      title: $t('common.table.created_time'),
      field: 'created_time',
      width: 180,
      formatter: ({ cellValue }) => {
        return cellValue ? new Date(cellValue).toLocaleString() : '';
      },
    },
    {
      title: $t('common.table.updated_time'),
      field: 'updated_time',
      width: 180,
      formatter: ({ cellValue }) => {
        return cellValue ? new Date(cellValue).toLocaleString() : '';
      },
    },
    {
      title: $t('common.table.operation'),
      field: 'operation',
      width: 200,
      fixed: 'right',
      cellRender: {
        attrs: {
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'edit',
            text: '编辑',
            icon: 'lucide:edit',
          },
          {
            code: 'delete',
            text: '删除',
            icon: 'lucide:trash-2',
            color: 'error',
            confirm: {
              title: '确认删除',
              content: '确定要删除这个变量吗？删除后不可恢复。',
            },
          },
        ],
      },
    },
  ];
}
