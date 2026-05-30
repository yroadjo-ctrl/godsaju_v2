/**
 * 양력 ↔ 음력 변환 (lunar-javascript)
 */
import { Solar, Lunar, LunarYear } from 'lunar-javascript';
import type { CalendarType } from './types.ts';

export type LunarConversionErrorCode =
  | 'NO_LEAP_YEAR'
  | 'NOT_LEAP_MONTH'
  | 'INVALID_LUNAR_DATE';

export class LunarConversionError extends Error {
  readonly code: LunarConversionErrorCode;

  constructor(code: LunarConversionErrorCode, message: string) {
    super(message);
    this.name = 'LunarConversionError';
    this.code = code;
  }
}

/** 해당 음력 연도의 윤달 월(1~12). 없으면 null */
export function getLunarLeapMonth(lunarYear: number): number | null {
  const leap = LunarYear.fromYear(lunarYear).getLeapMonth();
  return leap > 0 ? leap : null;
}

/** 양력 → 음력 (윤달이면 lunarMonth 음수) */
export function solarToLunar(
  year: number,
  month: number,
  day: number,
): {
  lunarYear: number;
  lunarMonth: number;
  lunarDay: number;
  isLeap: boolean;
} {
  const solar = Solar.fromYmd(year, month, day);
  const lunar = solar.getLunar();
  const rawMonth = lunar.getMonth();
  return {
    lunarYear: lunar.getYear(),
    lunarMonth: Math.abs(rawMonth),
    lunarDay: lunar.getDay(),
    isLeap: rawMonth < 0,
  };
}

/** 음력(·윤달) + 시각 → 양력 */
export function lunarToSolar(
  lunarYear: number,
  lunarMonth: number,
  lunarDay: number,
  isLeap: boolean,
  hour: number,
  minute: number,
): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
} {
  const monthArg = isLeap ? -Math.abs(lunarMonth) : lunarMonth;
  const lunar = Lunar.fromYmdHms(lunarYear, monthArg, lunarDay, hour, minute, 0);
  const solar = lunar.getSolar();
  return {
    year: solar.getYear(),
    month: solar.getMonth(),
    day: solar.getDay(),
    hour: solar.getHour(),
    minute: solar.getMinute(),
  };
}

export function normalizeCalendarType(calendarType?: CalendarType): CalendarType {
  return calendarType ?? 'solar';
}

/** UI·AI 복사용 달력 라벨 (한글) */
export function calendarTypeLabel(calendarType?: CalendarType): string {
  switch (normalizeCalendarType(calendarType)) {
    case 'solar':
      return '양력';
    case 'lunar':
      return '음력';
    case 'lunarLeap':
      return '윤달(음력)';
  }
}

/** 음력 입력 검증 (성공 시 null) */
export function validateLunarCalendarInput(
  calendarType: CalendarType,
  year: number,
  month: number,
  day: number,
): LunarConversionErrorCode | null {
  if (calendarType === 'solar') return null;

  if (calendarType === 'lunarLeap') {
    const leap = getLunarLeapMonth(year);
    if (leap == null) return 'NO_LEAP_YEAR';
    if (month !== leap) return 'NOT_LEAP_MONTH';
  }

  try {
    lunarToSolar(year, month, day, calendarType === 'lunarLeap', 12, 0);
    return null;
  } catch {
    return 'INVALID_LUNAR_DATE';
  }
}

/** BirthInput의 연월일시를 양력 벽시계로 변환 (타임존 보정 전) */
export function resolveSolarBirthDateTime(input: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  unknownTime?: boolean;
  calendarType?: CalendarType;
}): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
} {
  const calendarType = normalizeCalendarType(input.calendarType);
  const hour = input.unknownTime ? 12 : input.hour;
  const minute = input.unknownTime ? 0 : input.minute;

  if (calendarType === 'solar') {
    return {
      year: input.year,
      month: input.month,
      day: input.day,
      hour,
      minute,
    };
  }

  const validation = validateLunarCalendarInput(
    calendarType,
    input.year,
    input.month,
    input.day,
  );
  if (validation === 'NO_LEAP_YEAR') {
    throw new LunarConversionError(
      validation,
      `Lunar year ${input.year} has no leap month`,
    );
  }
  if (validation === 'NOT_LEAP_MONTH') {
    const leap = getLunarLeapMonth(input.year);
    throw new LunarConversionError(
      validation,
      `Leap month must be ${leap} for lunar year ${input.year}`,
    );
  }
  if (validation === 'INVALID_LUNAR_DATE') {
    throw new LunarConversionError(
      validation,
      `Invalid lunar date ${input.year}-${input.month}-${input.day}`,
    );
  }

  return lunarToSolar(
    input.year,
    input.month,
    input.day,
    calendarType === 'lunarLeap',
    hour,
    minute,
  );
}
