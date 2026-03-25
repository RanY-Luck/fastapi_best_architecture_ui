<script lang="ts" setup>
defineProps<{
  label: string;
  tone?: 'default' | 'error' | 'success' | 'warning';
  value: number | string;
}>();
</script>

<template>
  <div
    class="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
    data-test-id="report-summary-card"
    :data-tone="tone ?? 'default'"
  >
    <div class="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
      {{ label }}
    </div>
    <div class="mt-3 text-2xl font-semibold text-slate-900">
      {{ value }}
    </div>
  </div>
</template>
