export class PassengerManifest {
  private passengerCount = 0;

  constructor(private readonly capacity: number) {}

  get count(): number {
    return this.passengerCount;
  }

  tryBoard(): boolean {
    if (this.passengerCount >= this.capacity) {
      return false;
    }

    this.passengerCount += 1;
    return true;
  }

  unloadOne(): boolean {
    if (this.passengerCount === 0) {
      return false;
    }

    this.passengerCount -= 1;
    return true;
  }
}
