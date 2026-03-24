import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    name: 'ApiTesting',
    path: '/api-testing',
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
        path: 'dashboard',
        component: () =>
          import('#/plugins/api_testing/views/dashboard/index.vue'),
        meta: {
          icon: 'lucide:bar-chart-3',
          title: $t('apiTesting.dashboard.title'),
        },
      },
      {
        name: 'ApiTestingProject',
        path: 'project',
        component: () =>
          import('#/plugins/api_testing/views/project/index.vue'),
        meta: {
          icon: 'lucide:folder',
          title: $t('apiTesting.project.title'),
        },
      },
      {
        name: 'ApiTestingTestCase',
        path: 'testcase',
        component: () =>
          import('#/plugins/api_testing/views/testcase/index.vue'),
        meta: {
          icon: 'lucide:file-text',
          title: $t('apiTesting.testcase.title'),
        },
      },
      {
        name: 'ApiTestingTestStep',
        path: 'teststep',
        component: () =>
          import('#/plugins/api_testing/views/teststep/index.vue'),
        meta: {
          icon: 'lucide:list',
          title: $t('apiTesting.teststep.title'),
        },
      },
      {
        name: 'ApiTestingTestReport',
        path: 'testreport',
        component: () =>
          import('#/plugins/api_testing/views/testreport/index.vue'),
        meta: {
          icon: 'lucide:file-bar-chart',
          title: $t('apiTesting.testreport.title'),
        },
      },
      {
        name: 'ApiTestingTestReportDetail',
        path: 'testreport/:id',
        component: () =>
          import('#/plugins/api_testing/views/testreport/detail.vue'),
        meta: {
          hideInMenu: true,
          title: $t('apiTesting.testreport.detailTitle'),
        },
      },
      {
        name: 'ApiTestingEnvironment',
        path: 'environment',
        component: () =>
          import('#/plugins/api_testing/views/environment/index.vue'),
        meta: {
          icon: 'lucide:settings-2',
          title: $t('apiTesting.environment.title'),
        },
      },
      {
        name: 'ApiTestingVariable',
        path: 'variable',
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
