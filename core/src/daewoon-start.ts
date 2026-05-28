/**
 * 대운 교운(交運) 시각 — 만 N세 생일 + 나머지 환산
 */
import { formatDaewoonTermLabel } from './jieqi-lunar.ts';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MINUTES_PER_MONTH = 6 * 60; // 6시간 = 1개월
const MINUTES_PER_FATE_DAY = 12; // 12분 = 1일(運)
const CALENDAR_HOURS_PER_REMAINDER_MIN = 2; // 1분 = 2시간

/** 대운수 표기용 반올림 (calculateDaewoonMeta와 동일) */
export function roundDaewoonSuDisplay(daysForSu: number): number {
  const daewoonSu = Math.round((daysForSu / 3) * 10) / 10;
  return Math.round(daewoonSu);
}

/**
 * 대운수용 절기까지 일수
 * 順行: 출생 → 절출 · 逆行: 출생 → 절입
 */
export function calcDaysForDaewoonSu(
  isForward: boolean,
  birth: Date,
  ingi: Date,
  outgi: Date,
  ingiName: number,
  outgiName: number,
): { daysForSu: number; termDate: Date; termLabel: string } {
  if (isForward) {
    const daysForSu = Math.max(0, (outgi.getTime() - birth.getTime()) / MS_PER_DAY);
    return {
      daysForSu,
      termDate: outgi,
      termLabel: formatDaewoonTermLabel(outgiName, 'outgi', outgi),
    };
  }
  const daysForSu = Math.max(0, Math.abs(birth.getTime() - ingi.getTime()) / MS_PER_DAY);
  return {
    daysForSu,
    termDate: ingi,
    termLabel: formatDaewoonTermLabel(ingiName, 'ingi', ingi),
  };
}

/**
 * (절기일수 − N×3) 나머지 → 달력 가산분 (단계별 나누기 3)
 * 6시간=1개월 · 1시간=5일 · 12분=1일 · 1분=2시간
 */
export function decomposeDaewoonRemainderOffset(remainderCalDays: number): {
  months: number;
  days: number;
  hours: number;
} {
  let totalMinutes = Math.max(0, remainderCalDays) * 24 * 60;
  totalMinutes = Math.round(totalMinutes);

  const months = Math.floor(totalMinutes / MINUTES_PER_MONTH);
  totalMinutes -= months * MINUTES_PER_MONTH;

  const hourBlocks = Math.floor(totalMinutes / 60);
  totalMinutes -= hourBlocks * 60;

  const fateDaysFromHours = hourBlocks * 5;
  const fateDaysFrom12Min = Math.floor(totalMinutes / MINUTES_PER_FATE_DAY);
  totalMinutes -= fateDaysFrom12Min * MINUTES_PER_FATE_DAY;

  const hours = totalMinutes * CALENDAR_HOURS_PER_REMAINDER_MIN;

  return {
    months,
    days: fateDaysFromHours + fateDaysFrom12Min,
    hours,
  };
}

/**
 * 나머지 양력일수 → 교운 오프셋 (단계별 환산 후 양력 가산)
 */
export function addDaewoonRemainderOffset(anchor: Date, remainderCalDays: number): Date {
  const { months, days, hours } = decomposeDaewoonRemainderOffset(remainderCalDays);
  const d = new Date(anchor.getTime());
  if (months > 0) d.setMonth(d.getMonth() + months);
  if (days > 0) d.setDate(d.getDate() + days);
  if (hours > 0) d.setTime(d.getTime() + hours * 60 * 60 * 1000);
  return d;
}

/** 1운 ◆시작 = 만 N세 양력 생일 + (절기일수 − N×3) 나머지 */
export function computeFirstDaewoonStartDate(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  birthHour: number,
  birthMinute: number,
  daysForSu: number,
  daewoonSuDisplay: number,
): Date {
  const nthBirthday = new Date(birthYear, birthMonth - 1, birthDay, birthHour, birthMinute);
  nthBirthday.setFullYear(birthYear + daewoonSuDisplay);

  const remainderDays = Math.max(0, daysForSu - daewoonSuDisplay * 3);
  return addDaewoonRemainderOffset(nthBirthday, remainderDays);
}
