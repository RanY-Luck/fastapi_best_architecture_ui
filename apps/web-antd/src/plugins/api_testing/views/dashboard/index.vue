<script lang="ts" setup>
import type {
  ApiProject,
  TestCase,
  TestReport,
} from '#/plugins/api_testing/api/types.ts';

// 根据实际路径调整
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page, VbenButton } from '@vben/common-ui';
import { FxemojiBarChart, MdiFile, MdiPlay, Plus } from '@vben/icons';

import {
  Card,
  Col,
  Empty,
  List,
  message,
  Progress,
  Row,
  Statistic,
} from 'ant-design-vue';

import { getApiProjectListApi } from '#/plugins/api_testing/api/project';
import { getTestCaseListApi } from '#/plugins/api_testing/api/testcase';
import { getTestReportListApi } from '#/plugins/api_testing/api/testreport';

defineOptions({
  name: 'ApiTestingDashboard',
});

const router = useRouter();
// 统计数据
const stats = ref({
  totalProjects: 0,
  totalTestCases: 0,
  totalReports: 0,
  successRate: 0,
});

const formatTime = (time?: string): string => {
  if (!time) return '暂无时间';
  const date = new Date(time);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const latestProject = computed(() => {
  return recentProjects.value.slice(0, 1);
});

// 最近的项目
const recentProjects = ref<ApiProject[]>([]);

// 最近的测试用例
const recentTestCases = ref<TestCase[]>([]);

// 最近的测试报告
const recentReports = ref<TestReport[]>([]);

const loading = ref(false);

// 获取统计数据
async function fetchStats() {
  loading.value = true;
  try {
    // 获取项目统计
    const projectsResult = await getApiProjectListApi();
    stats.value.totalProjects = projectsResult.total;
    // 获取测试用例统计
    const casesResult = await getTestCaseListApi();
    stats.value.totalTestCases = casesResult.total;

    // 获取测试报告统计
    const reportsResult = await getTestReportListApi();
    stats.value.totalReports = reportsResult.total;
    // 计算成功率（基于最近的报告）
    if (reportsResult.items && reportsResult.items.length > 0) {
      const successCount = reportsResult.items.filter(
        (report) => report.success,
      ).length;
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

// 获取最近数据
async function fetchRecentData() {
  try {
    // 获取最近的项目
    const projectsResult = await getApiProjectListApi();

    recentProjects.value = projectsResult.items
      .filter((item) => item.created_time) // 过滤掉没有创建时间的
      .sort((a, b) => {
        const timeA = new Date(a.created_time).getTime();
        const timeB = new Date(b.created_time).getTime();
        return timeB - timeA; // 降序:最新创建的在前
      })
      .slice(0, 1);

    // 获取最近的测试用例
    const casesResult = await getTestCaseListApi();

    recentTestCases.value = casesResult.items
      .filter((item) => item.created_time) // 过滤掉没有创建时间的
      .sort((a, b) => {
        const timeA = new Date(a.created_time).getTime();
        const timeB = new Date(b.created_time).getTime();
        return timeB - timeA; // 降序:最新创建的在前
      })
      .slice(0, 1);

    // 获取最近的测试报告
    const reportsResult = await getTestReportListApi();
    recentReports.value = reportsResult.items;
  } catch {
    message.error('获取最近数据失败');
  }
}

// 快速操作
function handleQuickAction(action: string) {
  switch (action) {
    case 'create-case': {
      router.push('/api_testing/testcase');
      break;
    }
    case 'create-project': {
      router.push('/api_testing/project');
      break;
    }
    case 'view-reports': {
      router.push('/api_testing/testreport');
      break;
    }
  }
}

// 跳转到详情
function goToDetail(type: string, id: number) {
  switch (type) {
    case 'case': {
      router.push({
        name: 'ApiTestingTestStep',
        query: { test_case_id: id },
      });
      break;
    }
    case 'project': {
      router.push('/api_testing/project');
      break;
    }
    case 'report': {
      router.push({
        name: 'ApiTestingTestReportDetail',
        params: { id },
      });
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
      <!-- 欢迎信息 -->
      <Card>
        <div class="flex items-center justify-between">
          <div>
            <h1 class="mb-2 text-2xl font-bold">API测试管理</h1>
            <p class="text-gray-600">管理您的API测试项目、用例和报告</p>
          </div>
          <div class="flex space-x-2">
            <VbenButton
              type="primary"
              @click="handleQuickAction('create-project')"
            >
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

      <!-- 统计卡片 -->
      <Row :gutter="16" class="ry-card">
        <Col :span="6">
          <Card>
            <Statistic
              title="总项目数"
              :value="stats.totalProjects"
              :loading="loading"
            >
              <template #prefix>
                <MdiFile class="size-4" />
              </template>
            </Statistic>
          </Card>
        </Col>
        <Col :span="6">
          <Card>
            <Statistic
              title="总测试用例"
              :value="stats.totalTestCases"
              :loading="loading"
            >
              <template #prefix>
                <MdiPlay class="size-4" />
              </template>
            </Statistic>
          </Card>
        </Col>
        <Col :span="6">
          <Card>
            <Statistic
              title="总测试报告"
              :value="stats.totalReports"
              :loading="loading"
            >
              <template #prefix>
                <FxemojiBarChart class="size-4" />
              </template>
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
              :value-style="{
                color:
                  stats.successRate >= 80
                    ? '#3f8600'
                    : stats.successRate >= 60
                      ? '#faad14'
                      : '#cf1322',
              }"
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

      <!-- 最近数据 -->
      <Row :gutter="16">
        <!-- 最近项目 -->
        <Col :span="8">
          <Card title="最近项目" :body-style="{ padding: 0 }">
            <List v-if="latestProject.length > 0" :data-source="latestProject">
              <template #renderItem="{ item }">
                <List.Item
                  class="cursor-pointer px-4 hover:bg-gray-50"
                  @click="goToDetail('project', item.id)"
                >
                  <List.Item.Meta>
                    <template #title>{{ item.name }}</template>
                    <template #description>
                      {{ item.description || '暂无描述' }}
                    </template>
                  </List.Item.Meta>
                  <div class="text-sm text-gray-500">
                    最近更新时间：{{
                      formatTime(item.updated_time || item.created_time)
                    }}
                  </div>
                </List.Item>
              </template>
            </List>
            <Empty v-else description="暂无项目" />
          </Card>
        </Col>

        <!-- 最近测试用例 -->
        <Col :span="8">
          <Card title="最近测试用例" :body-style="{ padding: 0 }">
            <List
              v-if="recentTestCases.length > 0"
              :data-source="recentTestCases.slice(0, 1)"
            >
              <template #renderItem="{ item }">
                <List.Item
                  class="cursor-pointer px-4 hover:bg-gray-50"
                  @click="goToDetail('case', item.id)"
                >
                  <List.Item.Meta>
                    <template #title>{{ item.name }}</template>
                    <template #description>
                      {{ item.description || '未知项目' }}
                    </template>
                  </List.Item.Meta>
                  <div class="text-sm text-gray-500">
                    最近更新时间：{{
                      formatTime(item.updated_time || item.created_time)
                    }}
                  </div>
                </List.Item>
              </template>
            </List>
            <Empty v-else description="暂无测试用例" />
          </Card>
        </Col>

        <!-- 最近测试报告 -->
        <Col :span="8">
          <Card title="最近测试报告" :body-style="{ padding: 0 }">
            <List
              v-if="recentReports.length > 0"
              :data-source="recentReports.slice(0, 1)"
            >
              <template #renderItem="{ item }">
                <List.Item
                  class="cursor-pointer px-4 hover:bg-gray-50"
                  @click="goToDetail('report', item.id)"
                >
                  <List.Item.Meta>
                    <template #title>
                      <div class="flex items-center space-x-2">
                        <span>{{ item.name }}</span>
                        <div
                          class="h-2 w-2 rounded-full"
                          :class="item.success ? 'bg-green-500' : 'bg-red-500'"
                        ></div>
                      </div>
                    </template>
                    <template #description>
                      成功率:
                      {{
                        Math.round(
                          (item.success_steps / item.total_steps) * 100,
                        )
                      }}%
                    </template>
                  </List.Item.Meta>
                  <div class="text-sm text-gray-500">
                    最近更新时间：{{
                      formatTime(item.updated_time || item.created_time)
                    }}
                  </div>
                </List.Item>
              </template>
            </List>
            <Empty v-else description="暂无测试报告" />
          </Card>
        </Col>
      </Row>

      <!-- 快速操作 -->
      <Card title="快速操作">
        <div class="grid grid-cols-3 gap-4">
          <div
            class="cursor-pointer rounded-lg border border-gray-200 p-4 transition-all hover:border-blue-500 hover:shadow-md"
            @click="handleQuickAction('create-project')"
          >
            <div class="flex items-center space-x-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100"
              >
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
              <div
                class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100"
              >
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
              <div
                class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100"
              >
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
