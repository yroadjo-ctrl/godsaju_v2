import { toHangul } from '@core/pillars'

/** 간지 한글(한자) — 예: 계해(癸亥) */
export function formatGanziKorHanja(ganzi: string): string {
  if (!ganzi || ganzi.length < 2) return ganzi
  return `${toHangul(ganzi[0])}${toHangul(ganzi[1])}(${ganzi})`
}

/** 현재 O운 날짜 맥락 — 소운·대운·세운(년) / 월운(년·월) / 일운(월·일) */
export type CurrentYunContext =
  | { kind: 'year'; year: number }
  | { kind: 'yearMonth'; year: number; month: number }
  | { kind: 'monthDay'; month: number; day: number }

export function formatCurrentYunContext(ctx: CurrentYunContext): string {
  switch (ctx.kind) {
    case 'year':
      return `(${ctx.year}년)`
    case 'yearMonth':
      return `(${ctx.year}년 ${ctx.month}월)`
    case 'monthDay':
      return `(${ctx.month}월 ${ctx.day}일)`
  }
}

/** UI·AI 복사 공통 — 📍 현재 O운 : 계해(癸亥) (2026년) · 없음 (대운시작과 동일) */
export function formatCurrentYunLine(
  yunLabel: string,
  ganzi: string | null | undefined,
  pendingStartYear?: number | null,
  context?: CurrentYunContext | null,
  emptyReason?: string | null,
): string | null {
  if (ganzi) {
    const suffix = context ? ` ${formatCurrentYunContext(context)}` : ''
    return `📍 현재 ${yunLabel} : ${formatGanziKorHanja(ganzi)}${suffix}`
  }
  if (emptyReason) {
    return `📍 현재 ${yunLabel} : 없음 (${emptyReason})`
  }
  if (pendingStartYear != null) {
    return `📍 현재 ${yunLabel} : 없음 (${pendingStartYear}년에 시작)`
  }
  return null
}

/** 소운 없음 — 대운수 0 등 */
export const SOUN_EMPTY_REASON = '대운시작과 동일'
