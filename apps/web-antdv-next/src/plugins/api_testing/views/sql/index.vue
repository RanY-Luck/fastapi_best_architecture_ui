<script lang="ts" setup>
import type {
  SqlExecutionRequest,
  SqlTaskStatusResponse,
  SqlTaskSubmitResponse,
} from '#/plugins/api_testing/api/types';

import { computed, onBeforeUnmount, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  executeBatchSqlQueryApi,
  executeSqlQueryApi,
  getSqlTaskStatusApi,
} from '#/plugins/api_testing/api/sql';

const POLL_INTERVAL_MS = 1500;
const BATCH_SEPARATOR = '\n---\n';

const name = ref('');
const query = ref('');
const submitting = ref(false);
const pollError = ref('');
const pollStopped = ref(false);
const pollingActive = ref(false);
const tasks = ref<SqlTaskStatusResponse[]>([]);

let timer: null | ReturnType<typeof setInterval> = null;

const primaryTask = computed(() => tasks.value[0] ?? null);
const hasPendingTasks = computed(() =>
  tasks.value.some((task) => task.status === 'pending' || task.status === 'running'),
);
const isPolling = computed(() => pollingActive.value && hasPendingTasks.value);
const prettyResult = computed(() => {
  if (!primaryTask.value?.result) {
    return '';
  }
  return JSON.stringify(primaryTask.value.result, null, 2);
});
const prettyError = computed(() => primaryTask.value?.error || pollError.value);

function stopPolling(markStopped = true) {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  pollingActive.value = false;
  if (markStopped) {
    pollStopped.value = true;
  }
}


async function refreshTaskStatus() {
  if (tasks.value.length === 0) {
    return;
  }

  try {
    const nextTasks = await Promise.all(
      tasks.value.map(async (task) => {
        if (task.status === 'success' || task.status === 'failed') {
          return task;
        }
        return getSqlTaskStatusApi(task.task_id);
      }),
    );
    tasks.value = nextTasks;
    if (!nextTasks.some((task) => task.status === 'pending' || task.status === 'running')) {
      stopPolling(false);
    }
  } catch (error) {
    stopPolling(false);
    pollError.value = error instanceof Error ? error.message : 'SQL任务状态查询失败';
  }
}

function startPolling() {
  stopPolling(false);
  pollStopped.value = false;
  pollingActive.value = true;
  timer = setInterval(() => {
    void refreshTaskStatus();
  }, POLL_INTERVAL_MS);
}

function buildBatchRequests(trimmedName: string, trimmedQuery: string): SqlExecutionRequest[] {
  return trimmedQuery
    .split(BATCH_SEPARATOR)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item, index) => ({
      name: `${trimmedName}-${index + 1}`,
      query: item,
      use_default_db: true,
    }));
}

function applySubmitResult(result: SqlTaskSubmitResponse | SqlTaskSubmitResponse[]) {
  tasks.value = Array.isArray(result)
    ? result.map((task) => ({ ...task }))
    : [{ ...result }];
  startPolling();
}

async function handleSubmit() {
  if (submitting.value) {
    return;
  }

  const trimmedName = name.value.trim();
  const trimmedQuery = query.value.trim();
  if (!trimmedName || !trimmedQuery) {
    pollError.value = '请填写任务名称和 SQL 语句';
    return;
  }

  submitting.value = true;
  pollError.value = '';

  try {
    const submitResult = await executeSqlQueryApi({
      name: trimmedName,
      query: trimmedQuery,
      use_default_db: true,
    });
    applySubmitResult(submitResult);
  } catch (error) {
    pollError.value = error instanceof Error ? error.message : 'SQL任务提交失败';
  } finally {
    submitting.value = false;
  }
}

async function handleBatchSubmit() {
  if (submitting.value) {
    return;
  }

  const trimmedName = name.value.trim();
  const trimmedQuery = query.value.trim();
  if (!trimmedName || !trimmedQuery) {
    pollError.value = '请填写任务名称和 SQL 语句';
    return;
  }

  const batchRequests = buildBatchRequests(trimmedName, trimmedQuery);
  if (batchRequests.length === 0) {
    pollError.value = '没有可提交的 SQL 语句';
    return;
  }

  submitting.value = true;
  pollError.value = '';

  try {
    const submitResult = await executeBatchSqlQueryApi(batchRequests);
    applySubmitResult(submitResult.results);
  } catch (error) {
    pollError.value = error instanceof Error ? error.message : '批量SQL任务提交失败';
  } finally {
    submitting.value = false;
  }
}

