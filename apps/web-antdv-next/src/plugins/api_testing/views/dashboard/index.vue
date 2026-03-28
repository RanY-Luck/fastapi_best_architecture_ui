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
import { Card, Empty, Progress, message } from 'antdv-next';

import { getApiProjectListApi } from '#/plugins/api_testing/api/project';
import { getTestCaseListApi } from '#/plugins/api_testing/api/testcase';
import { getTestReportListApi } from '#/plugins/api_testing/api/testreport';

defineOptions({
  name: 'ApiTestingDashboard',
});

const router = useRouter();
const loading = ref(false);
const stats = ref({
  totalProjects: 0,
  totalReports: 0,
  totalTestCases: 0,
  successRate: 0,
});

const recentProjects = ref<ApiProject[]>([]);
const recentTestCases = ref<TestCase[]>([]);
const recentReports = ref<TestReport[]>([]);

const latestProject = computed(() => recentProjects.value[0]);
const latestTestCase = computed(() => recentTestCases.value[0]);
const latestReport = computed(() => recentReports.value[0]);

const statCards = computed(() => [
  {
    accent: 'project',
    icon: MdiFile,
    kicker: 'Project Footprint',
    title: '项目总数',
    value: stats.value.totalProjects,
  },
  {
    accent: 'case',
    icon: MdiPlay,
    kicker: 'Case Library',
    title: '测试用例',
    value: stats.value.totalTestCases,
  },
  {
    accent: 'report',
    icon: FxemojiBarChart,
    kicker: 'Execution Reports',
    title: '测试报告',
    value: stats.value.totalReports,
  },
  {
    accent: 'success',
    icon: FxemojiBarChart,
    kicker: 'Health Score',
    title: '成功率',
    value: `${stats.value.successRate}%`,
  },
]);

const activityCards = computed(() => [
  {
    description: latestProject.value?.description || '最近活跃的项目会在这里展示基础信息。',
    empty: !latestProject.value,
    emptyText: '暂无项目',
    id: latestProject.value?.id,
    label: '最近项目',
    status: latestProject.value ? '项目在线' : '等待创建',
    time: formatTime(latestProject.value?.updated_time || latestProject.value?.created_time),
    title: latestProject.value?.name || '还没有项目',
    type: 'project',
  },
  {
    description: latestTestCase.value?.description || '最近维护的测试用例会显示在这里。',
    empty: !latestTestCase.value,
    emptyText: '暂无测试用例',
    id: latestTestCase.value?.id,
    label: '最近用例',
    status: latestTestCase.value ? '可继续编辑' : '等待补充',
    time: formatTime(
      latestTestCase.value?.updated_time ||
        latestTestCase.value?.update_time ||
        latestTestCase.value?.created_time ||
        latestTestCase.value?.create_time,
    ),
    title: latestTestCase.value?.name || '还没有测试用例',
    type: 'case',
  },
  {
    description: latestReport.value
      ? `成功步骤 ${latestReport.value.success_steps}/${latestReport.value.total_steps}`
      : '最近执行的测试报告会在这里给出结果摘要。',
    empty: !latestReport.value,
    emptyText: '暂无测试报告',
    id: latestReport.value?.id,
    label: '最近报告',
    status: latestReport.value
      ? latestReport.value.success
        ? '执行成功'
        : '存在失败步骤'
      : '等待执行',
    time: formatTime(
      latestReport.value?.updated_time ||
        latestReport.value?.update_time ||
        latestReport.value?.created_time ||
        latestReport.value?.create_time,
    ),
    title: latestReport.value?.name || '还没有测试报告',
    type: 'report',
  },
]);

const heroSummary = computed(() => {
  const projectCount = stats.value.totalProjects;
  const caseCount = stats.value.totalTestCases;
  const reportCount = stats.value.totalReports;

  if (reportCount === 0) {
    return `当前已接入 ${projectCount} 个项目，累计维护 ${caseCount} 条测试用例，建议先发起一次执行获取健康度。`;
  }

  return `当前已接入 ${projectCount} 个项目，累计维护 ${caseCount} 条测试用例，最近报告成功率稳定在 ${stats.value.successRate}%。`;
});

const quickActions = [
  {
    action: 'create-project',
    description: '开始一个新的 API 测试项目，并配置基础地址。',
    title: '创建新项目',
  },
  {
    action: 'create-case',
    description: '为现有项目补充测试用例，完善覆盖范围。',
    title: '创建测试用例',
  },
  {
    action: 'view-reports',
    description: '查看最近执行结果，快速定位通过率与失败情况。',
    title: '查看测试报告',
  },
] as const;

function formatTime(time?: string) {
  if (!time) return '暂无时间';
  return new Date(time).toLocaleString('zh-CN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getLatestTimestamp(item: {
  create_time?: string;
  created_time?: string;
  update_time?: string;
  updated_time?: string;
}) {
  return new Date(
    item.updated_time ??
      item.update_time ??
      item.created_time ??
      item.create_time ??
      0,
  ).getTime();
}

