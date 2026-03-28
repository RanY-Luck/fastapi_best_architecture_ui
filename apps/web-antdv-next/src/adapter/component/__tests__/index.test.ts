import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

describe('adapter component imports', () => {
  it('avoids antdv-next deep dist imports that break vite optimized deps', () => {
    const source = readFileSync(
      path.resolve(import.meta.dirname, '../index.ts'),
      'utf8',
    );

    expect(source).not.toContain(`import('antdv-next/dist/`);
  });
});
