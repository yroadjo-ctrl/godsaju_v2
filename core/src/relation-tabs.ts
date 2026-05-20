import type { AllRelations } from './types.ts';
import { ELEMENT_HANJA } from './constants.ts';

const PILLAR_SHORT = ['時', '日', '月', '年'] as const;
const PILLAR_KOR = ['시', '일', '월', '년'] as const;

export type RelationTabId =
  | 'all'
  | 'hap'
  | 'chung'
  | 'hyeong'
  | 'pa'
  | 'triple'
  | 'wonjin';

export interface RelationTabDef {
  id: RelationTabId;
  label: string;
  hanja: string;
}

export const RELATION_TABS: RelationTabDef[] = [
  { id: 'all', label: '전체', hanja: '全' },
  { id: 'hap', label: '합', hanja: '合' },
  { id: 'chung', label: '충', hanja: '沖' },
  { id: 'hyeong', label: '형', hanja: '刑' },
  { id: 'pa', label: '파·해', hanja: '破害' },
  { id: 'triple', label: '삼합·방합', hanja: '三合' },
  { id: 'wonjin', label: '원진·귀문', hanja: '怨嗔' },
];

export interface RelationListItem {
  tab: RelationTabId;
  type: string;
  layer: '천간' | '지지' | '삼합' | '방합';
  char1: string;
  char2: string;
  pillarPair: string;
  detail: string | null;
  note?: string;
}

function pairKey(a: number, b: number): string {
  return `${Math.min(a, b)},${Math.max(a, b)}`;
}

function pillarPairLabel(i: number, j: number): string {
  const a = Math.min(i, j);
  const b = Math.max(i, j);
  return `${PILLAR_SHORT[a]}·${PILLAR_SHORT[b]}(${PILLAR_KOR[a]}·${PILLAR_KOR[b]})`;
}

function tabForType(type: string): RelationTabId | null {
  if (type === '合' || type === '半合') return 'hap';
  if (type === '沖') return 'chung';
  if (type === '刑') return 'hyeong';
  if (type === '破' || type === '害') return 'pa';
  if (type === '怨嗔' || type === '鬼門') return 'wonjin';
  return null;
}

const BANHAP_NOTE = '삼합의 두 지지만 만날 때 성립하는 불완전 합(해당 오행 국이 예정됨)';

function elementLabel(detail: string | null): string {
  if (!detail) return '';
  const el = ELEMENT_HANJA[detail as keyof typeof ELEMENT_HANJA];
  return el ? `(${el})` : detail ? `(${detail})` : '';
}

/** 탭별 관계 목록 (원국 4주) */
export function collectRelationListItems(
  relations: AllRelations,
  pillars: string[],
): RelationListItem[] {
  const items: RelationListItem[] = [];

  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
      const rel = relations.pairs.get(pairKey(i, j));
      if (!rel) continue;
      const pp = pillarPairLabel(i, j);

      for (const r of rel.stem) {
        const tab = tabForType(r.type);
        if (!tab) continue;
        items.push({
          tab,
          type: r.type,
          layer: '천간',
          char1: pillars[i][0],
          char2: pillars[j][0],
          pillarPair: pp,
          detail: r.detail,
        });
      }
      for (const r of rel.branch) {
        const tab = tabForType(r.type);
        if (!tab) continue;
        items.push({
          tab,
          type: r.type,
          layer: '지지',
          char1: pillars[i][1],
          char2: pillars[j][1],
          pillarPair: pp,
          detail: r.detail,
          note: r.type === '半合' ? BANHAP_NOTE : undefined,
        });
      }
    }
  }

  for (const r of relations.triple) {
    items.push({
      tab: 'triple',
      type: r.type,
      layer: '삼합',
      char1: '',
      char2: '',
      pillarPair: '원국 지지',
      detail: r.detail,
      note: '寅午戌·申子辰·亥卯未·巳酉丑 중 해당 조합',
    });
  }
  for (const r of relations.directional) {
    items.push({
      tab: 'triple',
      type: r.type,
      layer: '방합',
      char1: '',
      char2: '',
      pillarPair: '원국 지지',
      detail: r.detail,
      note: '寅卯辰·巳午未·申酉戌·亥子丑 방위 3합',
    });
  }

  return items;
}

export function formatRelationListItem(item: RelationListItem): string {
  const el = elementLabel(item.detail);
  const chars = item.char1 && item.char2 ? `${item.char1}${item.char2}` : '';
  const layer = item.layer !== '삼합' && item.layer !== '방합' ? `${item.layer} ` : '';
  return `${layer}${chars}${item.type}${el} · ${item.pillarPair}`;
}

export function countByTab(items: RelationListItem[]): Record<RelationTabId, number> {
  const counts: Record<RelationTabId, number> = {
    all: items.length, hap: 0, chung: 0, hyeong: 0, pa: 0, triple: 0, wonjin: 0,
  };
  for (const item of items) {
    counts[item.tab]++;
  }
  return counts;
}
