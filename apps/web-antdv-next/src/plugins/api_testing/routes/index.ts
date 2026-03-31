import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    name: 'ApiTesting',
    path: '/plugins/api_testing',
    component: BasicLayout,
    meta: {
      icon: 'lucide:test-tube',
      keepAlive: true,
      order: 1000,
      title: $t('apiTesting.menu'),
    },
    children: [
      {
        name: 'ApiTestingDashboard',
        path: '/plugins/api_dashboard',
        component: () =>
          import('#/plugins/api_testing/views/dashboard/index.vue'),
        meta: {
          icon: 'lucide:bar-chart-3',
          title: $t('apiTesting.dashboard.title'),
        },
      },
      {
        name: 'ApiTestingProject',
        path: '/plugins/project',
        component: () =>
          import('#/plugins/api_testing/views/project/index.vue'),
        meta: {
          icon: 'lucide:folder',
          title: $t('apiTesting.project.title'),
        },
      },
      {
        name: 'ApiTestingTestCase',
        path: '/plugins/testcase',
        component: () =>
          import('#/plugins/api_testing/views/testcase/index.vue'),
        meta: {
          icon: 'lucide:file-text',
          title: $t('apiTesting.testcase.title'),
        },
      },
      {
        name: 'ApiTestingTestStep',
        path: '/plugins/teststep',
        component: () =>
          import('#/plugins/api_testing/views/teststep/index.vue'),
        meta: {
          icon: 'lucide:list',
          title: $t('apiTesting.teststep.title'),
        },
      },
      {
        name: 'ApiTestingSql',
        path: '/plugins/sql',
        component: () =>
          import('#/plugins/api_testing/views/sql/index.vue'),
        meta: {
          icon: 'lucide:database-zap',
          title: $t('apiTesting.sql.title'),
        },
      },
      {
        name: 'ApiTestingTestSuite',
        path: '/plugins/testsuite',
        component: () =>
          import('#/plugins/api_testing/views/testsuite/index.vue'),
        meta: {
          icon: 'lucide:layers-3',
          title: '测试集合',
        },
      },
      {
        name: 'ApiTestingTestReport',
        path: '/plugins/testreport',
        component: () =>
          import('#/plugins/api_testing/views/testreport/index.vue'),
        meta: {
          icon: 'lucide:file-bar-chart',
          title: $t('apiTesting.testreport.title'),
        },
      },
      {
        name: 'ApiTestingTestReportDetail',
        path: '/plugins/testreportdetail/:id',
        component: () =>
          import('#/plugins/api_testing/views/testreport/detail.vue'),
        meta: {
          hideInMenu: true,
          title: $t('apiTesting.testreport.detailTitle'),
        },
      },
      {
        name: 'ApiTestingBatchReport',
        path: '/plugins/batch-report',
        component: () =>
          import('#/plugins/api_testing/views/batch-report/index.vue'),
        meta: {
          icon: 'lucide:panel-right-open',
          title: '批量执行报告',
        },
      },
      {
        name: 'ApiTestingEnvironment',
        path: '/plugins/environment',
        component: () =>
          import('#/plugins/api_testing/views/environment/index.vue'),
        meta: {
          icon: 'lucide:settings-2',
          title: $t('apiTesting.environment.title'),
        },
      },
      {
        name: 'ApiTestingVariable',
        path: '/plugins/variable',
        component: () =>
          import('#/plugins/api_testing/views/variable/index.vue'),
        meta: {
          icon: 'lucide:variable',
          title: $t('apiTesting.variable.title'),
        },
      },
      {
        path: '',
        redirect: { name: 'ApiTestingDashboard' },
      },
    ],
  },
];

export default routes;
