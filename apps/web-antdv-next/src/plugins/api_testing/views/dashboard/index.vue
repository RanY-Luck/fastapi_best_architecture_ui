<script lang="ts" setup>
import type {
  ApiProject,
  TestCase,
  TestReport,
} from '#/plugins/api_testing/api/types';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page, VbenButton } from '@vben/common-ui';
import { FxemojiBarChart, MdiFile, MdiPlay, Plus } from '@vben/icons';
import { Card, Col, Empty, message, Progress, Row, Statistic } from 'antdv-next';

import { getApiProjectListApi } from '#/plugins/api_testing/api/project';
import { getTestCaseListApi } from '#/plugins/api_testing/api/testcase';
import { getTestReportListApi } from '#/plugins/api_testing/api/testreport';

defineOptions({
  name: 'ApiTestingDashboard',
});

const router = useRouter();
const stats = ref({
  totalProjects: 0,
  totalReports: 0,
  totalTestCases: 0,
  successRate: 0,
});

const recentProjects = ref<ApiProject[]>([]);
const recentTestCases = ref<TestCase[]>([]);
const recentReports = ref<TestReport[]>([]);
const loading = ref(false);

const latestProject = computed(() => recentProjects.value.slice(0, 1));

const formatTime = (time?: string) => {
  if (!time) return '暂无时间';
  return new Date(time).toLocaleString('zh-CN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

async function fetchStats() {
  loading.value = true;
  try {
    const [projectsResult, casesResult, reportsResult] = await Promise.all([
      getApiProjectListApi(),
      getTestCaseListApi(),
      getTestReportListApi(),
    ]);
    stats.value.totalProjects = projectsResult.total;
    stats.value.totalTestCases = casesResult.total;
    stats.value.totalReports = reportsResult.total;
    if (reportsResult.items?.length) {
      const successCount = reportsResult.items.filter((report) => report.success).length;
      stats.value.successRate = Math.round(
        (successCount / reportsResult.items.length) * 100,
      );
    } else {
      stats.value.successRate = 0;
    }
  } catch {
    message.error('获取统计数据失败');
  } finally {
    loading.value = false;
  }
}

async function fetchRecentData() {
  try {
    const [projectsResult, casesResult, reportsResult] = await Promise.all([
      getApiProjectListApi(),
      getTestCaseListApi(),
      getTestReportListApi(),
    ]);

    recentProjects.value = projectsResult.items
      .filter((item) => item.created_time)
      .sort(
        (a, b) =>
          new Date(b.created_time).getTime() - new Date(a.created_time).getTime(),
      )
      .slice(0, 1);

    recentTestCases.value = casesResult.items
      .filter((item) => item.created_time || item.created_time)
      .sort(
        (a, b) =>
          new Date(b.updated_time || b.update_time || b.created_time || b.create_time || 0).getTime() -
          new Date(a.updated_time || a.update_time || a.created_time || a.create_time || 0).getTime(),
      )
      .slice(0, 1);

    recentReports.value = reportsResult.items.slice(0, 1);
  } catch {
    message.error('获取最近数据失败');
  }
}

function handleQuickAction(action: string) {
  switch (action) {
    case 'create-case': {
      router.push({ name: 'ApiTestingTestCase' });
      break;
    }
    case 'create-project': {
      router.push({ name: 'ApiTestingProject' });
      break;
    }
    case 'view-reports': {
      router.push({ name: 'ApiTestingTestReport' });
      break;
    }
  }
}

function goToDetail(type: string, id: number) {
  switch (type) {
    case 'case': {
      router.push({ name: 'ApiTestingTestCase' });
      break;
    }
    case 'project': {
      router.push({ name: 'ApiTestingProject' });
      break;
    }
    case 'report': {
      router.push({ name: 'ApiTestingTestReportDetail', params: { id } });
      break;
    }
  }
}

onMounted(() => {
  fetchStats();
  fetchRecentData();
});
</script>

<template>
  <Page auto-content-height>
    <div class="space-y-6">
      <Card>
        <div class="flex items-center justify-between gap-4">
          <div>
            <h1 class="mb-2 text-2xl font-bold">API测试管理</h1>
            <p class="text-gray-600">管理您的API测试项目、用例和报告</p>
          </div>
          <div class="flex gap-2">
            <VbenButton type="primary" @click="handleQuickAction('create-project')">
              <Plus class="mr-1 size-4" />
              创建项目
            </VbenButton>
            <VbenButton @click="handleQuickAction('create-case')">
              <Plus class="mr-1 size-4" />
              创建用例
            </VbenButton>
          </div>
        </div>
      </Card>

      <Row :gutter="16" class="ry-card">
        <Col :span="6">
          <Card>
            <Statistic title="总项目数" :value="stats.totalProjects" :loading="loading">
              <template #prefix><MdiFile class="size-4" /></template>
            </Statistic>
          </Card>
        </Col>
        <Col :span="6">
          <Card>
            <Statistic title="总测试用例" :value="stats.totalTestCases" :loading="loading">
              <template #prefix><MdiPlay class="size-4" /></template>
            </Statistic>
          </Card>
        </Col>
        <Col :span="6">
          <Card>
            <Statistic title="总测试报告" :value="stats.totalReports" :loading="loading">
              <template #prefix><FxemojiBarChart class="size-4" /></template>
            </Statistic>
          </Card>
        </Col>
        <Col :span="6">
          <Card>
            <Statistic
              title="平均成功率"
              :value="stats.successRate"
              suffix="%"
              :loading="loading"
            >
              <template #prefix>
                <Progress
                  type="circle"
                  :percent="stats.successRate"
                  size="small"
                  :width="20"
                  :stroke-width="8"
                  :show-info="false"
                />
              </template>
            </Statistic>
          </Card>
        </Col>
      </Row>

      <Row :gutter="16">
        <Col :span="8">
          <Card title="最近项目">
            <div v-if="latestProject.length > 0" class="space-y-3">
              <div
                v-for="item in latestProject"
                :key="item.id"
                class="cursor-pointer rounded border p-4 hover:bg-gray-50"
                @click="goToDetail('project', item.id)"
              >
                <div class="font-medium">{{ item.name }}</div>
                <div class="mt-1 text-sm text-gray-500">{{ item.description || '暂无描述' }}</div>
                <div class="mt-2 text-xs text-gray-400">
                  最近更新时间：{{ formatTime(item.updated_time || item.created_time) }}
                </div>
              </div>
            </div>
            <Empty v-else description="暂无项目" />
          </Card>
        </Col>

        <Col :span="8">
          <Card title="最近测试用例">
            <div v-if="recentTestCases.length > 0" class="space-y-3">
              <div
                v-for="item in recentTestCases"
                :key="item.id"
                class="cursor-pointer rounded border p-4 hover:bg-gray-50"
                @click="goToDetail('case', item.id)"
              >
                <div class="font-medium">{{ item.name }}</div>
                <div class="mt-1 text-sm text-gray-500">{{ item.description || '未知项目' }}</div>
                <div class="mt-2 text-xs text-gray-400">
                  最近更新时间：{{ formatTime(item.updated_time || item.update_time || item.created_time || item.create_time) }}
                </div>
              </div>
            </div>
            <Empty v-else description="暂无测试用例" />
          </Card>
        </Col>

        <Col :span="8">
          <Card title="最近测试报告">
            <div v-if="recentReports.length > 0" class="space-y-3">
              <div
                v-for="item in recentReports"
                :key="item.id"
                class="cursor-pointer rounded border p-4 hover:bg-gray-50"
                @click="goToDetail('report', item.id)"
              >
                <div class="flex items-center gap-2 font-medium">
                  <span>{{ item.name }}</span>
                  <span
                    class="inline-block h-2 w-2 rounded-full"
                    :class="item.success ? 'bg-green-500' : 'bg-red-500'"
                  />
                </div>
                <div class="mt-1 text-sm text-gray-500">
                  成功率: {{ Math.round((item.success_steps / item.total_steps) * 100) || 0 }}%
                </div>
                <div class="mt-2 text-xs text-gray-400">
                  最近更新时间：{{ formatTime(item.updated_time || item.update_time || item.created_time || item.create_time) }}
                </div>
              </div>
            </div>
            <Empty v-else description="暂无测试报告" />
          </Card>
        </Col>
      </Row>

      <Card title="快速操作">
        <div class="grid grid-cols-3 gap-4">
          <div
            class="cursor-pointer rounded-lg border border-gray-200 p-4 transition-all hover:border-blue-500 hover:shadow-md"
            @click="handleQuickAction('create-project')"
          >
            <div class="flex items-center space-x-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Plus class="size-5 text-blue-600" />
              </div>
              <div>
                <h3 class="font-medium">创建新项目</h3>
                <p class="text-sm text-gray-500">开始一个新的API测试项目</p>
              </div>
            </div>
          </div>

          <div
            class="cursor-pointer rounded-lg border border-gray-200 p-4 transition-all hover:border-green-500 hover:shadow-md"
            @click="handleQuickAction('create-case')"
          >
            <div class="flex items-center space-x-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <MdiPlay class="size-5 text-green-600" />
              </div>
              <div>
                <h3 class="font-medium">创建测试用例</h3>
                <p class="text-sm text-gray-500">为项目添加新的测试用例</p>
              </div>
            </div>
          </div>

          <div
            class="cursor-pointer rounded-lg border border-gray-200 p-4 transition-all hover:border-purple-500 hover:shadow-md"
            @click="handleQuickAction('view-reports')"
          >
            <div class="flex items-center space-x-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <FxemojiBarChart class="size-5 text-purple-600" />
              </div>
              <div>
                <h3 class="font-medium">查看测试报告</h3>
                <p class="text-sm text-gray-500">查看和分析测试结果</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  </Page>
</template>

<style scoped lang="scss">
.ry-card {
  .ant-col .ant-card {
    height: 100%;
  }
}
</style>
