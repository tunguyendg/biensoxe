import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const token = process.env.ACCESSTRADE_TOKEN?.trim();

describe('data/ never holds secrets', () => {
  for (const f of readdirSync('data', { recursive: true, encoding: 'utf8' }).filter((n) => /\.(json|md)$/.test(n))) {
    it(f, () => {
      const text = readFileSync(join('data', f), 'utf8');
      expect(text).not.toMatch(/Authorization/i);
      if (token) expect(text).not.toContain(token);
    });
  }
  it('.env is git-ignored and an example exists', () => {
    expect(readFileSync('.gitignore', 'utf8')).toMatch(/^\.env$/m);
    expect(readFileSync('.env.example', 'utf8')).toMatch(/^ACCESSTRADE_TOKEN=$/m);
  });
});
