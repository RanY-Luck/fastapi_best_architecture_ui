import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeGridProps } from '#/adapter/vxe-table';
import type { Environment } from '#/plugins/api_testing/api/types';

import { $t } from '@vben/locales';

import { CodeMirror } from '#/components/CodeMirror';
import { getAllEnabledApiProjectsApi } from '#/plugins/api_testing/api/project';

// 查询表单配置
export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'name',
    label: '环境名称',
    componentProps: {
      placeholder: '请输入环境名称',
    },
  },
  {
    component: 'ApiSelect',
    fieldName: 'project_id',
    label: '所属项目',
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
    component: 'Select',
    fieldName: 'status',
    label: '状态',
    componentProps: {
      placeholder: '请选择状态',
      options: [
        { label: '全部', value: '' },
        { label: '启用', value: 1 },
        { label: '禁用', value: 0 },
      ],
    },
  },
];

// 环境表单配置
export const environmentFormSchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'name',
    label: '环境名称',
    rules: 'required',
    componentProps: {
      placeholder: '请输入环境名称，如：开发环境、测试环境',
    },
  },
  {
    component: 'ApiSelect',
    fieldName: 'project_id',
    label: '所属项目',
    rules: 'required',
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
    component: 'Textarea',
    fieldName: 'description',
    label: '环境描述',
    componentProps: {
      placeholder: '请输入环境描述',
      rows: 3,
    },
  },
  {
    component: CodeMirror,
    fieldName: 'variables',
    label: '环境变量',
    componentProps: {
      placeholder:
        '请输入环境变量(JSON格式)\n例如: {"api_host": "https://api.test.com", "api_key": "xxx"}',
      language: 'json',
      height: 300,
      theme: 'light',
      lineNumbers: true,
      lineWrapping: true,
      tabSize: 2,
    },
  },
  {
    component: 'Switch',
    fieldName: 'is_default',
    label: '设为默认',
    defaultValue: false,
    componentProps: {
      checkedChildren: '是',
      unCheckedChildren: '否',
    },
  },
  {
    component: 'Select',
    fieldName: 'status',
    label: '状态',
    rules: 'required',
    defaultValue: 1,
    componentProps: {
      placeholder: '请选择状态',
      options: [
        { label: '启用', value: 1 },
        { label: '禁用', value: 0 },
      ],
    },
  },
];

// 表格列配置
export function useColumns(
  onActionClick: OnActionClickFn<Environment>,
): VxeGridProps<Environment>['columns'] {
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
      title: '环境名称',
      field: 'name',
      minWidth: 150,
    },
    {
      title: '所属项目',
      field: 'project_name',
      minWidth: 150,
    },
    {
      title: '描述',
      field: 'description',
      minWidth: 200,
      showOverflow: 'tooltip',
    },
    {
      title: '是否默认',
      field: 'is_default',
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
      title: '变量数量',
      field: 'variable_count',
      width: 100,
      formatter: ({ row }) => {
        return row.variables ? Object.keys(row.variables).length : 0;
      },
    },
    {
      title: '状态',
      field: 'status',
      width: 100,
      cellRender: {
        name: 'CellTag',
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
      width: 350,
      fixed: 'right',
      cellRender: {
        attrs: {
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'variables',
            text: '管理变量',
            icon: 'lucide:settings',
          },
          {
            code: 'setDefault',
            text: '设为默认',
            icon: 'lucide:star',
            color: 'warning',
          },
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
              content: '确定要删除这个环境吗？删除后不可恢复。',
            },
          },
        ],
      },
    },
  ];
}
