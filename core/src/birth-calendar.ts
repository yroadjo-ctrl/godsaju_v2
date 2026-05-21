import type { BirthInput } from './types.ts';
import {
  adjustBirthInputToKstWallClock,
  adjustBirthInputToSolarTime,
  DEFAULT_TIMEZONE,
} from './timezone.ts';
import { resolveSolarBirthDateTime } from './lunar-calendar.ts';

/**
 * BirthInput → 사주·자미·네이탈 계산용 양력 시각.
 * 1) 음력/윤달이면 양력 변환  2) KST 벽시계 또는 진태양시 보정
 */
export function getAdjustedBirthDateTime(input: BirthInput): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
} {
  const solar = resolveSolarBirthDateTime(input);
  const base: BirthInput = { ...input, ...solar };

  if (input.timezone != null && input.timezone !== DEFAULT_TIMEZONE) {
    return adjustBirthInputToSolarTime(base);
  }
  return adjustBirthInputToKstWallClock(base);
}
