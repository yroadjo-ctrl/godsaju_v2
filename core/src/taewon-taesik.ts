/**
 * 胎元 · 胎息
 *
 * 관례 (통용):
 * - 胎元: 月干進一 · 月支進三
 * - 胎息: 日干進一 · 日支進一
 */
import { SKY, EARTH, HGANJI } from './constants.ts';
import { getRelation, getJeonggi } from './pillars.ts';
import { formatNayeon } from './nayeon.ts';

export interface TaewonTaesikPillar {
  ganzi: string;
  stem: string;
  branch: string;
  stemSipsin: string;
  branchSipsin: string;
  nayeon: string;
}

export interface TaewonTaesikStats {
  taewon: TaewonTaesikPillar;
  taesik: TaewonTaesikPillar;
  methodNote: string;
}

function pymod(a: number, b: number): number {
  return ((a % b) + b) % b;
}

function advanceStem(stem: string, steps: number): string {
  const idx = SKY.indexOf(stem);
  if (idx < 0) return stem;
  return SKY[pymod(idx + steps, SKY.length)];
}

function advanceBranch(branch: string, steps: number): string {
  const idx = EARTH.indexOf(branch);
  if (idx < 0) return branch;
  return EARTH[pymod(idx + steps, EARTH.length)];
}

function buildPillar(stem: string, branch: string, dayStem: string): TaewonTaesikPillar {
  const ganzi = `${stem}${branch}`;
  const stemRel = getRelation(dayStem, stem);
  const jeonggi = getJeonggi(branch);
  const branchRel = getRelation(dayStem, jeonggi);
  return {
    ganzi,
    stem,
    branch,
    stemSipsin: stemRel ? `${stemRel.hangul}(${stemRel.hanja})` : '?',
    branchSipsin: branchRel ? `${branchRel.hangul}(${branchRel.hanja})` : '?',
    nayeon: formatNayeon(ganzi),
  };
}

export function calculateTaewonTaesik(
  monthStem: string,
  monthBranch: string,
  dayStem: string,
  dayBranch: string,
): TaewonTaesikStats {
  const taewonStem = advanceStem(monthStem, 1);
  const taewonBranch = advanceBranch(monthBranch, 3);
  const taesikStem = advanceStem(dayStem, 1);
  const taesikBranch = advanceBranch(dayBranch, 1);

  return {
    taewon: buildPillar(taewonStem, taewonBranch, dayStem),
    taesik: buildPillar(taesikStem, taesikBranch, dayStem),
    methodNote: '胎元: 月干進一·月支進三 · 胎息: 日干進一·日支進一',
  };
}

/** HGANJI 인덱스 검증용 */
export function isValidGanzi(ganzi: string): boolean {
  return HGANJI.includes(ganzi);
}
