export function nearestX(originX: number, positions: readonly number[]): number | null {
  if (positions.length === 0) {
    return null;
  }
  return positions.reduce((nearest, x) =>
    Math.abs(x - originX) < Math.abs(nearest - originX) ? x : nearest,
  );
}

export function formatIntelCue(label: string, originX: number, targetX: number | null): string {
  if (targetX === null) {
    return `${label} —`;
  }
  const direction = targetX < originX - 30 ? '◀' : targetX > originX + 30 ? '▶' : '◆';
  const distance = Math.round(Math.abs(targetX - originX) / 50) * 50;
  return `${label} ${direction} ${distance}m`;
}
