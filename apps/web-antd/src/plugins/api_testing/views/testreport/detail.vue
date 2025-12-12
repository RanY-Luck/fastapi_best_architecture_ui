<script lang="ts" setup>
import type { TestReport } from '#/plugins/api_testing/api/types';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page, VbenButton } from '@vben/common-ui';
import { ArrowLeft, Download, RefreshCw } from '@vben/icons';

import {
  Card,
  Col,
  Descriptions,
  message,
  Progress,
  Row,
  Statistic,
  Tag,
  Timeline,
} from 'ant-design-vue';

import {
  exportTestReportApi,
  getTestReportDetailApi,
} from '#/plugins/api_testing/api/testreport';

defineOptions({
  name: 'ApiTestingTestReportDetail',
});

const route = useRoute();
const router = useRouter();

const reportData = ref<null | TestReport>(null);
const loading = ref(false);

// 计算成功率
const successRate = computed(() => {
  if (!reportData.value || reportData.value.total_steps === 0) return 0;
  return Math.round(
    (reportData.value.success_steps / reportData.value.total_steps) * 100,
  );
});

// 格式化执行时长
const formatDuration = (duration: number) => {
  if (duration < 1000) {
    return `${duration}ms`;
  } else if (duration < 60_000) {
    return `${(duration / 1000).toFixed(1)}s`;
  } else {
    return `${(duration / 60_000).toFixed(1)}min`;
  }
};

// 获取执行步骤列表
const executionSteps = computed(() => {
  if (!reportData.value?.details?.steps) return [];
  return reportData.value.details.steps;
});

// 获取报告详情
async function fetchReportDetail() {
  const reportId = Number(route.params.id);
  if (!reportId) return;

  loading.value = true;
  try {
    const result = await getTestReportDetailApi(reportId);
    reportData.value = result;
    console.log('报告详情数据:', result); // 调试用
  } catch (error) {
    console.error('获取报告详情失败:', error);
    message.error('获取报告详情失败');
  } finally {
    loading.value = false;
  }
}

