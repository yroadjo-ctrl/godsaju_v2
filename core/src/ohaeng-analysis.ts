import type { Element, PillarDetail } from './types.ts';
import { BRANCH_ELEMENT, STEM_INFO, ELEMENT_HANJA, RELATIONS } from './constants.ts';
import {
  hiddenStemWeights,
  addElementWeight,
  addSipsinWeight,
  emptyElementCounts,
  emptySipsinCounts,
  stemElement,
  type ElementCounts,
  type SipsinCounts,
} from './element-weights.ts';

export type BalanceStatus = '발달' | '적정' | '부족' | '없음';

export interface ElementStat {
  element: Element;
  label: string;
  hanja: string;
  count: number;
  percent: number;
  status: BalanceStatus;
}

export interface SipsinStat {
  hanja: string;
  hangul: string;
  count: number;
  percent: number;
  status: BalanceStatus;
}

export interface OhaengSipsinStats {
  dayStem: string;
  dayStemKor: string;
  dayElement: Element;
  dayElementLabel: string;
  totalCharSlots: number;
  /** 표기용 기준 설명 */
  basisLabel?: string;
  elements: ElementStat[];
  sipsin: SipsinStat[];
}

const ELEMENT_ORDER: Element[] = ['tree', 'fire', 'earth', 'metal', 'water'];

const ELEMENT_KOR: Record<Element, string> = {
  tree: '목', fire: '화', earth: '토', metal: '금', water: '수',
};

const STEM_KOR: Record<string, string> = {
  '甲': '갑', '乙': '을', '丙': '병', '丁': '정',
  '戊': '무', '己': '기', '庚': '경', '辛': '신',
  '壬': '임', '癸': '계',
};

function balanceStatus(percent: number): BalanceStatus {
  if (percent <= 0) return '없음';
  if (percent >= 20) return '발달';
  if (percent >= 10) return '적정';
  return '부족';
}

function parseSipsinHanja(sipsin: string): string | null {
  const m = sipsin.match(/\(([^)]+)\)/);
  return m ? m[1] : null;
}

export function buildOhaengSipsinFromCounts(
  dayStem: string,
  elementCounts: ElementCounts,
  sipsinCounts: SipsinCounts,
  totalWeight: number,
  basisLabel?: string,
): OhaengSipsinStats {
  const dayEl = STEM_INFO[dayStem]?.element ?? 'tree';

  const elements: ElementStat[] = ELEMENT_ORDER.map(el => {
    const count = Math.round(elementCounts[el] * 10) / 10;
    const percent = totalWeight > 0
      ? Math.round((count / totalWeight) * 1000) / 10
      : 0;
    return {
      element: el,
      label: ELEMENT_KOR[el],
      hanja: ELEMENT_HANJA[el],
      count,
      percent,
      status: balanceStatus(percent),
    };
  });

  const sipsin: SipsinStat[] = RELATIONS.map(r => {
    const count = Math.round((sipsinCounts[r.hanja] ?? 0) * 10) / 10;
    const percent = totalWeight > 0
      ? Math.round((count / totalWeight) * 1000) / 10
      : 0;
    return {
      hanja: r.hanja,
      hangul: r.hangul,
      count,
      percent,
      status: balanceStatus(percent),
    };
  });

  return {
    dayStem,
    dayStemKor: STEM_KOR[dayStem] ?? dayStem,
    dayElement: dayEl,
    dayElementLabel: `${ELEMENT_KOR[dayEl]}(${ELEMENT_HANJA[dayEl]})`,
    totalCharSlots: Math.round(totalWeight * 10) / 10,
    basisLabel,
    elements,
    sipsin,
  };
}

/** 사주 원국 8글자(천간4·지지4) 기준 오행·십성 비율 */
export function calculateOhaengSipsinStats(
  pillars: PillarDetail[],
  unknownTime?: boolean,
): OhaengSipsinStats {
  const elementCounts: Record<Element, number> = {
    tree: 0, fire: 0, earth: 0, metal: 0, water: 0,
  };
  const sipsinCounts: Record<string, number> = {};
  for (const r of RELATIONS) sipsinCounts[r.hanja] = 0;

  const indices = unknownTime ? [1, 2, 3] : [0, 1, 2, 3];

  for (const i of indices) {
    const p = pillars[i];
    const stemEl = STEM_INFO[p.pillar.stem]?.element;
    const branchEl = BRANCH_ELEMENT[p.pillar.branch];
    if (stemEl) elementCounts[stemEl]++;
    if (branchEl) elementCounts[branchEl]++;

    const stemSs = parseSipsinHanja(p.stemSipsin);
    const branchSs = parseSipsinHanja(p.branchSipsin);
    if (stemSs && stemSs in sipsinCounts) sipsinCounts[stemSs]++;
    if (branchSs && branchSs in sipsinCounts) sipsinCounts[branchSs]++;
  }

  const totalCharSlots = indices.length * 2;
  const totalSipsinSlots = indices.length * 2;

  const dayStem = pillars[1].pillar.stem;
  const dayEl = STEM_INFO[dayStem]?.element ?? 'tree';

  const elements: ElementStat[] = ELEMENT_ORDER.map(el => {
    const count = elementCounts[el];
    const percent = totalCharSlots > 0
      ? Math.round((count / totalCharSlots) * 1000) / 10
      : 0;
    return {
      element: el,
      label: ELEMENT_KOR[el],
      hanja: ELEMENT_HANJA[el],
      count,
      percent,
      status: balanceStatus(percent),
    };
  });

  const sipsin: SipsinStat[] = RELATIONS.map(r => {
    const count = sipsinCounts[r.hanja] ?? 0;
    const percent = totalSipsinSlots > 0
      ? Math.round((count / totalSipsinSlots) * 1000) / 10
      : 0;
    return {
      hanja: r.hanja,
      hangul: r.hangul,
      count,
      percent,
      status: balanceStatus(percent),
    };
  });

  return {
    dayStem,
    dayStemKor: STEM_KOR[dayStem] ?? dayStem,
    dayElement: dayEl,
    dayElementLabel: `${ELEMENT_KOR[dayEl]}(${ELEMENT_HANJA[dayEl]})`,
    totalCharSlots,
    basisLabel: '천간·지지 표면 8글자',
    elements,
    sipsin,
  };
}

/** 지장간 가중(本气60·中气30·余气10) 오행·십성 */
export function calculateOhaengSipsinStatsWeighted(
  pillars: PillarDetail[],
  unknownTime?: boolean,
): OhaengSipsinStats {
  const elementCounts = emptyElementCounts();
  const sipsinCounts = emptySipsinCounts();
  let totalWeight = 0;

  const indices = unknownTime ? [1, 2, 3] : [0, 1, 2, 3];
  const dayStem = pillars[1].pillar.stem;

  for (const i of indices) {
    const p = pillars[i];
    addElementWeight(elementCounts, stemElement(p.pillar.stem), 1);
    totalWeight += 1;
    addSipsinWeight(sipsinCounts, dayStem, p.pillar.stem, 1);

    for (const { stem, weight } of hiddenStemWeights(p.pillar.branch)) {
      addElementWeight(elementCounts, stemElement(stem), weight);
      totalWeight += weight;
      addSipsinWeight(sipsinCounts, dayStem, stem, weight);
    }
  }

  return buildOhaengSipsinFromCounts(
    dayStem,
    elementCounts,
    sipsinCounts,
    totalWeight,
    '천간 1 + 지장간 가중(6:3:1)',
  );
}
