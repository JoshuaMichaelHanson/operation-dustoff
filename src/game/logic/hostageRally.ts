export interface HorizontalObstacle {
  x: number;
  width: number;
}

export function isGroundPathClear(
  startX: number,
  targetX: number,
  obstacles: readonly HorizontalObstacle[],
  clearance: number,
): boolean {
  const pathLeft = Math.min(startX, targetX);
  const pathRight = Math.max(startX, targetX);

  return obstacles.every((obstacle) => {
    const obstacleLeft = obstacle.x - obstacle.width / 2 - clearance;
    const obstacleRight = obstacle.x + obstacle.width / 2 + clearance;
    return pathRight <= obstacleLeft || pathLeft >= obstacleRight;
  });
}

export function getHostageRallyPositions(
  campX: number,
  hostageCount: number,
  obstacles: readonly HorizontalObstacle[],
  worldWidth: number,
  rallyDistance: number,
  rallySpacing: number,
  clearance = 16,
): number[] {
  const positions: number[] = [];
  const maximumSteps = Math.ceil(worldWidth / rallySpacing);

  for (let index = 0; index < hostageCount; index += 1) {
    const preferredDirection = index % 2 === 0 ? -1 : 1;
    const preferredDistance =
      rallyDistance + Math.floor(index / 2) * rallySpacing;
    const candidateDistances: number[] = [];

    for (let step = 0; step <= maximumSteps; step += 1) {
      const fartherDistance = preferredDistance + step * rallySpacing;
      candidateDistances.push(fartherDistance);

      if (step > 0) {
        const nearerDistance = preferredDistance - step * rallySpacing;
        if (nearerDistance >= rallySpacing) {
          candidateDistances.push(nearerDistance);
        }
      }
    }

    let rallyX = campX;
    let foundPosition = false;
    for (const distance of candidateDistances) {
      for (const direction of [preferredDirection, -preferredDirection]) {
        const candidateX = campX + direction * distance;
        const insideWorld =
          candidateX >= clearance && candidateX <= worldWidth - clearance;
        const hasSpacing = positions.every(
          (position) => Math.abs(position - candidateX) >= rallySpacing,
        );

        if (
          insideWorld &&
          hasSpacing &&
          isGroundPathClear(campX, candidateX, obstacles, clearance)
        ) {
          rallyX = candidateX;
          foundPosition = true;
          break;
        }
      }

      if (foundPosition) {
        break;
      }
    }

    positions.push(rallyX);
  }

  return positions;
}
