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
  <div class="space-y-2">
    <div class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
      {{ title }}
    </div>
    <pre class="max-h-48 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">{{ formattedValue }}</pre>
  </div>
</template>
