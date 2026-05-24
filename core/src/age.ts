/**
 * 만나이(생일 기준) — 표·현재 O운·대운/세운/소운 판정 공통
 */

/** 기준일 시점 만나이 (생일 전이면 -1) */
export function getManAge(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  refDate: Date,
): number {
  let age = refDate.getFullYear() - birthYear;
  const refMonth = refDate.getMonth() + 1;
  const refDay = refDate.getDate();
  if (refMonth < birthMonth || (refMonth === birthMonth && refDay < birthDay)) {
    age--;
  }
  return Math.max(0, age);
}

/** 대운·세운·소운 칸 — 해당 양력년 12/31 기준 만나이 */
export function getManAgeInCalendarYear(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  calendarYear: number,
): number {
  return getManAge(birthYear, birthMonth, birthDay, new Date(calendarYear, 11, 31));
}
