import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeGridProps } from '#/adapter/vxe-table';
import type { ApiProject } from '#/plugins/api_testing/api';

import { $t } from '@vben/locales';
// 查询表单配置
export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'name',
    label: '项目名称',
    componentProps: {
      placeholder: '请输入项目名称',
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

// 项目表单配置
export const projectFormSchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'name',
    label: '项目名称',
    rules: 'required',
    componentProps: {
      placeholder: '请输入项目名称',
    },
  },
  {
    component: 'Input',
    fieldName: 'base_url',
    label: '基础URL',
    rules: 'required',
    componentProps: {
      placeholder: '请输入基础URL，如：https://api.example.com',
    },
  },
  {
    component: 'Textarea',
    fieldName: 'description',
    label: '项目描述',
    componentProps: {
      placeholder: '请输入项目描述',
      rows: 3,
    },
  },
  {
    component: 'Select',
    fieldName: 'status',
    label: '状态',
    rules: 'required',
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
  onActionClick: OnActionClickFn<ApiProject>,
): VxeGridProps<ApiProject>['columns'] {
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
      title: '项目名称',
      field: 'name',
      minWidth: 150,
    },
    {
      title: '基础URL',
      field: 'base_url',
      minWidth: 200,
    },
    {
      title: '描述',
      field: 'description',
      minWidth: 200,
      showOverflow: 'tooltip',
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
              content: '确定要删除这个项目吗？删除后不可恢复。',
            },
          },
        ],
      },
    },
  ];
}
