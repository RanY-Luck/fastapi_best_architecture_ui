<script lang="ts" setup>
import ReportStepCard from './report-step-card.vue';

defineProps<{
  expandedKeys: string[];
  steps: Record<string, any>[];
}>();

defineEmits<{
  expandAll: [];
  expandFailures: [];
  toggleStep: [key: string];
}>();
</script>

<template>
  <section class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="text-sm text-slate-500">按执行时间顺序查看步骤细节</div>
      <div class="flex gap-2">
        <button
          class="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700"
          type="button"
          @click="$emit('expandFailures')"
        >
          仅展开失败步骤
        </button>
        <button
          class="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700"
          type="button"
          @click="$emit('expandAll')"
        >
          展开全部
        </button>
      </div>
    </div>

    <div v-if="steps.length === 0" class="rounded-2xl border border-dashed border-slate-300 bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] px-6 py-10 text-center text-sm text-slate-500">
      暂无可展示的步骤明细
    </div>

    <div v-else class="space-y-4">
      <ReportStepCard
        v-for="step in steps"
        :key="String(step.id ?? step.name)"
        :expanded="expandedKeys.includes(String(step.id ?? step.name))"
        :step="step"
        @toggle="$emit('toggleStep', String(step.id ?? step.name))"
      />
    </div>
  </section>
</template>
