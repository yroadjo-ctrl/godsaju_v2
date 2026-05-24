import type { JasiMethod } from './types.ts';
import { HGANJI, YANGGAN } from './constants.ts';
import { calcSolarTerms, calcPillarIndices } from './pillars.ts';
import { formatDaewoonTermLabel } from './jieqi-lunar.ts';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
export const MS_PER_SAJU_YEAR = 365.242196 * MS_PER_DAY;

export interface DaewoonMeta {
  /** 대운수 (첫 대운 시작 만나이, 소수) — 3일=1년 */
  daewoonSu: number;
  /** 통상 표기용 (소수 첫째 자리 올림) */
  daewoonSuDisplay: number;
  isForward: boolean;
  direction: '順行' | '逆行';
  directionKor: string;
  /** 출생일부터 절기까지 일수 */
  daysToTerm: number;
  termDate: Date;
  termLabel: string;
  firstGanzi: string;
  firstStartDate: Date;
  /** 월주 간지 (대운수 병기, 예: 戊申) */
  monthGanzi: string;
}

export function daewoonAgeFromBirth(birth: Date, start: Date): number {
  const years = (start.getTime() - birth.getTime()) / MS_PER_SAJU_YEAR;
  return Math.max(0, Math.round(years));
}

/**
 * 대운수용 절기까지 일수 — getDaewoon과 동일 기준.
 * 順行: 출생 → 다음 節(절출) · 逆行: 출생 → 이전 節(절입)
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

/** 대운수·順逆行 — 3日=1年 (calcDaysForDaewoonSu와 getDaewoon 공통) */
export function calculateDaewoonMeta(
  isMale: boolean,
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  jasiMethod?: JasiMethod,
  firstDaewoon?: { ganzi: string; startDate: Date },
): DaewoonMeta {
  const [, sy, sm] = calcPillarIndices(year, month, day, hour, minute, jasiMethod);
  const monthGanzi = HGANJI[sm];

  const yearStem = HGANJI[sy][0];
  const isYangGan = YANGGAN.includes(yearStem);
  const isForward = (isMale && isYangGan) || (!isMale && !isYangGan);

  const terms = calcSolarTerms(year, month, day, hour, minute);
  const birth = new Date(year, month - 1, day, hour, minute);
  const ingi = new Date(
    terms.ingiYear, terms.ingiMonth - 1, terms.ingiDay, terms.ingiHour, terms.ingiMin,
  );
  const outgi = new Date(
    terms.outgiYear, terms.outgiMonth - 1, terms.outgiDay, terms.outgiHour, terms.outgiMin,
  );

  const { daysForSu, termDate, termLabel } = calcDaysForDaewoonSu(
    isForward, birth, ingi, outgi, terms.ingiName, terms.outgiName,
  );

  const daysToTerm = Math.round(daysForSu * 10) / 10;
  const daewoonSu = Math.round((daysForSu / 3) * 10) / 10;
  const daewoonSuDisplay = Math.round(daewoonSu);

  const firstStartDate = firstDaewoon?.startDate ?? birth;

  return {
    daewoonSu,
    daewoonSuDisplay,
    isForward,
    direction: isForward ? '順行' : '逆行',
    directionKor: isForward ? '순행' : '역행',
    daysToTerm,
    termDate,
    termLabel,
    firstGanzi: firstDaewoon?.ganzi ?? '',
    firstStartDate,
    monthGanzi,
  };
}
