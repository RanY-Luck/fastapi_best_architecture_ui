import { describe, expect, it } from 'vitest';

describe('test step json editor helpers', () => {
  it('loads json editor helpers for structured request editing', async () => {
    let moduleValue: null | typeof import('../json-editor') = null;
    let loadError: unknown;

    try {
      moduleValue = await import('../json-editor');
    } catch (error) {
      loadError = error;
    }

    expect(loadError).toBeUndefined();
    expect(moduleValue).not.toBeNull();
    expect(typeof moduleValue?.parseEditorState).toBe('function');
    expect(typeof moduleValue?.stringifyEditorState).toBe('function');
  });

  it('parses legacy header json into structured rows and stringifies to explicit items', async () => {
    const { parseEditorState, stringifyEditorState } = await import('../json-editor');
    const state = parseEditorState('headers', '{"Authorization":"Bearer token","page":1}');

    expect(state.mode).toBe('structured');
    expect(state.objectRows[0]?.key).toBe('Authorization');

    const nextValue = stringifyEditorState({
      authForm: state.authForm,
      bodyForm: state.bodyForm,
      mode: state.mode,
      objectRows: state.objectRows,
      rawText: state.rawText,
      sqlRows: state.sqlRows,
      type: 'headers',
      validationRows: state.validationRows,
    });

    expect(JSON.parse(nextValue)).toEqual([
      { enabled: true, key: 'Authorization', value: 'Bearer token' },
      { enabled: true, key: 'page', value: 1 },
    ]);
  });

  it('serializes structured body data with official mode and items fields', async () => {
    const { parseEditorState, stringifyEditorState } = await import('../json-editor');
    const state = parseEditorState('body', '{"keyword":"demo"}');
    state.bodyForm.mode = 'form-data';

    const nextValue = stringifyEditorState({
      authForm: state.authForm,
      bodyForm: state.bodyForm,
      mode: state.mode,
      objectRows: state.objectRows,
      rawText: state.rawText,
      sqlRows: state.sqlRows,
      type: 'body',
      validationRows: state.validationRows,
    });

    expect(JSON.parse(nextValue)).toEqual({
      items: [{ enabled: true, key: 'keyword', value: 'demo' }],
      mode: 'form-data',
    });
  });
});
