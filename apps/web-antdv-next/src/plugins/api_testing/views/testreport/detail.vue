<script lang="ts" setup>
import type { TestReport } from '#/plugins/api_testing/api/types';

import { computed, onMounted, ref } from 'vue';
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
  formatDuration,
} from './detail.helpers';
import ReportHealthPanel from './components/report-health-panel.vue';
import ReportSummaryCard from './components/report-summary-card.vue';

defineOptions({
  name: 'ApiTestingTestReportDetail',
});

const route = useRoute();
const router = useRouter();

const reportData = ref<null | TestReport>(null);
const loading = ref(false);

const summaryStats = computed(() => {
  return buildReportSummaryStats(reportData.value ?? {});
});

const successRate = computed(() => summaryStats.value.successRate);

const executionSteps = computed<any[]>(() => {
  if (!reportData.value?.details?.steps) return [];
  return reportData.value.details.steps;
});

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

onMounted(() => {
  fetchReportDetail();
});
</script>

<template>
  <Page auto-content-height>
    <div v-if="loading" class="flex h-64 items-center justify-center">
      <RefreshCw class="size-8 animate-spin" />
    </div>

    <div v-else-if="reportData" class="space-y-6">
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
          <div class="rounded-xl border border-slate-200 px-4 py-3">
            <span class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">报告名称</span>
            <div class="mt-2 font-medium text-slate-900">{{ reportData.name }}</div>
          </div>
          <div class="rounded-xl border border-slate-200 px-4 py-3">
            <span class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">测试用例</span>
            <div class="mt-2 font-medium text-slate-900">
              {{ reportData.test_case_name || '未知' }}
            </div>
          </div>
          <div class="rounded-xl border border-slate-200 px-4 py-3">
            <span class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">执行结果</span>
            <div class="mt-2">
              <Tag :color="reportData.success ? 'success' : 'error'">
                {{ summaryStats.statusText }}
              </Tag>
            </div>
          </div>
          <div class="rounded-xl border border-slate-200 px-4 py-3">
            <span class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">失败步骤</span>
            <div class="mt-2 font-medium text-slate-900">{{ reportData.fail_steps }}</div>
          </div>
          <div class="rounded-xl border border-slate-200 px-4 py-3">
            <span class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">开始时间</span>
            <div class="mt-2 font-medium text-slate-900">
              {{ new Date(reportData.start_time).toLocaleString() }}
            </div>
          </div>
          <div class="rounded-xl border border-slate-200 px-4 py-3">
            <span class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">结束时间</span>
            <div class="mt-2 font-medium text-slate-900">
              {{ new Date(reportData.end_time).toLocaleString() }}
            </div>
          </div>
          <div class="rounded-xl border border-slate-200 px-4 py-3">
            <span class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">总步骤</span>
            <div class="mt-2 font-medium text-slate-900">{{ reportData.total_steps }}</div>
          </div>
          <div class="rounded-xl border border-slate-200 px-4 py-3">
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
        <div v-if="executionSteps.length > 0" class="space-y-4">
          <div
            v-for="(step, index) in executionSteps"
            :key="index"
            class="rounded border p-4"
          >
            <div class="flex items-center justify-between">
              <h4 class="font-medium">{{ step.name }}</h4>
              <div class="flex items-center space-x-2">
                <Tag :color="step.success ? 'success' : 'error'">
                  {{ step.success ? '成功' : '失败' }}
                </Tag>
                <span class="text-sm text-gray-500">{{ step.duration }}ms</span>
              </div>
            </div>

            <div class="mt-2 text-sm">
              <span class="font-medium">请求：</span>
              <Tag>{{ step.request_data?.method || 'N/A' }}</Tag>
              <span class="text-gray-600">{{ step.request_data?.url || step.url }}</span>
            </div>

            <div v-if="step.response?.status_code" class="mt-2 text-sm">
              <span class="font-medium">状态码：</span>
              <Tag
                :color="
                  step.response.status_code >= 200 && step.response.status_code < 300
                    ? 'success'
                    : 'error'
                "
              >
                {{ step.response.status_code }}
              </Tag>
            </div>

            <div class="mt-2 text-sm text-gray-500">
              <span class="font-medium">开始时间：</span>
              {{ new Date(step.start_time).toLocaleString() }}
              <span class="ml-4 font-medium">结束时间：</span>
              {{ new Date(step.end_time).toLocaleString() }}
            </div>

            <div v-if="step.assertions?.length" class="mt-2 text-sm">
              <span class="font-medium">断言结果：</span>
              <div class="mt-1 space-y-1">
                <div
                  v-for="(assertion, aIndex) in step.assertions"
                  :key="aIndex"
                  class="flex items-center space-x-2"
                >
                  <Tag :color="assertion.success ? 'success' : 'error'">
                    {{ assertion.success ? '通过' : '失败' }}
                  </Tag>
                  <span>{{ assertion.description || '断言检查' }}</span>
                </div>
              </div>
            </div>

            <details v-if="step.response" class="mt-2 text-sm">
              <summary class="cursor-pointer font-medium">响应数据</summary>
              <div class="mt-2 space-y-2">
                <div v-if="step.response.headers">
                  <div class="font-medium">响应头:</div>
                  <pre class="mt-1 max-h-32 overflow-auto rounded bg-gray-50 p-2 text-xs">{{ JSON.stringify(step.response.headers, null, 2) }}</pre>
                </div>
                <div v-if="step.response.json || step.response.text">
                  <div class="font-medium">响应体:</div>
                  <pre class="mt-1 max-h-40 overflow-auto rounded bg-gray-50 p-2 text-xs">{{ step.response.json ? JSON.stringify(step.response.json, null, 2) : step.response.text }}</pre>
                </div>
              </div>
            </details>

            <details v-if="step.request_data" class="mt-2 text-sm">
              <summary class="cursor-pointer font-medium">请求数据</summary>
              <pre class="mt-2 max-h-40 overflow-auto rounded bg-gray-50 p-2 text-xs">{{ JSON.stringify(step.request_data, null, 2) }}</pre>
            </details>
          </div>
        </div>
        <div v-else class="py-8 text-center text-gray-500">暂无执行详情数据</div>
      </Card>
    </div>

    <div v-else class="py-8 text-center text-gray-500">报告不存在或已被删除</div>
  </Page>
</template>
