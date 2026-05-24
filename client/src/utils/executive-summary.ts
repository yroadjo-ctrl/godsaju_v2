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

/** AI 해석용 한 줄 핵심 요약 (조후·격국·용신·신강약) */
export function buildAiExecutiveSummaryLines(input: {
  sinGangYak?: SinGangYakStats
  gyeokguk?: GyeokgukStats
  johu?: JohuStats
  yongsin?: YongsinStats
}): string[] {
  const { sinGangYak, gyeokguk, johu, yongsin } = input
  if (!sinGangYak || !gyeokguk || !johu || !yongsin) return []

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

  const lines: string[] = [
    '■ 핵심 요약 (Executive Summary)',
    '',
    `- ${summaryLine}`,
  ]

  if (yongsin.hwaGeukSummary && yongsin.primarySource !== '화격') {
    lines.push(`- **화격(化格)**: ${yongsin.hwaGeukSummary}`)
  }
  if (yongsin.eokbuPrimary && yongsin.primarySource !== '억부') {
    lines.push(
      `- **억부용신(抑扶用神)**: ${yongsin.eokbuPrimary.label}(${yongsin.eokbuPrimary.hanja})`,
    )
  }

  lines.push('')
  lines.push('※ 아래 상세 표·운세는 이 요약의 근거 데이터입니다.')
  lines.push('')

  return lines
}
