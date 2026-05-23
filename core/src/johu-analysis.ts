import type { Element, PillarDetail } from './types.ts';
import { STEM_INFO, ELEMENT_HANJA } from './constants.ts';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface JohuStats {
  season: Season;
  seasonLabel: string;
  seasonHanja: string;
  dayStem: string;
  dayStemKor: string;
  monthBranch: string;
  /** 조후용신 (主) */
  primary: Element;
  primaryLabel: string;
  /** 조후희신 (輔) */
  secondary?: Element;
  secondaryLabel?: string;
  /** 조후기신 (忌) — 과다 시 불리 */
  avoid?: Element;
  avoidLabel?: string;
  summary: string;
  explanation: string;
}

const STEM_KOR: Record<string, string> = {
  '甲': '갑', '乙': '을', '丙': '병', '丁': '정',
  '戊': '무', '己': '기', '庚': '경', '辛': '신',
  '壬': '임', '癸': '계',
};

const ELEMENT_KOR: Record<Element, string> = {
  tree: '목', fire: '화', earth: '토', metal: '금', water: '수',
};

const SEASON_INFO: Record<Season, { label: string; hanja: string; branches: string[] }> = {
  spring: { label: '봄', hanja: '春', branches: ['寅', '卯', '辰'] },
  summer: { label: '여름', hanja: '夏', branches: ['巳', '午', '未'] },
  autumn: { label: '가을', hanja: '秋', branches: ['申', '酉', '戌'] },
  winter: { label: '겨울', hanja: '冬', branches: ['亥', '子', '丑'] },
};

/** 일간·계절별 조후 필요 오행 (穷通宝鉴 요약) */
const JOHU_TABLE: Record<string, Record<Season, { primary: Element; secondary?: Element; avoid?: Element; note: string }>> = {
  '甲': {
    spring: { primary: 'water', secondary: 'fire', note: '春木尚寒，先取火暖，次用癸水润根' },
    summer: { primary: 'water', note: '夏木枯焦，癸水润泽' },
    autumn: { primary: 'fire', secondary: 'water', note: '秋金克木，丙丁制金' },
    winter: { primary: 'fire', secondary: 'tree', note: '冬水寒木，丙丁暖局' },
  },
  '乙': {
    spring: { primary: 'fire', secondary: 'water', note: '春木向阳，丙火发荣' },
    summer: { primary: 'water', note: '夏木需癸水润' },
    autumn: { primary: 'fire', secondary: 'water', note: '秋金当令，火制金' },
    winter: { primary: 'fire', note: '寒木需火暖' },
  },
  '丙': {
    spring: { primary: 'water', note: '春火渐升，壬水既济' },
    summer: { primary: 'water', secondary: 'metal', note: '夏火炎烈，壬癸制火' },
    autumn: { primary: 'tree', secondary: 'water', note: '秋火渐衰，木生火' },
    winter: { primary: 'tree', secondary: 'fire', note: '冬火微弱，甲丙助燃' },
  },
  '丁': {
    spring: { primary: 'tree', note: '春火借木生' },
    summer: { primary: 'water', note: '夏火需水制' },
    autumn: { primary: 'tree', secondary: 'metal', note: '秋金旺，甲引丁' },
    winter: { primary: 'tree', secondary: 'fire', note: '冬丁需木火' },
  },
  '戊': {
    spring: { primary: 'fire', secondary: 'tree', note: '春土虚，丙甲疏发' },
    summer: { primary: 'water', secondary: 'metal', note: '夏土燥，癸润' },
    autumn: { primary: 'fire', secondary: 'tree', note: '秋土厚，丙甲泄秀' },
    winter: { primary: 'fire', secondary: 'tree', note: '寒土需火暖' },
  },
  '己': {
    spring: { primary: 'fire', secondary: 'tree', note: '春湿土，丙甲化湿' },
    summer: { primary: 'water', note: '夏燥土，癸润' },
    autumn: { primary: 'fire', secondary: 'water', note: '秋土金旺，丙癸并用' },
    winter: { primary: 'fire', note: '冬寒湿土，丙火暖' },
  },
  '庚': {
    spring: { primary: 'fire', secondary: 'earth', note: '春金寒，丁甲锻金' },
    summer: { primary: 'water', secondary: 'metal', note: '夏金受火克，壬癸润' },
    autumn: { primary: 'fire', secondary: 'water', note: '秋金太刚，丁制' },
    winter: { primary: 'fire', secondary: 'tree', note: '冬金寒水，丙丁暖' },
  },
  '辛': {
    spring: { primary: 'water', secondary: 'fire', note: '春金尚寒，壬水洗淘' },
    summer: { primary: 'water', secondary: 'metal', note: '夏火克金，壬癸救' },
    autumn: { primary: 'water', secondary: 'fire', note: '秋金太旺，壬泄' },
    winter: { primary: 'fire', secondary: 'tree', note: '冬金水冷，丙暖' },
  },
  '壬': {
    spring: { primary: 'earth', secondary: 'fire', note: '春水润木，戊制' },
    summer: { primary: 'metal', secondary: 'water', note: '夏水涸，庚生' },
    autumn: { primary: 'fire', secondary: 'tree', note: '秋水金旺，丙制' },
    winter: { primary: 'fire', secondary: 'earth', note: '冬水寒，丙戊暖' },
  },
  '癸': {
    spring: { primary: 'fire', secondary: 'tree', note: '春癸水冷，丙暖' },
    summer: { primary: 'metal', secondary: 'water', note: '夏水涸，庚辛源' },
    autumn: { primary: 'fire', secondary: 'metal', note: '秋金生水过旺，丙制' },
    winter: { primary: 'fire', secondary: 'earth', note: '冬癸极寒，丙戊' },
  },
};

