<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { TestReport } from '#/plugins/api_testing/api/types';

import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteTestReportApi,
  exportTestReportApi,
  getTestReportListApi,
} from '#/plugins/api_testing/api/testreport';

import { querySchema, useColumns } from './data';

defineOptions({
  name: 'ApiTestingTestReportDetail',
});

const route = useRoute();
const router = useRouter();

// 表单配置
const formOptions: VbenFormProps = {
  // 默认展开
  collapsed: false,
  showCollapseButton: true,
  submitButtonOptions: {
    content: $t('common.form.query'),
  },
  schema: querySchema,
};

// 表格配置
const gridOptions: VxeTableGridOptions<TestReport> = {
  rowConfig: {
    keyField: 'id',
  },
  checkboxConfig: {
    highlight: true,
  },
  height: 'auto',
  exportConfig: {},
  printConfig: {},
  toolbarConfig: {
    export: true,
    print: true,
    refresh: { code: 'query' },
    custom: true,
    zoom: true,
  },
  columns: useColumns(onActionClick),
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        // 如果URL中有test_case_id参数，自动填充到查询条件中
        const testCaseId = route.query.test_case_id;
        const params = {
          page: page.currentPage,
          size: page.pageSize,
          ...formValues,
        };
        if (testCaseId) {
          params.test_case_id = Number(testCaseId);
        }
        return await getTestReportListApi(params);
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

// 操作处理
function onActionClick({ code, row }: OnActionClickParams<TestReport>) {
  switch (code) {
    case 'delete': {
      deleteTestReportApi(row.id).then(() => {
        message.success('测试报告删除成功');
        onRefresh();
      });
      break;
    }
    case 'detail': {
      router.push({
        name: 'ApiTestingTestReportDetail',
        params: { id: row.id },
      });
      break;
    }
    case 'export': {
      message.loading('正在导出报告...', 0);
      exportTestReportApi(row.id, 'html')
        .then((blob) => {
          message.destroy();
          // 创建下载链接
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${row.name}_报告.html`;
          document.body.append(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
          message.success('报告导出成功');
        })
        .catch(() => {
          message.destroy();
          message.error('报告导出失败');
        });
      break;
    }
  }
}

// 刷新表格
function onRefresh() {
  gridApi.query();
}

// 初始化时如果有test_case_id参数，设置到查询表单中
onMounted(() => {
  const testCaseId = route.query.test_case_id;
  if (testCaseId) {
    // 设置查询表单的默认值
    gridApi.query({ test_case_id: Number(testCaseId) });
  }
});
</script>

<template>
  <Page auto-content-height>
    <Grid />
  </Page>
</template>
