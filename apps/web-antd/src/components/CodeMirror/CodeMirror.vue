<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
} from '@codemirror/autocomplete';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { python } from '@codemirror/lang-python';
import { sql } from '@codemirror/lang-sql'; // ← 新增这一行
import { lintKeymap } from '@codemirror/lint';
import { Compartment, EditorState } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
// eslint-disable-next-line vue/no-dupe-keys
import { EditorView, keymap, placeholder } from '@codemirror/view';
import { basicSetup } from 'codemirror';

interface Props {
  value?: string;
  modelValue?: string;
  language?: 'css' | 'html' | 'javascript' | 'json' | 'python' | 'sql';
  placeholder?: string;
  height?: number | string;
  theme?: 'dark' | 'light';
  disabled?: boolean;
  readonly?: boolean;
  tabSize?: number;
}

const props = withDefaults(defineProps<Props>(), {
  value: '',
  modelValue: '',
  language: 'javascript',
  placeholder: '',
  height: 300,
  theme: 'light',
  disabled: false,
  readonly: false,
  tabSize: 2,
});

const emit = defineEmits<{
  change: [value: string];
  'update:modelValue': [value: string];
  'update:value': [value: string];
}>();

const editorRef = ref<HTMLElement>();
let editorView: EditorView | null = null;
const themeConfig = new Compartment();
const placeholderConfig = new Compartment(); // ← 新增：placeholder Compartment
const currentValue = computed(() => props.value || props.modelValue || '');

// 获取语言扩展
const getLanguageExtension = () => {
  const langMap = {
    javascript,
    python,
    json,
    html,
    css,
    sql,
  };
  return langMap[props.language]?.() || javascript();
};

// 创建主题
const createTheme = () => {
  if (props.theme === 'dark') {
    return oneDark;
  }

  // 自定义浅色主题（类似 VSCode）
  return EditorView.theme(
    {
      '&': {
        backgroundColor: '#ffffff',
        color: '#24292e',
        fontSize: '14px',
        height: '100%',
      },
      '.cm-content': {
        fontFamily:
          "'Fira Code', 'JetBrains Mono', 'Consolas', 'Monaco', monospace",
        caretColor: '#24292e',
        padding: '8px 0',
      },
      '.cm-line': {
        padding: '0 4px',
        lineHeight: '1.6',
      },
      '.cm-activeLine': {
        backgroundColor: '#f6f8fa',
      },
      '.cm-activeLineGutter': {
        backgroundColor: '#f6f8fa',
      },
      '.cm-gutters': {
        backgroundColor: '#fafbfc',
        color: '#6e7781',
        border: 'none',
        borderRight: '1px solid #d0d7de',
      },
      '.cm-lineNumbers': {
        minWidth: '40px',
        paddingRight: '12px',
      },
      '.cm-lineNumbers .cm-gutterElement': {
        padding: '0 8px 0 16px',
        fontSize: '12px',
      },
      '.cm-cursor': {
        borderLeftColor: '#24292e',
        borderLeftWidth: '2px',
      },
      '.cm-selectionBackground, ::selection': {
        backgroundColor: '#b3d4fc !important',
      },
      '&.cm-focused .cm-selectionBackground, &.cm-focused ::selection': {
        backgroundColor: '#b3d4fc !important',
      },
      '.cm-searchMatch': {
        backgroundColor: '#ffd33d',
      },
      '.cm-searchMatch.cm-searchMatch-selected': {
        backgroundColor: '#f2cc60',
      },
      '.cm-tooltip': {
        border: '1px solid #d0d7de',
        backgroundColor: '#ffffff',
        borderRadius: '6px',
        boxShadow: '0 8px 24px rgba(140, 149, 159, 0.2)',
      },
      '.cm-tooltip.cm-tooltip-autocomplete > ul': {
        fontFamily:
          "'Fira Code', 'JetBrains Mono', 'Consolas', 'Monaco', monospace",
      },
    },
    { dark: false },
  );
};

// 初始化编辑器
const initEditor = () => {
  if (!editorRef.value) return;
  const extensions = [
    basicSetup,
    placeholderConfig.of(
      props.placeholder ? placeholder(props.placeholder) : [],
    ),
    getLanguageExtension(),
    themeConfig.of(createTheme()),
    keymap.of([
      indentWithTab,
      ...defaultKeymap,
      ...closeBracketsKeymap,
      ...lintKeymap,
    ]),
    closeBrackets(),
    autocompletion(),
    EditorView.baseTheme({
      '.cm-placeholder': {
        color: props.theme === 'dark' ? '#8b949e' : '#6e7781',
        fontStyle: 'italic',
        opacity: 0.7,
        pointerEvents: 'none',
      },
    }),
    EditorState.tabSize.of(props.tabSize),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const value = update.state.doc.toString();
        emit('update:modelValue', value);
        emit('update:value', value);
        emit('change', value);
      }
    }),
    EditorView.editable.of(!props.disabled && !props.readonly),
    EditorView.lineWrapping,
  ];

  const state = EditorState.create({
    doc: currentValue.value,
    extensions,
  });

  editorView = new EditorView({
    state,
    parent: editorRef.value,
  });

  // 设置高度
  if (editorRef.value) {
    const height =
      typeof props.height === 'number' ? `${props.height}px` : props.height;
    editorRef.value.style.height = height;
  }
};

