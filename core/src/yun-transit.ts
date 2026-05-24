/**
 * 운(運) transit 간지 — 사주원국과 동일(입춘·12節)
 * 표 헤더 연·월은 양력, 간지는 절기 기준
 */
import { HGANJI } from './constants.ts';
import {
  getLunarMonthGanIndex,
  getLunarYearGanIndex,
  lookupJieForYear,
} from './jieqi-lunar.ts';

const ANCHOR_SAJU_YEAR = 1996;
const ANCHOR_YEAR_GANJI_INDEX = 12;

function pymod(a: number, b: number): number {
  return ((a % b) + b) % b;
}

/** 양력 calYear 칸 — 해당년 입춘(立春)부터 적용되는 流年 간지 */
export function getLiuNianGanziForCalendarYear(calYear: number): string {
  const idx = pymod(ANCHOR_YEAR_GANJI_INDEX + (calYear - ANCHOR_SAJU_YEAR), 60);
  return HGANJI[idx];
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

/** 양력 월 칸 대표 流月 (월 중순 시각 12節 기준, 원국 월주와 동일) */
export function getLiuYueGanziForCalendarMonth(calYear: number, calMonth: number): string {
  return getLiuYueGanziAtDate(calYear, calMonth, 15, 12, 0);
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
