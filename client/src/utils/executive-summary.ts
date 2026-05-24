import type {
  GyeokgukStats,
  JohuStats,
  SinGangYakStats,
  YongsinPrimarySource,
  YongsinStats,
} from '@core/types'

const SINGANG_HANJA: Record<string, string> = {
  '극약': '極弱',
  '태약': '太弱',
  '신약': '身弱',
  '중화신약': '中和身弱',
  '중화신강': '中和身強',
  '신강': '身強',
  '태강': '太強',
  '극왕': '極旺',
}

const SOURCE_HANJA: Record<YongsinPrimarySource, string> = {
  '억부': '抑扶',
  '조후': '調候',
  '화격': '化格',
}

export interface ExecutiveSummaryContent {
  summaryLine: string
  extras: Array<{ label: string; text: string }>
  footnote: string
}

/** 조후·격국·용신·신강약 한 줄 요약 (UI · AI 복사 공통) */
export function buildExecutiveSummaryContent(input: {
  sinGangYak?: SinGangYakStats
  gyeokguk?: GyeokgukStats
  johu?: JohuStats
  yongsin?: YongsinStats
}): ExecutiveSummaryContent | null {
  const { sinGangYak, gyeokguk, johu, yongsin } = input
  if (!sinGangYak || !gyeokguk || !johu || !yongsin) return null

  const sgHanja = SINGANG_HANJA[sinGangYak.level] ?? sinGangYak.level
  const sourceHanja = SOURCE_HANJA[yongsin.primarySource]
  const avoid = yongsin.avoid.map(a => `${a.label}(${a.hanja})`).join('·')

  const summaryLine = [
    `일간 ${yongsin.dayStemKor}(${yongsin.dayStem})`,
    `신강약(身強弱) ${sinGangYak.level}(${sgHanja})`,
    `격국(格局) ${gyeokguk.summary}`,
    `조후(調候) ${johu.primaryLabel}`,
    `용신(用神) ${yongsin.primary.label}(${yongsin.primary.hanja}) · ${yongsin.primarySource}(${sourceHanja})`,
    `희신(喜神) ${yongsin.secondary.label}(${yongsin.secondary.hanja})`,
    avoid ? `기신(忌神) ${avoid}` : null,
  ].filter(Boolean).join(' · ')

  const extras: ExecutiveSummaryContent['extras'] = []
  if (yongsin.hwaGeukSummary && yongsin.primarySource !== '화격') {
    extras.push({ label: '화격(化格)', text: yongsin.hwaGeukSummary })
  }
  if (yongsin.eokbuPrimary && yongsin.primarySource !== '억부') {
    extras.push({
      label: '억부용신(抑扶用神)',
      text: `${yongsin.eokbuPrimary.label}(${yongsin.eokbuPrimary.hanja})`,
    })
  }

  return {
    summaryLine,
    extras,
    footnote: '아래 상세 표·운세는 이 요약의 근거 데이터입니다.',
  }
}

/** AI 복사용 마크다운 줄 */
export function buildAiExecutiveSummaryLines(input: {
  sinGangYak?: SinGangYakStats
  gyeokguk?: GyeokgukStats
  johu?: JohuStats
  yongsin?: YongsinStats
}): string[] {
  const content = buildExecutiveSummaryContent(input)
  if (!content) return []

  const lines: string[] = [
    '■ 핵심 요약 (Executive Summary)',
    '',
    `- ${content.summaryLine}`,
  ]

  for (const extra of content.extras) {
    lines.push(`- **${extra.label}**: ${extra.text}`)
  }

  lines.push('')
  lines.push(`※ ${content.footnote}`)
  lines.push('')

  return lines
}
