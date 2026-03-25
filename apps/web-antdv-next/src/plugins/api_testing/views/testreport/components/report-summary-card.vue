<script lang="ts" setup>
defineProps<{
  label: string;
  tone?: 'default' | 'error' | 'success' | 'warning';
  value: number | string;
}>();
</script>

<template>
  <div
    class="rounded-2xl border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 py-4 shadow-sm shadow-slate-200/70"
    data-test-id="report-summary-card"
    :data-tone="tone ?? 'default'"
  >
    <div class="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
      {{ label }}
    </div>
    <div
      class="mt-3 text-2xl font-semibold"
      :class="{
        'text-emerald-700': tone === 'success',
        'text-rose-700': tone === 'error',
        'text-amber-700': tone === 'warning',
        'text-slate-900': !tone || tone === 'default',
      }"
    >
      {{ value }}
    </div>
  </div>
</template>
