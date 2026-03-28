import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeGridProps } from '#/adapter/vxe-table';
import type { TestSuite } from '#/plugins/api_testing/api/types';

import { $t } from '#/locales';
import { getAllEnabledApiProjectsApi } from '#/plugins/api_testing/api/project';

type SyncCaseFn = (projectId?: number, caseIds?: number[]) => Promise<void>;

let _syncCaseFieldOptions: null | SyncCaseFn = null;

export function registerSyncCaseFn(fn: SyncCaseFn) {
  _syncCaseFieldOptions = fn;
}

export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'name',
    label: '集合名称',
    componentProps: {
      placeholder: '请输入测试集合名称',
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

export const testSuiteFormSchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'name',
    label: '集合名称',
    rules: 'required',
    componentProps: {
      placeholder: '请输入测试集合名称',
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
    component: 'Select',
    fieldName: 'case_ids',
    label: '关联用例',
    rules: 'required',
    defaultValue: [],
    componentProps: {
      mode: 'multiple',
      allowClear: true,
      maxTagCount: 'responsive',
      options: [],
      placeholder: '请先选择项目，再选择测试用例',
    },
  },
  {
    component: 'Textarea',
    fieldName: 'description',
    label: '集合描述',
    componentProps: {
      placeholder: '请输入测试集合描述',
      rows: 3,
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

export function useColumns(
  onActionClick: OnActionClickFn<TestSuite>,
): VxeGridProps<TestSuite>['columns'] {
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
      title: '集合名称',
      field: 'name',
      minWidth: 180,
    },
    {
      title: '所属项目',
      field: 'project_name',
      minWidth: 160,
    },
    {
      title: '用例数量',
      field: 'case_count',
      width: 110,
    },
    {
      title: '描述',
      field: 'description',
      minWidth: 220,
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
      width: 280,
      fixed: 'right',
      cellRender: {
        attrs: {
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'view-cases',
            text: '关联用例',
            icon: 'lucide:list',
          },
          {
            code: 'execute',
            text: '批量执行',
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
              content: '确定要删除这个测试集合吗？删除后不可恢复。',
            },
          },
        ],
      },
    },
  ];
}
