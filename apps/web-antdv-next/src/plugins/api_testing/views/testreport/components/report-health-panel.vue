<script lang="ts" setup>
const props = defineProps<{
  failSteps: number;
  successRate: number;
  successSteps: number;
  totalSteps: number;
}>();

const failureRate = props.totalSteps
  ? Math.max(0, 100 - props.successRate)
  : 0;
</script>

<template>
  <div
    class="rounded-2xl border border-slate-200 bg-slate-950 px-5 py-4 text-slate-50 shadow-sm"
    data-test-id="report-health-panel"
  >
    <div class="flex items-center justify-between gap-3">
      <div>
        <div class="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
          执行健康
        </div>
        <div class="mt-2 text-lg font-semibold">
          {{ successSteps }}/{{ totalSteps }} 步通过
        </div>
      </div>
      <div class="text-right text-sm text-slate-300">
        <div>失败步骤 {{ failSteps }}</div>
        <div>失败占比 {{ failureRate }}%</div>
      </div>
    </div>
    <div class="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
      <div
        class="h-full rounded-full bg-emerald-400"
        :style="{ width: `${successRate}%` }"
      />
    </div>
  </div>
</template>
