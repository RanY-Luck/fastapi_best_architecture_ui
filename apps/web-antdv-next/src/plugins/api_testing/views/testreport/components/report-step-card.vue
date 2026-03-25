<script lang="ts" setup>
import { computed } from 'vue';

import { formatDuration } from '../detail.helpers';

import ReportCodeBlock from './report-code-block.vue';

const props = defineProps<{
  expanded: boolean;
  step: Record<string, any>;
}>();

defineEmits<{
  toggle: [];
}>();

const stepKey = computed(() => String(props.step.id ?? props.step.name ?? 'step'));
const requestSummary = computed(() => {
  const method = props.step.request_data?.method ?? 'N/A';
  const url = props.step.request_data?.url ?? props.step.url ?? '';
  return [method, url].filter(Boolean).join(' ');
});
</script>

<template>
  <div
    class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    :data-state="step.success ? 'success' : 'error'"
    :data-test-id="`step-card-${stepKey}`"
  >
    <button
      class="flex w-full items-start justify-between gap-4 text-left"
      type="button"
      :data-test-id="`step-header-${stepKey}`"
      @click="$emit('toggle')"
    >
      <div class="space-y-2">
        <div class="flex items-center gap-2">
          <span class="text-sm font-semibold text-slate-900">{{ step.name }}</span>
          <span class="rounded-full px-2 py-0.5 text-xs font-medium" :class="step.success ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'">
            {{ step.success ? '成功' : '失败' }}
          </span>
        </div>
        <div class="text-sm text-slate-500">
          {{ requestSummary }}
        </div>
      </div>
      <div class="space-y-2 text-right text-xs text-slate-500">
        <div>{{ formatDuration(step.duration ?? 0) }}</div>
        <div v-if="step.response?.status_code">HTTP {{ step.response.status_code }}</div>
      </div>
    </button>

    <div
      v-if="expanded"
      class="mt-4 space-y-4 border-t border-slate-100 pt-4"
      :data-test-id="`step-body-${stepKey}`"
    >
      <div
        v-if="step.error_message"
        class="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
        :data-test-id="`step-error-${stepKey}`"
      >
        {{ step.error_message }}
      </div>

      <div class="grid gap-3 md:grid-cols-2">
        <div class="rounded-xl border border-slate-200 px-3 py-3 text-sm">
          <div class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
            概览
          </div>
          <div class="mt-2 space-y-1 text-slate-700">
            <div>步骤状态：{{ step.success ? '成功' : '失败' }}</div>
            <div>执行耗时：{{ formatDuration(step.duration ?? 0) }}</div>
            <div v-if="requestSummary">请求摘要：{{ requestSummary }}</div>
          </div>
        </div>

        <div
          v-if="Array.isArray(step.assertions) && step.assertions.length > 0"
          class="rounded-xl border border-slate-200 px-3 py-3 text-sm"
        >
          <div class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
            断言
          </div>
          <div class="mt-2 space-y-2">
            <div
              v-for="(assertion, index) in step.assertions"
              :key="index"
              class="flex items-center gap-2 text-slate-700"
            >
              <span class="rounded-full px-2 py-0.5 text-xs font-medium" :class="assertion.success ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'">
                {{ assertion.success ? '通过' : '失败' }}
              </span>
              <span>{{ assertion.description || '断言检查' }}</span>
            </div>
          </div>
        </div>
      </div>

      <ReportCodeBlock
        v-if="step.request_data"
        title="请求数据"
        :value="step.request_data"
      />

      <ReportCodeBlock
        v-if="step.response?.headers"
        title="响应头"
        :value="step.response.headers"
      />

      <ReportCodeBlock
        v-if="step.response?.json || step.response?.text"
        title="响应数据"
        :value="step.response?.json ?? step.response?.text"
      />
    </div>
  </div>
</template>
