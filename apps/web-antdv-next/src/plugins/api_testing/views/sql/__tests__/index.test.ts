import { flushPromises, mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const apiMocks = vi.hoisted(() => ({
  executeBatchSqlQueryApi: vi.fn(),
  executeSqlQueryApi: vi.fn(),
  getSqlTaskStatusApi: vi.fn(),
}));

vi.mock('#/plugins/api_testing/api/sql', () => ({
  executeBatchSqlQueryApi: apiMocks.executeBatchSqlQueryApi,
  executeSqlQueryApi: apiMocks.executeSqlQueryApi,
  getSqlTaskStatusApi: apiMocks.getSqlTaskStatusApi,
}));

vi.mock('@vben/common-ui', () => ({
  Page: defineComponent({
    name: 'MockPage',
    setup(_, { slots }) {
      return () => h('div', { class: 'mock-page' }, slots.default?.());
    },
  }),
}));

import SqlPage from '../index.vue';

describe('api testing sql page', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('submits sql and polls until the task succeeds', async () => {
    apiMocks.executeSqlQueryApi.mockResolvedValueOnce({
      celery_task_id: 'celery-1',
      name: 'users',
      status: 'pending',
      task_id: 'task-1',
    });
    apiMocks.getSqlTaskStatusApi.mockResolvedValueOnce({
      celery_task_id: 'celery-1',
      duration: 120,
      error: null,
      name: 'users',
      result: { success: true, data: [{ id: 1 }] },
      status: 'success',
      task_id: 'task-1',
    });

    const wrapper = mount(SqlPage);

    await wrapper.get('[data-test-id="sql-name-input"]').setValue('users');
    await wrapper.get('[data-test-id="sql-query-input"]').setValue('SELECT 1 AS id');
    await wrapper.get('[data-test-id="sql-submit-button"]').trigger('click');
    await flushPromises();

    await vi.advanceTimersByTimeAsync(1500);
    await flushPromises();

    expect(apiMocks.executeSqlQueryApi).toHaveBeenCalledWith({
      name: 'users',
      query: 'SELECT 1 AS id',
      use_default_db: true,
    });
    expect(apiMocks.getSqlTaskStatusApi).toHaveBeenCalledWith('task-1');
    expect(wrapper.text()).toContain('task-1');
    expect(wrapper.text()).toContain('success');
  });

  it('submits batch sql tasks and refreshes all tasks manually', async () => {
    apiMocks.executeBatchSqlQueryApi.mockResolvedValueOnce({
      results: [
        { task_id: 'task-1', celery_task_id: 'celery-1', status: 'pending', name: 'batch-1' },
        { task_id: 'task-2', celery_task_id: 'celery-2', status: 'pending', name: 'batch-2' },
      ],
      summary: { total: 2, pending: 2 },
    });
    apiMocks.getSqlTaskStatusApi
      .mockResolvedValueOnce({
        celery_task_id: 'celery-1',
        duration: 20,
        error: null,
        name: 'batch-1',
        result: { success: true, data: [{ id: 1 }] },
        status: 'success',
        task_id: 'task-1',
      })
      .mockResolvedValueOnce({
        celery_task_id: 'celery-2',
        duration: 24,
        error: null,
        name: 'batch-2',
        result: { success: true, data: [{ id: 2 }] },
        status: 'success',
        task_id: 'task-2',
      });

    const wrapper = mount(SqlPage);

    await wrapper.get('[data-test-id="sql-name-input"]').setValue('batch');
    await wrapper.get('[data-test-id="sql-query-input"]').setValue('SELECT 1;\n---\nSELECT 2;');
    await wrapper.get('[data-test-id="sql-batch-submit-button"]').trigger('click');
    await flushPromises();

    expect(apiMocks.executeBatchSqlQueryApi).toHaveBeenCalledWith([
      { name: 'batch-1', query: 'SELECT 1;', use_default_db: true },
      { name: 'batch-2', query: 'SELECT 2;', use_default_db: true },
    ]);

    await wrapper.get('[data-test-id="sql-refresh-button"]').trigger('click');
    await flushPromises();

    expect(apiMocks.getSqlTaskStatusApi).toHaveBeenNthCalledWith(1, 'task-1');
    expect(apiMocks.getSqlTaskStatusApi).toHaveBeenNthCalledWith(2, 'task-2');
    expect(wrapper.text()).toContain('batch-1');
    expect(wrapper.text()).toContain('batch-2');
  });

  it('stops polling when stop button is clicked', async () => {
    apiMocks.executeSqlQueryApi.mockResolvedValueOnce({
      celery_task_id: 'celery-1',
      name: 'users',
      status: 'pending',
      task_id: 'task-1',
    });

    const wrapper = mount(SqlPage);

    await wrapper.get('[data-test-id="sql-name-input"]').setValue('users');
    await wrapper.get('[data-test-id="sql-query-input"]').setValue('SELECT 1 AS id');
    await wrapper.get('[data-test-id="sql-submit-button"]').trigger('click');
    await flushPromises();

    await wrapper.get('[data-test-id="sql-stop-button"]').trigger('click');
    await vi.advanceTimersByTimeAsync(1500);
    await flushPromises();

    expect(apiMocks.getSqlTaskStatusApi).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('轮询已停止');
  });
});
