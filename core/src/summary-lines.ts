import type { AllRelations, RelationResult, SpecialSinsal } from './types.ts';
import { ELEMENT_HANJA } from './constants.ts';

const PILLAR_SHORT = ['時', '日', '月', '年'] as const;

const SINSAL_HANJA: Record<string, string> = {
  '현침살': '懸針殺', '백호대살': '白虎大殺', '괴강살': '魁罡殺',
  '천을귀인': '天乙貴人', '태극귀인': '太極貴人', '월덕귀인': '月德貴人',
  '천덕귀인': '天德貴人', '홍염살': '紅艶殺', '도화살': '桃花殺',
  '양인살': '羊刃殺', '원진살': '怨嗔殺', '귀문관살': '鬼門關殺',
  '천문성': '天門星', '역마살': '驛馬殺', '망신살': '亡身殺',
  '장성살': '將星殺', '화개살': '華蓋殺', '겁살': '劫殺',
  '재살': '災殺', '천살': '天殺', '지살': '地殺',
  '연살': '年殺', '월살': '月殺', '일살': '日殺', '시살': '時殺',
};

const REL_TYPE_KOR: Record<string, string> = {
  '合': '합',
  '沖': '충',
  '刑': '형',
  '破': '파',
  '害': '해',
  '半合': '반합',
  '三合': '삼합',
  '方合': '방합',
  '怨嗔': '원진',
  '鬼門': '귀문',
};

function sinsalDisplay(name: string): string {
  const hanja = SINSAL_HANJA[name];
  return hanja ? `${name}(${hanja})` : name;
}

function pillarPairLabel(i: number, j: number): string {
  const a = Math.min(i, j);
  const b = Math.max(i, j);
  return `${PILLAR_SHORT[a]}·${PILLAR_SHORT[b]}`;
}

function formatRelationPart(
  r: RelationResult,
  char1: string,
  char2: string,
  pillarPair: string,
  layer?: '천간' | '지지',
): string {
  const typeKor = REL_TYPE_KOR[r.type] ?? r.type;
  const el = r.detail && ELEMENT_HANJA[r.detail as keyof typeof ELEMENT_HANJA]
    ? ELEMENT_HANJA[r.detail as keyof typeof ELEMENT_HANJA]
    : '';
  const layerPrefix = layer ? `${layer}` : '';
  return `${layerPrefix}${char1}${char2}${typeKor}${el ? `(${el})` : ''}(${pillarPair})`;
}

function pairKey(a: number, b: number): string {
  return `${Math.min(a, b)},${Math.max(a, b)}`;
}

/** 특수신살 한 줄 요약 (포스텔러식) */
export function buildSinsalSummaryLine(
  godSinsal: SpecialSinsal[],
  unknownTime?: boolean,
): string | null {
  const items = unknownTime
    ? godSinsal.filter(s => s.pillarIndex !== 0)
    : godSinsal;
  if (items.length === 0) return null;

  const byName = new Map<string, number[]>();
  for (const s of items) {
    const arr = byName.get(s.name) ?? [];
    arr.push(s.pillarIndex);
    byName.set(s.name, arr);
  }

  const parts = [...byName.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'ko'))
    .map(([name, indices]) => {
      const uniq = [...new Set(indices)].sort((x, y) => x - y);
      const pos = uniq.map(i => PILLAR_SHORT[i]).join('·');
      const hanja = SINSAL_HANJA[name];
      const inner = hanja ? `${hanja}, ${pos}` : pos;
      return `${name}(${inner})`;
    });

  return parts.join(' · ');
}

/** 원국 합충형파해 한 줄 요약 */
export function buildRelationsSummaryLine(
  relations: AllRelations,
  pillars: string[],
): string | null {
  const parts: string[] = [];

  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
      const rel = relations.pairs.get(pairKey(i, j));
      if (!rel) continue;
      const pp = pillarPairLabel(i, j);
      for (const r of rel.stem) {
        parts.push(formatRelationPart(r, pillars[i][0], pillars[j][0], pp, '천간'));
      }
      for (const r of rel.branch) {
        parts.push(formatRelationPart(r, pillars[i][1], pillars[j][1], pp, '지지'));
      }
    }
  }

  for (const r of relations.triple) {
    const el = r.detail && ELEMENT_HANJA[r.detail as keyof typeof ELEMENT_HANJA]
      ? ELEMENT_HANJA[r.detail as keyof typeof ELEMENT_HANJA]
      : '';
    const typeKor = REL_TYPE_KOR[r.type] ?? r.type;
    parts.push(`지지${typeKor}${el ? `(${el})` : ''}`);
  }
  for (const r of relations.directional) {
    const el = r.detail && ELEMENT_HANJA[r.detail as keyof typeof ELEMENT_HANJA]
      ? ELEMENT_HANJA[r.detail as keyof typeof ELEMENT_HANJA]
      : '';
    const typeKor = REL_TYPE_KOR[r.type] ?? r.type;
    parts.push(`지지${typeKor}${el ? `(${el})` : ''}`);
  }

  return parts.length > 0 ? parts.join(' · ') : null;
}

export { sinsalDisplay, SINSAL_HANJA };
