/**
 * 만나이(생일 기준) — 표·현재 O운·대운/세운/소운 판정 공통
 */
import { instantToKstParts, kstWallClockToDate } from './kst-clock.ts';

/** 기준일 시점 만나이 (생일 전이면 -1) — refDate는 UTC 순간, 기준일은 KST 벽시계 */
export function getManAge(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  refDate: Date,
): number {
  const ref = instantToKstParts(refDate);
  let age = ref.year - birthYear;
  const refMonth = ref.month;
  const refDay = ref.day;
  if (refMonth < birthMonth || (refMonth === birthMonth && refDay < birthDay)) {
    age--;
  }
  return Math.max(0, age);
}

/** 세운 칸 — 해당 양력년 12/31 기준 만나이 (소운·대운은 생일 startDate 기준) */
export function getManAgeInCalendarYear(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  calendarYear: number,
): number {
  return getManAge(
    birthYear,
    birthMonth,
    birthDay,
    kstWallClockToDate({ year: calendarYear, month: 12, day: 31, hour: 0, minute: 0 }),
  );
}
