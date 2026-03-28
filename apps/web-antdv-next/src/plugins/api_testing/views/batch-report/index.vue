<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type {
  BatchExecutionReport,
  BatchExecutionReportParams,
} from '#/plugins/api_testing/api/types';

import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page, useVbenDrawer, VbenButton } from '@vben/common-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { $t } from '#/locales';
import { getBatchExecutionReportListApi } from '#/plugins/api_testing/api/testreport';
import {
  filterEmptyParams,
  getRouteQueryNumber,
} from '#/plugins/api_testing/utils';

import BatchReportDrawer from './batch-report-drawer.vue';
import { querySchema, useColumns } from './data';

defineOptions({
  name: 'ApiTestingBatchReport',
});

const route = useRoute();
const router = useRouter();

const formOptions: VbenFormProps = {
  collapsed: false,
  showCollapseButton: true,
  submitButtonOptions: {
    content: $t('common.form.query'),
  },
  schema: querySchema,
};

function openDrawer(id: number) {
  drawerApi.setData({ id }).open();
}

function onActionClick({
  code,
  row,
}: OnActionClickParams<BatchExecutionReport>) {
  switch (code) {
    case 'detail': {
      openDrawer(row.id);
      break;
    }
  }
}

const gridOptions: VxeTableGridOptions<BatchExecutionReport> = {
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
        return await getBatchExecutionReportListApi({
          page: page.currentPage,
          size: page.pageSize,
          ...(filterEmptyParams(formValues) as BatchExecutionReportParams),
        });
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });
const [Drawer, drawerApi] = useVbenDrawer({
  connectedComponent: BatchReportDrawer,
});

onMounted(() => {
  const params: BatchExecutionReportParams = {};
  const projectId = getRouteQueryNumber(route.query.project_id);
  const reportId = getRouteQueryNumber(route.query.report_id);
  const suiteId = getRouteQueryNumber(route.query.suite_id);
  const targetType =
    route.query.target_type === 'project' || route.query.target_type === 'suite'
      ? route.query.target_type
      : undefined;

  if (projectId) {
    params.project_id = projectId;
  }
  if (suiteId) {
    params.suite_id = suiteId;
  }
  if (targetType) {
    params.target_type = targetType;
  }

  if (Object.keys(params).length > 0) {
    gridApi.query(params);
  }

  if (reportId) {
    openDrawer(reportId);
  }
});
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-actions>
        <VbenButton
          variant="outline"
          @click="router.push({ name: 'ApiTestingTestReport' })"
        >
          查看单用例报告
        </VbenButton>
      </template>
    </Grid>
    <Drawer />
  </Page>
</template>
