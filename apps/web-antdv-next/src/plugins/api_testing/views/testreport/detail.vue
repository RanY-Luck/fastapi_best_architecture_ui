<script lang="ts" setup>
import type { TestReport } from '#/plugins/api_testing/api/types';

import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page, VbenButton } from '@vben/common-ui';
import { ArrowLeft, Download, RefreshCw } from '@vben/icons';
import { Card, message, Tag } from 'antdv-next';

import {
  exportTestReportApi,
  getTestReportDetailApi,
} from '#/plugins/api_testing/api/testreport';

import {
  buildReportSummaryStats,
  getInitialExpandedStepKeys,
  normalizeExecutionSteps,
} from './detail.helpers';
import ReportHealthPanel from './components/report-health-panel.vue';
import ReportSummaryCard from './components/report-summary-card.vue';
import ReportStepTimeline from './components/report-step-timeline.vue';

defineOptions({
  name: 'ApiTestingTestReportDetail',
});

const route = useRoute();
const router = useRouter();

const reportData = ref<null | TestReport>(null);
const loading = ref(false);
const expandedStepKeys = ref<string[]>([]);

const summaryStats = computed(() => {
  return buildReportSummaryStats(reportData.value ?? {});
});

const successRate = computed(() => summaryStats.value.successRate);

const executionSteps = computed<any[]>(() => {
  return normalizeExecutionSteps(reportData.value?.details);
});

watch(
  executionSteps,
  (steps) => {
    expandedStepKeys.value = getInitialExpandedStepKeys(steps);
  },
  { immediate: true },
);

async function fetchReportDetail() {
  const reportId = Number(route.params.id);
  if (!reportId) return;

  loading.value = true;
  try {
    reportData.value = await getTestReportDetailApi(reportId);
  } catch (error) {
    console.error('获取报告详情失败:', error);
    message.error('获取报告详情失败');
  } finally {
    loading.value = false;
  }
}

async function handleExport() {
  if (!reportData.value) return;

  message.loading('正在导出报告...', 0);
  try {
    const blob = await exportTestReportApi(reportData.value.id, 'html');
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportData.value.name}_报告.html`;
    document.body.append(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    message.destroy();
    message.success('报告导出成功');
  } catch {
    message.destroy();
    message.error('报告导出失败');
  }
}

function handleBack() {
  router.back();
}

function handleRefresh() {
  fetchReportDetail();
}

function expandAllSteps() {
  expandedStepKeys.value = executionSteps.value.map((step) =>
    String(step.id ?? step.name),
  );
}

function expandFailureSteps() {
  expandedStepKeys.value = getInitialExpandedStepKeys(executionSteps.value);
}

function toggleStep(stepKey: string) {
  if (expandedStepKeys.value.includes(stepKey)) {
    expandedStepKeys.value = expandedStepKeys.value.filter(
      (key) => key !== stepKey,
    );
    return;
  }

  expandedStepKeys.value = [...expandedStepKeys.value, stepKey];
}

onMounted(() => {
  fetchReportDetail();
});
</script>

<template>
  <Page auto-content-height>
    <div v-if="loading" class="flex h-64 items-center justify-center">
      <RefreshCw class="size-8 animate-spin" />
    </div>

    <div v-else-if="reportData" class="space-y-6 pb-6">
      <div class="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
        <div class="flex items-start space-x-4">
          <VbenButton @click="handleBack">
            <ArrowLeft class="mr-1 size-4" />
            返回
          </VbenButton>
          <div class="space-y-2">
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-bold">{{ reportData.name }}</h1>
              <Tag :color="reportData.success ? 'success' : 'error'">
                {{ summaryStats.statusText }}
              </Tag>
            </div>
            <p class="text-sm text-slate-500">
              {{ reportData.test_case_name || '未知用例' }} ·
              {{ new Date(reportData.start_time).toLocaleString() }} -
              {{ new Date(reportData.end_time).toLocaleString() }} ·
              {{ summaryStats.durationText }}
            </p>
          </div>
        </div>
        <div class="flex space-x-2">
          <VbenButton @click="handleRefresh">
            <RefreshCw class="mr-1 size-4" />
            刷新
          </VbenButton>
          <VbenButton type="primary" @click="handleExport">
            <Download class="mr-1 size-4" />
            导出报告
          </VbenButton>
        </div>
      </div>

      <section class="grid gap-4 xl:grid-cols-[repeat(4,minmax(0,1fr))]">
        <ReportSummaryCard
          label="执行结果"
          :tone="summaryStats.statusTone"
          :value="summaryStats.statusText"
        />
        <ReportSummaryCard label="成功率" :value="`${successRate}%`" />
        <ReportSummaryCard label="失败步骤" :value="summaryStats.failedSteps" />
        <ReportSummaryCard label="执行时长" :value="summaryStats.durationText" />
      </section>

      <ReportHealthPanel
        :fail-steps="reportData.fail_steps"
        :success-rate="successRate"
        :success-steps="reportData.success_steps"
        :total-steps="reportData.total_steps"
      />

      <Card title="执行元信息">
        <div class="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
          <div class="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm shadow-slate-200/60">
            <span class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">报告名称</span>
            <div class="mt-2 font-medium text-slate-900">{{ reportData.name }}</div>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm shadow-slate-200/60">
            <span class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">测试用例</span>
            <div class="mt-2 font-medium text-slate-900">
              {{ reportData.test_case_name || '未知' }}
            </div>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm shadow-slate-200/60">
            <span class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">执行结果</span>
            <div class="mt-2">
              <Tag :color="reportData.success ? 'success' : 'error'">
                {{ summaryStats.statusText }}
              </Tag>
            </div>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm shadow-slate-200/60">
            <span class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">失败步骤</span>
            <div class="mt-2 font-medium text-slate-900">{{ reportData.fail_steps }}</div>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm shadow-slate-200/60">
            <span class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">开始时间</span>
            <div class="mt-2 font-medium text-slate-900">
              {{ new Date(reportData.start_time).toLocaleString() }}
            </div>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm shadow-slate-200/60">
            <span class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">结束时间</span>
            <div class="mt-2 font-medium text-slate-900">
              {{ new Date(reportData.end_time).toLocaleString() }}
            </div>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm shadow-slate-200/60">
            <span class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">总步骤</span>
            <div class="mt-2 font-medium text-slate-900">{{ reportData.total_steps }}</div>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm shadow-slate-200/60">
            <span class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">执行时长</span>
            <div class="mt-2 font-medium text-slate-900">{{ summaryStats.durationText }}</div>
          </div>
        </div>
      </Card>

      <Card title="执行详情">
        <div class="mb-4 flex items-center justify-between">
          <div class="text-sm text-slate-500">
            失败步骤
            <Tag :color="reportData.success ? 'success' : 'error'">
              {{ reportData.fail_steps }}
            </Tag>
          </div>
          <div class="text-sm text-slate-500">成功率 {{ successRate }}%</div>
        </div>
        <ReportStepTimeline
          :expanded-keys="expandedStepKeys"
          :steps="executionSteps"
          @expand-all="expandAllSteps"
          @expand-failures="expandFailureSteps"
          @toggle-step="toggleStep"
        />
      </Card>
    </div>

    <div v-else class="py-8 text-center text-gray-500">报告不存在或已被删除</div>
  </Page>
</template>
