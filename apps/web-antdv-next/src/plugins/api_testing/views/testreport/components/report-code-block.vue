<script lang="ts" setup>
import { computed } from 'vue';

const props = defineProps<{
  title: string;
  value: unknown;
}>();

const formattedValue = computed(() => {
  if (typeof props.value === 'string') {
    return props.value;
  }
  return JSON.stringify(props.value, null, 2);
});
</script>

<template>
  <div class="space-y-2" data-test-id="report-code-block">
    <div class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
      {{ title }}
    </div>
    <pre class="max-h-72 overflow-auto rounded-xl border border-slate-800 bg-slate-950/95 p-3 text-xs text-slate-100 shadow-inner">{{ formattedValue }}</pre>
  </div>
</template>
