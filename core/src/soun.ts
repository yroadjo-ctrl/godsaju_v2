/**
 * 小運 — 대운 전 연운 (1년 1간지)
 *
 * 阳男阴女顺行 · 阴男阳女逆行 (대운과 동일)
 * 起点: 时柱 (시간 모를 때 月柱)
 */
import type { JasiMethod } from './types.ts';
import { HGANJI, YANGGAN } from './constants.ts';
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

/** 대운 시작 만나이 전까지 매년 1주 */
export function calculateSoun(
  isMale: boolean,
  birthYear: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  firstDaewoonAge: number,
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

  const count = Math.max(0, firstDaewoonAge);
  const items: SounItem[] = [];

  for (let age = 0; age < count; age++) {
    const idx = pymod(startIdx + flow * age, HGANJI.length);
    const ganzi = HGANJI[idx];
    const stem = ganzi[0];
    const branch = ganzi[1];
    const jeonggi = getJeonggi(branch);

    items.push({
      age,
      year: birthYear + age,
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
