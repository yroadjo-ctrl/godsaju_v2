import type { Element, PillarDetail } from './types.ts';
import { BRANCH_ELEMENT, STEM_INFO } from './constants.ts';
import { getHiddenStems, getRelation, getTwelveMeteor } from './pillars.ts';

export type SinGangLevel =
  | '극약' | '태약' | '신약' | '중화신약' | '중화신강' | '신강' | '태강' | '극왕';

/** 세력 스케일 (약 → 강) */
export const SINGANG_LEVELS: SinGangLevel[] = [
  '극약', '태약', '신약', '중화신약', '중화신강', '신강', '태강', '극왕',
];

/** 生·比 = 일간을 돕는 십성 (인성·비겁) */
export const HELP_SIPSIN_LABEL = '인성(印星)·비겁(比劫)';

export function formatHelpSipsinRatio(helpCount: number, totalCount: number): string {
  return `${helpCount} / ${totalCount} ${HELP_SIPSIN_LABEL}`;
}

export interface DeungFlag {
  key: 'deungryeong' | 'deungji' | 'deungsi' | 'deungse';
  label: string;
  hanja: string;
  ok: boolean;
}

export interface SinGangYakStats {
  dayStem: string;
  dayStemKor: string;
  flags: DeungFlag[];
  /** 득령·득지·득시·득세 충족 개수 (0~4) */
  score: number;
  level: SinGangLevel;
  /** 신강 계열이면 true */
  isStrong: boolean;
  conclusion: string;
  /** 0~100, 50=중화. 원국 세력 비율(지장간·합화 미포함) */
  strengthPercent: number;
  helpCount: number;
  totalCount: number;
}

const STEM_KOR: Record<string, string> = {
  '甲': '갑', '乙': '을', '丙': '병', '丁': '정',
  '戊': '무', '己': '기', '庚': '경', '辛': '신',
  '壬': '임', '癸': '계',
};

const ELEMENT_KOR: Record<Element, string> = {
  tree: '목', fire: '화', earth: '토', metal: '금', water: '수',
};

/** 왕·록·생·대 — 통근·득력 판정 */
const STRONG_METEOR_HANJA = new Set(['長生', '冠帶', '乾祿', '帝旺']);

/** 월령 계절(본기·왕지 위주, 토월은 왕지만) */
const SEASON_BRANCHES: Record<Element, string[]> = {
  tree: ['寅', '卯'],
  fire: ['巳', '午'],
  earth: ['辰', '未', '戌', '丑'],
  metal: ['申', '酉'],
  water: ['亥', '子'],
};

const HELP_SIPSIN = new Set(['比肩', '劫財', '正印', '偏印']);

function parseSipsinHanja(sipsin: string): string | null {
  const m = sipsin.match(/\(([^)]+)\)/);
  return m ? m[1] : null;
}

function meteorHanja(unseong: string): string | null {
  const m = unseong.match(/\(([^)]+)\)/);
  return m ? m[1] : null;
}

function hasTonggeun(dayStem: string, branch: string): boolean {
  const mh = meteorHanja(getTwelveMeteor(dayStem, branch));
  if (mh && STRONG_METEOR_HANJA.has(mh)) return true;

  const dayEl = STEM_INFO[dayStem]?.element;
  if (!dayEl) return false;
  const hidden = getHiddenStems(branch).replace(/ /g, '');
  for (const s of hidden) {
    if (STEM_INFO[s]?.element === dayEl) return true;
  }
  return false;
}

function isDeungryeong(dayStem: string, monthBranch: string): boolean {
  const dayEl = STEM_INFO[dayStem]?.element;
  if (!dayEl) return false;
  if (BRANCH_ELEMENT[monthBranch] === dayEl) return true;
  if (SEASON_BRANCHES[dayEl]?.includes(monthBranch)) return true;
  return hasTonggeun(dayStem, monthBranch);
}

