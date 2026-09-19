import { RESCUE_BASE } from '../constants';
import { calculateRescueScore } from '../logic/rescueRules';

export class GameState {
  private rescuedHostages = 0;
  private currentScore = 0;

  get rescued(): number {
    return this.rescuedHostages;
  }

  get score(): number {
    return this.currentScore;
  }

  recordRescue(hostageCount: number): void {
    this.rescuedHostages += hostageCount;
    this.currentScore += calculateRescueScore(
      hostageCount,
      RESCUE_BASE.scorePerHostage,
    );
  }
}
