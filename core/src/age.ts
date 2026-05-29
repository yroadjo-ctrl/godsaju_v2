/**
 * 만나이(생일 기준) — 표·현재 O운·대운/세운/소운 판정 공통
 */
import { instantToKstParts } from './kst-clock.ts';

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
