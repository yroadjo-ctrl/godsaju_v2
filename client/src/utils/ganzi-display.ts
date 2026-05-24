import { toHangul } from '@core/pillars'

/** 간지 한글(한자) — 예: 계해(癸亥) */
export function formatGanziKorHanja(ganzi: string): string {
  if (!ganzi || ganzi.length < 2) return ganzi
  return `${toHangul(ganzi[0])}${toHangul(ganzi[1])}(${ganzi})`
}

/** UI·AI 복사 공통 — 📍 현재 O운 : 계해(癸亥) · 미시작 시 없음 (2036년에 시작) */
export function formatCurrentYunLine(
  yunLabel: string,
  ganzi: string | null | undefined,
  pendingStartYear?: number | null,
): string | null {
  if (ganzi) {
    return `📍 현재 ${yunLabel} : ${formatGanziKorHanja(ganzi)}`
  }
  if (pendingStartYear != null) {
    return `📍 현재 ${yunLabel} : 없음 (${pendingStartYear}년에 시작)`
  }
  return null
}
