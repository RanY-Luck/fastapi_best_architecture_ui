import { describe, expect, it } from 'vitest';

import routes from '../index';

describe('api testing routes', () => {
  it('registers testsuite, batch-report and sql plugin routes', () => {
    const apiTestingRoute = routes.find((route) => route.name === 'ApiTesting');
    const childRouteNames =
      apiTestingRoute?.children?.map((route) => route.name) ?? [];

    expect(childRouteNames).toContain('ApiTestingTestSuite');
    expect(childRouteNames).toContain('ApiTestingBatchReport');
    expect(childRouteNames).toContain('ApiTestingSql');
  });
});
