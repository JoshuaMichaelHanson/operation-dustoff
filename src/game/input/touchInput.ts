export type DigitalDirection = -1 | 0 | 1;

export interface DigitalStickDirection {
  horizontal: DigitalDirection;
  vertical: DigitalDirection;
}

export interface TouchCapabilities {
  maximumTouchPoints: number;
  coarsePointer: boolean;
  forced: boolean;
}

export class TouchInputState {
  horizontal: DigitalDirection = 0;
  vertical: DigitalDirection = 0;
  cannonDown = false;
  private missileQueued = false;

  setDirection(direction: DigitalStickDirection): void {
    this.horizontal = direction.horizontal;
    this.vertical = direction.vertical;
  }

  queueMissile(): void {
    this.missileQueued = true;
  }

  consumeMissile(): boolean {
    const queued = this.missileQueued;
    this.missileQueued = false;
    return queued;
  }

  reset(): void {
    this.horizontal = 0;
    this.vertical = 0;
    this.cannonDown = false;
    this.missileQueued = false;
  }
}

export function quantizeVirtualStick(
  deltaX: number,
  deltaY: number,
  deadZone: number,
): DigitalStickDirection {
  const distance = Math.hypot(deltaX, deltaY);
  if (distance < deadZone) {
    return { horizontal: 0, vertical: 0 };
  }

  const absoluteX = Math.abs(deltaX);
  const absoluteY = Math.abs(deltaY);
  const diagonalThreshold = 0.42;
  const horizontal =
    absoluteX >= absoluteY * diagonalThreshold
      ? (Math.sign(deltaX) as DigitalDirection)
      : 0;
  const vertical =
    absoluteY >= absoluteX * diagonalThreshold
      ? (Math.sign(deltaY) as DigitalDirection)
      : 0;

  return { horizontal, vertical };
}

export function shouldEnableTouchControls(
  capabilities: TouchCapabilities,
): boolean {
  return (
    capabilities.forced ||
    capabilities.maximumTouchPoints > 0 ||
    capabilities.coarsePointer
  );
}

export function isTouchControlEnabled(): boolean {
  const browser = globalThis as typeof globalThis & {
    location?: { search: string };
    matchMedia?: (query: string) => { matches: boolean };
    navigator?: { maxTouchPoints?: number };
  };
  if (!browser.navigator || !browser.location) {
    return false;
  }

  return shouldEnableTouchControls({
    maximumTouchPoints: browser.navigator.maxTouchPoints ?? 0,
    coarsePointer: browser.matchMedia?.('(pointer: coarse)').matches ?? false,
    forced: /(?:^|[?&])touch(?:=1)?(?:&|$)/.test(browser.location.search),
  });
}
