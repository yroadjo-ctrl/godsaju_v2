import { getStemRelation, getBranchRelation } from '@core/pillars'

const POS_LABELS = ['시', '일', '월', '년'] as const

const RELATION_TYPES = ['沖', '刑', '合', '半合', '破', '害', '怨嗔', '鬼門'] as const

export type YunBigoKind = 'gongmang' | 'interaction' | 'fuyin'

export interface YunBigoLine {
  kind: YunBigoKind
  text: string
  relationType?: string
}

export interface YunBigoInput {
  isGongmang: boolean
  /** newline or slash separated */
  interactions?: string
  fuYinFanYin?: string
}

/** 원국 [시,일,월,년] vs 운세 간지 — 합·충·형 등 */
export function collectNatalTransitInteractions(
  ganzi: string,
  natalGanzis: string[],
): string[] {
  if (ganzi.length < 2) return []

  const stem = ganzi[0]
  const branch = ganzi[1]
  const interArr: string[] = []

  natalGanzis.forEach((natal, idx) => {
    if (!natal || natal.length < 2) return
    const pos = POS_LABELS[idx] ?? '?'
    const natalStem = natal[0]
    const natalBranch = natal[1]

    const sRel = getStemRelation(natalStem, stem)
    if (sRel) {
      const sRels = Array.isArray(sRel) ? sRel : [sRel]
      sRels.forEach((rel) => {
        const label = typeof rel === 'object' ? (rel.type || '') : rel
        if (label) interArr.push(`${natalStem}${stem}${label}(${pos}간)`)
      })
    }

    const bRel = getBranchRelation(natalBranch, branch)
    if (bRel) {
      const bRels = Array.isArray(bRel) ? bRel : [bRel]
      bRels.forEach((rel) => {
        const label = typeof rel === 'object' ? (rel.type || '') : rel
        if (label) interArr.push(`${natalBranch}${branch}${label}(${pos}지)`)
      })
    }
  })

  return interArr
}

export function extractRelationType(text: string): string | undefined {
  for (const type of RELATION_TYPES) {
    if (text.includes(type)) return type
  }
  return undefined
}

function splitInteractions(raw?: string): string[] {
  if (!raw?.trim()) return []
  return raw
    .split(/\n|\s*\/\s*/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function buildYunBigoLines(input: YunBigoInput): YunBigoLine[] {
  const lines: YunBigoLine[] = []

  if (input.isGongmang) {
    lines.push({ kind: 'gongmang', text: '空亡' })
  }

  for (const text of splitInteractions(input.interactions)) {
    lines.push({
      kind: 'interaction',
      text,
      relationType: extractRelationType(text),
    })
  }

  const fuYin = input.fuYinFanYin?.trim()
  if (fuYin && fuYin !== '-') {
    for (const part of fuYin.split(/\s+/).filter(Boolean)) {
      lines.push({ kind: 'fuyin', text: part })
    }
  }

  return lines
}

/** AI·텍스트 export용 — 한 칸 문자열 (UI와 동일: ◇空亡) */
export function formatYunBigoPlainText(input: YunBigoInput): string {
  const lines = buildYunBigoLines(input)
  if (lines.length === 0) return '-'
  return lines.map((l) => (l.kind === 'gongmang' ? `◇${l.text}` : l.text)).join(' · ')
}

export function formatYunBigoPlainTextFromParts(
  isGongmang: boolean,
  interactions: string | string[],
  fuYinFanYin?: string,
): string {
  const interactionStr = Array.isArray(interactions)
    ? interactions.join('\n')
    : interactions
  return formatYunBigoPlainText({
    isGongmang,
    interactions: interactionStr,
    fuYinFanYin,
  })
}
