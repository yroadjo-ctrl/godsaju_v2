import type { Element } from './types.ts';
import { STEM_INFO } from './constants.ts';
import { getHiddenStems, getRelation } from './pillars.ts';

/** 지장간 가중 (本气·中气·余气) */
export const JIJANGGAN_WEIGHTS = [0.6, 0.3, 0.1] as const;

export function parseHiddenStemList(branch: string): string[] {
  return getHiddenStems(branch).replace(/ /g, '').split('').filter(Boolean);
}

export function hiddenStemWeights(branch: string): Array<{ stem: string; weight: number }> {
  const stems = parseHiddenStemList(branch);
  if (stems.length === 0) return [];
  if (stems.length === 1) return [{ stem: stems[0], weight: 1 }];
  if (stems.length === 2) return [
    { stem: stems[0], weight: 0.6 },
    { stem: stems[1], weight: 0.4 },
  ];
  return stems.slice(0, 3).map((stem, i) => ({
    stem,
    weight: JIJANGGAN_WEIGHTS[i] ?? 0.1,
  }));
}

export function stemElement(stem: string): Element | undefined {
  return STEM_INFO[stem]?.element;
}

export function sipsinHanja(dayStem: string, targetStem: string): string | null {
  return getRelation(dayStem, targetStem)?.hanja ?? null;
}

export type ElementCounts = Record<Element, number>;
export type SipsinCounts = Record<string, number>;

export function emptyElementCounts(): ElementCounts {
  return { tree: 0, fire: 0, earth: 0, metal: 0, water: 0 };
}

export function emptySipsinCounts(): SipsinCounts {
  return {
    '比肩': 0, '劫財': 0, '食神': 0, '傷官': 0, '偏財': 0,
    '正財': 0, '偏官': 0, '正官': 0, '偏印': 0, '正印': 0,
  };
}

export function addElementWeight(counts: ElementCounts, el: Element | undefined, w: number): void {
  if (el && w > 0) counts[el] += w;
}

export function addSipsinWeight(
  counts: SipsinCounts, dayStem: string, targetStem: string, w: number,
): void {
  const hanja = sipsinHanja(dayStem, targetStem);
  if (hanja && hanja in counts) counts[hanja] += w;
}