// 导出报告
async function handleExport() {
  if (!reportData.value) return;

  message.loading('正在导出报告...', 0);
  try {
    const blob = await exportTestReportApi(reportData.value.id, 'html');
    // 创建下载链接
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

// 返回列表
function handleBack() {
  router.back();
}

// 刷新数据
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
      <!-- 头部操作栏 -->
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <VbenButton @click="handleBack">
            <ArrowLeft class="mr-1 size-4" />
            返回
          </VbenButton>
          <h1 class="text-2xl font-bold">{{ reportData.name }}</h1>
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

      <!-- 统计概览 -->
      <Row :gutter="16">
        <Col :span="6">
          <Card>
            <Statistic
              title="执行结果"
              :value="reportData.success ? '成功' : '失败'"
              :value-style="{
                color: reportData.success ? '#3f8600' : '#cf1322',
              }"
            />
          </Card>
        </Col>
        <Col :span="6">
          <Card>
            <Statistic title="总步骤数" :value="reportData.total_steps" />
          </Card>
        </Col>
        <Col :span="6">
          <Card>
            <Statistic
              title="成功率"
              :value="successRate"
              suffix="%"
              :value-style="{
                color:
                  successRate >= 80
                    ? '#3f8600'
                    : successRate >= 60
                      ? '#faad14'
                      : '#cf1322',
              }"
            />
          </Card>
        </Col>
        <Col :span="6">
          <Card>
            <Statistic
              title="执行时长"
              :value="formatDuration(reportData.duration)"
            />
          </Card>
        </Col>
      </Row>

      <!-- 基本信息 -->
      <Card title="基本信息">
        <Descriptions :column="2" bordered>
          <Descriptions.Item label="报告名称">
            {{ reportData.name }}
          </Descriptions.Item>
          <Descriptions.Item label="测试用例">
            {{ reportData.test_case_name || '未知' }}
          </Descriptions.Item>
          <Descriptions.Item label="执行结果">
            <Tag :color="reportData.success ? 'success' : 'error'">
              {{ reportData.success ? '成功' : '失败' }}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="成功率">
            <Progress
              :percent="successRate"
              :status="
                successRate >= 80
                  ? 'success'
                  : successRate >= 60
                    ? 'normal'
                    : 'exception'
              "
            />
          </Descriptions.Item>
          <Descriptions.Item label="总步骤数">
            {{ reportData.total_steps }}
          </Descriptions.Item>
          <Descriptions.Item label="成功步骤数">
            <Tag color="success">{{ reportData.success_steps }}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="失败步骤数">
            <Tag :color="reportData.fail_steps > 0 ? 'error' : 'default'">
              {{ reportData.fail_steps }}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="执行时长">
            {{ formatDuration(reportData.duration) }}
          </Descriptions.Item>
          <Descriptions.Item label="开始时间">
            {{ new Date(reportData.start_time).toLocaleString() }}
          </Descriptions.Item>
          <Descriptions.Item label="结束时间">
            {{ new Date(reportData.end_time).toLocaleString() }}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <!-- 执行详情 -->
      <Card title="执行详情">
        <div v-if="executionSteps.length > 0" class="space-y-4">
          <Timeline>
            <Timeline.Item
              v-for="(step, index) in executionSteps"
              :key="index"
              :color="step.success ? 'green' : 'red'"
            >
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <h4 class="font-medium">{{ step.name }}</h4>
                  <div class="flex items-center space-x-2">
                    <Tag :color="step.success ? 'success' : 'error'">
                      {{ step.success ? '成功' : '失败' }}
                    </Tag>
                    <span class="text-sm text-gray-500">
                      {{ step.duration }}ms
                    </span>
                  </div>
                </div>

                <!-- 请求信息 -->
                <div class="text-sm">
                  <span class="font-medium">请求:</span>
                  <Tag>{{ step.request_data?.method || 'N/A' }}</Tag>
                  <span class="text-gray-600">
                    {{ step.request_data?.url || step.url }}
                  </span>
                </div>

                <!-- 响应状态 -->
                <div v-if="step.response?.status_code" class="text-sm">
                  <span class="font-medium">状态码:</span>
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

                <!-- 执行时间 -->
                <div class="text-sm text-gray-500">
                  <span class="font-medium">开始时间:</span>
                  {{ new Date(step.start_time).toLocaleString() }}
                  <span class="ml-4 font-medium">结束时间:</span>
                  {{ new Date(step.end_time).toLocaleString() }}
                </div>

                <!-- 断言结果 -->
                <div
                  v-if="step.assertions && step.assertions.length > 0"
                  class="text-sm"
                >
                  <span class="font-medium">断言结果:</span>
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

                <!-- 响应详情 -->
                <details v-if="step.response" class="text-sm">
                  <summary class="cursor-pointer font-medium">响应数据</summary>
                  <div class="mt-2 space-y-2">
                    <!-- 响应头 -->
                    <div v-if="step.response.headers">
                      <div class="font-medium">响应头:</div>
                      <pre class="mt-1 max-h-32 overflow-auto rounded bg-gray-50 p-2 text-xs">{{ JSON.stringify(step.response.headers, null, 2) }}</pre>
                    </div>
                    <!-- 响应体 -->
                    <div v-if="step.response.json || step.response.text">
                      <div class="font-medium">响应体:</div>
                      <pre class="mt-1 max-h-40 overflow-auto rounded bg-gray-50 p-2 text-xs">{{ step.response.json ? JSON.stringify(step.response.json, null, 2) : step.response.text }}</pre>
                    </div>
                  </div>
                </details>

                <!-- 请求详情 -->
                <details v-if="step.request_data" class="text-sm">
                  <summary class="cursor-pointer font-medium">请求数据</summary>
                  <pre class="mt-2 max-h-40 overflow-auto rounded bg-gray-50 p-2 text-xs">{{ JSON.stringify(step.request_data, null, 2) }}</pre>
                </details>
              </div>
            </Timeline.Item>
          </Timeline>
        </div>
        <div v-else class="py-8 text-center text-gray-500">
          暂无执行详情数据
        </div>
      </Card>
    </div>

    <div v-else class="py-8 text-center text-gray-500">
      报告不存在或已被删除
    </div>
  </Page>
</template>
