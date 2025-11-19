<script lang="ts" setup>
import type { TestReport } from '#/plugins/api_testing/api/types';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page, VbenButton } from '@vben/common-ui';
import { ArrowLeft } from '@vben/icons';

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

// 获取报告详情
async function fetchReportDetail() {
  const reportId = Number(route.params.id);
  if (!reportId) return;

  loading.value = true;
  try {
    const result = await getTestReportDetailApi(reportId);
    reportData.value = result;
  } catch {
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
            {{ reportData.test_case?.name || '未知' }}
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
        <div
          v-if="reportData.details && reportData.details.steps"
          class="space-y-4"
        >
          <Timeline>
            <Timeline.Item
              v-for="(step, index) in reportData.details.steps"
              :key="index"
              :color="step.success ? 'green' : 'red'"
            >
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <h4 class="font-medium">{{ step.step_name }}</h4>
                  <div class="flex items-center space-x-2">
                    <Tag :color="step.success ? 'success' : 'error'">
                      {{ step.success ? '成功' : '失败' }}
                    </Tag>
                    <!--                    <span class="text-sm text-gray-500"-->
                    <!--                      >{{ step.response_time }}ms</span-->
                    <!--                    >-->
                  </div>
                </div>

                <div v-if="step.status_code" class="text-sm">
                  <span class="font-medium">状态码:</span>
                  <Tag
                    :color="
                      step.status_code >= 200 && step.status_code < 300
                        ? 'success'
                        : 'error'
                    "
                  >
                    {{ step.status_code }}
                  </Tag>
                </div>

                <div v-if="step.error_message" class="text-sm text-red-600">
                  <span class="font-medium">错误信息:</span>
                  {{ step.error_message }}
                </div>

                <div
                  v-if="step.validations && step.validations.length > 0"
                  class="text-sm"
                >
                  <span class="font-medium">断言结果:</span>
                  <div class="mt-1 space-y-1">
                    <div
                      v-for="(validation, vIndex) in step.validations"
                      :key="vIndex"
                      class="flex items-center space-x-2"
                    >
                      <Tag :color="validation.success ? 'success' : 'error'">
                        {{ validation.success ? '通过' : '失败' }}
                      </Tag>
                      <span>{{
                        validation.rule.description || validation.rule.field
                      }}</span>
                      <span v-if="!validation.success" class="text-red-600">
                        (期望: {{ validation.rule.expected }}, 实际:
                        {{ validation.actual }})
                      </span>
                    </div>
                  </div>
                </div>

                <details v-if="step.response_data" class="text-sm">
                  <summary class="cursor-pointer font-medium">响应数据</summary>
                  <!--                  <pre-->
                  <!--                    class="mt-2 max-h-40 overflow-auto rounded bg-gray-50 p-2 text-xs"-->
                  <!--                    >{{ JSON.stringify(step.response_data, null, 2) }}</pre>-->
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
