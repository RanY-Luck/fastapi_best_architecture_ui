import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'lucide:test-tube',
      keepAlive: true,
      order: 1000,
      title: 'API测试',
    },
    name: 'ApiTesting',
    path: '/api-testing',
    children: [
      {
        name: 'ApiTestingDashboard',
        path: '/api-testing/dashboard',
        component: () =>
          import('#/plugins/api_testing/views/dashboard/index.vue'),
        meta: {
          icon: 'lucide:bar-chart-3',
          title: '测试用例仪表板',
        },
      },
      {
        name: 'ApiTestingProject',
        path: '/api-testing/project',
        component: () =>
          import('#/plugins/api_testing/views/project/index.vue'),
        meta: {
          icon: 'lucide:folder',
          title: '项目管理',
        },
      },
      {
        name: 'ApiTestingTestCase',
        path: '/api-testing/test-case',
        component: () =>
          import('#/plugins/api_testing/views/test-case/index.vue'),
        meta: {
          icon: 'lucide:file-text',
          title: '测试用例',
        },
      },
      {
        name: 'ApiTestingTestStep',
        path: '/api-testing/test-step',
        component: () =>
          import('#/plugins/api_testing/views/test-step/index.vue'),
        meta: {
          icon: 'lucide:list',
          title: '测试步骤',
        },
      },
      {
        name: 'ApiTestingTestReport',
        path: '/api-testing/test-report',
        component: () =>
          import('#/plugins/api_testing/views/test-report/index.vue'),
        meta: {
          icon: 'lucide:file-bar-chart',
          title: '测试报告',
        },
      },
      {
        name: 'ApiTestingTestReportDetail',
        path: '/api-testing/test-report/:id',
        component: () =>
          import('#/plugins/api_testing/views/test-report/detail.vue'),
        meta: {
          hideInMenu: true,
          title: '报告详情',
        },
      },
    ],
  },
];

export default routes;