// 监听值变化
watch(
  () => currentValue.value,
  (newValue) => {
    if (editorView) {
      const editorValue = editorView.state.doc.toString();
      if (newValue !== editorValue) {
        editorView.dispatch({
          changes: {
            from: 0,
            to: editorValue.length,
            insert: newValue || '',
          },
        });
      }
    }
  },
);

// 监听主题变化
watch(
  () => props.theme,
  () => {
    if (editorView) {
      editorView.dispatch({
        effects: themeConfig.reconfigure(createTheme()),
      });
    }
  },
);

// 监听语言变化
watch(
  () => props.language,
  () => {
    if (editorView) {
      editorView.destroy();
      initEditor();
    }
  },
);

// 监听禁用状态
watch(
  () => [props.disabled, props.readonly],
  () => {
    if (editorView) {
      editorView.dispatch({
        effects: EditorView.editable.reconfigure(
          EditorView.editable.of(!props.disabled && !props.readonly),
        ),
      });
    }
  },
);
// 监听 placeholder 变化
watch(
  () => props.placeholder,
  (newPlaceholder) => {
    if (editorView) {
      editorView.dispatch({
        effects: placeholderConfig.reconfigure(
          newPlaceholder ? placeholder(newPlaceholder) : [],
        ),
      });
    }
  },
);
onMounted(() => {
  initEditor();
});

onBeforeUnmount(() => {
  if (editorView) {
    editorView.destroy();
  }
});
</script>

<template>
  <div class="code-editor-container">
    <div ref="editorRef" class="code-editor"></div>
  </div>
</template>

<style scoped lang="less">
.code-editor-container {
  width: 100%;
  height: 100%;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  overflow: hidden;
  transition: border-color 0.2s;

  &:hover {
    border-color: #8c959f;
  }

  &:focus-within {
    border-color: #0969da;
    box-shadow: 0 0 0 3px rgba(9, 105, 218, 0.1);
  }

  .code-editor {
    width: 100%;
    height: 100%;

    :deep(.cm-editor) {
      height: 100%;
      outline: none;
    }

    :deep(.cm-scroller) {
      overflow: auto;
      scrollbar-width: thin;
      scrollbar-color: #d0d7de #f6f8fa;

      &::-webkit-scrollbar {
        width: 10px;
        height: 10px;
      }

      &::-webkit-scrollbar-track {
        background: #f6f8fa;
      }

      &::-webkit-scrollbar-thumb {
        background: #d0d7de;
        border-radius: 5px;

        &:hover {
          background: #8c959f;
        }
      }
    }

    // 语法高亮 - Light Theme
    :deep(.cm-keyword) {
      color: #cf222e;
      font-weight: 600;
    }

    :deep(.cm-string) {
      color: #0a3069;
    }

    :deep(.cm-comment) {
      color: #6e7781;
      font-style: italic;
    }

    :deep(.cm-number) {
      color: #0550ae;
    }

    :deep(.cm-variable) {
      color: #24292e;
    }

    :deep(.cm-variableName) {
      color: #953800;
    }

    :deep(.cm-propertyName) {
      color: #116329;
    }

    :deep(.cm-function) {
      color: #8250df;
    }

    :deep(.cm-operator) {
      color: #cf222e;
    }

    :deep(.cm-bool) {
      color: #0550ae;
      font-weight: 600;
    }

    :deep(.cm-punctuation) {
      color: #24292e;
    }

    :deep(.cm-bracket) {
      color: #24292e;
    }

    :deep(.cm-tag) {
      color: #116329;
    }

    :deep(.cm-attributeName) {
      color: #0550ae;
    }

    :deep(.cm-className) {
      color: #953800;
    }

    :deep(.cm-typeName) {
      color: #953800;
    }
  }
}

// Dark Theme 语法高亮
.code-editor-container:has(.cm-theme-dark) {
  border-color: #30363d;

  &:hover {
    border-color: #484f58;
  }

  &:focus-within {
    border-color: #1f6feb;
  }

  .code-editor {
    :deep(.cm-scroller) {
      scrollbar-color: #484f58 #161b22;

      &::-webkit-scrollbar-track {
        background: #161b22;
      }

      &::-webkit-scrollbar-thumb {
        background: #484f58;

        &:hover {
          background: #6e7681;
        }
      }
    }
  }
}
</style>
