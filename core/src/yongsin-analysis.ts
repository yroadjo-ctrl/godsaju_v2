import type { Element, OhaengSipsinStats, SinGangYakStats } from './types.ts';
import type { JohuStats } from './johu-analysis.ts';
import type { GyeokgukStats } from './gyeokguk-analysis.ts';
import type { HapHwaStats } from './hap-hwa-analysis.ts';
import { ELEMENT_HANJA } from './constants.ts';

export interface YongsinElementInfo {
  element: Element;
  label: string;
  hanja: string;
  sipsinRole: string;
  sipsinHanja: string;
  percent: number;
}

export interface YongsinStats {
  method: string;
  methodHanja: string;
  dayStem: string;
  dayStemKor: string;
  dayElement: Element;
  sinGangLevel: string;
  isStrong: boolean;
  /** 억부용신 (主) */
  primary: YongsinElementInfo;
  /** 희신 (輔) */
  secondary: YongsinElementInfo;
  /** 기신 (忌) */
  avoid: YongsinElementInfo[];
  summary: string;
  explanation: string;
  /** 조후·격국·합화 보정 레이어 */
  johuPrimary?: YongsinElementInfo;
  johuSummary?: string;
  gyeokgukPattern?: string;
  gyeokgukSummary?: string;
  hapHwaSummary?: string;
  ohaengBasis?: string;
}

const ELEMENT_KOR: Record<Element, string> = {
  tree: '목', fire: '화', earth: '토', metal: '금', water: '수',
};

const ELEMENT_CYCLE: Record<Element, {
  input: Element;
  same: Element;
  output: Element;
  wealth: Element;
  officer: Element;
}> = {
  tree: { input: 'water', same: 'tree', output: 'fire', wealth: 'earth', officer: 'metal' },
  fire: { input: 'tree', same: 'fire', output: 'earth', wealth: 'metal', officer: 'water' },
  earth: { input: 'fire', same: 'earth', output: 'metal', wealth: 'water', officer: 'tree' },
  metal: { input: 'earth', same: 'metal', output: 'water', wealth: 'tree', officer: 'fire' },
  water: { input: 'metal', same: 'water', output: 'tree', wealth: 'fire', officer: 'earth' },
};

const WEAK_ROLES: Record<'same' | 'input' | 'officer' | 'wealth', { role: string; hanja: string }> = {
  same: { role: '비겁', hanja: '比劫' },
  input: { role: '인성', hanja: '印星' },
  officer: { role: '관성', hanja: '官星' },
  wealth: { role: '재성', hanja: '財星' },
};

const STRONG_ROLES: Record<'officer' | 'output' | 'wealth' | 'same' | 'input', { role: string; hanja: string }> = {
  officer: { role: '관성', hanja: '官星' },
  output: { role: '식상', hanja: '食傷' },
  wealth: { role: '재성', hanja: '財星' },
  same: { role: '비겁', hanja: '比劫' },
  input: { role: '인성', hanja: '印星' },
};

function elementInfo(
  el: Element,
  roleKey: keyof typeof WEAK_ROLES,
  percent: number,
  roles: typeof WEAK_ROLES | typeof STRONG_ROLES,
): YongsinElementInfo {
  const r = roles[roleKey as keyof typeof roles];
  return {
    element: el,
    label: ELEMENT_KOR[el],
    hanja: ELEMENT_HANJA[el],
    sipsinRole: r.role,
    sipsinHanja: r.hanja,
    percent,
  };
}

function percentMap(ohaeng: OhaengSipsinStats): Record<Element, number> {
  return Object.fromEntries(ohaeng.elements.map(e => [e.element, e.percent])) as Record<Element, number>;
}

function buildYongsinResult(
  sinGangYak: SinGangYakStats,
  dayEl: Element,
  primary: YongsinElementInfo,
  secondary: YongsinElementInfo,
  avoid: YongsinElementInfo[],
  summary: string,
  explanation: string,
  options: { johu?: JohuStats; gyeokguk?: GyeokgukStats; hapHwa?: HapHwaStats } | undefined,
  ohaengSipsin: OhaengSipsinStats,
  isStrong: boolean,
): YongsinStats {
  const johu = options?.johu;
  const gyeokguk = options?.gyeokguk;
  const hapHwa = options?.hapHwa;

  const johuPrimary = johu ? {
    element: johu.primary,
    label: ELEMENT_KOR[johu.primary],
    hanja: ELEMENT_HANJA[johu.primary],
    sipsinRole: '조후',
    sipsinHanja: '調候',
    percent: ohaengSipsin.elements.find(e => e.element === johu.primary)?.percent ?? 0,
  } : undefined;

  const extraNotes: string[] = [];
  if (johu) extraNotes.push(`조후: ${johu.summary}`);
  if (gyeokguk) extraNotes.push(`격국: ${gyeokguk.summary}`);
  if (hapHwa && hapHwa.events.some(e => e.established)) {
    extraNotes.push(`합화: ${hapHwa.summary}`);
  }
  if (extraNotes.length > 0) {
    explanation += ` ${extraNotes.join(' · ')}.`;
  }

  return {
    method: extraNotes.length > 0 ? '억부·조후·격국 종합' : '억부용신',
    methodHanja: extraNotes.length > 0 ? '抑扶·調候·格局' : '抑扶用神',
    dayStem: sinGangYak.dayStem,
    dayStemKor: sinGangYak.dayStemKor,
    dayElement: dayEl,
    sinGangLevel: sinGangYak.level,
    isStrong,
    primary,
    secondary,
    avoid,
    summary,
    explanation,
    johuPrimary,
    johuSummary: johu?.summary,
    gyeokgukPattern: gyeokguk?.hanja,
    gyeokgukSummary: gyeokguk?.summary,
    hapHwaSummary: hapHwa?.summary,
    ohaengBasis: ohaengSipsin.basisLabel,
  };
}

