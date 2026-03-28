import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeGridProps } from '#/adapter/vxe-table';
import type { BatchExecutionReport } from '#/plugins/api_testing/api/types';

import { $t } from '#/locales';
import { getAllEnabledApiProjectsApi } from '#/plugins/api_testing/api/project';
import { getTestSuiteListApi } from '#/plugins/api_testing/api/testsuite';

import { formatBatchDuration } from './drawer.helpers';

export const querySchema: VbenFormSchema[] = [
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
    component: 'ApiSelect',
    fieldName: 'suite_id',
    label: '测试集合',
    componentProps: {
      placeholder: '请选择测试集合',
      api: async () => {
        const data = (await getTestSuiteListApi({ page: 1, size: 1000 })) as any;
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
    fieldName: 'target_type',
    label: '执行范围',
    componentProps: {
      placeholder: '请选择执行范围',
      options: [
        { label: '全部', value: '' },
        { label: '项目', value: 'project' },
        { label: '测试集合', value: 'suite' },
      ],
    },
  },
  {
    component: 'Select',
    fieldName: 'success_only',
    label: '执行结果',
    componentProps: {
      placeholder: '请选择执行结果',
      options: [
        { label: '全部', value: '' },
        { label: '成功', value: true },
        { label: '失败', value: false },
      ],
    },
  },
  {
    component: 'DatePicker',
    fieldName: 'start_date',
    label: '开始日期',
    componentProps: {
      placeholder: '请选择开始日期',
      format: 'YYYY-MM-DD',
      valueFormat: 'YYYY-MM-DD',
    },
  },
  {
    component: 'DatePicker',
    fieldName: 'end_date',
    label: '结束日期',
    componentProps: {
      placeholder: '请选择结束日期',
      format: 'YYYY-MM-DD',
      valueFormat: 'YYYY-MM-DD',
    },
  },
];

export function useColumns(
  onActionClick: OnActionClickFn<BatchExecutionReport>,
): VxeGridProps<BatchExecutionReport>['columns'] {
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
      title: '批量报告名称',
      field: 'name',
      minWidth: 220,
    },
    {
      title: '执行范围',
      field: 'target_type',
      width: 110,
      cellRender: {
        name: 'CellTag',
        options: [
          { label: '项目', value: 'project', color: 'blue' },
          { label: '测试集合', value: 'suite', color: 'cyan' },
        ],
      },
    },
    {
      title: '所属项目',
      field: 'project_name',
      minWidth: 160,
    },
    {
      title: '测试集合',
      field: 'suite_name',
      minWidth: 160,
      formatter: ({ cellValue }) => cellValue || '-',
    },
    {
      title: '总用例数',
      field: 'total_cases',
      width: 100,
    },
    {
      title: '成功',
      field: 'success_cases',
      width: 80,
    },
    {
      title: '失败',
      field: 'fail_cases',
      width: 80,
    },
    {
      title: '执行结果',
      field: 'success',
      width: 100,
      cellRender: {
        name: 'CellTag',
        options: [
          { label: '成功', value: true, color: 'success' },
          { label: '失败', value: false, color: 'error' },
        ],
      },
    },
    {
      title: '执行时长',
      field: 'duration',
      width: 110,
      formatter: ({ cellValue }) => formatBatchDuration(cellValue),
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
      title: $t('common.table.operation'),
      field: 'operation',
      width: 120,
      fixed: 'right',
      cellRender: {
        attrs: {
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'detail',
            text: '查看详情',
            icon: 'lucide:panel-right-open',
          },
        ],
      },
    },
  ];
}
