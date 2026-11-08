import { describe, expect, it } from 'vitest';
import { parsePlate } from '../src/lib/parse';

const code = (input: string, c: string) => [input, { kind: 'code', code: c, raw: input }] as const;

describe('parsePlate: code formats', () => {
  it.each([
    code('83', '83'),
    code('83A', '83'),
    code('83a1', '83'),
    code('83A12345', '83'),
    code('83A-123.45', '83'),
    code('51G 123.45', '51'),
    code('29-LD 012.34', '29'),
    code('  83  ', '83'),
    code('83-', '83'),
    code('8 3', '83'),
    code('8.3A', '83'),
    code('123', '12'),
    code('29lD01234', '29'),
    code('51F-888.88', '51'),
    code('30A_12345', '30'),
    code('９９', '99'), // full-width digits are normalised
    code('83\t', '83'),
    code('83\n', '83'),
  ])('%j', (input, expected) => {
    expect(parsePlate(input)).toEqual(expected);
  });
});

describe('parsePlate: letters first', () => {
  it.each(['NG', 'ng 01-02', 'NN', 'QT 123', 'AB 12', 'TK-3456', 'Đ1', 'ａｂ'])('%j', (input) => {
    expect(parsePlate(input)).toEqual({ kind: 'letters', raw: input });
  });
});

describe('parsePlate: empty', () => {
  it.each(['', ' ', '  \t\n', '-', '. - .', '___'])('%j', (input) => {
    expect(parsePlate(input)).toEqual({ kind: 'empty', raw: input });
  });
});

describe('parsePlate: invalid', () => {
  it.each(['8', '8A', '!!', '😀', '😀83', '@83', '8x3', '1', '(83)', '٨٣'])('%j', (input) => {
    expect(parsePlate(input)).toEqual({ kind: 'invalid', raw: input });
  });
});
