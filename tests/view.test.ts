import { describe, expect, it } from 'vitest';
import { getViewState, plateText, stateKey } from '../src/lib/view';

describe('getViewState', () => {
  it.each(['', ' ', '-', '8', ' 8 ', '８', '8.'])('%j is a neutral hint, never an error', (i) => {
    expect(getViewState(i)).toEqual({ kind: 'hint' });
  });

  it.each(['!', '😀', '8A', '8x3', '@83', '(83)', '٨٣'])('%j is invalid', (i) => {
    expect(getViewState(i)).toEqual({ kind: 'invalid' });
  });

  it.each(['NG', 'qt 12', 'AB-1'])('%j is letters-first', (i) => {
    expect(getViewState(i)).toEqual({ kind: 'letters' });
  });

  it('known province code', () => {
    const s = getViewState('83a-123.45');
    expect(s.kind).toBe('result');
    expect(s.kind === 'result' && s.result).toMatchObject({ kind: 'province', code: '83' });
  });

  it('special code 80', () => {
    const s = getViewState('80');
    expect(s.kind === 'result' && s.result.kind).toBe('special');
  });

  it.each(['13', '42', '87'])('unknown code %s is an informational result, not invalid', (c) => {
    const s = getViewState(c);
    expect(s.kind === 'result' && s.result.kind).toBe('unknown');
  });
});

describe('stateKey', () => {
  it('is stable while typing more of the same plate', () => {
    expect(stateKey(getViewState('83'))).toBe(stateKey(getViewState('83A-123')));
  });
  it('differs across codes and kinds', () => {
    expect(stateKey(getViewState('83'))).not.toBe(stateKey(getViewState('84')));
    expect(stateKey(getViewState('NG'))).toBe('letters');
    expect(stateKey(getViewState(''))).toBe('hint');
    expect(stateKey(getViewState('!'))).toBe('invalid');
  });
});

describe('plateText', () => {
  it('normalises, strips unsafe characters and caps length', () => {
    expect(plateText('  83a-123.45 ')).toBe('83A-123.45');
    expect(plateText('８３  a')).toBe('83 A');
    expect(plateText('😀<script>')).toBe('SCRIPT');
    expect(plateText('1234567890123456')).toBe('123456789012');
    expect(plateText('!!!')).toBe('');
  });
});
