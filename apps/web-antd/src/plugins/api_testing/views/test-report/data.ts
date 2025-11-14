import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeGridProps } from '#/adapter/vxe-table';
import type { TestReport } from '#/api/api-testing';

// 查询表单配置
export const querySchema: VbenFormSchema[] = [
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
    fieldName: 'success',
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
    fieldName: 'start_time',
    label: '开始时间',
    componentProps: {
      placeholder: '请选择开始时间',
      showTime: true,
    },
  },
  {
    component: 'DatePicker',
    fieldName: 'end_time',
    label: '结束时间',
    componentProps: {
      placeholder: '请选择结束时间',
      showTime: true,
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
      title: 'ID',
      field: 'id',
      width: 80,
    },
    {
      title: '报告名称',
      field: 'name',
      minWidth: 150,
    },
    {
      title: '测试用例',
      field: 'test_case.name',
      minWidth: 150,
    },
    {
      title: '执行结果',
      field: 'success',
      width: 100,
      cellRender: {
        name: 'CellTag',
        props: ({ row }: { row: any }) => {
          const success = row.success;
          return {
            color: success ? 'success' : 'error',
            text: success ? '成功' : '失败',
          };
        },
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
      cellRender: {
        name: 'CellTag',
        props: ({ row }: { row: any }) => ({
          color: 'success',
          text: row.success_steps,
        }),
      },
    },
    {
      title: '失败步骤',
      field: 'fail_steps',
      width: 100,
      cellRender: {
        name: 'CellTag',
        props: ({ row }: { row: any }) => ({
          color: row.fail_steps > 0 ? 'error' : 'default',
          text: row.fail_steps,
        }),
      },
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
        props: ({ row }: { row: any }) => {
          const rate =
            row.total_steps > 0
              ? (row.success_steps / row.total_steps) * 100
              : 0;
          return {
            percentage: rate,
            color: rate >= 80 ? '#52c41a' : rate >= 60 ? '#faad14' : '#ff4d4f',
          };
        },
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
      width: 200,
      fixed: 'right',
      cellRender: {
        name: 'CellActions',
        props: {
          onActionClick,
          actions: [
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
    },
  ];
}