function getReportPercent(report?: TestReport) {
  if (!report || !report.total_steps) return 0;
  return Math.round((report.success_steps / report.total_steps) * 100) || 0;
}

async function fetchDashboardData() {
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

    recentProjects.value = [...projectsResult.items]
      .filter((item) => item.created_time || item.updated_time)
      .sort((a, b) => getLatestTimestamp(b) - getLatestTimestamp(a))
      .slice(0, 1);

    recentTestCases.value = [...casesResult.items]
      .filter((item) => item.created_time || item.create_time || item.updated_time || item.update_time)
      .sort((a, b) => getLatestTimestamp(b) - getLatestTimestamp(a))
      .slice(0, 1);

    recentReports.value = [...reportsResult.items]
      .sort((a, b) => getLatestTimestamp(b) - getLatestTimestamp(a))
      .slice(0, 1);
  } catch {
    message.error('获取仪表盘数据失败');
  } finally {
    loading.value = false;
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

function goToDetail(type: string, id?: number) {
  if (!id) return;

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
  fetchDashboardData();
});
</script>

<template>
  <Page auto-content-height>
    <div class="api-dashboard">
      <section class="hero-card" data-test-id="dashboard-hero">
        <div class="hero-copy">
          <span class="hero-eyebrow">API Testing Workspace</span>
          <h1>API 测试概览</h1>
          <p class="hero-description">用更轻的首页视图，快速判断项目覆盖率、执行健康度和最近动态。</p>
          <p class="hero-summary">{{ heroSummary }}</p>
          <div class="hero-pills">
            <span class="hero-pill">{{ stats.totalProjects }} 个项目</span>
            <span class="hero-pill">{{ stats.totalTestCases }} 条用例</span>
            <span class="hero-pill">{{ stats.totalReports }} 份报告</span>
          </div>
        </div>
        <div class="hero-side">
          <div class="hero-meter">
            <span>执行健康度</span>
            <strong>{{ stats.successRate }}%</strong>
            <Progress :percent="stats.successRate" :show-info="false" />
          </div>
          <div class="hero-actions">
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
      </section>

      <section class="stats-grid">
        <article
          v-for="card in statCards"
          :key="card.title"
          class="stat-card"
          :class="`is-${card.accent}`"
          data-test-id="dashboard-stat-card"
        >
          <div class="stat-icon">
            <component :is="card.icon" class="size-5" />
          </div>
          <div class="stat-copy">
            <span class="stat-kicker">{{ card.kicker }}</span>
            <strong>{{ card.value }}</strong>
            <span class="stat-title">{{ card.title }}</span>
          </div>
        </article>
      </section>

      <section class="section-header">
        <div>
          <span class="section-eyebrow">Recent activity</span>
          <h2>最近动态</h2>
        </div>
        <p>保留你最关心的一条项目、用例和执行结果，避免首页变成拥挤列表。</p>
      </section>

      <section class="activity-grid">
        <Card
          v-for="item in activityCards"
          :key="item.label"
          class="activity-card"
          data-test-id="dashboard-activity-card"
        >
          <template v-if="!item.empty">
            <button class="activity-button" @click="goToDetail(item.type, item.id)">
              <div class="activity-topline">
                <span class="activity-label">{{ item.label }}</span>
                <span class="activity-status">{{ item.status }}</span>
              </div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.description }}</p>
              <div class="activity-footer">
                <span>{{ item.time }}</span>
                <span v-if="item.type === 'report'">成功率 {{ getReportPercent(latestReport) }}%</span>
                <span v-else>点击查看详情</span>
              </div>
            </button>
          </template>
          <Empty v-else :description="item.emptyText" />
        </Card>
      </section>

      <section class="section-header quick-section">
        <div>
          <span class="section-eyebrow">Quick entry</span>
          <h2>快捷入口</h2>
        </div>
        <p>保留高频操作，但表现成产品入口卡，而不是普通按钮组。</p>
      </section>

      <section class="quick-grid">
        <article
          v-for="item in quickActions"
          :key="item.action"
          class="quick-card"
          data-test-id="dashboard-quick-action"
          @click="handleQuickAction(item.action)"
        >
          <div class="quick-icon">
            <component :is="item.action === 'view-reports' ? FxemojiBarChart : item.action === 'create-case' ? MdiPlay : Plus" class="size-5" />
          </div>
          <div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.description }}</p>
          </div>
        </article>
      </section>
    </div>
  </Page>
</template>

<style scoped lang="scss">
.api-dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-height: 100%;
  padding: 4px;
  color: #1f2937;
}

