/**
 * 小運 — 대운 전 연운 (1년 1간지)
 *
 * 阳男阴女顺行 · 阴男阳女逆行 (대운과 동일)
 * 起点: 时柱 (시간 모를 때 月柱)
 */
import type { JasiMethod } from './types.ts';
import { HGANJI, YANGGAN } from './constants.ts';
import { getManAge } from './age.ts';
import {
  calcPillarIndices,
  getRelation,
  getJeonggi,
  getTwelveMeteor,
  getTwelveSpirit,
} from './pillars.ts';

export interface SounItem {
  age: number;
  year: number;
  /** 해당 칸 小運 시작 — 출생 월·일·시 (매년 생일) */
  startDate: Date;
  ganzi: string;
  stemSipsin: string;
  branchSipsin: string;
  unseong: string;
  sinsal: string;
  isGongmang: boolean;
}

function pymod(a: number, b: number): number {
  return ((a % b) + b) % b;
}

function getSipsinHanja(dayStem: string, targetStem: string): string {
  const rel = getRelation(dayStem, targetStem);
  return rel?.hanja ?? '?';
}

/** 小運 칸 수 — 1운 startDate 연도 − 출생 연도 (대운 전 매년 1주) */
export function getSounYearCount(birthYear: number, firstDaewoonStart: Date | undefined): number {
  if (!firstDaewoonStart) return 0;
  return Math.max(0, firstDaewoonStart.getFullYear() - birthYear);
}

/** 대운 시작 전까지 매년 1주 */
export function calculateSoun(
  isMale: boolean,
  birthYear: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  sounYearCount: number,
  dayStem: string,
  yearBranch: string,
  gongmangSet: Set<string>,
  jasiMethod?: JasiMethod,
  unknownTime?: boolean,
): SounItem[] {
  const [, sy, sm, , sh] = calcPillarIndices(
    birthYear, month, day, hour, minute, jasiMethod,
  );

  const yearStem = HGANJI[sy][0];
  const isYangGan = YANGGAN.includes(yearStem);
  const isForward = (isMale && isYangGan) || (!isMale && !isYangGan);
  const flow = isForward ? 1 : -1;
  const startIdx = unknownTime ? sm : sh;

  const count = Math.max(0, sounYearCount);
  const items: SounItem[] = [];

  for (let i = 0; i < count; i++) {
    const calendarYear = birthYear + i;
    const startDate = new Date(calendarYear, month - 1, day, hour, minute);
    const idx = pymod(startIdx + flow * i, HGANJI.length);
    const ganzi = HGANJI[idx];
    const stem = ganzi[0];
    const branch = ganzi[1];
    const jeonggi = getJeonggi(branch);

    items.push({
      age: getManAge(birthYear, month, day, startDate),
      year: calendarYear,
      startDate,
      ganzi,
      stemSipsin: getSipsinHanja(dayStem, stem),
      branchSipsin: getSipsinHanja(dayStem, jeonggi),
      unseong: getTwelveMeteor(dayStem, branch),
      sinsal: getTwelveSpirit(yearBranch, branch),
      isGongmang: gongmangSet.has(branch),
    });
  }

  return items;
}
