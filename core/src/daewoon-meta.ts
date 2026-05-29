import type { JasiMethod } from './types.ts';
import { HGANJI, YANGGAN } from './constants.ts';
import { calcSolarTerms, calcPillarIndices } from './pillars.ts';
import { calcDaysForDaewoonSu } from './daewoon-start.ts';

/** 년간 음양 + 성별 → 順逆行 구분 (陽男·陰女·陰男·陽女) */
export type DaewoonYinYangGenderLabel = '陽男' | '陰女' | '陰男' | '陽女';

export function formatDaewoonYinYangGenderLabel(
  isMale: boolean,
  isYangYearStem: boolean,
): DaewoonYinYangGenderLabel {
  if (isYangYearStem && isMale) return '陽男';
  if (!isYangYearStem && !isMale) return '陰女';
  if (!isYangYearStem && isMale) return '陰男';
  return '陽女';
}

export interface DaewoonMeta {
  /** 대운수 (첫 대운 시작 만나이, 소수) — 3일=1년 */
  daewoonSu: number;
  /** 통상 표기용 (소수 첫째 자리 올림) */
  daewoonSuDisplay: number;
  isForward: boolean;
  direction: '順行' | '逆行';
  directionKor: string;
  /** 陽男·陰女·陰男·陽女 */
  yinYangGenderLabel: DaewoonYinYangGenderLabel;
  /** 출생일부터 절기까지 일수 */
  daysToTerm: number;
  termDate: Date;
  termLabel: string;
  firstGanzi: string;
  firstStartDate: Date;
  /** 월주 간지 (대운수 병기, 예: 戊申) */
  monthGanzi: string;
}

/** 대운수·順逆行 — 3日=1年 */
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
  const yinYangGenderLabel = formatDaewoonYinYangGenderLabel(isMale, isYangGan);
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
    yinYangGenderLabel,
    daysToTerm,
    termDate,
    termLabel,
    firstGanzi: firstDaewoon?.ganzi ?? '',
    firstStartDate,
    monthGanzi,
  };
}
