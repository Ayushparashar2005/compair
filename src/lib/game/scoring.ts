export const calculateScore = (
  basePoints: number,
  streakCount: number,
  isCorrect: boolean,
  timeRemainingMs: number = 0
): { pointsAwarded: number; newStreak: number; multiplier: number } => {
  if (!isCorrect) {
    return { pointsAwarded: 0, newStreak: 0, multiplier: 1.0 };
  }

  let multiplier = 1.0;
  if (streakCount >= 10) {
    multiplier = 2.0;
  } else if (streakCount >= 5) {
    multiplier = 1.5;
  } else if (streakCount >= 3) {
    multiplier = 1.2;
  }

  // Speed Bonus (answered within 3 seconds of 10s timer)
  if (timeRemainingMs > 7000) {
    multiplier += 0.5;
  } else if (timeRemainingMs > 5000) {
    multiplier += 0.2; // Minor speed bonus
  }

  const newStreak = streakCount + 1;
  const pointsAwarded = Math.round(basePoints * multiplier);

  return { pointsAwarded, newStreak, multiplier };
};
