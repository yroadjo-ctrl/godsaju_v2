/**
 * KST(+9:00) 벽시계 ↔ UTC 순간 변환
 * 절기·운(입춘·節入·현재 O운) 비교는 접속 PC 로컬 TZ와 무관하게 동일하게 유지
 */
export const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export interface KstWallClock {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second?: number;
}

/** UTC 순간 → KST 벽시계 연·월·일·시·분 */
export function instantToKstParts(instant: Date | number): KstWallClock {
  const ms = typeof instant === 'number' ? instant : instant.getTime();
  const d = new Date(ms + KST_OFFSET_MS);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    second: d.getUTCSeconds(),
  };
}

/** KST 벽시계 → UTC 순간(ms) */
export function kstWallClockToInstant(parts: KstWallClock): number {
  const { year, month, day, hour, minute, second = 0 } = parts;
  return Date.UTC(year, month - 1, day, hour, minute, second) - KST_OFFSET_MS;
}

/** KST 벽시계 → Date(비교용 UTC 순간) */
export function kstWallClockToDate(parts: KstWallClock): Date {
  return new Date(kstWallClockToInstant(parts));
}

/** 운·절기용 “지금” 순간 (기본값) */
export function getYunNow(instant: Date = new Date()): Date {
  return instant;
}

/** 일운 구간 끝 — KST 양력 기준 오늘 + 1개월 − 1일 */
export function kstAddOneMonthMinusOneDay(
  parts: Pick<KstWallClock, 'year' | 'month' | 'day'>,
): Pick<KstWallClock, 'year' | 'month' | 'day'> {
  let year = parts.year;
  let month = parts.month + 1;
  if (month > 12) {
    month = 1;
    year += 1;
  }
  let day = parts.day - 1;
  if (day < 1) {
    month = parts.month;
    year = parts.year;
    day = new Date(Date.UTC(year, month, 0)).getUTCDate();
  }
  return { year, month, day };
}
