import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeGridProps } from '#/adapter/vxe-table';
import type { TestReport } from '#/plugins/api_testing/api/types';

import { $t } from '@vben/locales';

import { DictEnum, getDictOptions } from '#/utils/dict';

// 查询表单配置
export const querySchema: VbenFormSchema[] = [
  {
    component: 'Select',
    fieldName: 'success_only',
    label: '执行结果',
    componentProps: {
      placeholder: '请选择执行结果',
      options: [
        { label: '全部', value: '-' },
        { label: '成功', value: true },
        { label: '失败', value: false },
      ],
    },
  },
  {
    component: 'DatePicker',
    fieldName: 'start_date',
    label: '开始时间',
    componentProps: {
      placeholder: '请选择开始时间',
      showTime: true,
      format: 'YYYY-MM-DD', // 显示格式
      valueFormat: 'YYYY-MM-DD', // 值格式（传给后端的格式）
    },
  },
  {
    component: 'DatePicker',
    fieldName: 'end_date',
    label: '结束时间',
    componentProps: {
      placeholder: '请选择结束时间',
      showTime: true,
      format: 'YYYY-MM-DD', // 显示格式
      valueFormat: 'YYYY-MM-DD', // 值格式（传给后端的格式）
    },
  },
];

// 表格列配置
export function useColumns(
  onActionClick: OnActionClickFn<TestReport>,
): VxeGridProps<TestReport>['columns'] {
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
      title: '报告名称',
      field: 'name',
      minWidth: 150,
    },
    {
      title: '测试用例',
      field: 'test_case_name',
      minWidth: 150,
    },
    {
      title: '执行结果',
      field: 'success',
      width: 100,
      cellRender: {
        name: 'CellTag',
        options: getDictOptions(DictEnum.SYS_LOGIN_STATUS),
      },
    },
    {
      title: '总步骤数',
      field: 'total_steps',
      width: 100,
    },
    {
      title: '成功步骤',
      field: 'success_steps',
      width: 100,
      // cellRender: {
      //   name: 'CellTag',
      //   props: ({ row }: { row: any }) => ({
      //     color: 'success',
      //     text: row.success_steps,
      //   }),
      // },
    },
    {
      title: '失败步骤',
      field: 'fail_steps',
      width: 100,
      // cellRender: {
      //   name: 'CellTag',
      //   props: ({ row }: { row: any }) => ({
      //     color: row.fail_steps > 0 ? 'error' : 'default',
      //     text: row.fail_steps,
      //   }),
      // },
    },
    {
      title: '成功率',
      field: 'success_rate',
      width: 100,
      formatter: ({ row }) => {
        const rate =
          row.total_steps > 0
            ? ((row.success_steps / row.total_steps) * 100).toFixed(1)
            : '0';
        return `${rate}%`;
      },
      cellRender: {
        name: 'CellProgress',
      },
    },
    {
      title: '执行时长',
      field: 'duration',
      width: 120,
      formatter: ({ cellValue }) => {
        if (cellValue < 1000) {
          return `${cellValue}ms`;
        } else if (cellValue < 60_000) {
          return `${(cellValue / 1000).toFixed(1)}s`;
        } else {
          return `${(cellValue / 60_000).toFixed(1)}min`;
        }
      },
    },
    {
      title: '开始时间',
      field: 'start_time',
      width: 180,
      formatter: ({ cellValue }) => {
        return cellValue ? new Date(cellValue).toLocaleString() : '';
      },
    },
    {
      title: '结束时间',
      field: 'end_time',
      width: 180,
      formatter: ({ cellValue }) => {
        return cellValue ? new Date(cellValue).toLocaleString() : '';
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
            code: 'detail',
            text: '查看详情',
            icon: 'lucide:eye',
          },
          {
            code: 'export',
            text: '导出报告',
            icon: 'lucide:download',
          },
          {
            code: 'delete',
            text: '删除',
            icon: 'lucide:trash-2',
            color: 'error',
            confirm: {
              title: '确认删除',
              content: '确定要删除这个测试报告吗？删除后不可恢复。',
            },
          },
        ],
      },
    },
  ];
}
