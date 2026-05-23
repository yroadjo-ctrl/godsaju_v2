import type { BirthInput, JasiMethod } from './types.ts';
import { HGANJI } from './constants.ts';
import { getAdjustedBirthDateTime } from './birth-time-adjustment.ts';
import { calcPillarIndices, calcMonthBoundaryTerms, toHangul } from './pillars.ts';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** 24절기 중 12節(짝수 인덱스) — 월 전환 기준 */
const JIE_HANJA = [
  '小寒', '立春', '惊蛰', '清明', '立夏', '芒种',
  '小暑', '立秋', '白露', '寒露', '立冬', '大雪',
] as const;

const JIE_KOR = [
  '소한', '입춘', '경칩', '청명', '입하', '망종',
  '소서', '입추', '백로', '한로', '입동', '대설',
] as const;

export interface MonthPillarBasis {
  monthGanzi: string;
  monthGanziKor: string;
  monthBranch: string;
  monthBranchKor: string;
  /** 예: 申月 */
  monthLabel: string;
  boundaryTermHanja: string;
  boundaryTermKor: string;
  boundaryYear: number;
  boundaryMonth: number;
  boundaryDay: number;
  boundaryHour: number;
  boundaryMinute: number;
  nextTermHanja: string;
  nextTermKor: string;
  nextBoundaryYear: number;
  nextBoundaryMonth: number;
  nextBoundaryDay: number;
  nextBoundaryHour: number;
  nextBoundaryMinute: number;
  /** 출생(적용 시각) − 절입, 일 단위 (소수 첫째) */
  daysFromBoundary: number;
  /** UI·복사용 상대 시각 문구 */
  relativeToBoundary: string;
  appliedYear: number;
  appliedMonth: number;
  appliedDay: number;
  appliedHour: number;
  appliedMinute: number;
}

function termNameFromIngiName(ingiName: number): { hanja: string; kor: string } {
  const idx = ((Math.floor(ingiName / 2) % 12) + 12) % 12;
  return { hanja: JIE_HANJA[idx], kor: JIE_KOR[idx] };
}

function formatRelativeToBoundary(msDiff: number): { days: number; label: string } {
  const days = msDiff / MS_PER_DAY;
  const rounded = Math.round(days * 10) / 10;

  if (Math.abs(msDiff) < MS_PER_DAY) {
    const totalMin = Math.round(Math.abs(msDiff) / 60000);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    const rel = msDiff >= 0 ? '절기 이후' : '절기 이전';
    if (h > 0) {
      return { days: rounded, label: `${rel} ${h}시간 ${m}분` };
    }
    return { days: rounded, label: `${rel} ${m}분` };
  }

  const rel = rounded >= 0 ? '절기 이후' : '절기 이전';
  return { days: rounded, label: `${rel} ${Math.abs(rounded)}일` };
}

/** 사주 계산 적용 시각 기준 월주·절기 근거 */
export function calculateMonthPillarBasis(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  jasiMethod?: JasiMethod,
): MonthPillarBasis {
  const [, , sm] = calcPillarIndices(year, month, day, hour, minute, jasiMethod);
  const monthGanzi = HGANJI[sm];
  const monthBranch = monthGanzi[1];
  const monthGanziKor = toHangul(monthGanzi[0]) + toHangul(monthGanzi[1]);
  const monthBranchKor = toHangul(monthBranch);

  const terms = calcMonthBoundaryTerms(year, month, day, hour, minute, monthBranch);
  const boundary = termNameFromIngiName(terms.ingiName);
  const nextBoundary = termNameFromIngiName(terms.outgiName);

  const birth = new Date(year, month - 1, day, hour, minute);
  const ingi = new Date(
    terms.ingiYear, terms.ingiMonth - 1, terms.ingiDay, terms.ingiHour, terms.ingiMin,
  );
  const { days: daysFromBoundary, label: relativeToBoundary } = formatRelativeToBoundary(
    birth.getTime() - ingi.getTime(),
  );

  return {
    monthGanzi,
    monthGanziKor,
    monthBranch,
    monthBranchKor,
    monthLabel: `${monthBranch}月`,
    boundaryTermHanja: boundary.hanja,
    boundaryTermKor: boundary.kor,
    boundaryYear: terms.ingiYear,
    boundaryMonth: terms.ingiMonth,
    boundaryDay: terms.ingiDay,
    boundaryHour: terms.ingiHour,
    boundaryMinute: terms.ingiMin,
    nextTermHanja: nextBoundary.hanja,
    nextTermKor: nextBoundary.kor,
    nextBoundaryYear: terms.outgiYear,
    nextBoundaryMonth: terms.outgiMonth,
    nextBoundaryDay: terms.outgiDay,
    nextBoundaryHour: terms.outgiHour,
    nextBoundaryMinute: terms.outgiMin,
    daysFromBoundary,
    relativeToBoundary,
    appliedYear: year,
    appliedMonth: month,
    appliedDay: day,
    appliedHour: hour,
    appliedMinute: minute,
  };
}

export function calculateMonthPillarBasisFromInput(input: BirthInput): MonthPillarBasis {
  const { year, month, day, hour, minute } = getAdjustedBirthDateTime(input);
  return calculateMonthPillarBasis(year, month, day, hour, minute, input.jasiMethod);
}

export function formatMonthPillarBasisDateTime(
  y: number, m: number, d: number, h: number, min: number,
): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${y}-${pad(m)}-${pad(d)} ${pad(h)}:${pad(min)}`;
}
