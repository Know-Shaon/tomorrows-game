const DAY_MILLISECONDS = 86_400_000;
const CHALLENGE_EPOCH_UTC = Date.UTC(2026, 0, 1);

export interface DailyInfo {
  challengeNumber: number;
  millisecondsRemaining: number;
  nextGameAt: Date;
}

export function getDailyInfo(now: Date): DailyInfo {
  const localDayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const challengeNumber = Math.max(
    1,
    Math.floor((localDayUtc - CHALLENGE_EPOCH_UTC) / DAY_MILLISECONDS) + 1,
  );
  const nextGameAt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);

  return {
    challengeNumber,
    millisecondsRemaining: Math.max(0, nextGameAt.getTime() - now.getTime()),
    nextGameAt,
  };
}

export function formatCountdown(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1_000));
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((part) => part.toString().padStart(2, '0')).join(':');
}
