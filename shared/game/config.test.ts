import { describe, expect, it } from 'vitest';
import { InvalidGameConfigError, validateGameConfig } from './config';
import { DAILY_CONFIGS } from './configs';

describe('daily game configuration', () => {
  it('validates all seven bundled configurations', () => {
    expect(DAILY_CONFIGS).toHaveLength(7);
    for (const config of DAILY_CONFIGS) expect(validateGameConfig(config)).toBe(config);
    expect(new Set(DAILY_CONFIGS.map((config) => config.engine))).toEqual(
      new Set([
        'defense-v1',
        'dodge-v1',
        'tap-v1',
        'classify-v1',
        'timing-v1',
        'sequence-v1',
        'sort-v1',
      ]),
    );
  });

  it('rejects executable or remote configuration fields', () => {
    expect(() => validateGameConfig({ ...DAILY_CONFIGS[0], script: 'alert(1)' })).toThrow(
      InvalidGameConfigError,
    );
    expect(() =>
      validateGameConfig({ ...DAILY_CONFIGS[0], summary: 'Visit https://example.com' }),
    ).toThrow('safe plain text');
  });

  it('rejects tokens outside the allowlist', () => {
    expect(() => validateGameConfig({ ...DAILY_CONFIGS[0], poster: 'remote-sprite' })).toThrow(
      'allowlisted',
    );
  });

  it('rejects unsafe values for each engine-specific schema', () => {
    expect(() => validateGameConfig({ ...DAILY_CONFIGS[1], targetToken: 'remote-target' })).toThrow(
      'allowlisted',
    );
    expect(() => validateGameConfig({ ...DAILY_CONFIGS[2], targetsSeconds: [7] })).toThrow(
      '2 to 5 rounds',
    );
    const sort = DAILY_CONFIGS[3];
    if (!sort || sort.engine !== 'sort-v1') throw new Error('Expected a sort configuration.');
    expect(() =>
      validateGameConfig({
        ...sort,
        items: [{ token: 'sock', correctSide: 'cloud' }, ...sort.items],
      }),
    ).toThrow('allowlisted');
  });
});
