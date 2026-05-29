/**
 * 운(運) transit 간지 — 사주원국과 동일(입춘·12節)
 * 표 헤더 연·월은 양력, 간지는 절기 기준
 */
import { HGANJI } from './constants.ts';
import {
  getLunarMonthGanIndex,
  getLunarYearGanIndex,
  getMonthlyJieQiEntries,
  lookupJieForYear,
} from './jieqi-lunar.ts';

const LICHUN_JIE_INDEX = 2;

/** 절입 직후 1분 — 해당 節·입춘 이후 월령·년주 간지 */
function sampleAfterJieRu(dt: Date): { year: number; month: number; day: number; hour: number; min: number } {
  const t = new Date(dt.getTime() + 60_000);
  return {
    year: t.getFullYear(),
    month: t.getMonth() + 1,
    day: t.getDate(),
    hour: t.getHours(),
    min: t.getMinutes(),
  };
}

/** 양력 calYear 칸 — 해당년 입춘(立春) 節入 직후 流年 간지 */
export function getLiuNianGanziForCalendarYear(calYear: number): string {
  const lichun = lookupJieForYear(calYear, LICHUN_JIE_INDEX);
  if (!lichun) {
    return getLiuNianGanziAtDate(calYear, 2, 5, 12, 0);
  }
  const { year, month, day, hour, min } = sampleAfterJieRu(lichun);
  return getLiuNianGanziAtDate(year, month, day, hour, min);
}

/** 특정 시각의 流年 간지 (원국 년주와 동일 규칙) */
export function getLiuNianGanziAtDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  min: number,
): string {
  const idx = getLunarYearGanIndex(year, month, day, hour, min);
  return HGANJI[idx];
}

/** 양력 월 칸 — 그 달 첫 節入(◆) 직후 流月 간지 (원국 월주와 동일) */
export function getLiuYueGanziForCalendarMonth(calYear: number, calMonth: number): string {
  const firstJieRu = getMonthlyJieQiEntries(calYear, calMonth).find((e) => e.isJieRu);
  if (!firstJieRu) {
    return getLiuYueGanziAtDate(calYear, calMonth, 15, 12, 0);
  }
  const dt = lookupJieForYear(calYear, firstJieRu.jieIndex);
  if (!dt) {
    return getLiuYueGanziAtDate(calYear, calMonth, firstJieRu.day, firstJieRu.hour, firstJieRu.minute);
  }
  const { year, month, day, hour, min } = sampleAfterJieRu(dt);
  return getLiuYueGanziAtDate(year, month, day, hour, min);
}

/** 특정 시각의 流月 간지 (원국 월주와 동일 규칙) */
export function getLiuYueGanziAtDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  min: number,
): string {
  const yearIdx = getLunarYearGanIndex(year, month, day, hour, min);
  const monthIdx = getLunarMonthGanIndex(yearIdx, year, month, day, hour, min, HGANJI);
  return HGANJI[monthIdx];
}

/** 입춘 전이면 전년도 칸 기준 (소운·현재 세운) */
export function getEffectiveCalendarYearForLichun(now: Date = new Date()): number {
  const calYear = now.getFullYear();
  const lichun = lookupJieForYear(calYear, 2);
  if (lichun && now < lichun) return calYear - 1;
  return calYear;
}
