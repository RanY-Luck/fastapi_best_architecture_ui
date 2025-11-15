import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeGridProps } from '#/adapter/vxe-table';
import type { TestStep } from '#/api/api-testing';

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
    componentProps: {
      placeholder: '请输入步骤名称',
    },
  },
  {
    component: 'Input',
    fieldName: 'test_case_id',
    label: '测试用例ID',
    rules: 'required',
    componentProps: {
      placeholder: '请输入测试用例ID',
      type: 'number',
    },
  },
  {
    component: 'Input',
    fieldName: 'url',
    label: '请求URL',
    rules: 'required',
    componentProps: {
      placeholder: '请输入请求URL，如：/api/users',
    },
  },
  {
    component: 'Select',
    fieldName: 'method',
    label: 'HTTP方法',
    rules: 'required',
    componentProps: {
      placeholder: '请选择HTTP方法',
      options: httpMethodOptions,
    },
  },
  {
    component: 'JsonEditor',
    fieldName: 'headers',
    label: '请求头',
    componentProps: {
      placeholder: '请输入请求头（JSON格式）',
      height: 120,
    },
  },
  {
    component: 'JsonEditor',
    fieldName: 'params',
    label: '查询参数',
    componentProps: {
      placeholder: '请输入查询参数（JSON格式）',
      height: 120,
    },
  },
  {
    component: 'JsonEditor',
    fieldName: 'body',
    label: '请求体',
    componentProps: {
      placeholder: '请输入请求体（JSON格式）',
      height: 150,
    },
  },
  {
    component: 'JsonEditor',
    fieldName: 'extract',
    label: '变量提取',
    componentProps: {
      placeholder: '请输入变量提取规则（JSON格式）',
      height: 120,
    },
  },
  {
    component: 'JsonEditor',
    fieldName: 'validate',
    label: '断言规则',
    componentProps: {
      placeholder: '请输入断言规则（JSON格式）',
      height: 150,
    },
  },
  {
    component: 'InputNumber',
    fieldName: 'timeout',
    label: '超时时间(秒)',
    componentProps: {
      placeholder: '请输入超时时间',
      min: 1,
      max: 300,
    },
  },
  {
    component: 'InputNumber',
    fieldName: 'retry',
    label: '重试次数',
    componentProps: {
      placeholder: '请输入重试次数',
      min: 0,
      max: 10,
    },
  },
  {
    component: 'InputNumber',
    fieldName: 'order',
    label: '执行顺序',
    rules: 'required',
    componentProps: {
      placeholder: '请输入执行顺序',
      min: 1,
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
  onActionClick: OnActionClickFn<TestStep>,
): VxeGridProps<TestStep>['columns'] {
  return [
    {
      type: 'checkbox',
      width: 50,
    },
    {
      title: 'ID',
      field: 'id',
      width: 80,
    },
    {
      title: '步骤名称',
      field: 'name',
      minWidth: 150,
    },
    {
      title: 'HTTP方法',
      field: 'method',
      width: 100,
      cellRender: {
        name: 'CellTag',
        props: ({ row }: { row: any }) => {
          const method = row.method;
          const colorMap: Record<string, string> = {
            GET: 'success',
            POST: 'primary',
            PUT: 'warning',
            DELETE: 'error',
            PATCH: 'info',
            HEAD: 'default',
            OPTIONS: 'default',
          };
          return {
            color: colorMap[method] || 'default',
            text: method,
          };
        },
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
        props: ({ row }: { row: any }) => {
          const status = row.status;
          return {
            color: status === 1 ? 'success' : 'error',
            text: status === 1 ? '启用' : '禁用',
          };
        },
      },
    },
    {
      title: '创建时间',
      field: 'create_time',
      width: 180,
      formatter: ({ cellValue }) => {
        return cellValue ? new Date(cellValue).toLocaleString() : '';
      },
    },
    {
      title: '操作',
      field: 'action',
      width: 280,
      fixed: 'right',
      cellRender: {
        name: 'CellActions',
        props: {
          onActionClick,
          actions: [
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
    },
  ];
}
