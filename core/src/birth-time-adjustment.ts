import type { BirthInput } from './types.ts';
import { resolveSolarBirthDateTime } from './lunar-calendar.ts';
import {
  DEFAULT_TIMEZONE,
  adjustBirthInputToKstWallClock,
  adjustBirthInputToSolarTime,
  getBirthTimezone,
  getLocalSolarTimeCorrectionMinutes,
  resolveLocalDateTimeToUtc,
} from './timezone.ts';

export type BirthTimeAdjustmentMode = 'kst' | 'local-solar';

export interface BirthTimeAdjustmentInfo {
  mode: BirthTimeAdjustmentMode;
  timezone: string;
  /** 양력 변환 후 입력 벽시계 */
  wallClock: { year: number; month: number; day: number; hour: number; minute: number };
  /** 사주 계산에 쓰는 최종 시각 */
  adjusted: { year: number; month: number; day: number; hour: number; minute: number };
  /** 현지 진태양시 모드일 때만 */
  standardMeridianDegrees?: number;
  longitudeCorrectionMinutes?: number;
  equationOfTimeMinutes?: number;
  totalCorrectionMinutes?: number;
}

function isOverseasBirth(input: BirthInput): boolean {
  const tz = input.timezone ?? DEFAULT_TIMEZONE;
  return tz !== DEFAULT_TIMEZONE;
}

/** BirthInput → 사주·자미·네이탈 계산용 양력 시각 (절기·월주 포함 동일 시각) */
export function getAdjustedBirthDateTime(input: BirthInput): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
} {
  const info = getBirthTimeAdjustmentInfo(input);
  return info.adjusted;
}

/** UI용: 시간 보정 모드·분해·적용 시각 */
export function getBirthTimeAdjustmentInfo(input: BirthInput): BirthTimeAdjustmentInfo {
  const solar = resolveSolarBirthDateTime(input);
  const base: BirthInput = { ...input, ...solar };

  const wallClock = {
    year: solar.year,
    month: solar.month,
    day: solar.day,
    hour: solar.hour,
    minute: solar.minute,
  };

  if (isOverseasBirth(input)) {
    const timezone = getBirthTimezone(base);
    const utcDate = resolveLocalDateTimeToUtc(
      wallClock.year, wallClock.month, wallClock.day,
      wallClock.hour, wallClock.minute, timezone,
    );
    const breakdown = getLocalSolarTimeCorrectionMinutes(
      utcDate, timezone, base.longitude,
      wallClock.year, wallClock.month, wallClock.day,
    );
    const adjusted = adjustBirthInputToSolarTime(base);
    return {
      mode: 'local-solar',
      timezone,
      wallClock,
      adjusted,
      standardMeridianDegrees: breakdown.standardMeridianDegrees,
      longitudeCorrectionMinutes: breakdown.longitudeCorrectionMinutes,
      equationOfTimeMinutes: breakdown.equationOfTimeMinutes,
      totalCorrectionMinutes: breakdown.totalCorrectionMinutes,
    };
  }

  const adjusted = adjustBirthInputToKstWallClock(base);
  return {
    mode: 'kst',
    timezone: DEFAULT_TIMEZONE,
    wallClock,
    adjusted,
  };
}

export function formatClockTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function formatSignedMinutes(minutes: number): string {
  const rounded = Math.round(minutes);
  if (rounded === 0) return '0분';
  return `${rounded > 0 ? '+' : ''}${rounded}분`;
}
