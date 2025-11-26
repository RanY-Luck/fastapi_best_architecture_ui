import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeGridProps } from '#/adapter/vxe-table';
import type { TestCase } from '#/plugins/api_testing/api';

import { $t } from '@vben/locales';

import { getAllEnabledApiProjectsApi } from '#/plugins/api_testing/api';

// 查询表单配置
export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'name',
    label: '用例名称',
    componentProps: {
      placeholder: '请输入用例名称',
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
        { label: '停用', value: 0 },
      ],
    },
  },
];
// 测试用例表单配置
export const testCaseFormSchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'name',
    label: '用例名称',
    rules: 'required',
    componentProps: {
      placeholder: '请输入用例名称',
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
        // 处理分页数据
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
    label: '用例描述',
    componentProps: {
      placeholder: '请输入用例描述',
      rows: 3,
    },
  },
  {
    component: 'CodeMirror',
    fieldName: 'pre_script',
    label: '前置脚本',
    componentProps: {
      placeholder: '请输入前置脚本（JavaScript）',
      language: 'javascript',
      height: 150,
    },
  },
  {
    component: 'CodeMirror',
    fieldName: 'post_script',
    label: '后置脚本',
    componentProps: {
      placeholder: '请输入后置脚本（JavaScript）',
      language: 'javascript',
      height: 150,
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
  onActionClick: OnActionClickFn<TestCase>,
): VxeGridProps<TestCase>['columns'] {
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
      title: '用例名称',
      field: 'name',
      minWidth: 150,
    },
    {
      title: '所属项目',
      field: 'project_name',
      width: 150,
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
      width: 400,
      fixed: 'right',
      cellRender: {
        attrs: {
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'steps',
            text: '管理步骤',
            icon: 'lucide:list',
          },
          {
            code: 'execute',
            text: '执行测试',
            icon: 'lucide:play',
            color: 'success',
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
              content: '确定要删除这个测试用例吗？删除后不可恢复。',
            },
          },
        ],
      },
    },
  ];
}