function isHelpSipsin(hanja: string | null): boolean {
  return hanja != null && HELP_SIPSIN.has(hanja);
}

function countDeungse(
  pillars: PillarDetail[],
  dayStem: string,
  indices: number[],
): { help: number; total: number } {
  let help = 0;
  let total = 0;

  for (const i of indices) {
    const p = pillars[i];
    if (i !== 1) {
      const stemSs = parseSipsinHanja(p.stemSipsin);
      if (stemSs) {
        total++;
        if (isHelpSipsin(stemSs)) help++;
      }
    }
    const branchSs = parseSipsinHanja(p.branchSipsin);
    if (branchSs) {
      total++;
      if (isHelpSipsin(branchSs)) help++;
    }
  }

  return { help, total };
}

function resolveLevel(
  score: number,
  helpRatio: number,
): { level: SinGangLevel; isStrong: boolean; conclusion: string } {
  if (score <= 0) {
    return { level: '극약', isStrong: false, conclusion: '일간 세력이 매우 약합니다(극약).' };
  }
  if (score === 1) {
    return { level: '신약', isStrong: false, conclusion: '일간 세력이 약한 편입니다(신약).' };
  }
  if (score === 2) {
    if (helpRatio >= 0.55) {
      return { level: '중화신강', isStrong: true, conclusion: '신강·신약이 비슷하나 약간 강한 편입니다(중화신강).' };
    }
    if (helpRatio <= 0.45) {
      return { level: '중화신약', isStrong: false, conclusion: '신강·신약이 비슷하나 약간 약한 편입니다(중화신약).' };
    }
    return { level: '중화신약', isStrong: false, conclusion: '신강·신약이 균형에 가깝습니다(중화).' };
  }
  if (score === 3) {
    return { level: '신강', isStrong: true, conclusion: '일간 세력이 강한 편입니다(신강).' };
  }
  if (helpRatio >= 0.65) {
    return { level: '극왕', isStrong: true, conclusion: '일간 세력이 매우 강합니다(극왕).' };
  }
  return { level: '태강', isStrong: true, conclusion: '일간 세력이 꽤 강합니다(태강).' };
}

/** 일간 기준 신강·신약 (득령·득지·득시·득세) */
export function calculateSinGangYak(
  pillars: PillarDetail[],
  unknownTime?: boolean,
): SinGangYakStats {
  const dayStem = pillars[1].pillar.stem;
  const dayBranch = pillars[1].pillar.branch;
  const monthBranch = pillars[2].pillar.branch;
  const hourBranch = pillars[0].pillar.branch;

  const indices = unknownTime ? [1, 2, 3] : [0, 1, 2, 3];

  const deungryeong = isDeungryeong(dayStem, monthBranch);
  const deungji = hasTonggeun(dayStem, dayBranch);
  const deungsi = !unknownTime && hasTonggeun(dayStem, hourBranch);

  const { help, total } = countDeungse(pillars, dayStem, indices);
  const helpRatio = total > 0 ? help / total : 0.5;
  const deungse = helpRatio > 0.5;

  const flags: DeungFlag[] = [
    { key: 'deungryeong', label: '득령', hanja: '得令', ok: deungryeong },
    { key: 'deungji', label: '득지', hanja: '得地', ok: deungji },
    { key: 'deungsi', label: '득시', hanja: '得時', ok: deungsi },
    { key: 'deungse', label: '득세', hanja: '得勢', ok: deungse },
  ];

  const score = flags.filter(f => f.ok).length;
  const { level, isStrong, conclusion } = resolveLevel(score, helpRatio);

  const strengthPercent = total > 0
    ? Math.round(Math.min(100, Math.max(0, helpRatio * 100)))
    : 50;

  return {
    dayStem,
    dayStemKor: STEM_KOR[dayStem] ?? dayStem,
    flags,
    score,
    level,
    isStrong,
    conclusion,
    strengthPercent,
    helpCount: help,
    totalCount: total,
  };
}

export { ELEMENT_KOR };
