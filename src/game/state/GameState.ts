import { MISSION, PLAYER, RESCUE_BASE } from '../constants';
import { calculateRescueScore } from '../logic/rescueRules';

export class GameState {
  private rescuedHostages = 0;
  private currentScore: number;
  private remainingLives: number;
  private bossDefeated = false;

  constructor(
    private readonly target: number = MISSION.rescueTarget,
    initial?: { score?: number; lives?: number },
    private readonly requiresBoss = false,
  ) {
    this.currentScore = Math.max(0, initial?.score ?? 0);
    this.remainingLives = Math.max(
      1,
      Math.min(PLAYER.startingLives, initial?.lives ?? PLAYER.startingLives),
    );
  }

  get rescued(): number {
    return this.rescuedHostages;
  }

  get score(): number {
    return this.currentScore;
  }

  get lives(): number {
    return this.remainingLives;
  }

  get rescueTarget(): number {
    return this.target;
  }

  get isVictory(): boolean {
    return this.rescuedHostages >= this.target &&
      (!this.requiresBoss || this.bossDefeated);
  }

  get isBossDefeated(): boolean {
    return this.bossDefeated;
  }

  defeatBoss(): void {
    this.bossDefeated = true;
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

  awardScore(points: number): void {
    this.currentScore += points;
  }

  loseLife(): number {
    this.remainingLives = Math.max(0, this.remainingLives - 1);
    return this.remainingLives;
  }
}
