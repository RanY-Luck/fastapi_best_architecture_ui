<script setup lang="ts">
import { computed } from 'vue';

import { TextArea } from 'antdv-next';

interface Props {
  disabled?: boolean;
  height?: number | string;
  modelValue?: string;
  placeholder?: string;
  readonly?: boolean;
  value?: string;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  height: 300,
  modelValue: '',
  placeholder: '',
  readonly: false,
  value: '',
});

const emit = defineEmits<{
  change: [value: string];
  'update:modelValue': [value: string];
  'update:value': [value: string];
}>();

const currentValue = computed(() => props.value || props.modelValue || '');
const textareaStyle = computed(() => ({
  minHeight: typeof props.height === 'number' ? `${props.height}px` : props.height,
}));

function onUpdate(value?: number | string) {
  const nextValue = typeof value === 'string' ? value : String(value ?? '');
  emit('update:modelValue', nextValue);
  emit('update:value', nextValue);
  emit('change', nextValue);
}
</script>

<template>
  <TextArea
    :value="currentValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :auto-size="false"
    :style="textareaStyle"
    @update:value="onUpdate"
  />
</template>
