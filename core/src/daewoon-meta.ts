import type { JasiMethod } from './types.ts';
import { HGANJI, YANGGAN } from './constants.ts';
import { calcSolarTerms, calcPillarIndices, toHangul } from './pillars.ts';

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
  /** 월주 한글 (대운수 병기, 예: 무신) */
  monthGanziKor: string;
}

export function daewoonAgeFromBirth(birth: Date, start: Date): number {
  const years = (start.getTime() - birth.getTime()) / MS_PER_SAJU_YEAR;
  return Math.max(0, Math.round(years));
}

function formatTermDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${h}:${min}`;
}

/** 대운수·順逆行 — 순행: 절입→출생 일수÷3, 역행: 출생→절출(근접 시 절입) */
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
  const monthGanziKor = toHangul(monthGanzi[0]) + toHangul(monthGanzi[1]);

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

  let daysForSu: number;
  let termDate: Date;
  let termLabel: string;

  if (isForward) {
    // 순행(陽男 등): 당월 절입부터 출생까지 — 포스텔러·전통 표기와 동일
    daysForSu = (birth.getTime() - ingi.getTime()) / MS_PER_DAY;
    if (daysForSu < 0) {
      daysForSu = (outgi.getTime() - birth.getTime()) / MS_PER_DAY;
      termDate = outgi;
      termLabel = `節出(절출) ${formatTermDate(outgi)}`;
    } else {
      termDate = ingi;
      termLabel = `節入(절입) ${formatTermDate(ingi)}`;
    }
  } else {
    // 역행: 출생 이후 절출까지; 절출 직후 출생이면 절입까지 역산
    daysForSu = (birth.getTime() - outgi.getTime()) / MS_PER_DAY;
    if (daysForSu < 1) {
      daysForSu = (birth.getTime() - ingi.getTime()) / MS_PER_DAY;
      termDate = ingi;
      termLabel = `節入(절입) ${formatTermDate(ingi)}`;
    } else {
      termDate = outgi;
      termLabel = `節出(절출) ${formatTermDate(outgi)}`;
    }
  }

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
    monthGanziKor,
  };
}
