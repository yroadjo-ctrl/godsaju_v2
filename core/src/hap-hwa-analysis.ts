import type { Element, OhaengSipsinStats, PillarDetail, AllRelations } from './types.ts';
import { STEM_COMBINES, BRANCH_COMBINES_6, BRANCH_ELEMENT } from './constants.ts';
import { getStemRelation, getBranchRelation } from './pillars.ts';
import {
  type ElementCounts,
  type SipsinCounts,
  emptyElementCounts,
  emptySipsinCounts,
  addElementWeight,
  addSipsinWeight,
  stemElement,
} from './element-weights.ts';
import { buildOhaengSipsinFromCounts } from './ohaeng-analysis.ts';

export interface HapHwaEvent {
  kind: 'stem' | 'branch';
  pillarIndices: [number, number];
  label: string;
  transformElement: Element;
  transformLabel: string;
  /** 성립 여부 (월령·충파 고려) */
  established: boolean;
  reason: string;
}

export interface HapHwaStats {
  events: HapHwaEvent[];
  /** 합화 반영 오행·십성 (미성립 시 입력과 동일) */
  adjustedOhaeng: OhaengSipsinStats;
  summary: string;
}

const ELEMENT_KOR: Record<Element, string> = {
  tree: '목', fire: '화', earth: '토', metal: '금', water: '수',
};

function pairKey(a: number, b: number): string {
  return `${Math.min(a, b)},${Math.max(a, b)}`;
}

function monthSupportsTransform(monthBranch: string, transform: Element): boolean {
  if (BRANCH_ELEMENT[monthBranch] === transform) return true;
  const seasonElements: Element[] = [];
  const branchEl = BRANCH_ELEMENT[monthBranch];
  if (branchEl) seasonElements.push(branchEl);
  return seasonElements.includes(transform);
}

function hasClashBetween(
  relations: AllRelations,
  i: number,
  j: number,
): boolean {
  const rel = relations.pairs.get(pairKey(i, j));
  if (!rel) return false;
  return rel.branch.some(r => r.type === '沖' || r.type === '冲');
}

function stemCombineElement(stem1: string, stem2: string): Element | null {
  const key = `${stem1},${stem2}`;
  const rev = `${stem2},${stem1}`;
  const hit = STEM_COMBINES[key] ?? STEM_COMBINES[rev];
  return hit ? hit[1] as Element : null;
}

function branchCombineElement(b1: string, b2: string): Element | null {
  const key = `${b1},${b2}`;
  const rev = `${b2},${b1}`;
  const hit = BRANCH_COMBINES_6[key] ?? BRANCH_COMBINES_6[rev];
  return hit ? hit[1] as Element : null;
}

function cloneCountsFromOhaeng(base: OhaengSipsinStats): {
  elements: ElementCounts;
  sipsin: SipsinCounts;
  totalWeight: number;
} {
  const elements = emptyElementCounts();
  for (const e of base.elements) elements[e.element] = e.count;
  const sipsin = emptySipsinCounts();
  for (const s of base.sipsin) sipsin[s.hanja] = s.count;
  const totalWeight = base.totalCharSlots;
  return { elements, sipsin, totalWeight };
}

/** 지장간 가중 오행에 합화 보정 적용 */
export function calculateHapHwa(
  pillars: PillarDetail[],
  relations: AllRelations,
  baseOhaeng: OhaengSipsinStats,
): HapHwaStats {
  const monthBranch = pillars[2].pillar.branch;
  const dayStem = pillars[1].pillar.stem;
  const events: HapHwaEvent[] = [];
  const { elements, sipsin, totalWeight } = cloneCountsFromOhaeng(baseOhaeng);

  const indices = baseOhaeng.totalCharSlots <= 6 ? [1, 2, 3] : [0, 1, 2, 3];

  for (let a = 0; a < indices.length; a++) {
    for (let b = a + 1; b < indices.length; b++) {
      const i = indices[a];
      const j = indices[b];
      const p1 = pillars[i].pillar;
      const p2 = pillars[j].pillar;

      const stemRels = getStemRelation(p1.stem, p2.stem);
      const stemRel = stemRels.find(r => r.type === '合');
      const transform = stemCombineElement(p1.stem, p2.stem);
      if (stemRel && transform) {
        const clash = hasClashBetween(relations, i, j);
        const supported = monthSupportsTransform(monthBranch, transform);
        const established = supported && !clash;
        const reason = established
          ? `월령 ${monthBranch}이(가) ${ELEMENT_KOR[transform]}(化神)을(를) 도움`
          : clash
            ? '합화 성립 불가 — 지지 충(沖) 존재'
            : `월령 ${monthBranch}이(가) ${ELEMENT_KOR[transform]}(化神)을(를) 돕지 못함`;

        events.push({
          kind: 'stem',
          pillarIndices: [i, j],
          label: `${p1.stem}${p2.stem}合${ELEMENT_KOR[transform]}`,
          transformElement: transform,
          transformLabel: ELEMENT_KOR[transform],
          established,
          reason,
        });

        if (established) {
          const w = 0.5;
          const el1 = stemElement(p1.stem);
          const el2 = stemElement(p2.stem);
          addElementWeight(elements, el1, -w);
          addElementWeight(elements, el2, -w);
          addElementWeight(elements, transform, w * 2);
          addSipsinWeight(sipsin, dayStem, p1.stem, -w);
          addSipsinWeight(sipsin, dayStem, p2.stem, -w);
        }
      }

      const branchRels = getBranchRelation(p1.branch, p2.branch);
      const branchRel = branchRels.find(r => r.type === '合');
      const bTransform = branchCombineElement(p1.branch, p2.branch);
      if (branchRel && bTransform) {
        const clash = hasClashBetween(relations, i, j);
        const supported = monthSupportsTransform(monthBranch, bTransform);
        const established = supported && !clash;
        const reason = established
          ? `월령 ${monthBranch}이(가) ${ELEMENT_KOR[bTransform]}(化神)을(를) 도움`
          : clash
            ? '합화 성립 불가 — 지지 충(沖) 존재'
            : `월령 ${monthBranch}이(가) ${ELEMENT_KOR[bTransform]}(化神)을(를) 돕지 못함`;

        events.push({
          kind: 'branch',
          pillarIndices: [i, j],
          label: `${p1.branch}${p2.branch}合${ELEMENT_KOR[bTransform]}`,
          transformElement: bTransform,
          transformLabel: ELEMENT_KOR[bTransform],
          established,
          reason,
        });

        if (established) {
          const w = 0.3;
          addElementWeight(elements, BRANCH_ELEMENT[p1.branch], -w);
          addElementWeight(elements, BRANCH_ELEMENT[p2.branch], -w);
          addElementWeight(elements, bTransform, w * 2);
        }
      }
    }
  }

  for (const k of Object.keys(elements) as Element[]) {
    elements[k] = Math.max(0, Math.round(elements[k] * 1000) / 1000);
  }

  const adjustedOhaeng = buildOhaengSipsinFromCounts(
    dayStem,
    elements,
    sipsin,
    totalWeight,
    '지장간·합화 보정',
  );

  const establishedEvents = events.filter(e => e.established);
  const summary = establishedEvents.length > 0
    ? establishedEvents.map(e => e.label).join(' · ')
    : events.length > 0
      ? `합 ${events.length}건 (성립 0건)`
      : '원국 천·지 합 없음';

  return { events, adjustedOhaeng, summary };
}
