/**
 * 운세(대운·세운·일진) — 伏吟·反吟, 용신 연동
 */
import type { Element } from './types.ts';
import type { YongsinStats } from './yongsin-analysis.ts';
import { STEM_INFO } from './constants.ts';
import { getStemRelation, getBranchRelation, getJeonggi } from './pillars.ts';

export type YongsinTransitRole = '用' | '喜' | '忌' | '-';

const PILLAR_POS = ['시', '일', '월', '년'] as const;

export interface TransitAnnotation {
  /** 伏吟(日) 反吟(月) … 공백 구분, 없으면 '-' */
  fuYinFanYin: string;
  yongsinStem: YongsinTransitRole;
  yongsinBranch: YongsinTransitRole;
  /** 예: 간 喜 · 지 忌 */
  yongsinLabel: string;
}

function stemElement(stem: string): Element | null {
  return STEM_INFO[stem]?.element ?? null;
}

function branchJeonggiElement(branch: string): Element | null {
  const jeonggi = getJeonggi(branch);
  return jeonggi ? (STEM_INFO[jeonggi]?.element ?? null) : null;
}

/** 합화 보정 오행 기준 용신·희신·기신 분류 */
export function classifyYongsinRole(
  element: Element | null,
  yongsin: YongsinStats,
): YongsinTransitRole {
  if (!element) return '-';
  if (element === yongsin.primary.element) return '用';
  if (element === yongsin.secondary.element) return '喜';
  if (yongsin.avoid.some((a) => a.element === element)) return '忌';
  return '-';
}

function formatYongsinLabel(stem: YongsinTransitRole, branch: YongsinTransitRole): string {
  const parts: string[] = [];
  if (stem !== '-') parts.push(`간 ${stem}`);
  if (branch !== '-') parts.push(`지 ${branch}`);
  return parts.length > 0 ? parts.join(' · ') : '-';
}

/** 원국 4주 [시,일,월,년] 간지 vs 운세 간지 */
export function detectFuYinFanYin(
  transitGanzi: string,
  natalGanzis: string[],
): string {
  if (transitGanzi.length < 2) return '-';

  const stem = transitGanzi[0];
  const branch = transitGanzi[1];
  const tags: string[] = [];

  natalGanzis.forEach((natal, idx) => {
    if (!natal || natal.length < 2) return;
    const pos = PILLAR_POS[idx] ?? '?';

    if (transitGanzi === natal) {
      tags.push(`伏吟(${pos})`);
      return;
    }

    const nStem = natal[0];
    const nBranch = natal[1];
    const stemClash = getStemRelation(nStem, stem).some((r) => r.type === '沖');
    const branchClash = getBranchRelation(nBranch, branch).some((r) => r.type === '沖');
    if (stemClash && branchClash) {
      tags.push(`反吟(${pos})`);
    }
  });

  return tags.length > 0 ? tags.join(' ') : '-';
}

export function annotateTransit(
  transitGanzi: string,
  natalGanzis: string[],
  yongsin: YongsinStats,
): TransitAnnotation {
  const stem = transitGanzi[0] ?? '';
  const branch = transitGanzi[1] ?? '';
  const yongsinStem = classifyYongsinRole(stemElement(stem), yongsin);
  const yongsinBranch = classifyYongsinRole(branchJeonggiElement(branch), yongsin);

  return {
    fuYinFanYin: detectFuYinFanYin(transitGanzi, natalGanzis),
    yongsinStem,
    yongsinBranch,
    yongsinLabel: formatYongsinLabel(yongsinStem, yongsinBranch),
  };
}