.hero-card {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) minmax(300px, 0.9fr);
  gap: 24px;
  padding: 28px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 28px;
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.16), transparent 42%),
    radial-gradient(circle at bottom right, rgba(16, 185, 129, 0.14), transparent 36%),
    linear-gradient(135deg, #f8fbff 0%, #ffffff 52%, #f5f8ff 100%);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
}

.hero-eyebrow,
.section-eyebrow,
.stat-kicker {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.hero-eyebrow,
.section-eyebrow {
  color: #2563eb;
}

.hero-copy h1,
.section-header h2 {
  margin: 10px 0 0;
  color: #0f172a;
}

.hero-copy h1 {
  font-size: clamp(30px, 3vw, 42px);
  font-weight: 700;
  line-height: 1.08;
}

.hero-description,
.hero-summary,
.section-header p,
.activity-card p,
.quick-card p {
  margin: 0;
  color: #64748b;
}

.hero-description {
  margin-top: 12px;
  font-size: 16px;
}

.hero-summary {
  max-width: 680px;
  margin-top: 16px;
  line-height: 1.7;
}

.hero-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
}

.hero-pill {
  padding: 10px 14px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.8);
  color: #334155;
  font-size: 13px;
  font-weight: 500;
}

.hero-side {
  display: flex;
  flex-direction: column;
  gap: 16px;
  justify-content: space-between;
}

.hero-meter {
  padding: 20px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(8px);
}

.hero-meter span {
  color: #475569;
  font-size: 13px;
}

.hero-meter strong {
  display: block;
  margin: 8px 0 14px;
  color: #0f172a;
  font-size: 34px;
  line-height: 1;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.stats-grid,
.activity-grid,
.quick-grid {
  display: grid;
  gap: 16px;
}

.stats-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.stat-card {
  display: flex;
  gap: 14px;
  padding: 20px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 22px;
  background: #ffffff;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.05);
}

.stat-card.is-project {
  background: linear-gradient(180deg, #f7fbff 0%, #ffffff 100%);
}

.stat-card.is-case {
  background: linear-gradient(180deg, #f2fdf7 0%, #ffffff 100%);
}

.stat-card.is-report {
  background: linear-gradient(180deg, #fffaf1 0%, #ffffff 100%);
}

.stat-card.is-success {
  background: linear-gradient(180deg, #eef4ff 0%, #ffffff 100%);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.85);
  color: #2563eb;
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.12);
}

.stat-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
}

.stat-kicker {
  color: #94a3b8;
}

.stat-copy strong {
  color: #0f172a;
  font-size: 30px;
  line-height: 1;
}

.stat-title {
  color: #475569;
  font-size: 14px;
}

.section-header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
}

.section-header p {
  max-width: 520px;
  text-align: right;
}

.activity-grid,
.quick-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

:deep(.activity-card.ant-card) {
  border-radius: 24px;
  border-color: rgba(148, 163, 184, 0.14);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.05);
}

:deep(.activity-card .ant-card-body) {
  height: 100%;
  padding: 0;
}

.activity-button,
.quick-card {
  width: 100%;
  text-align: left;
}

.activity-button {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100%;
  padding: 22px;
  border: none;
  border-radius: 24px;
  background: transparent;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease;
}

.activity-button:hover,
.quick-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 36px rgba(37, 99, 235, 0.10);
}

.activity-button:hover {
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.9), #ffffff 100%);
}

.activity-topline,
.activity-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.activity-label,
.activity-status,
.activity-footer {
  font-size: 13px;
}

.activity-label {
  color: #2563eb;
  font-weight: 600;
}

.activity-status {
  padding: 6px 10px;
  border-radius: 999px;
  background: #eff6ff;
  color: #2563eb;
}

.activity-button h3,
.quick-card h3 {
  margin: 0;
  color: #0f172a;
  font-size: 22px;
}

.activity-card p,
.quick-card p {
  line-height: 1.7;
}

.activity-footer {
  margin-top: auto;
  color: #94a3b8;
}

.quick-section {
  margin-top: 6px;
}

.quick-card {
  display: flex;
  gap: 14px;
  padding: 22px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 22px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.quick-card:hover {
  border-color: rgba(37, 99, 235, 0.26);
}

.quick-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: #eff6ff;
  color: #2563eb;
}

@media (max-width: 1200px) {
  .stats-grid,
  .activity-grid,
  .quick-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .hero-card,
  .section-header {
    grid-template-columns: 1fr;
    align-items: start;
  }

  .section-header {
    display: flex;
    flex-direction: column;
  }

  .section-header p {
    max-width: none;
    text-align: left;
  }
}

@media (max-width: 640px) {
  .api-dashboard {
    gap: 18px;
  }

  .hero-card {
    padding: 22px;
    border-radius: 24px;
  }

  .stats-grid,
  .activity-grid,
  .quick-grid {
    grid-template-columns: 1fr;
  }

  .hero-actions,
  .hero-pills {
    flex-direction: column;
  }
}
</style>

