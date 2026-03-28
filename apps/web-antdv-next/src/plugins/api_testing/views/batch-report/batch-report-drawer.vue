<script lang="ts" setup>
import type { BatchExecutionReport } from '#/plugins/api_testing/api/types';

import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { JsonViewer, useVbenDrawer } from '@vben/common-ui';

import { message } from 'antdv-next';

import { getBatchExecutionReportDetailApi } from '#/plugins/api_testing/api/testreport';

import {
  buildBatchReportSummary,
  normalizeBatchCaseResults,
} from './drawer.helpers';

defineOptions({
  name: 'BatchReportDrawer',
});

const router = useRouter();
const loading = ref(false);
const report = ref<BatchExecutionReport>();

const caseResultColumns = [
  {
    title: '用例 ID',
    dataIndex: 'caseId',
    key: 'caseId',
    width: 88,
  },
  {
    title: '测试用例',
    dataIndex: 'testCaseName',
    key: 'testCaseName',
    ellipsis: true,
  },
  {
    title: '执行结果',
    dataIndex: 'success',
    key: 'success',
    width: 88,
  },
  {
    title: '执行时长',
    dataIndex: 'durationText',
    key: 'durationText',
    width: 100,
  },
  {
    title: '测试报告',
    dataIndex: 'reportId',
    key: 'reportId',
    width: 120,
  },
];

const [Drawer, drawerApi] = useVbenDrawer({
  destroyOnClose: true,
  footer: false,
  class: 'w-[720px]',
  onOpenChange: async (isOpen) => {
    if (!isOpen) {
      report.value = undefined;
      return;
    }

    const data = drawerApi.getData<{ id?: number }>();
    if (!data?.id) {
      report.value = undefined;
      return;
    }

    loading.value = true;
    try {
      report.value = await getBatchExecutionReportDetailApi(data.id);
    } catch (error) {
      console.error('加载批量执行报告详情失败:', error);
      message.error('加载批量执行报告详情失败');
    } finally {
      loading.value = false;
    }
  },
});

const summary = computed(() => buildBatchReportSummary(report.value ?? {}));
const caseRows = computed(() => normalizeBatchCaseResults(report.value?.details));

function openChildReport(reportId: number) {
  router.push({
    name: 'ApiTestingTestReportDetail',
    params: { id: reportId },
  });
}
</script>

<template>
  <Drawer :title="report?.name || '批量执行详情'">
    <a-spin :spinning="loading">
      <div class="space-y-4">
        <a-row :gutter="12">
          <a-col :span="6">
            <a-card size="small">
              <a-statistic title="执行结果" :value="summary.statusText" />
            </a-card>
          </a-col>
          <a-col :span="6">
            <a-card size="small">
              <a-statistic title="成功率" :value="summary.successRate" suffix="%" />
            </a-card>
          </a-col>
          <a-col :span="6">
            <a-card size="small">
              <a-statistic title="失败用例" :value="summary.failedCases" />
            </a-card>
          </a-col>
          <a-col :span="6">
            <a-card size="small">
              <a-statistic title="最大并发" :value="summary.maxConcurrency" />
            </a-card>
          </a-col>
        </a-row>

        <a-descriptions bordered size="small" :column="2">
          <a-descriptions-item label="所属项目">
            {{ report?.project_name || `项目 #${report?.project_id || '-'}` }}
          </a-descriptions-item>
          <a-descriptions-item label="测试集合">
            {{ report?.suite_name || '-' }}
          </a-descriptions-item>
          <a-descriptions-item label="执行范围">
            {{ report?.target_type === 'suite' ? '测试集合' : '项目' }}
          </a-descriptions-item>
          <a-descriptions-item label="执行时长">
            {{ summary.durationText }}
          </a-descriptions-item>
          <a-descriptions-item label="开始时间">
            {{ report?.start_time ? new Date(report.start_time).toLocaleString() : '-' }}
          </a-descriptions-item>
          <a-descriptions-item label="结束时间">
            {{ report?.end_time ? new Date(report.end_time).toLocaleString() : '-' }}
          </a-descriptions-item>
        </a-descriptions>

        <a-card size="small" title="子用例执行结果">
          <a-table
            :columns="caseResultColumns"
            :data-source="caseRows"
            :pagination="false"
            row-key="caseId"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'success'">
                <a-tag :color="record.success ? 'success' : 'error'">
                  {{ record.success ? '成功' : '失败' }}
                </a-tag>
              </template>
              <template v-else-if="column.dataIndex === 'reportId'">
                <a-button
                  v-if="record.reportId"
                  size="small"
                  type="link"
                  @click="openChildReport(record.reportId)"
                >
                  #{{ record.reportId }}
                </a-button>
                <span v-else>-</span>
              </template>
            </template>
          </a-table>
          <a-empty
            v-if="caseRows.length === 0"
            class="py-6"
            description="暂无子用例执行明细"
          />
        </a-card>

        <a-card size="small" title="原始诊断信息">
          <JsonViewer
            v-if="report?.details"
            :value="report.details"
            boxed
            expanded
            :copyable="true"
            :expand-depth="3"
            :show-array-index="false"
          />
          <a-empty v-else description="无诊断详情" />
        </a-card>
      </div>
    </a-spin>
  </Drawer>
</template>
