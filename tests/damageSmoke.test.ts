import { describe, expect, it } from 'vitest';

import { getDamageSmokeProfile } from '../src/game/logic/damageSmoke';

describe('helicopter damage smoke', () => {
  it('does not smoke above half health', () => {
    expect(getDamageSmokeProfile(51, 100)).toBeNull();
  });

  it('starts visible smoke at half health', () => {
    const profile = getDamageSmokeProfile(50, 100);

    expect(profile).not.toBeNull();
    expect(profile?.intervalMs).toBe(220);
  });

  it('uses darker, more frequent smoke at critical health', () => {
    const damaged = getDamageSmokeProfile(50, 100);
    const critical = getDamageSmokeProfile(25, 100);

    expect(critical).not.toBeNull();
    expect(critical?.intervalMs).toBeLessThan(damaged?.intervalMs ?? 0);
    expect(critical?.alpha).toBeGreaterThan(damaged?.alpha ?? 1);
    expect(critical?.color).not.toBe(damaged?.color);
  });

  it('stops smoke after destruction', () => {
    expect(getDamageSmokeProfile(0, 100)).toBeNull();
  });
});
