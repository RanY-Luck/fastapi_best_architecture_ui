import { describe, expect, it } from 'vitest';

import { parseEditorState, stringifyEditorState } from '../json-editor';

describe('test step json editor helpers', () => {
  it('parses legacy header json into structured rows and stringifies to explicit items', () => {
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

  it('keeps disabled header rows as explicit payload fields', () => {
    const state = parseEditorState('headers', '{"Authorization":"Bearer token","page":1}');
    state.objectRows[0]!.enabled = false;

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
      { enabled: false, key: 'Authorization', value: 'Bearer token' },
      { enabled: true, key: 'page', value: 1 },
    ]);
  });

  it('parses auth json into a bearer form and stringifies back', () => {
    const state = parseEditorState('auth', '{"type":"Bearer","token":"demo-token"}');

    expect(state.mode).toBe('structured');
    expect(state.authForm.type).toBe('bearer');
    expect(state.authForm.bearerToken).toBe('demo-token');

    const nextValue = stringifyEditorState({
      authForm: state.authForm,
      bodyForm: state.bodyForm,
      mode: state.mode,
      objectRows: state.objectRows,
      rawText: state.rawText,
      sqlRows: state.sqlRows,
      type: 'auth',
      validationRows: state.validationRows,
    });

    expect(JSON.parse(nextValue)).toEqual({ type: 'Bearer', token: 'demo-token' });
  });

  it('serializes structured body data with official mode and items fields', () => {
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

  it('parses new structured body payloads into rows', () => {
    const state = parseEditorState(
      'body',
      '{"mode":"x-www-form-urlencoded","items":[{"enabled":false,"key":"a","value":1},{"enabled":true,"key":"b","value":"2"}]}',
    );

    expect(state.mode).toBe('structured');
    expect(state.bodyForm.mode).toBe('x-www-form-urlencoded');
    expect(state.bodyForm.rows[0]).toMatchObject({ enabled: false, key: 'a', value: '1' });
    expect(state.bodyForm.rows[1]).toMatchObject({ enabled: true, key: 'b', value: '2' });
  });

  it('parses validation arrays into structured rows', () => {
    const state = parseEditorState(
      'validation',
      '[{"source":"json","type":"equals","path":"$.count","expected":2}]',
    );

    expect(state.mode).toBe('structured');
    expect(state.validationRows[0]?.path).toBe('$.count');

    const nextValue = stringifyEditorState({
      authForm: state.authForm,
      bodyForm: state.bodyForm,
      mode: state.mode,
      objectRows: state.objectRows,
      rawText: state.rawText,
      sqlRows: state.sqlRows,
      type: 'validation',
      validationRows: state.validationRows,
    });

    expect(JSON.parse(nextValue)).toEqual([
      { source: 'json', type: 'equals', path: '$.count', expected: 2 },
    ]);
  });

  it('keeps unsupported object payloads in raw json mode', () => {
    const state = parseEditorState('headers', '[1,2,3]');

    expect(state.mode).toBe('json');
    expect(state.rawText).toBe('[1,2,3]');
  });
});