async function handleManualRefresh() {
  pollStopped.value = false;
  await refreshTaskStatus();
}

function handleStopPolling() {
  stopPolling(true);
}

onBeforeUnmount(() => {
  stopPolling(false);
});
</script>

<template>
  <Page auto-content-height>
    <div class="space-y-6" data-test-id="sql-page">
      <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="mb-4">
          <h1 class="text-2xl font-semibold text-slate-900">异步 SQL 执行</h1>
          <p class="mt-2 text-sm text-slate-500">
            提交 SQL 到后台异步执行，页面只负责轮询状态，不阻塞当前操作。
          </p>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <label class="block text-sm font-medium text-slate-700">
            任务名称
            <input
              v-model="name"
              data-test-id="sql-name-input"
              class="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500"
              placeholder="例如：查询用户数"
              type="text"
            />
          </label>
          <div class="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            使用 `---` 分隔多段 SQL，可一次提交多条后台任务。
          </div>
        </div>

        <label class="mt-4 block text-sm font-medium text-slate-700">
          SQL 语句
          <textarea
            v-model="query"
            data-test-id="sql-query-input"
            class="mt-2 min-h-[220px] w-full rounded-xl border border-slate-300 px-3 py-3 font-mono text-sm outline-none transition focus:border-sky-500"
            placeholder="SELECT * FROM users LIMIT 10;\n---\nSELECT COUNT(*) FROM users;"
          />
        </label>

        <div class="mt-4 flex flex-wrap items-center gap-3">
          <button
            :disabled="submitting"
            class="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            data-test-id="sql-submit-button"
            type="button"
            @click="handleSubmit"
          >
            {{ submitting ? '提交中...' : '提交异步任务' }}
          </button>
          <button
            :disabled="submitting"
            class="rounded-lg border border-sky-300 px-4 py-2 text-sm font-medium text-sky-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
            data-test-id="sql-batch-submit-button"
            type="button"
            @click="handleBatchSubmit"
          >
            批量 SQL 提交
          </button>
          <button
            :disabled="tasks.length === 0"
            class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
            data-test-id="sql-refresh-button"
            type="button"
            @click="handleManualRefresh"
          >
            手动刷新
          </button>
          <button
            :disabled="!isPolling"
            class="rounded-lg border border-amber-300 px-4 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:text-slate-400"
            data-test-id="sql-stop-button"
            type="button"
            @click="handleStopPolling"
          >
            停止轮询
          </button>
          <span v-if="isPolling" class="text-sm text-amber-600">任务执行中，正在轮询状态...</span>
          <span v-else-if="pollStopped" class="text-sm text-slate-500">轮询已停止</span>
          <span v-else-if="primaryTask?.status === 'success'" class="text-sm text-emerald-600">任务执行成功</span>
          <span v-else-if="primaryTask?.status === 'failed'" class="text-sm text-rose-600">任务执行失败</span>
        </div>

        <p v-if="pollError" class="mt-3 text-sm text-rose-600">{{ pollError }}</p>
      </section>

      <section v-if="tasks.length > 0" class="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]" data-test-id="sql-task-panel">
        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 class="text-base font-semibold text-slate-900">任务列表</h2>
          <div class="mt-4 space-y-3">
            <article
              v-for="item in tasks"
              :key="item.task_id"
              class="rounded-xl border border-slate-200 px-4 py-3"
            >
              <div class="flex items-center justify-between gap-3">
                <div>
                  <h3 class="text-sm font-medium text-slate-900">{{ item.name }}</h3>
                  <p class="mt-1 break-all text-xs text-slate-500">{{ item.task_id }}</p>
                </div>
                <span class="text-xs font-medium uppercase text-slate-700">{{ item.status }}</span>
              </div>
              <p class="mt-2 text-xs text-slate-500">耗时：{{ item.duration ?? '-' }}</p>
            </article>
          </div>
        </div>

        <div class="space-y-6">
          <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 class="text-base font-semibold text-slate-900">执行结果</h2>
            <pre
              v-if="prettyResult"
              class="mt-4 max-h-[420px] overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100"
            >{{ prettyResult }}</pre>
            <p v-else class="mt-4 text-sm text-slate-500">结果还未返回，或当前任务没有结果数据。</p>
          </div>

          <div v-if="prettyError" class="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
            <h2 class="text-base font-semibold text-rose-700">错误信息</h2>
            <pre class="mt-4 whitespace-pre-wrap break-all text-sm text-rose-700">{{ prettyError }}</pre>
          </div>
        </div>
      </section>
    </div>
  </Page>
</template>


