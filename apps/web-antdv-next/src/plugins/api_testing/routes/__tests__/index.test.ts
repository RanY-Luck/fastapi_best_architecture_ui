import { describe, expect, it } from 'vitest';

import routes from '../index';

describe('api testing routes', () => {
  it('registers the execution stream route with the expected metadata', () => {
    const apiTestingRoute = routes.find((route) => route.name === 'ApiTesting');
    const childRoutes = apiTestingRoute?.children ?? [];
    const childRouteNames = childRoutes.map((route) => route.name);
    const executionStreamRoute = childRoutes.find(
      (route) => route.name === 'ApiTestingExecutionStream',
    );

    expect(childRouteNames).toContain('ApiTestingExecutionStream');
    expect(childRouteNames).toContain('ApiTestingTestSuite');
    expect(childRouteNames).toContain('ApiTestingBatchReport');
    expect(executionStreamRoute?.path).toBe('/plugins/testcase-execution-stream');
    expect(executionStreamRoute?.meta?.hideInMenu).toBe(true);
    expect(executionStreamRoute?.meta?.title).toBe('运行日志');
  });
});