/** 신강·신약·오행 비율 기준 억부용신 */
export function calculateYongsin(
  sinGangYak: SinGangYakStats,
  ohaengSipsin: OhaengSipsinStats,
  options?: {
    johu?: JohuStats;
    gyeokguk?: GyeokgukStats;
    hapHwa?: HapHwaStats;
  },
): YongsinStats {
  const dayEl = ohaengSipsin.dayElement;
  const cycle = ELEMENT_CYCLE[dayEl];
  const pct = percentMap(ohaengSipsin);

  if (!sinGangYak.isStrong) {
    const primary = elementInfo(cycle.same, 'same', pct[cycle.same] ?? 0, WEAK_ROLES);
    const secondary = elementInfo(cycle.input, 'input', pct[cycle.input] ?? 0, WEAK_ROLES);
    const avoid = [
      elementInfo(cycle.officer, 'officer', pct[cycle.officer] ?? 0, WEAK_ROLES),
      elementInfo(cycle.wealth, 'wealth', pct[cycle.wealth] ?? 0, WEAK_ROLES),
    ];

    const summary = `${primary.label}(${primary.hanja}) · 억부용신`;
    const explanation =
      `${sinGangYak.level}으로 일간이 약하므로, 같은 오행·생해 주는 오행을 돕는 억부법을 씁니다. ` +
      `용신(用神)은 ${primary.label}(${primary.hanja}, ${primary.sipsinRole}/${primary.sipsinHanja}), ` +
      `희신(喜神)은 ${secondary.label}(${secondary.hanja}, ${secondary.sipsinRole}/${secondary.sipsinHanja})입니다. ` +
      `기신(忌神)은 ${avoid.map(a => `${a.label}(${a.hanja})`).join('·')} 쪽입니다.`;

    return buildYongsinResult(
      sinGangYak, dayEl, primary, secondary, avoid, summary, explanation, options, ohaengSipsin, false,
    );
  }

  const drainCandidates: Array<{ key: 'officer' | 'output' | 'wealth'; el: Element }> = [
    { key: 'officer', el: cycle.officer },
    { key: 'output', el: cycle.output },
    { key: 'wealth', el: cycle.wealth },
  ];
  drainCandidates.sort((a, b) => (pct[a.el] ?? 0) - (pct[b.el] ?? 0));
  const picked = drainCandidates[0];
  const secondPick = drainCandidates[1];

  const primary = elementInfo(picked.el, picked.key, pct[picked.el] ?? 0, STRONG_ROLES);
  const secondary = elementInfo(secondPick.el, secondPick.key, pct[secondPick.el] ?? 0, STRONG_ROLES);
  const avoid = [
    elementInfo(cycle.same, 'same', pct[cycle.same] ?? 0, STRONG_ROLES),
    elementInfo(cycle.input, 'input', pct[cycle.input] ?? 0, STRONG_ROLES),
  ];

  const summary = `${primary.label}(${primary.hanja}) · 억부용신`;
  const explanation =
    `${sinGangYak.level}으로 일간이 강하므로, 설기·극제·재성으로 기운을 빼는 억부법을 씁니다. ` +
    `용신(用神)은 ${primary.label}(${primary.hanja}, ${primary.sipsinRole}/${primary.sipsinHanja}), ` +
    `희신(喜神)은 ${secondary.label}(${secondary.hanja}, ${secondary.sipsinRole}/${secondary.sipsinHanja})입니다. ` +
    `기신(忌神)은 ${avoid.map(a => `${a.label}(${a.hanja})`).join('·')} 쪽입니다.`;

  return buildYongsinResult(
    sinGangYak, dayEl, primary, secondary, avoid, summary, explanation, options, ohaengSipsin, true,
  );
}
