export type FuelEvent = 'none' | 'refueled' | 'empty';

export class FuelTank {
  private remaining: number;

  constructor(
    readonly capacityMs: number,
    private readonly returnSpeed = 200,
    private readonly returnBufferMs = 6_000,
  ) {
    this.remaining = capacityMs;
  }

  get remainingMs(): number {
    return this.remaining;
  }

  get secondsRemaining(): number {
    return Math.ceil(this.remaining / 1_000);
  }

  get ratio(): number {
    return this.remaining / this.capacityMs;
  }

  get isCritical(): boolean {
    return this.remaining <= 8_000;
  }

  update(deltaMs: number, airborne: boolean, atBase: boolean): FuelEvent {
    if (atBase) {
      if (this.remaining === this.capacityMs) return 'none';
      this.refill();
      return 'refueled';
    }
    if (!airborne || this.remaining === 0) return 'none';
    this.remaining = Math.max(0, this.remaining - Math.max(0, deltaMs));
    return this.remaining === 0 ? 'empty' : 'none';
  }

  refill(): void {
    this.remaining = this.capacityMs;
  }

  shouldReturn(distanceToBase: number): boolean {
    const estimatedReturnMs = Math.max(0, distanceToBase) /
      this.returnSpeed * 1_000 + this.returnBufferMs;
    return this.remaining <= estimatedReturnMs;
  }
}
