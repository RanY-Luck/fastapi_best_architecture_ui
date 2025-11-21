import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeGridProps } from '#/adapter/vxe-table';
import type { TestStep } from '#/plugins/api_testing/api/types';

import { $t } from '@vben/locales';

// HTTP方法选项
export const httpMethodOptions = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
  { label: 'PATCH', value: 'PATCH' },
  { label: 'HEAD', value: 'HEAD' },
  { label: 'OPTIONS', value: 'OPTIONS' },
];

// 查询表单配置
export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'name',
    label: '步骤名称',
    componentProps: {
      placeholder: '请输入步骤名称',
    },
  },
  {
    component: 'Input',
    fieldName: 'test_case_id',
    label: '测试用例ID',
    componentProps: {
      placeholder: '请输入测试用例ID',
      type: 'number',
    },
  },
  {
    component: 'Select',
    fieldName: 'method',
    label: 'HTTP方法',
    componentProps: {
      placeholder: '请选择HTTP方法',
      options: [{ label: '全部', value: '' }, ...httpMethodOptions],
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

// 测试步骤表单配置
export const testStepFormSchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'name',
    label: '步骤名称',
    rules: 'required',
  },
  {
    component: 'Input',
    fieldName: 'test_case_id',
    label: '测试用例ID',
    rules: 'required',
  },
  {
    component: 'Input',
    fieldName: 'url',
    label: '请求URL',
    rules: 'required',
  },
  {
    component: 'Select',
    fieldName: 'method',
    label: 'HTTP方法',
    rules: 'required',
    componentProps: {
      options: httpMethodOptions,
    },
  },
  {
    component: 'Textarea',
    fieldName: 'headers',
    label: '请求头',
    componentProps: {
      placeholder:
        '请输入请求头(JSON格式)\n例如: {"Content-Type": "application/json"}',
      rows: 4,
    },
  },
  {
    component: 'Textarea',
    fieldName: 'params',
    label: '查询参数',
    componentProps: {
      placeholder: '请输入查询参数(JSON格式)\n例如: {"page": 1, "size": 10}',
      rows: 4,
    },
  },
  {
    component: 'Textarea',
    fieldName: 'body',
    label: '请求体',
    componentProps: {
      placeholder: '请输入请求体(JSON格式)',
      rows: 5,
    },
  },
  {
    component: 'Textarea',
    fieldName: 'files',
    label: '文件上传',
    componentProps: {
      placeholder: '请输入文件配置(JSON格式)',
      rows: 3,
    },
  },
  {
    component: 'Textarea',
    fieldName: 'auth',
    label: '认证信息',
    componentProps: {
      placeholder:
        '请输入认证信息(JSON格式)\n例如: {"type": "Bearer", "token": "xxx"}',
      rows: 3,
    },
  },
  {
    component: 'Textarea',
    fieldName: 'extract',
    label: '变量提取',
    componentProps: {
      placeholder:
        '请输入变量提取规则(JSON格式)\n例如: {"user_id": "$.data.id"}',
      rows: 4,
    },
  },
  {
    component: 'Textarea',
    fieldName: 'validations',
    label: '断言规则',
    componentProps: {
      placeholder:
        '请输入断言规则(JSON格式)\n例如: [{"field": "status_code", "operator": "eq", "expected": 200}]',
      rows: 5,
    },
  },
  {
    component: 'Textarea',
    fieldName: 'sql_queries',
    label: 'SQL查询',
    componentProps: {
      placeholder: '请输入SQL查询(JSON格式)',
      rows: 4,
    },
  },
  {
    component: 'InputNumber',
    fieldName: 'timeout',
    label: '超时时间(秒)',
    defaultValue: 30,
    componentProps: {
      min: 1,
      max: 300,
    },
  },
  {
    component: 'InputNumber',
    fieldName: 'retry',
    label: '重试次数',
    defaultValue: 0,
    componentProps: {
      min: 0,
      max: 10,
    },
  },
  {
    component: 'InputNumber',
    fieldName: 'retry_interval',
    label: '重试间隔(秒)',
    defaultValue: 1,
    componentProps: {
      min: 1,
      max: 60,
    },
  },
  {
    component: 'InputNumber',
    fieldName: 'order',
    label: '执行顺序',
    rules: 'required',
    defaultValue: 0,
    componentProps: {
      min: 0,
    },
  },
  {
    component: 'Select',
    fieldName: 'status',
    label: '状态',
    rules: 'required',
    defaultValue: 1,
    componentProps: {
      options: [
        { label: '启用', value: 1 },
        { label: '禁用', value: 0 },
      ],
    },
  },
];

// 表格列配置
export function useColumns(
  onActionClick: OnActionClickFn<TestStep>,
): VxeGridProps<TestStep>['columns'] {
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
      title: '步骤名称',
      field: 'name',
      minWidth: 150,
    },
    {
      title: '测试用例',
      field: 'test_case_id',
      minWidth: 150,
    },
    {
      title: 'HTTP方法',
      field: 'method',
      width: 100,
      cellRender: {
        name: 'CellTag',
      },
    },
    {
      title: '请求URL',
      field: 'url',
      minWidth: 200,
      showOverflow: 'tooltip',
    },
    {
      title: '执行顺序',
      field: 'order',
      width: 100,
      sortable: true,
    },
    {
      title: '超时时间',
      field: 'timeout',
      width: 100,
      formatter: ({ cellValue }) => `${cellValue}秒`,
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
      width: 290,
      fixed: 'right',
      cellRender: {
        attrs: {
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'execute',
            text: '执行',
            icon: 'lucide:play',
            color: 'success',
          },
          {
            code: 'edit',
            text: '编辑',
            icon: 'lucide:edit',
          },
          {
            code: 'copy',
            text: '复制',
            icon: 'lucide:copy',
          },
          {
            code: 'delete',
            text: '删除',
            icon: 'lucide:trash-2',
            color: 'error',
            confirm: {
              title: '确认删除',
              content: '确定要删除这个测试步骤吗？删除后不可恢复。',
            },
          },
        ],
      },
    },
  ];
}
