import { PLAYER, RESCUE_BASE } from '../constants';
import { calculateRescueScore } from '../logic/rescueRules';

export class GameState {
  private rescuedHostages = 0;
  private currentScore = 0;
  private remainingLives: number = PLAYER.startingLives;

  get rescued(): number {
    return this.rescuedHostages;
  }

  get score(): number {
    return this.currentScore;
  }

  get lives(): number {
    return this.remainingLives;
  }

  get isGameOver(): boolean {
    return this.remainingLives === 0;
  }

  recordRescue(hostageCount: number): void {
    this.rescuedHostages += hostageCount;
    this.currentScore += calculateRescueScore(
      hostageCount,
      RESCUE_BASE.scorePerHostage,
    );
  }

  loseLife(): number {
    this.remainingLives = Math.max(0, this.remainingLives - 1);
    return this.remainingLives;
  }
}
