import type { Element, OhaengSipsinStats, PillarDetail, AllRelations } from './types.ts';
import {
  STEM_COMBINES,
  BRANCH_COMBINES_6,
  BRANCH_ELEMENT,
  TRIPLE_COMPOSES,
  TRIPLE_COMPOSE_ELEMENTS,
  DIRECTIONAL_COMPOSES,
  DIRECTIONAL_COMPOSE_ELEMENTS,
  ELEMENT_HANJA,
} from './constants.ts';
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
  kind: 'stem' | 'branch' | 'triple' | 'directional';
  pillarIndices: number[];
  label: string;
  transformElement: Element;
  transformLabel: string;
  /** 성립 여부 (월령·충파 고려) */
  established: boolean;
  reason: string;
}

export interface HwaGeukInfo {
  /** 화목격 등 */
  name: string;
  /** 化木格 등 */
  hanja: string;
  element: Element;
  /** 근거 합·局 */
  source: string;
  summary: string;
}

export interface HapHwaStats {
  events: HapHwaEvent[];
  /** 성립한 화격(化格) */
  hwaGeuk: HwaGeukInfo[];
  /** 합화 반영 오행·십성 (미성립 시 입력과 동일) */
  adjustedOhaeng: OhaengSipsinStats;
  summary: string;
}

const ELEMENT_KOR: Record<Element, string> = {
  tree: '목', fire: '화', earth: '토', metal: '금', water: '수',
};

const HWA_GEUK_HANJA: Record<Element, string> = {
  tree: '化木格', fire: '化火格', earth: '化土格', metal: '化金格', water: '化水格',
};

const HWA_GEUK_NAME: Record<Element, string> = {
  tree: '화목격', fire: '화화격', earth: '화토격', metal: '화금격', water: '화수격',
};

function pairKey(a: number, b: number): string {
  return `${Math.min(a, b)},${Math.max(a, b)}`;
}

function monthSupportsTransform(monthBranch: string, transform: Element): boolean {
  if (BRANCH_ELEMENT[monthBranch] === transform) return true;
  const branchEl = BRANCH_ELEMENT[monthBranch];
  if (branchEl) return branchEl === transform;
  return false;
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

function buildHwaGeuk(
  element: Element,
  source: string,
  kind: HapHwaEvent['kind'],
): HwaGeukInfo {
  const kindLabel =
    kind === 'triple' ? '삼합화격(三合化格)'
      : kind === 'directional' ? '방합화격(方合化格)'
        : '화격(化格)';
  return {
    name: HWA_GEUK_NAME[element],
    hanja: HWA_GEUK_HANJA[element],
    element,
    source,
    summary: `${kindLabel} — ${source} → ${ELEMENT_KOR[element]}(${ELEMENT_HANJA[element]})`,
  };
}

function dedupeHwaGeuk(list: HwaGeukInfo[]): HwaGeukInfo[] {
  const seen = new Set<Element>();
  return list.filter(h => {
    if (seen.has(h.element)) return false;
    seen.add(h.element);
    return true;
  });
}

function findBranchIndices(pillars: PillarDetail[], indices: number[], branches: string[]): number[] {
  const want = new Set(branches);
  const found: number[] = [];
  for (const i of indices) {
    const b = pillars[i].pillar.branch;
    if (want.has(b) && !found.includes(i)) found.push(i);
  }
  return found;
}

/** 지장간 가중 오행에 합화·삼합·방합 보정 적용 */
export function calculateHapHwa(
  pillars: PillarDetail[],
  relations: AllRelations,
  baseOhaeng: OhaengSipsinStats,
): HapHwaStats {
  const monthBranch = pillars[2].pillar.branch;
  const dayStem = pillars[1].pillar.stem;
  const events: HapHwaEvent[] = [];
  const hwaGeukCandidates: HwaGeukInfo[] = [];
  const { elements, sipsin, totalWeight } = cloneCountsFromOhaeng(baseOhaeng);

  const indices = baseOhaeng.totalCharSlots <= 6 ? [1, 2, 3] : [0, 1, 2, 3];
  const branchSet = new Set(indices.map(i => pillars[i].pillar.branch));

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
          hwaGeukCandidates.push(
            buildHwaGeuk(transform, `${p1.stem}${p2.stem}合${ELEMENT_KOR[transform]}`, 'stem'),
          );
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
          hwaGeukCandidates.push(
            buildHwaGeuk(bTransform, `${p1.branch}${p2.branch}合${ELEMENT_KOR[bTransform]}`, 'branch'),
          );
        }
      }
    }
  }

  for (const triple of TRIPLE_COMPOSES) {
    if (!triple.every(b => branchSet.has(b))) continue;
    const key = triple.join(',');
    const transform = TRIPLE_COMPOSE_ELEMENTS[key] as Element;
    const supported = monthSupportsTransform(monthBranch, transform);
    const established = supported;
    const label = `${triple.join('')}三合${ELEMENT_KOR[transform]}`;
    const reason = established
      ? `삼합(三合) ${ELEMENT_KOR[transform]}局 — 월령 ${monthBranch}이(가) 化神을(를) 도움`
      : `삼합(三合) ${ELEMENT_KOR[transform]}局 — 월령 ${monthBranch}이(가) 化神을(를) 돕지 못함`;

    events.push({
      kind: 'triple',
      pillarIndices: findBranchIndices(pillars, indices, triple),
      label,
      transformElement: transform,
      transformLabel: ELEMENT_KOR[transform],
      established,
      reason,
    });

    if (established) {
      const w = 0.45;
      addElementWeight(elements, transform, w);
      hwaGeukCandidates.push(buildHwaGeuk(transform, label, 'triple'));
    }
  }

  for (const dir of DIRECTIONAL_COMPOSES) {
    if (!dir.every(b => branchSet.has(b))) continue;
    const key = dir.join(',');
    const transform = DIRECTIONAL_COMPOSE_ELEMENTS[key] as Element;
    const supported = monthSupportsTransform(monthBranch, transform);
    const established = supported;
    const label = `${dir.join('')}方合${ELEMENT_KOR[transform]}`;
    const reason = established
      ? `방합(方合) ${ELEMENT_KOR[transform]}方 — 월령 ${monthBranch}이(가) 化神을(를) 도움`
      : `방합(方合) ${ELEMENT_KOR[transform]}方 — 월령 ${monthBranch}이(가) 化神을(를) 돕지 못함`;

    events.push({
      kind: 'directional',
      pillarIndices: findBranchIndices(pillars, indices, dir),
      label,
      transformElement: transform,
      transformLabel: ELEMENT_KOR[transform],
      established,
      reason,
    });

    if (established) {
      const w = 0.4;
      addElementWeight(elements, transform, w);
      hwaGeukCandidates.push(buildHwaGeuk(transform, label, 'directional'));
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

  const hwaGeuk = dedupeHwaGeuk(hwaGeukCandidates);
  const establishedEvents = events.filter(e => e.established);
  const summaryParts: string[] = [];
  if (hwaGeuk.length > 0) {
    summaryParts.push(hwaGeuk.map(h => `${h.name}(${h.hanja})`).join(' · '));
  }
  if (establishedEvents.length > 0) {
    summaryParts.push(establishedEvents.map(e => e.label).join(' · '));
  }
  const summary = summaryParts.length > 0
    ? summaryParts.join(' | ')
    : events.length > 0
      ? `합·局 ${events.length}건 (성립 0건)`
      : '원국 천·지 합·삼합·방합 없음';

  return { events, hwaGeuk, adjustedOhaeng, summary };
}