export function getSeasonFromBranch(branch: string): Season {
  for (const [key, info] of Object.entries(SEASON_INFO) as [Season, typeof SEASON_INFO.spring][]) {
    if (info.branches.includes(branch)) return key;
  }
  return 'spring';
}

export function calculateJohu(pillars: PillarDetail[]): JohuStats {
  const dayStem = pillars[1].pillar.stem;
  const monthBranch = pillars[2].pillar.branch;
  const season = getSeasonFromBranch(monthBranch);
  const seasonInfo = SEASON_INFO[season];
  const row = JOHU_TABLE[dayStem]?.[season] ?? {
    primary: 'fire' as Element,
    note: '계절·일간 조후 균형',
  };

  const primaryLabel = `${ELEMENT_KOR[row.primary]}(${ELEMENT_HANJA[row.primary]})`;
  const secondaryLabel = row.secondary
    ? `${ELEMENT_KOR[row.secondary]}(${ELEMENT_HANJA[row.secondary]})`
    : undefined;
  const avoidLabel = row.avoid
    ? `${ELEMENT_KOR[row.avoid]}(${ELEMENT_HANJA[row.avoid]})`
    : undefined;

  const summary = `조후용신 ${primaryLabel}${secondaryLabel ? ` · 희 ${secondaryLabel}` : ''}`;
  const explanation =
    `${seasonInfo.label}(${seasonInfo.hanja}, 월지 ${monthBranch}) · ` +
    `일간 ${STEM_KOR[dayStem] ?? dayStem}(${dayStem}) 기준. ${row.note}`;

  return {
    season,
    seasonLabel: seasonInfo.label,
    seasonHanja: seasonInfo.hanja,
    dayStem,
    dayStemKor: STEM_KOR[dayStem] ?? dayStem,
    monthBranch,
    primary: row.primary,
    primaryLabel,
    secondary: row.secondary,
    secondaryLabel,
    avoid: row.avoid,
    avoidLabel,
    summary,
    explanation,
  };
}
