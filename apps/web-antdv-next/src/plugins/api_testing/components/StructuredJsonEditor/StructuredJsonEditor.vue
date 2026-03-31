<script setup lang="ts">
import type {
  AuthFormState,
  BodyFormState,
  KeyValueRow,
  JsonEditorMode,
  JsonEditorType,
  SqlQueryRow,
  ValidationRuleRow,
} from '#/plugins/api_testing/views/teststep/json-editor';

import { computed, ref, watch } from 'vue';

import { Button, Input, RadioButton, RadioGroup, Switch, TextArea } from 'antdv-next';

import {
  createEmptyAuthFormState,
  createEmptyBodyFormState,
  createEmptyKeyValueRow,
  createEmptySqlDbConfigRow,
  createEmptySqlQueryRow,
  createEmptyValidationRow,
  parseEditorState,
  stringifyEditorState,
} from '#/plugins/api_testing/views/teststep/json-editor';

interface Props {
  disabled?: boolean;
  editorType: JsonEditorType;
  modelValue?: string;
  placeholder?: string;
  readonly?: boolean;
  value?: string;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
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

const mode = ref<JsonEditorMode>('structured');
const rawText = ref('');
const authForm = ref<AuthFormState>(createEmptyAuthFormState());
const bodyForm = ref<BodyFormState>(createEmptyBodyFormState());
const objectRows = ref<KeyValueRow[]>([createEmptyKeyValueRow()]);
const validationRows = ref<ValidationRuleRow[]>([createEmptyValidationRow()]);
const sqlRows = ref<SqlQueryRow[]>([createEmptySqlQueryRow()]);
const syncing = ref(false);

const currentValue = computed(() => props.value || props.modelValue || '');
const modeOptions = [
  { label: '结构化', value: 'structured' },
  { label: 'JSON', value: 'json' },
];
const authTypeOptions = [
  { label: '无认证', value: 'none' },
  { label: 'Bearer Token', value: 'bearer' },
  { label: 'Basic Auth', value: 'basic' },
  { label: 'API Key', value: 'apiKey' },
];
const bodyModeOptions = [
  { label: 'JSON', value: 'json' },
  { label: 'form-data', value: 'form-data' },
  { label: 'x-www-form-urlencoded', value: 'x-www-form-urlencoded' },
];
const tableMeta = computed(() => {
  switch (props.editorType) {
    case 'headers':
      return { addLabel: '新增请求头', keyLabel: 'Header 名称', valueLabel: 'Header 值' };
    case 'params':
      return { addLabel: '新增参数', keyLabel: '参数名', valueLabel: '参数值' };
    case 'body':
      return { addLabel: '新增 Body 字段', keyLabel: '字段名', valueLabel: '字段值' };
    case 'extract':
      return { addLabel: '新增提取规则', keyLabel: '变量名', valueLabel: '提取表达式' };
    case 'files':
      return { addLabel: '新增文件字段', keyLabel: '字段名', valueLabel: '文件路径' };
    default:
      return { addLabel: '新增字段', keyLabel: '字段名', valueLabel: '值' };
  }
});

function isObjectEditorType(type: JsonEditorType) {
  return ['extract', 'files', 'headers', 'object', 'params'].includes(type);
}

function supportsEnabledFlag(type: JsonEditorType) {
  return ['headers', 'params', 'body', 'files'].includes(type);
}

function ensureObjectRows(rows: KeyValueRow[]) {
  return rows.length > 0 ? rows : [createEmptyKeyValueRow()];
}

function ensureValidationRows(rows: ValidationRuleRow[]) {
  return rows.length > 0 ? rows : [createEmptyValidationRow()];
}

function syncFromValue(value: string) {
  const nextState = parseEditorState(props.editorType, value);
  authForm.value = nextState.authForm;
  bodyForm.value = nextState.bodyForm;
  mode.value = nextState.mode;
  rawText.value = nextState.rawText;
  objectRows.value = nextState.objectRows;
  validationRows.value = nextState.validationRows;
  sqlRows.value = nextState.sqlRows;
}

function emitValue() {
  const nextValue = stringifyEditorState({
    authForm: authForm.value,
    bodyForm: bodyForm.value,
    mode: mode.value,
    objectRows: objectRows.value,
    rawText: rawText.value,
    sqlRows: sqlRows.value,
    type: props.editorType,
    validationRows: validationRows.value,
  });
  emit('update:modelValue', nextValue);
  emit('update:value', nextValue);
  emit('change', nextValue);
}

watch(
  currentValue,
  (value) => {
    syncing.value = true;
    syncFromValue(value);
    syncing.value = false;
  },
  { immediate: true },
);

watch(
  [authForm, bodyForm, mode, rawText, objectRows, validationRows, sqlRows],
  () => {
    if (syncing.value) {
      return;
    }
    emitValue();
  },
  { deep: true },
);

function addObjectRow(target = objectRows.value) {
  target.push(createEmptyKeyValueRow());
}

function removeObjectRow(index: number, target = objectRows.value) {
  target.splice(index, 1);
  const nextRows = ensureObjectRows(target);
  if (target === objectRows.value) {
    objectRows.value = [...nextRows];
  } else if (target.length === 0) {
    target.push(...nextRows);
  }
}

function addValidationRow(target = validationRows.value) {
  target.push(createEmptyValidationRow());
}

function removeValidationRow(index: number, target = validationRows.value) {
  target.splice(index, 1);
  const nextRows = ensureValidationRows(target);
  if (target === validationRows.value) {
    validationRows.value = [...nextRows];
  } else if (target.length === 0) {
    target.push(...nextRows);
  }
}

function addSqlRow() {
  sqlRows.value.push(createEmptySqlQueryRow());
}

function removeSqlRow(index: number) {
  sqlRows.value.splice(index, 1);
  if (sqlRows.value.length === 0) {
    sqlRows.value = [createEmptySqlQueryRow()];
  }
}

function resetSqlDbConfig(index: number) {
  const row = sqlRows.value[index];
  if (!row) {
    return;
  }
  row.dbConfig = createEmptySqlDbConfigRow();
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-3">
      <RadioGroup v-model:value="mode" button-style="solid" size="small">
        <RadioButton v-for="item in modeOptions" :key="item.value" :value="item.value">
          {{ item.label }}
        </RadioButton>
      </RadioGroup>
      <span class="text-xs text-slate-500">结构化模式优先，复杂场景可切回 JSON。</span>
    </div>

    <TextArea
      v-if="mode === 'json'"
      v-model:value="rawText"
      :auto-size="{ minRows: 8, maxRows: 18 }"
      :disabled="disabled"
      :placeholder="placeholder"
      :readonly="readonly"
    />

    <div v-else-if="editorType === 'auth'" class="space-y-4">
      <RadioGroup v-model:value="authForm.type" button-style="solid" size="small">
        <RadioButton v-for="item in authTypeOptions" :key="item.value" :value="item.value">
          {{ item.label }}
        </RadioButton>
      </RadioGroup>

      <div v-if="authForm.type === 'none'" class="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
        当前步骤不附带认证信息。
      </div>

      <div v-else-if="authForm.type === 'bearer'" class="grid gap-3 rounded-lg border border-slate-200 p-4">
        <Input v-model:value="authForm.bearerToken" :disabled="disabled" :readonly="readonly" placeholder="Bearer Token" />
      </div>

      <div v-else-if="authForm.type === 'basic'" class="grid gap-3 rounded-lg border border-slate-200 p-4 md:grid-cols-2">
        <Input v-model:value="authForm.basicUsername" :disabled="disabled" :readonly="readonly" placeholder="用户名" />
        <Input v-model:value="authForm.basicPassword" :disabled="disabled" :readonly="readonly" placeholder="密码" />
      </div>

      <div v-else class="grid gap-3 rounded-lg border border-slate-200 p-4 md:grid-cols-3">
        <Input v-model:value="authForm.apiKeyName" :disabled="disabled" :readonly="readonly" placeholder="Key 名称" />
        <Input v-model:value="authForm.apiKeyValue" :disabled="disabled" :readonly="readonly" placeholder="Key 值" />
        <Input v-model:value="authForm.apiKeyIn" :disabled="disabled" :readonly="readonly" placeholder="位置，如 header/query" />
      </div>
    </div>

    <div v-else-if="editorType === 'body'" class="space-y-3">
      <RadioGroup v-model:value="bodyForm.mode" button-style="solid" size="small">
        <RadioButton v-for="item in bodyModeOptions" :key="item.value" :value="item.value">
          {{ item.label }}
        </RadioButton>
      </RadioGroup>
      <div class="grid grid-cols-[60px_180px_minmax(0,1fr)_80px] gap-3 px-3 text-xs font-medium uppercase tracking-wide text-slate-500">
        <div>启用</div>
        <div>{{ tableMeta.keyLabel }}</div>
        <div>{{ tableMeta.valueLabel }}</div>
        <div>操作</div>
      </div>
      <div
        v-for="(row, index) in bodyForm.rows"
        :key="row.id"
        class="grid gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-[60px_180px_minmax(0,1fr)_80px]"
      >
        <div class="flex items-center justify-center">
          <Switch v-model:checked="row.enabled" :disabled="disabled || readonly" size="small" />
        </div>
        <Input v-model:value="row.key" :disabled="disabled" :readonly="readonly" :placeholder="tableMeta.keyLabel" />
        <Input v-model:value="row.value" :disabled="disabled" :readonly="readonly" :placeholder="tableMeta.valueLabel" />
        <Button :disabled="disabled || readonly" danger @click="removeObjectRow(index, bodyForm.rows)">删除</Button>
      </div>
      <Button :disabled="disabled || readonly" type="dashed" @click="addObjectRow(bodyForm.rows)">{{ tableMeta.addLabel }}</Button>
    </div>

    <div v-else-if="isObjectEditorType(editorType)" class="space-y-3">
      <div
        :class="supportsEnabledFlag(editorType) ? 'grid grid-cols-[60px_180px_minmax(0,1fr)_80px] gap-3 px-3 text-xs font-medium uppercase tracking-wide text-slate-500' : 'grid grid-cols-[180px_minmax(0,1fr)_80px] gap-3 px-3 text-xs font-medium uppercase tracking-wide text-slate-500'"
      >
        <template v-if="supportsEnabledFlag(editorType)"><div>启用</div></template>
        <div>{{ tableMeta.keyLabel }}</div>
        <div>{{ tableMeta.valueLabel }}</div>
        <div>操作</div>
      </div>
      <div
        v-for="(row, index) in objectRows"
        :key="row.id"
        :class="supportsEnabledFlag(editorType) ? 'grid gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-[60px_180px_minmax(0,1fr)_80px]' : 'grid gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-[180px_minmax(0,1fr)_80px]'"
      >
        <template v-if="supportsEnabledFlag(editorType)">
          <div class="flex items-center justify-center">
            <Switch v-model:checked="row.enabled" :disabled="disabled || readonly" size="small" />
          </div>
        </template>
        <Input v-model:value="row.key" :disabled="disabled" :readonly="readonly" :placeholder="tableMeta.keyLabel" />
        <Input v-model:value="row.value" :disabled="disabled" :readonly="readonly" :placeholder="tableMeta.valueLabel" />
        <Button :disabled="disabled || readonly" danger @click="removeObjectRow(index)">删除</Button>
      </div>
      <Button :disabled="disabled || readonly" type="dashed" @click="addObjectRow()">{{ tableMeta.addLabel }}</Button>
    </div>

    <div v-else-if="editorType === 'validation'" class="space-y-3">
      <div
        v-for="(row, index) in validationRows"
        :key="row.id"
        class="space-y-3 rounded-lg border border-slate-200 p-4"
      >
        <div class="grid gap-3 md:grid-cols-2">
          <Input v-model:value="row.source" :disabled="disabled" :readonly="readonly" placeholder="source，如 json/body" />
          <Input v-model:value="row.type" :disabled="disabled" :readonly="readonly" placeholder="type，如 equals/contains" />
        </div>
        <div class="grid gap-3 md:grid-cols-2">
          <Input v-model:value="row.path" :disabled="disabled" :readonly="readonly" placeholder="path，例如 $.data.id" />
          <Input v-model:value="row.expected" :disabled="disabled" :readonly="readonly" placeholder="expected，支持 JSON 字面量" />
        </div>
        <div class="grid gap-3 md:grid-cols-[minmax(0,1fr)_80px]">
          <Input v-model:value="row.message" :disabled="disabled" :readonly="readonly" placeholder="失败提示，可选" />
          <Button :disabled="disabled || readonly" danger @click="removeValidationRow(index)">删除</Button>
        </div>
      </div>
      <Button :disabled="disabled || readonly" type="dashed" @click="addValidationRow()">新增断言</Button>
    </div>

    <div v-else class="space-y-4">
      <article
        v-for="(row, index) in sqlRows"
        :key="row.id"
        class="space-y-4 rounded-xl border border-slate-200 p-4"
      >
        <div class="grid gap-3 md:grid-cols-[minmax(0,1fr)_120px_80px]">
          <Input v-model:value="row.name" :disabled="disabled" :readonly="readonly" placeholder="SQL 名称" />
          <div class="flex items-center gap-2 text-sm text-slate-600">
            <Switch v-model:checked="row.useDefaultDb" :disabled="disabled || readonly" />
            默认库
          </div>
          <Button :disabled="disabled || readonly" danger @click="removeSqlRow(index)">删除</Button>
        </div>

        <TextArea
          v-model:value="row.query"
          :auto-size="{ minRows: 4, maxRows: 10 }"
          :disabled="disabled"
          :readonly="readonly"
          placeholder="SQL 语句"
        />

        <div v-if="!row.useDefaultDb" class="space-y-3 rounded-lg bg-slate-50 p-3">
          <div class="grid gap-3 md:grid-cols-3">
            <Input v-model:value="row.dbConfig.type" :disabled="disabled" :readonly="readonly" placeholder="数据库类型" />
            <Input v-model:value="row.dbConfig.host" :disabled="disabled" :readonly="readonly" placeholder="主机" />
            <Input v-model:value="row.dbConfig.port" :disabled="disabled" :readonly="readonly" placeholder="端口" />
          </div>
          <div class="grid gap-3 md:grid-cols-3">
            <Input v-model:value="row.dbConfig.database" :disabled="disabled" :readonly="readonly" placeholder="数据库名" />
            <Input v-model:value="row.dbConfig.username" :disabled="disabled" :readonly="readonly" placeholder="用户名" />
            <Input v-model:value="row.dbConfig.password" :disabled="disabled" :readonly="readonly" placeholder="密码" />
          </div>
          <Button :disabled="disabled || readonly" type="link" @click="resetSqlDbConfig(index)">清空自定义库配置</Button>
        </div>

        <div class="space-y-3">
          <div class="text-sm font-medium text-slate-700">提取变量</div>
          <div
            v-for="(extractRow, extractIndex) in row.extract"
            :key="extractRow.id"
            class="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)_80px]"
          >
            <Input v-model:value="extractRow.key" :disabled="disabled" :readonly="readonly" placeholder="变量名" />
            <Input v-model:value="extractRow.value" :disabled="disabled" :readonly="readonly" placeholder="提取表达式" />
            <Button :disabled="disabled || readonly" danger @click="removeObjectRow(extractIndex, row.extract)">删除</Button>
          </div>
          <Button :disabled="disabled || readonly" type="dashed" @click="addObjectRow(row.extract)">新增提取</Button>
        </div>

        <div class="space-y-3">
          <div class="text-sm font-medium text-slate-700">SQL 断言</div>
          <div
            v-for="(validationRow, validationIndex) in row.validations"
            :key="validationRow.id"
            class="space-y-3 rounded-lg border border-slate-200 p-3"
          >
            <div class="grid gap-3 md:grid-cols-2">
              <Input v-model:value="validationRow.source" :disabled="disabled" :readonly="readonly" placeholder="source" />
              <Input v-model:value="validationRow.type" :disabled="disabled" :readonly="readonly" placeholder="type" />
            </div>
            <div class="grid gap-3 md:grid-cols-2">
              <Input v-model:value="validationRow.path" :disabled="disabled" :readonly="readonly" placeholder="path" />
              <Input v-model:value="validationRow.expected" :disabled="disabled" :readonly="readonly" placeholder="expected" />
            </div>
            <div class="grid gap-3 md:grid-cols-[minmax(0,1fr)_80px]">
              <Input v-model:value="validationRow.message" :disabled="disabled" :readonly="readonly" placeholder="message" />
              <Button :disabled="disabled || readonly" danger @click="removeValidationRow(validationIndex, row.validations)">删除</Button>
            </div>
          </div>
          <Button :disabled="disabled || readonly" type="dashed" @click="addValidationRow(row.validations)">新增 SQL 断言</Button>
        </div>
      </article>

      <Button :disabled="disabled || readonly" type="dashed" @click="addSqlRow()">新增 SQL</Button>
    </div>
  </div>
</template>
