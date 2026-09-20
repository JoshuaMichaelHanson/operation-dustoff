export class Health {
  private currentHealth: number;

  constructor(private readonly maximumHealth: number) {
    this.currentHealth = maximumHealth;
  }

  get current(): number {
    return this.currentHealth;
  }

  takeDamage(amount: number): boolean {
    if (this.currentHealth === 0) {
      return false;
    }

    this.currentHealth = Math.max(0, this.currentHealth - Math.max(0, amount));
    return this.currentHealth === 0;
  }

  reset(): void {
    this.currentHealth = this.maximumHealth;
  }
}
