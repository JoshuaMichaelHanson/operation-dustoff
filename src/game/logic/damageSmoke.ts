export interface DamageSmokeProfile {
  intervalMs: number;
  radius: number;
  color: number;
  alpha: number;
}

const DAMAGED_SMOKE: DamageSmokeProfile = {
  intervalMs: 220,
  radius: 5,
  color: 0x59635b,
  alpha: 0.58,
};

const CRITICAL_SMOKE: DamageSmokeProfile = {
  intervalMs: 110,
  radius: 7,
  color: 0x343a35,
  alpha: 0.78,
};

export function getDamageSmokeProfile(
  health: number,
  maximumHealth: number,
): DamageSmokeProfile | null {
  if (health <= 0 || maximumHealth <= 0) {
    return null;
  }

  const healthRatio = health / maximumHealth;
  if (healthRatio <= 0.25) {
    return CRITICAL_SMOKE;
  }

  if (healthRatio <= 0.5) {
    return DAMAGED_SMOKE;
  }

  return null;
}
