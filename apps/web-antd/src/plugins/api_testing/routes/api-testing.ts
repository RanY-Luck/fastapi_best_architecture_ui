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
    path: '/api_testing',
    children: [
      {
        name: 'ApiTestingDashboard',
        path: '/api_dashboard',
        component: () =>
          import('#/plugins/api_testing/views/dashboard/index.vue'),
        meta: {
          icon: 'lucide:bar-chart-3',
          title: '测试用例仪表板',
        },
      },
      {
        name: 'ApiTestingProject',
        path: '/project',
        component: () =>
          import('#/plugins/api_testing/views/project/index.vue'),
        meta: {
          icon: 'lucide:folder',
          title: '项目管理',
        },
      },
      {
        name: 'ApiTestingTestCase',
        path: '/testcase',
        component: () =>
          import('#/plugins/api_testing/views/testcase/index.vue'),
        meta: {
          icon: 'lucide:file-text',
          title: '测试用例',
        },
      },
      {
        name: 'ApiTestingTestStep',
        path: '/teststep',
        component: () =>
          import('#/plugins/api_testing/views/teststep/index.vue'),
        meta: {
          icon: 'lucide:list',
          title: '测试步骤',
        },
      },
      {
        name: 'ApiTestingTestReport',
        path: '/testreport',
        component: () =>
          import('#/plugins/api_testing/views/testreport/index.vue'),
        meta: {
          icon: 'lucide:file-bar-chart',
          title: '测试报告',
        },
      },
      {
        name: 'ApiTestingTestReportDetail',
        path: '/testreportdetail/:id',
        component: () =>
          import('#/plugins/api_testing/views/testreport/detail.vue'),
        meta: {
          hideInMenu: true,
          title: '报告详情',
        },
      },
      {
        name: 'ApiTestingEnvironment',
        path: '/environment',
        component: () =>
          import('#/plugins/api_testing/views/environment/index.vue'),
        meta: {
          icon: 'lucide:settings-2',
          title: '环境管理',
        },
      },
      {
        name: 'ApiTestingVariable',
        path: '/variable',
        component: () =>
          import('#/plugins/api_testing/views/variable/index.vue'),
        meta: {
          icon: 'lucide:variable',
          title: '变量管理',
        },
      },
    ],
  },
];

export default routes;
