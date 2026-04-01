<script lang="ts" setup>
import type { TestCaseStreamEvent } from '#/plugins/api_testing/api/types';

import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page, VbenButton } from '@vben/common-ui';

import { executeTestCaseStreamApi } from '#/plugins/api_testing/api/testcase';
import ReportCodeBlock from '#/plugins/api_testing/views/testreport/components/report-code-block.vue';

import {
  buildExecutionSummary,
  formatExecutionEvent,
} from './stream.helpers';

defineOptions({
  name: 'ApiTestingExecutionStream',
});

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const errorMessage = ref('');
const events = ref<TestCaseStreamEvent[]>([]);
const expandedEventIndexes = ref<number[]>([]);
const timelineRef = ref<HTMLElement | null>(null);
const abortController = new AbortController();
let isActive = true;

const summary = computed(() => buildExecutionSummary(events.value));
const finalRunEvent = computed(() => {
  return [...events.value]
    .reverse()
    .find((event) => event.type === 'run_end');
});
const statusText = computed(() => {
  if (errorMessage.value) {
    return '执行失败';
  }

  if (loading.value) {
    return '执行中';
  }

  if (finalRunEvent.value?.success === false) {
    return '执行失败';
  }

  if (finalRunEvent.value) {
    return '已完成';
  }

  if (events.value.length > 0) {
    return '已连接';
  }

  return '等待执行';
});

function isHighlightedEvent(event: TestCaseStreamEvent) {
  return event.type === 'error' || event.success === false;
}

async function scrollLatestEventIntoView() {
  await nextTick();
  const latestEvent = timelineRef.value?.querySelector<HTMLElement>(
    '[data-test-id="execution-event-card"]:last-child',
  );
  latestEvent?.scrollIntoView({ block: 'nearest' });
}

function appendEvent(event: TestCaseStreamEvent) {
  events.value = [...events.value, event];
  void scrollLatestEventIntoView();
}

function isRawEventExpanded(index: number) {
  return expandedEventIndexes.value.includes(index);
}

function toggleRawEvent(index: number) {
  expandedEventIndexes.value = isRawEventExpanded(index)
    ? expandedEventIndexes.value.filter((item) => item !== index)
    : [...expandedEventIndexes.value, index];
}

async function loadStream() {
  const caseId = Number(route.query.case_id);
  const environmentId = route.query.environment_id
    ? Number(route.query.environment_id)
    : undefined;

  if (!caseId) {
    errorMessage.value = '缺少测试用例ID';
    return;
  }

  loading.value = true;
  errorMessage.value = '';
  events.value = [];
  expandedEventIndexes.value = [];

  try {
    const streamedEvents = await executeTestCaseStreamApi(
      caseId,
      environmentId,
      (event) => {
        if (!isActive) {
          return;
        }

        appendEvent(event);
      },
      abortController.signal,
    );

    if (isActive && events.value.length === 0) {
      events.value = streamedEvents;
      void scrollLatestEventIntoView();
    }
  } catch (error) {
    if (abortController.signal.aborted || !isActive) {
      return;
    }

    errorMessage.value = error instanceof Error ? error.message : '执行失败';
  } finally {
    if (isActive) {
      loading.value = false;
    }
  }
}

function goToReport() {
  if (!summary.value.reportId) {
    return;
  }

  router.push({
    name: 'ApiTestingTestReportDetail',
    params: { id: summary.value.reportId },
  });
}

onMounted(() => {
  loadStream();
});

onUnmounted(() => {
  isActive = false;
  abortController.abort();
});
</script>

<template>
  <Page auto-content-height>
    <div class="space-y-4">
      <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div class="space-y-1">
            <h1 class="text-xl font-semibold text-slate-900">运行日志</h1>
            <p class="text-sm text-slate-500">
              状态：{{ statusText }} · 总步骤：{{ summary.totalSteps }} · 成功：
              {{ summary.successSteps }} · 失败：{{ summary.failSteps }}
            </p>
            <p
              v-if="loading && summary.currentStepName"
              class="text-sm text-slate-500"
            >
              当前步骤：{{ summary.currentStepName }}
            </p>
            <p v-if="errorMessage" class="text-sm text-rose-500">
              {{ errorMessage }}
            </p>
          </div>
          <VbenButton
            v-if="summary.reportId"
            type="primary"
            @click="goToReport"
          >
            查看报告
          </VbenButton>
        </div>
      </section>

      <section class="space-y-3">
        <div ref="timelineRef" class="space-y-3">
        <article
          v-for="(event, index) in events"
          :key="`${event.type}-${index}`"
          data-test-id="execution-event-card"
          :class="[
            'rounded-2xl border p-4',
            isHighlightedEvent(event)
              ? 'border-rose-200 bg-rose-50'
              : 'border-slate-200 bg-slate-50',
          ]"
        >
          <div class="flex items-center justify-between gap-3">
            <div class="space-y-1">
              <strong class="font-medium text-slate-900">
                {{ formatExecutionEvent(event).title }}
              </strong>
              <p
                v-if="formatExecutionEvent(event).description"
                class="text-sm text-slate-500"
              >
                {{ formatExecutionEvent(event).description }}
              </p>
            </div>
            <span v-if="event.step_name" class="text-sm text-slate-500">
              {{ event.step_name }}
            </span>
          </div>
          <p v-if="event.message" class="mt-2 whitespace-pre-wrap text-sm text-slate-600">
            {{ event.message }}
          </p>
          <div class="mt-3 space-y-3">
            <button
              class="text-sm font-medium text-sky-700 transition hover:text-sky-900"
              data-test-id="toggle-raw-event"
              type="button"
              @click="toggleRawEvent(index)"
            >
              {{ isRawEventExpanded(index) ? '收起原始事件' : '查看原始事件' }}
            </button>

            <ReportCodeBlock
              v-if="isRawEventExpanded(index)"
              title="原始事件"
              :value="event"
            />
          </div>
        </article>
        </div>

        <div
          v-if="!events.length && !loading && !errorMessage"
          class="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500"
        >
          暂无执行事件
        </div>
      </section>
    </div>
  </Page>
</template>
