import type { Element, OhaengSipsinStats, PillarDetail, SinGangYakStats } from './types.ts';
import { getJeonggi, getRelation, getTwelveMeteor } from './pillars.ts';
import { ELEMENT_HANJA } from './constants.ts';

export type GyeokgukCategory = '정격' | '종격' | '특수격';

export interface GyeokgukStats {
  name: string;
  hanja: string;
  category: GyeokgukCategory;
  /** 격국 근거 십성 */
  basisSipsinHanja: string;
  basisSipsinHangul: string;
  basisSource: string;
  summary: string;
  explanation: string;
}

const STEM_KOR: Record<string, string> = {
  '甲': '갑', '乙': '을', '丙': '병', '丁': '정',
  '戊': '무', '己': '기', '庚': '경', '辛': '신',
  '壬': '임', '癸': '계',
};

const SIPSIN_TO_GEUK: Record<string, { name: string; hanja: string }> = {
  '正官': { name: '正官格', hanja: '正官格' },
  '偏官': { name: '七殺格', hanja: '七殺格' },
  '正印': { name: '正印格', hanja: '正印格' },
  '偏印': { name: '偏印格', hanja: '偏印格' },
  '食神': { name: '食神格', hanja: '食神格' },
  '傷官': { name: '傷官格', hanja: '傷官格' },
  '正財': { name: '正財格', hanja: '正財格' },
  '偏財': { name: '偏財格', hanja: '偏財格' },
  '比肩': { name: '建祿格', hanja: '建祿格' },
  '劫財': { name: '月刃格', hanja: '月刃格' },
};

const ELEMENT_KOR: Record<Element, string> = {
  tree: '목', fire: '화', earth: '토', metal: '금', water: '수',
};

function meteorHanja(unseong: string): string | null {
  const m = unseong.match(/\(([^)]+)\)/);
  return m ? m[1] : null;
}

function dominantElement(ohaeng: OhaengSipsinStats): { element: Element; percent: number } | null {
  const sorted = [...ohaeng.elements].sort((a, b) => b.percent - a.percent);
  if (sorted[0]?.percent <= 0) return null;
  return { element: sorted[0].element, percent: sorted[0].percent };
}

/** 월령·신강약 기준 격국 */
export function calculateGyeokguk(
  pillars: PillarDetail[],
  sinGangYak: SinGangYakStats,
  ohaeng: OhaengSipsinStats,
): GyeokgukStats {
  const dayStem = pillars[1].pillar.stem;
  const monthStem = pillars[2].pillar.stem;
  const monthBranch = pillars[2].pillar.branch;
  const jeonggi = getJeonggi(monthBranch);

  const monthStemRel = getRelation(dayStem, monthStem);
  const monthBranchRel = getRelation(dayStem, jeonggi);
  const monthMeteor = meteorHanja(getTwelveMeteor(dayStem, monthBranch));

  const dom = dominantElement(ohaeng);

  if (!sinGangYak.isStrong && sinGangYak.score <= 0 && dom && dom.percent >= 55) {
    const el = dom.element;
    return {
      name: `從${ELEMENT_HANJA[el]}格`,
      hanja: `從${ELEMENT_HANJA[el]}格`,
      category: '종격',
      basisSipsinHanja: '-',
      basisSipsinHangul: '-',
      basisSource: `일간 ${STEM_KOR[dayStem]}(${dayStem}) 극약 · ${ELEMENT_KOR[el]} ${dom.percent}%`,
      summary: `從${ELEMENT_HANJA[el]}格 (종${ELEMENT_KOR[el]}격)`,
      explanation:
        `일간 세력이 매우 약하고 ${ELEMENT_KOR[el]}(化) 기운이 ${dom.percent}%로 압도적이어서 ` +
        `종${ELEMENT_KOR[el]}격(從${ELEMENT_KOR[el]}格)으로 봅니다.`,
    };
  }

  if (sinGangYak.isStrong && dom && dom.percent >= 60 && dom.element === ohaeng.dayElement) {
    return {
      name: `專旺格`,
      hanja: '專旺格',
      category: '특수격',
      basisSipsinHanja: '比劫',
      basisSipsinHangul: '비겁',
      basisSource: `일간 ${STEM_KOR[dayStem]}(${dayStem}) · ${ELEMENT_KOR[dom.element]} ${dom.percent}%`,
      summary: '專旺格 (전왕격)',
      explanation:
        `일간과 같은 오행 ${ELEMENT_KOR[dom.element]}이 ${dom.percent}%로 편중되고 신강하여 전왕격(專旺格)에 가깝습니다.`,
    };
  }

  let basisRel = monthBranchRel;
  let basisSource = `월지 ${monthBranch} 정기 ${jeonggi}`;

  if (monthStemRel && monthStemRel.hanja !== '比肩' && monthStemRel.hanja !== '劫財') {
    basisRel = monthStemRel;
    basisSource = `월간 ${monthStem} 투출`;
  }

  if (monthMeteor === '帝旺' || monthMeteor === '建祿' || monthMeteor === '冠帶') {
    if (monthMeteor === '帝旺') {
      return {
        name: '月刃格',
        hanja: '月刃格',
        category: '특수격',
        basisSipsinHanja: '劫財',
        basisSipsinHangul: '겁재',
        basisSource: `월지 ${monthBranch} 12운성 ${monthMeteor}`,
        summary: '月刃格 (월인격)',
        explanation: `월지 ${monthBranch}가 일간 ${STEM_KOR[dayStem]}(${dayStem})의 帝旺(제왕)에 해당하여 월刃격(月刃格)으로 봅니다.`,
      };
    }
    if (monthMeteor === '建祿' || monthMeteor === '冠帶') {
      return {
        name: '建祿格',
        hanja: '建祿格',
        category: '특수격',
        basisSipsinHanja: '比肩',
        basisSipsinHangul: '비견',
        basisSource: `월지 ${monthBranch} 12운성 ${monthMeteor}`,
        summary: '建祿格 (건록격)',
        explanation: `월지 ${monthBranch}가 일간의 建祿·冠帶(건록·관대)에 해당하여 건록격(建祿格)으로 봅니다.`,
      };
    }
  }

  const geuk = basisRel ? SIPSIN_TO_GEUK[basisRel.hanja] : null;
  if (geuk && basisRel) {
    return {
      name: geuk.name,
      hanja: geuk.hanja,
      category: '정격',
      basisSipsinHanja: basisRel.hanja,
      basisSipsinHangul: basisRel.hangul,
      basisSource,
      summary: `${geuk.name} (${basisRel.hangul}격)`,
      explanation:
        `${basisSource} 기준 십성 ${basisRel.hangul}(${basisRel.hanja})이 월령 주도하여 ` +
        `${geuk.name}(정격)으로 분류합니다.`,
    };
  }

  return {
    name: '雜格',
    hanja: '雜格',
    category: '정격',
    basisSipsinHanja: basisRel?.hanja ?? '-',
    basisSipsinHangul: basisRel?.hangul ?? '-',
    basisSource,
    summary: '雜格 (잡격)',
    explanation: '월령 십성이 뚜렷하지 않아 잡격(雜格)으로 분류합니다.',
  };
}
