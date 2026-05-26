import { Solar } from 'lunar-javascript'
import type { SajuResult, ZiweiChart, LiuNianInfo, NatalChart } from '@core/types'
import { ELEMENT_HANJA, PILLAR_NAMES, PALACE_NAMES, MAIN_STAR_NAMES, JIJANGGAN, GONGMANG_TABLE, HGANJI } from '@core/constants'
import { getDaxianList } from '@core/ziwei'
import { formatRelation, fmt2, formatSinsal, getStemAttr, getBranchAttr } from './format.ts'
import { ZODIAC_SYMBOLS, PLANET_SYMBOLS, ASPECT_SYMBOLS, ROMAN, formatDegree } from '@core/natal'
import { t as translate, getLocale } from '../i18n/index.ts'
import { getTwelveMeteor, getTwelveSpirit, getRelation, getJeonggi, getStemRelation, getBranchRelation, getDayPillarForDate } from '@core/pillars'
import {
  formatHelpSipsinRatio,
  buildSinsalSummaryLine,
  buildRelationsSummaryLine,
  calculateMonthPillarBasisFromInput,
  buildJieQiDateKeyMap,
  formatMonthlyJieQiCell,
  formatLichunBoundaryCell,
  formatDaewoonStartCell,
  annotateTransit,
  getLiuNianGanziForCalendarYear,
  getLiuYueGanziForCalendarMonth,
} from '@core/index'
import { PILLAR_TABLE_LABELS, pillarLabelForExport } from './pillar-table-labels.ts'
import {
  formatBirthInfoRow,
  formatCalculationBasisLines,
  formatMonthPillarBasisLines,
} from './birth-info-format.ts'
import { isKongwang } from '@core/monthly-data'
import { YUN_METHOD_NOTES, YUN_DAewoon_EXPORT_NOTES, YUN_SEWOON_EXPORT_NOTES, YUN_SOUN_EXPORT_NOTES } from './yun-method-notes.ts'
import { formatCurrentYunLine, type CurrentYunContext, SOUN_EMPTY_REASON } from './ganzi-display.ts'
import { formatDaewoonAgeBridgeNote } from './yun-age-notes.ts'
import {
  findActiveDaewoonIndex,
  isBeforeFirstDaewoon,
  getFirstDaewoonStartYear,
  getCurrentLiuNianGanzi,
  getCurrentLiuYueGanzi,
  getEffectiveYunCalendarYear,
} from './yun-period.ts'
import { getManAgeInCalendarYear } from '@core/age'
import { buildAiExecutiveSummaryLines } from './executive-summary.ts'
import { formatYunBigoPlainText, collectNatalTransitInteractions } from './yun-bigo.ts'
import { formatZiweiInline, formatZhiKorHanja } from './ziwei-labels.ts'
import { formatGanziKorHanja } from './ganzi-display.ts'
import { buildZiweiBirthInfoLines, buildZiweiPalaceGridText } from './ziwei-palace-grid.ts'
import type { Locale } from '../i18n/index.ts'

/** AI 복사 섹션 제목 (■ 접두) */
function sectionTitle(title: string): string {
  return `■ ${title}`
}

/** 현재 로케일의 t() 래퍼 생성 */
function makeT(locale?: Locale) {
  const l = locale ?? getLocale()
  return (key: string) => translate(l, key)
}

/** 사주 결과를 CLI 형식 텍스트로 변환 */
export function sajuToText(
  result: SajuResult,
  locale?: Locale,
  monthlyYear?: number,
  selectedDaewoonIdx?: number,
): string {
  const t = makeT(locale)
  const {
    input, pillars, daewoon, soun, daewoonMeta, relations, gongmang,
    ohaengSipsin, ohaengSipsinWeighted, ohaengSipsinAdjusted,
    hapHwa, johu, gyeokguk, sinGangYak, yongsin, taewonTaesik,
  } = result
  const natalGanzis = pillars.map((p) => p.pillar.ganzi)
  const lines: string[] = []

  // 음양오행 변환 맵 (PillarTable.tsx와 동일)
  const stemKoreanMap: Record<string, string> = {
    '甲': '갑', '乙': '을', '丙': '병', '丁': '정',
    '戊': '무', '己': '기', '庚': '경', '辛': '신',
    '壬': '임', '癸': '계'
  }
  
  const branchKoreanMap: Record<string, string> = {
    '子': '자', '丑': '축', '寅': '인', '卯': '묘',
    '辰': '진', '巳': '사', '午': '오', '未': '미',
    '申': '신', '酉': '유', '戌': '술', '亥': '해'
  }
  
  const stemYinYangMap: Record<string, string> = {
    '甲': '陽木', '乙': '陰木', '丙': '陽火', '丁': '陰火',
    '戊': '陽土', '己': '陰土', '庚': '陽金', '辛': '陰金',
    '壬': '陽水', '癸': '陰水',
  }
  
  const branchYinYangMap: Record<string, string> = {
    '子': '陽水', '丑': '陰土', '寅': '陽木', '卯': '陰木',
    '辰': '陽土', '巳': '陰火', '午': '陽火', '未': '陰土',
    '申': '陽金', '酉': '陰金', '戌': '陽土', '亥': '陰水',
  }
  
  // 사주 원국 각 자리별 고정 육친 명칭 (남성 사주 기준)
  const fixedRelations = {
    0: { stem: '아들', branch: '딸' },        // 시주 (hour)
    1: { stem: '자신', branch: '배우자' },    // 일주 (day)
    2: { stem: '부친', branch: '모친' },      // 월주 (month)
    3: { stem: '조부', branch: '조모' },      // 년주 (year)
  }
  
  // 음양오행 한글 변환 함수 (PillarTable.tsx와 동일)
  const formatYinYang = (yinYang: string): string => {
    return yinYang
      .replace(/陽|陰/, m => m === '陽' ? '양' : '음')
      .replace(/木/, '목')
      .replace(/火/, '화')
      .replace(/土/, '토')
      .replace(/金/, '금')
      .replace(/水/, '수')
  }
  
  // 귀인 한자 병기 매핑 (PillarTable.tsx와 동일, 귀인 제외)
  const GUIIN_HANJA: Record<string, string> = {
    '천을귀인': '天乙',
    '천덕귀인': '天德',
    '월덕귀인': '月德',
    '태극귀인': '太極',
    '문창귀인': '文昌',
    '복성귀인': '福星',
    '홍란귀인': '紅鸞',
  }

  // 귀인 정보 추출 (PillarTable.tsx와 동일)
  const getGuiinForPillar = (pillarIndex: number): string => {
    const pillar = pillars[pillarIndex] as any
    if (pillar?.guiin && Array.isArray(pillar.guiin) && pillar.guiin.length > 0) {
      return pillar.guiin
        .map((g: any) => {
          const hanja = GUIIN_HANJA[g.name]
          return hanja ? `${g.name}(${hanja})` : g.name
        })
        .join(' / ')
    }
    return '-'
  }
  
  // 고정폭 계산 함수 (전각/반각 문자 처리)
  const getDisplayWidth = (str: string): number => {
    let width = 0
    for (const char of str) {
      const code = char.charCodeAt(0)
      // 한글, 한자, CJK 문자는 전각(2)
      if ((code >= 0xac00 && code <= 0xd7a3) || // 한글
          (code >= 0x4e00 && code <= 0x9fff) || // CJK 통합 ideo그래프
          (code >= 0x3040 && code <= 0x309f) || // 히라가나
          (code >= 0x30a0 && code <= 0x30ff)) { // 가타가나
        width += 2
      } else {
        width += 1
      }
    }
    return width
  }
  
  // 고정폭 문자열 생성 함수
  const padFixedWidth = (str: string, targetWidth: number): string => {
    const currentWidth = getDisplayWidth(str)
    const spacesNeeded = Math.max(0, targetWidth - currentWidth)
    return str + ' '.repeat(spacesNeeded)
  }
  
  // 가로선 생성 함수 (+ 기호 사용)
  const createHorizontalLine = (columnCount: number, columnWidth: number): string => {
    let line = ''
    for (let i = 0; i < columnCount; i++) {
      if (i === 0) {
        line += '┼' + '─'.repeat(columnWidth - 1)
      } else {
        line += '┼' + '─'.repeat(columnWidth - 1)
      }
    }
    return line
  }

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const effectiveYunYear = getEffectiveYunCalendarYear(now)
  const currentSounGanzi = soun.find((s) => s.year === effectiveYunYear)?.ganzi ?? null
  const beforeFirstDaewoon = isBeforeFirstDaewoon(daewoon, now)
  const activeDwIdx = daewoon.length > 0 ? findActiveDaewoonIndex(daewoon, now) : -1
  const currentDaewoonGanzi = !beforeFirstDaewoon && activeDwIdx >= 0
    ? daewoon[activeDwIdx]?.ganzi ?? null
    : null
  const pendingStartYear = beforeFirstDaewoon ? getFirstDaewoonStartYear(daewoon) : null
  const currentSewoonGanzi = beforeFirstDaewoon ? null : getCurrentLiuNianGanzi(now)
  const currentMonthGanzi = getCurrentLiuYueGanzi(now)
  const currentDayGanzi = getDayPillarForDate(currentYear, currentMonth, now.getDate())

  const pushCurrentYun = (
    label: string,
    ganzi: string | null | undefined,
    pendingYear?: number | null,
    context?: CurrentYunContext | null,
    emptyReason?: string | null,
  ) => {
    const line = formatCurrentYunLine(label, ganzi, pendingYear, context, emptyReason)
    if (line) lines.push(line)
  }

  lines.push(sectionTitle('출생정보(出生情報)'))
  lines.push('')
  lines.push('| 이름 | 생년월일시 | 시간(12간지) / 통자시·야자시 / 성별 | 출생위치 |')
  lines.push('| --- | --- | --- | --- |')
  lines.push(formatBirthInfoRow(input))
  lines.push('')

  for (const line of buildAiExecutiveSummaryLines({ sinGangYak, gyeokguk, johu, yongsin })) {
    lines.push(line)
  }

  lines.push(sectionTitle('사주원국 (四柱原局)'))
  lines.push('')
  for (const line of formatCalculationBasisLines(input)) {
    lines.push(line)
  }
  lines.push('')
  lines.push('절기·월주 근거:')
  for (const line of formatMonthPillarBasisLines(calculateMonthPillarBasisFromInput(input))) {
    lines.push(`- ${line}`)
  }
  lines.push('- ※ 절기 시·분: lunar-javascript + KST(+1h). 년·월주는 입춘·12節 기준.')
  lines.push('')

  const headerLabels = ['時柱', '日柱', '月柱', '年柱']
  const headerDesc1 = ['말년운(60세~)', '중년운(40~60세)', '청년운(20~40세)', '초년운(0~20세)']
  const headerDesc2 = ['자녀운, 결실', '정체성, 자아', '부모, 사회상', '조상, 시대상']
  const q = input.unknownTime

  const L = PILLAR_TABLE_LABELS
  const cat = pillarLabelForExport(L.category)

  lines.push(`| ${cat} | ${headerLabels.join(' | ')} |`)
  lines.push(`|  | ${headerDesc1.join(' | ')} |`)
  lines.push(`|  | ${headerDesc2.join(' | ')} |`)
  lines.push('|---|---|---|---|---|')

  // 천간 행
  lines.push(`| ${pillarLabelForExport(L.stem)} | ${pillars.map((p, i) => {
    if (i === 0 && q) return '?'
    const stem = p.pillar.stem
    const yinYang = formatYinYang(stemYinYangMap[stem] || '')
    const relation = (fixedRelations as any)[i]?.stem || ''
    return `${stem}(${yinYang})(${relation})`
  }).join(' | ')} |`)

  // 십성(천간) 행
  lines.push(`| ${pillarLabelForExport(L.sipsin)} | ${pillars.map((p, i) => i === 0 && q ? '?' : p.stemSipsin).join(' | ')} |`)

  // 지지 행
  lines.push(`| ${pillarLabelForExport(L.branch)} | ${pillars.map((p, i) => {
    if (i === 0 && q) return '?'
    const branch = p.pillar.branch
    const yinYang = formatYinYang(branchYinYangMap[branch] || '')
    const relation = (fixedRelations as any)[i]?.branch || ''
    return `${branch}(${yinYang})(${relation})`
  }).join(' | ')} |`)

  // 십성(지지) 행
  lines.push(`| ${pillarLabelForExport(L.sipsin)} | ${pillars.map((p, i) => i === 0 && q ? '?' : p.branchSipsin).join(' | ')} |`)

  // 지장간 행
  lines.push(`| ${pillarLabelForExport(L.jigang)} | ${pillars.map((p, i) => i === 0 && q ? '?' : p.jigang).join(' | ')} |`)

  // 12운성 행
  lines.push(`| ${pillarLabelForExport(L.unseong)} | ${pillars.map((p, i) => i === 0 && q ? '?' : p.unseong).join(' | ')} |`)

  // 12신살 행
  lines.push(`| ${pillarLabelForExport(L.sinsal)} | ${pillars.map((p, i) => i === 0 && q ? '?' : p.sinsal).join(' | ')} |`)

  // 나음 행
  lines.push(`| ${pillarLabelForExport(L.nayeon)} | ${pillars.map((p, i) => i === 0 && q ? '?' : p.nayeon).join(' | ')} |`)

  // 귀인 행
  lines.push(`| ${pillarLabelForExport(L.guiin)} | ${pillars.map((p, i) => i === 0 && q ? '?' : getGuiinForPillar(i)).join(' | ')} |`)

  // 공망 행 (UI와 동일: 空亡 + 공망지지)
  lines.push(`| ${pillarLabelForExport(L.gongmang)} | ${pillars.map((p, i) => {
    if (i === 0 && q) return '?'
    const hasGongmang = gongmang.pillarIndices.includes(i)
    return hasGongmang
      ? `空亡 (${gongmang.branches[0]}${gongmang.branches[1]})`
      : '-'
  }).join(' | ')} |`)

  lines.push('')
  lines.push(sectionTitle('태원(胎元) · 태식(胎息)'))
  lines.push('')
  lines.push(`※ ${taewonTaesik.methodNote}`)
  lines.push('')
  lines.push('| 구분 | 간지 | 천간십성 | 지지십성 | 納音 |')
  lines.push('| --- | --- | --- | --- | --- |')
  lines.push(`| 태원(胎元) | ${taewonTaesik.taewon.ganzi} | ${taewonTaesik.taewon.stemSipsin} | ${taewonTaesik.taewon.branchSipsin} | ${taewonTaesik.taewon.nayeon} |`)
  lines.push(`| 태식(胎息) | ${taewonTaesik.taesik.ganzi} | ${taewonTaesik.taesik.stemSipsin} | ${taewonTaesik.taesik.branchSipsin} | ${taewonTaesik.taesik.nayeon} |`)
  lines.push('')

  // 오행·십성 분석
  const appendOhaengBlock = (title: string, os: typeof ohaengSipsin) => {
    lines.push(sectionTitle(title))
    lines.push('')
    lines.push('| 오행 | 비율 | 상태 |')
    lines.push('|------|------|------|')
    for (const el of os.elements) {
      const pct = el.percent > 0 ? `${el.percent}%` : '-'
      const status = el.status === '없음' ? '-' : el.status
      lines.push(`| ${el.label}(${el.hanja}) | ${pct} | ${status} |`)
    }
    lines.push('')
    lines.push('| 십성 (十星) | 비율 | 상태 |')
    lines.push('|------|------|------|')
    for (const s of os.sipsin) {
      const pct = s.percent > 0 ? `${s.percent}%` : '-'
      const status = s.status === '없음' ? '-' : s.status
      lines.push(`| ${s.hangul}(${s.hanja}) | ${pct} | ${status} |`)
    }
    lines.push('')
  }

  if (ohaengSipsin && ohaengSipsinWeighted && ohaengSipsinAdjusted) {
    appendOhaengBlock(
      `오행 · 십성 (표면 8글자) (일간 ${ohaengSipsin.dayStemKor}(${ohaengSipsin.dayStem}) ${ohaengSipsin.dayElementLabel})`,
      ohaengSipsin,
    )
    appendOhaengBlock(
      `오행 · 십성 (지장간 가중 6:3:1) (일간 ${ohaengSipsinWeighted.dayStemKor}(${ohaengSipsinWeighted.dayStem}))`,
      ohaengSipsinWeighted,
    )
    appendOhaengBlock(
      `오행 · 십성 (합화 보정) (일간 ${ohaengSipsinAdjusted.dayStemKor}(${ohaengSipsinAdjusted.dayStem}))`,
      ohaengSipsinAdjusted,
    )
    lines.push('※ 발달(20%↑)·적정(10~20%)·부족(10%↓).')
    lines.push('')
  } else if (ohaengSipsin) {
    const os = ohaengSipsin
    lines.push(sectionTitle(`오행 · 십성 (五行 · 十星) 분석 (일간 ${os.dayStemKor}(${os.dayStem}) ${os.dayElementLabel}, 원국 ${os.totalCharSlots}글자 기준)`))
    lines.push('')
    lines.push('| 오행 | 비율 | 상태 |')
    lines.push('|------|------|------|')
    for (const el of os.elements) {
      const pct = el.percent > 0 ? `${el.percent}%` : '-'
      const status = el.status === '없음' ? '-' : el.status
      lines.push(`| ${el.label}(${el.hanja}) | ${pct} | ${status} |`)
    }
    lines.push('')
    lines.push('| 십성 (十星) | 비율 | 상태 |')
    lines.push('|------|------|------|')
    for (const s of os.sipsin) {
      const pct = s.percent > 0 ? `${s.percent}%` : '-'
      const status = s.status === '없음' ? '-' : s.status
      lines.push(`| ${s.hangul}(${s.hanja}) | ${pct} | ${status} |`)
    }
    lines.push('')
    lines.push('※ 발달(20%↑)·적정(10~20%)·부족(10%↓).')
    lines.push('')
  }

  // 조후·합화·격국
  if (johu && hapHwa && gyeokguk) {
    lines.push(sectionTitle('조후(調候) · 합화(合化) · 격국(格局)'))
    lines.push('')
    lines.push(`- **조후(調候)**: ${johu.summary}`)
    lines.push(`  ${johu.explanation}`)
    if (johu.secondaryLabel) {
      lines.push(`  - 조후희신(調候喜神): ${johu.secondaryLabel}`)
    }
    if (johu.avoidLabel) {
      lines.push(`  - 조후기신(調候忌神): ${johu.avoidLabel}`)
    }
    lines.push(`- **합화(合化)**: ${hapHwa.summary}`)
    if (hapHwa.hwaGeuk.length > 0) {
      for (const h of hapHwa.hwaGeuk) {
        lines.push(`  - **화격(化格)**: ${h.name}(${h.hanja}) — ${h.source}`)
      }
    }
    const pairEvents = hapHwa.events.filter(e => e.kind === 'stem' || e.kind === 'branch')
    const bureauEvents = hapHwa.events.filter(e => e.kind === 'triple' || e.kind === 'directional')
    const pairKindLabel: Record<string, string> = {
      stem: '천간합(天干合)',
      branch: '지지합(地支合)',
    }
    for (const e of pairEvents) {
      lines.push(`  - ${pairKindLabel[e.kind] ?? ''} ${e.label}: ${e.established ? '성립' : '불성립'} (${e.reason})`)
    }
    for (const e of bureauEvents) {
      const kind = e.kind === 'triple' ? '삼합(三合)' : '방합(方合)'
      lines.push(`  - ${kind} ${e.label}: ${e.established ? '성립' : '불성립'} (${e.reason})`)
    }
    const gyeokgukTag = gyeokguk.category === '화격' ? ' · 화격(化格)' : ''
    lines.push(`- **격국(格局)${gyeokgukTag}**: ${gyeokguk.summary} — ${gyeokguk.explanation}`)
    lines.push('')
  }

  // 신강·신약
  if (sinGangYak) {
    const sg = sinGangYak
    lines.push(sectionTitle(`신강·신약 (身強·身弱) (일간 ${sg.dayStemKor}(${sg.dayStem}))`))
    lines.push('')
    lines.push(`| 항목 | 판정 |`)
    lines.push(`|------|------|`)
    for (const f of sg.flags) {
      lines.push(`| ${f.label}(${f.hanja}) | ${f.ok ? '○' : '×'} |`)
    }
    lines.push('')
    lines.push(`- **결론**: ${sg.level} — ${sg.conclusion}`)
    lines.push(`- **득력(得勢)**: ${sg.score}/4 (득령·득지·득시·득세)`)
    lines.push(`- **일간 세력 비율**: ${formatHelpSipsinRatio(sg.helpCount, sg.totalCount)} → 약 ${sg.strengthPercent}% (${sg.basisLabel} 기준)`)
    if (sg.surfaceStrengthPercent != null && sg.surfaceHelpCount != null && sg.surfaceTotalCount != null) {
      lines.push(`- **표면 십성 기준**: ${formatHelpSipsinRatio(sg.surfaceHelpCount, sg.surfaceTotalCount)} → 약 ${sg.surfaceStrengthPercent}%`)
    }
    lines.push('')
    lines.push('※ 득지(得地)=일지, 득시(得時)=시지. 득세(得勢)는 지장간 가중 십성 비율 반영.')
    lines.push('')
  }

  // 용신
  if (yongsin) {
    const ys = yongsin
    lines.push(sectionTitle(`용신 (用神) (일간 ${ys.dayStemKor}(${ys.dayStem}), ${ys.method}/${ys.methodHanja}, 신강약 ${ys.sinGangLevel})`))
    lines.push('')
    const sourceHanja = ys.primarySource === '화격' ? '化格'
      : ys.primarySource === '조후' ? '調候'
        : '抑扶'
    lines.push(`- **용신(用神)**: ${ys.primary.label}(${ys.primary.hanja}) · ${ys.primary.sipsinRole}(${ys.primary.sipsinHanja}) · 원국 ${ys.primary.percent > 0 ? `${ys.primary.percent}%` : '-'} · 주용신(主用神): ${ys.primarySource}(${sourceHanja})`)
    lines.push(`- **희신(喜神)**: ${ys.secondary.label}(${ys.secondary.hanja}) · ${ys.secondary.sipsinRole}(${ys.secondary.sipsinHanja}) · 원국 ${ys.secondary.percent > 0 ? `${ys.secondary.percent}%` : '-'}`)
    if (ys.eokbuPrimary && ys.primarySource !== '억부') {
      lines.push(`- **억부용신(抑扶用神)**: ${ys.eokbuPrimary.label}(${ys.eokbuPrimary.hanja}) · ${ys.eokbuPrimary.sipsinRole}(${ys.eokbuPrimary.sipsinHanja})`)
    }
    lines.push(`- **기신(忌神)**: ${ys.avoid.map(a => `${a.label}(${a.hanja})`).join(' · ')}`)
    lines.push(`- **요약**: ${ys.summary}`)
    lines.push(`- **설명**: ${ys.explanation}`)
    lines.push('')
    if (yongsin.johuSummary && yongsin.primarySource !== '조후') {
      lines.push(`- **조후용신(調候用神)**: ${yongsin.johuSummary}`)
    }
    if (yongsin.hwaGeukSummary) {
      lines.push(`- **화격(化格)**: ${yongsin.hwaGeukSummary}`)
    }
    if (yongsin.gyeokgukSummary) {
      lines.push(`- **격국(格局)**: ${yongsin.gyeokgukSummary}`)
    }
    lines.push('')
    lines.push(`※ ${yongsin.method}(${yongsin.methodHanja}) · 오행 기준: ${yongsin.ohaengBasis ?? '원국'}`)
    lines.push('')
  }

  // 八字關係 — 마크다운 매트릭스 표
  // 열(좌→우): 時(0)→日(1)→月(2)→年(3)  /  행(위→아래): 年(3)→月(2)→日(1)→時(0)
  const bzGanzis = pillars.map(p => p.pillar.ganzi)

  function bzPairKey(a: number, b: number) {
    return `${Math.min(a, b)},${Math.max(a, b)}`
  }
  function bzCellText(rowIdx: number, colIdx: number): string {
    if (rowIdx === colIdx) return '—'
    const rel = relations.pairs.get(bzPairKey(rowIdx, colIdx))
    if (!rel) return '-'
    const parts: string[] = []
    for (const r of rel.stem) {
      const detail = r.detail && ELEMENT_HANJA[r.detail] ? ELEMENT_HANJA[r.detail] : ''
      parts.push(`${bzGanzis[rowIdx][0]}${bzGanzis[colIdx][0]} ${r.type}${detail}`)
    }
    for (const r of rel.branch) {
      const detail = r.detail && ELEMENT_HANJA[r.detail]
        ? ELEMENT_HANJA[r.detail]
        : r.detail ? `(${r.detail})` : ''
      parts.push(`${bzGanzis[rowIdx][1]}${bzGanzis[colIdx][1]} ${r.type}${detail}`)
    }
    return parts.length > 0 ? parts.join(' / ') : '-'
  }

  const BZ_COL_ORDER  = [0, 1, 2, 3]          // 時→日→月→年
  const BZ_COL_LABELS = ['時柱', '日柱', '月柱', '年柱']
  const BZ_ROW_ORDER  = [3, 2, 1, 0]          // 年→月→日→時
  const BZ_ROW_LABELS = ['年柱', '月柱', '日柱', '時柱']

  const bzHeader = `|  | ${BZ_COL_ORDER.map((ci, c) => `${BZ_COL_LABELS[c]}(${bzGanzis[ci]})`).join(' | ')} |`
  const bzDivider = `|---|${BZ_COL_ORDER.map(() => '---').join('|')}|`
  const bzRows = BZ_ROW_ORDER.map((ri, r) => {
    const cells = BZ_COL_ORDER.map(ci => bzCellText(ri, ci))
    return `| ${BZ_ROW_LABELS[r]}(${bzGanzis[ri]}) | ${cells.join(' | ')} |`
  })

  // 삼합/방합
  const bzMulti: string[] = []
  for (const rel of relations.triple) {
    const el = rel.detail && ELEMENT_HANJA[rel.detail] ? ELEMENT_HANJA[rel.detail] : ''
    bzMulti.push(`${rel.type}${el}局`)
  }
  for (const rel of relations.directional) {
    const el = rel.detail && ELEMENT_HANJA[rel.detail] ? ELEMENT_HANJA[rel.detail] : ''
    bzMulti.push(`${rel.type}${el}`)
  }

  // 특수신살 (갓사주 전용) — 합충형파해 앞에 배치
  if (result.godSinsal && result.godSinsal.length > 0) {
    const ssStemKor: Record<string, string> = {
      '甲': '갑', '乙': '을', '丙': '병', '丁': '정', '戊': '무',
      '己': '기', '庚': '경', '辛': '신', '壬': '임', '癸': '계',
    }
    const ssBranchKor: Record<string, string> = {
      '子': '자', '丑': '축', '寅': '인', '卯': '묘', '辰': '진',
      '巳': '사', '午': '오', '未': '미', '申': '신', '酉': '유',
      '戌': '술', '亥': '해',
    }
    const ssSinsalHanja: Record<string, string> = {
      '현침살': '懸針殺', '백호대살': '白虎大殺', '괴강살': '魁罡殺',
      '천을귀인': '天乙貴人', '태극귀인': '太極貴人', '월덕귀인': '月德貴人',
      '천덕귀인': '天德貴人', '홍염살': '紅艶殺', '도화살': '桃花殺',
      '양인살': '羊刃殺', '원진살': '怨嗔殺', '귀문관살': '鬼門關殺',
      '천문성': '天門星', '역마살': '驛馬殺', '망신살': '亡身殺',
      '장성살': '將星殺', '화개살': '華蓋殺', '겁살': '劫殺',
      '재살': '災殺', '천살': '天殺', '지살': '地殺',
      '연살': '年殺', '월살': '月殺',
    }
    const ssSinsalLabel = (name: string) => {
      const hanja = ssSinsalHanja[name]
      return hanja ? `${name}(${hanja})` : name
    }
    const ssStems    = result.pillars.map(p => p.pillar.stem)
    const ssBranches = result.pillars.map(p => p.pillar.branch)
    const ssStemCells   = ssStems.map(s => `${ssStemKor[s] || s}(${s})`)
    const ssBranchCells = ssBranches.map(b => `${ssBranchKor[b] || b}(${b})`)
    const ssHeavenCells = Array(4).fill(null).map((_, i) => {
      const names = result.godSinsal?.filter(s => s.position === 'heaven' && s.pillarIndex === i).map(s => ssSinsalLabel(s.name)) ?? []
      return names.length > 0 ? names.join(' / ') : '-'
    })
    const ssEarthCells = Array(4).fill(null).map((_, i) => {
      const names = result.godSinsal?.filter(s => s.position === 'earth' && s.pillarIndex === i).map(s => ssSinsalLabel(s.name)) ?? []
      return names.length > 0 ? names.join(' / ') : '-'
    })
    lines.push(sectionTitle('특수신살 (特殊神殺) (길성과 흉성)'))
    const ssSummary = buildSinsalSummaryLine(result.godSinsal, input.unknownTime)
    if (ssSummary) lines.push(`- **요약**: ${ssSummary}`)
    lines.push(`| 구분 | ${headerLabels.join(' | ')} |`)
    lines.push('|---|---|---|---|---|')
    lines.push(`| 天干 | ${ssStemCells.join(' | ')} |`)
    lines.push(`| 天干 神殺 | ${ssHeavenCells.join(' | ')} |`)
    lines.push(`| 地支 | ${ssBranchCells.join(' | ')} |`)
    lines.push(`| 地支 神殺 | ${ssEarthCells.join(' | ')} |`)
    lines.push('')
  }

  // 合沖刑破害(四柱原局) — 특수신살 뒤에 배치
  lines.push(sectionTitle('합충형파해 (合沖刑破害)'))
  const relSummary = buildRelationsSummaryLine(relations, bzGanzis)
  if (relSummary) lines.push(`- **요약**: ${relSummary}`)
  lines.push(bzHeader)
  lines.push(bzDivider)
  bzRows.forEach(row => lines.push(row))
  if (bzMulti.length > 0) {
    lines.push(`3자 관계: ${bzMulti.join(', ')}`)
  }
  lines.push('')

  // 坐法 · 引從法 통합 마크다운 표
  if (result.jwabeop) {
    const dayBranch = result.pillars[1].pillar.branch
    lines.push(sectionTitle(`좌법 · 인종법 (坐法 · 引從法) (日支 ${dayBranch} 기준 지장간 12운성)`))
    lines.push('')

    const CATEGORIES_EXPORT = ['比劫', '食傷', '財星', '官星', '印星'] as const
    type CatExport = (typeof CATEGORIES_EXPORT)[number]
    const CATEGORY_KOR_EXPORT: Record<CatExport, string> = {
      比劫: '비겁', 食傷: '식상', 財星: '재성', 官星: '관성', 印星: '인성',
    }
    const SIPSIN_TO_CAT_EXPORT: Record<string, CatExport> = {
      比肩: '比劫', 劫財: '比劫', 食神: '食傷', 傷官: '食傷',
      偏財: '財星', 正財: '財星', 偏官: '官星', 正官: '官星',
      偏印: '印星', 正印: '印星',
    }
    const SIPSIN_KOR_EXPORT: Record<string, string> = {
      比肩: '비견', 劫財: '겁재', 食神: '식신', 傷官: '상관',
      偏財: '편재', 正財: '정재', 偏官: '편관', 正官: '정관',
      偏印: '편인', 正印: '정인',
    }

    // 카테고리별 맵: pillarIdx → category → entries
    const catMap: Record<number, Partial<Record<CatExport, typeof result.jwabeop[0]>>> = {}
    result.jwabeop.forEach((entries, pi) => {
      catMap[pi] = {}
      entries.forEach(entry => {
        const cat = SIPSIN_TO_CAT_EXPORT[entry.sipsin]
        if (cat) {
          const arr = catMap[pi][cat]
          if (arr) arr.push(entry)
          else catMap[pi][cat] = [entry]
        }
      })
    })

    // 인종법 맵
    const injongMap: Partial<Record<CatExport, typeof result.injongbeop[0]>> = {}
    result.injongbeop.forEach(e => { injongMap[e.category as CatExport] = e })

    // 표 헤더: 십성 | 時柱(branch) | 日柱(branch) | 月柱(branch) | 年柱(branch) | 引從法
    const yearBranch = result.pillars[3].pillar.branch
    const monthBranch = result.pillars[2].pillar.branch
    const dayBranchCol = result.pillars[1].pillar.branch
    const hourBranch = input.unknownTime ? '?' : result.pillars[0].pillar.branch
    lines.push(`| 십성 | 時柱(${hourBranch}) | 日柱(${dayBranchCol}) | 月柱(${monthBranch}) | 年柱(${yearBranch}) | 引從法 |`)
    lines.push('|------|---------|---------|---------|---------|--------|')

    // 표시 순서: 時=0, 日=1, 月=2, 年=3
    const PILLAR_EXPORT = [
      { idx: 0, isUnknown: !!input.unknownTime },
      { idx: 1, isUnknown: false },
      { idx: 2, isUnknown: false },
      { idx: 3, isUnknown: false },
    ]

    for (const cat of CATEGORIES_EXPORT) {
      const rowLabel = `${CATEGORY_KOR_EXPORT[cat]}(${cat})`
      const cells = PILLAR_EXPORT.map(({ idx, isUnknown }) => {
        if (isUnknown) return '-'
        const entries = catMap[idx]?.[cat] ?? []
        if (entries.length === 0) return '-'
        return entries
          .map(e => {
            const sipsinLabel = SIPSIN_KOR_EXPORT[e.sipsin]
              ? `${SIPSIN_KOR_EXPORT[e.sipsin]}(${e.sipsin})`
              : e.sipsin
            return `${e.stem} ${sipsinLabel} ${e.unseong}坐`
          })
          .join(' / ')
      })
      const injong = injongMap[cat]
      const injongCell = injong
        ? `${injong.yangStem} ${CATEGORY_KOR_EXPORT[injong.category as CatExport]}(${injong.category}) ${injong.unseong}從`
        : '-'
      lines.push(`| ${rowLabel} | ${cells.join(' | ')} | ${injongCell} |`)
    }
    lines.push('')
    lines.push('※ 坐: 지장간이 일지에서의 12운성 · 從: 사주에 없는 십성이 일지에서의 12운성')
    lines.push('')
  }

  // 小運 (대운 전)
  if (soun.length > 0) {
    lines.push('')
    lines.push(sectionTitle('소운(小運)'))
    pushCurrentYun('소운', currentSounGanzi, null, currentSounGanzi ? { kind: 'year', year: effectiveYunYear } : null)
    for (const line of YUN_SOUN_EXPORT_NOTES) lines.push(line)
    if (input.unknownTime) lines.push('※ 출생 시각 미입력 — 月柱 기준.')
    lines.push(YUN_METHOD_NOTES.yongsinTransit)
    lines.push('')

    const revSoun = [...soun].reverse()
    lines.push(`| ${['나이', ...revSoun.map((s) => `${s.age}세`)].join(' | ')} |`)
    lines.push(`| ${['연도', ...revSoun.map((s) => `${s.year}年`)].join(' | ')} |`)
    lines.push(`| ${['절기', ...revSoun.map((s) => formatLichunBoundaryCell(s.year, '<br>').replace(/\|/g, '\\|'))].join(' | ')} |`)
    lines.push(`| ${['간지', ...revSoun.map((s) => s.ganzi)].join(' | ')} |`)
    lines.push(`| ${['12운성', ...revSoun.map((s) => s.unseong)].join(' | ')} |`)
    lines.push(`| ${['비고', ...revSoun.map((s) => {
      const interArr = collectNatalTransitInteractions(s.ganzi, natalGanzis)
      return formatYunBigoPlainText({
        isGongmang: s.isGongmang,
        interactions: interArr.join(' / '),
        fuYinFanYin: annotateTransit(s.ganzi, natalGanzis, yongsin).fuYinFanYin,
      })
    })].join(' | ')} |`)
    lines.push(`| ${['용신', ...revSoun.map((s) => annotateTransit(s.ganzi, natalGanzis, yongsin).yongsinLabel)].join(' | ')} |`)
    lines.push('')
  } else {
    lines.push('')
    lines.push(sectionTitle('소운(小運)'))
    pushCurrentYun('소운', null, null, null, SOUN_EMPTY_REASON)
    for (const line of YUN_SOUN_EXPORT_NOTES) lines.push(line)
    if (input.unknownTime) lines.push('※ 출생 시각 미입력 — 月柱 기준.')
    lines.push('')
  }

  // 대운 (마크단운 표 형식, 가로 배열)
  if (daewoon.length > 0) {
    lines.push(sectionTitle(input.unknownTime ? `대운 (大運) (${t('saju.unknownTimeWarning')})` : '대운 (大運)'))
    pushCurrentYun(
      '대운',
      currentDaewoonGanzi,
      pendingStartYear,
      currentDaewoonGanzi ? { kind: 'year', year: currentYear } : null,
    )
    const dm = daewoonMeta
    if (dm) {
      lines.push(`- **대운수**: ${dm.daewoonSuDisplay}(${dm.monthGanzi}) (정밀 ${dm.daewoonSu})`)
      lines.push(`- **順逆行**: ${dm.directionKor}(${dm.direction})`)
      lines.push(`- **절기 기준**: ${dm.termLabel} (출생→절기 ${dm.daysToTerm}일, 3일=1년)`)
      if (dm.firstGanzi) {
        lines.push(`- **1運**: ${dm.firstGanzi} · ${dm.firstStartDate.getFullYear()}년부터`)
      }
    }
    const bridgeNote = formatDaewoonAgeBridgeNote(
      input.year, input.month, input.day, daewoon[0], daewoonMeta,
    )
    if (bridgeNote) lines.push(bridgeNote)
    for (const line of YUN_DAewoon_EXPORT_NOTES) lines.push(line)
    lines.push('')
    const reversedDaewoon = [...daewoon].reverse()
    
    // 헤더 행: 운 번호
    const headerRow = ['순번', ...reversedDaewoon.map(dw => `[${dw.index}運]`)].join(' | ')
    lines.push(`| ${headerRow} |`)
    
    // 구분선
    const separatorRow = Array(reversedDaewoon.length + 1).fill('---').join(' | ')
    lines.push(`| ${separatorRow} |`)
    
    // 나이 행
    const ageRow = ['나이', ...reversedDaewoon.map(dw => `${dw.age}${t('saju.ageSuffix')}[${dw.index}運]`)].join(' | ')
    lines.push(`| ${ageRow} |`)
    
    // 시작연도 행
    const yearRow = ['시작연도', ...reversedDaewoon.map(dw => `${dw.startDate.getFullYear()}年`)].join(' | ')
    lines.push(`| ${yearRow} |`)

    const startJieRow = ['시작', ...reversedDaewoon.map((dw) =>
      formatDaewoonStartCell(dw.startDate, '<br>').replace(/\|/g, '\\|'),
    )].join(' | ')
    lines.push(`| ${startJieRow} |`)
    
    // 천간십성 행 (getRelation으로 실제 십성 계산)
    const stemSipsinRow = ['천간십성', ...reversedDaewoon.map(dw => {
      const rel = getRelation(pillars[1]?.pillar.stem || '', dw.ganzi.charAt(0))
      return rel ? `${rel.hangul}(${rel.hanja})` : '?'
    })].join(' | ')
    lines.push(`| ${stemSipsinRow} |`)
    
    // 천간 행 (ganzi에서 첫 글자 + 한글음 + 음양오행)
    const stemRow = ['천간', ...reversedDaewoon.map(dw => {
      const stem = dw.ganzi.charAt(0)
      const stemAttr = getStemAttr(stem)
      return `${stem}(${stemAttr.um})(${stemAttr.ohaeng})`
    })].join(' | ')
    lines.push(`| ${stemRow} |`)
    
    // 지지 행 (ganzi에서 두 번째 글자 + 한글음 + 음양오행)
    const branchRow = ['지지', ...reversedDaewoon.map(dw => {
      const branch = dw.ganzi.charAt(1)
      const branchAttr = getBranchAttr(branch)
      return `${branch}(${branchAttr.um})(${branchAttr.ohaeng})`
    })].join(' | ')
    lines.push(`| ${branchRow} |`)
    
    // 지지십성 행 (getRelation으로 실제 십성 계산)
    const branchSipsinRow = ['지지십성', ...reversedDaewoon.map(dw => {
      const jeonggi = getJeonggi(dw.ganzi.charAt(1))
      const rel = getRelation(pillars[1]?.pillar.stem || '', jeonggi)
      return rel ? `${rel.hangul}(${rel.hanja})` : '?'
    })].join(' | ')
    lines.push(`| ${branchSipsinRow} |`)
    
    // 12운성 행
    const unseongRow = ['12운성', ...reversedDaewoon.map(dw => dw.unseong)].join(' | ')
    lines.push(`| ${unseongRow} |`)
    
    // 12신살 행 (신살 명칭 정밀화)
    const sinsalRow = ['12신살', ...reversedDaewoon.map(dw => dw.sinsal)].join(' | ')
    lines.push(`| ${sinsalRow} |`)
    
    // 비고 행 (공맹 · 합충형 · 伏吟反吟 통합)
    const remarkRow = ['비고', ...reversedDaewoon.map((dw) => {
      const interArr = collectNatalTransitInteractions(dw.ganzi, natalGanzis)
      return formatYunBigoPlainText({
        isGongmang: dw.isGongmang,
        interactions: interArr.join(' / '),
        fuYinFanYin: annotateTransit(dw.ganzi, natalGanzis, yongsin).fuYinFanYin,
      })
    })].join(' | ')
    lines.push(`| ${remarkRow} |`)

    const yongsinRow = ['용신', ...reversedDaewoon.map((dw) =>
      annotateTransit(dw.ganzi, natalGanzis, yongsin).yongsinLabel,
    )].join(' | ')
    lines.push(`| ${yongsinRow} |`)
  }

  // 세운 (Annual Cycles - 기존 엔진 함수 활용)
  const dayStem = pillars[1]?.pillar.stem || ''
  const yearBranch = pillars[3]?.pillar.branch || ''
  
  if (dayStem && yearBranch) {
    lines.push('') // 빈 줄
    lines.push(sectionTitle('세운 (歲運)'))
    pushCurrentYun(
      '세운',
      currentSewoonGanzi,
      pendingStartYear,
      currentSewoonGanzi ? { kind: 'year', year: effectiveYunYear } : null,
    )
    lines.push('')
    
    // 공망 계산
    const dayGanzi = pillars[1]?.pillar.ganzi || ''
    const dayGanziIdx = HGANJI.indexOf(dayGanzi)
    const gongmangBranches: string[] = dayGanziIdx >= 0 ? GONGMANG_TABLE[Math.trunc(dayGanziIdx / 10)] : []
    
    // 선택 대운 (UI와 동일 — 미지정 시 현재 시각 기준 활성 대운)
    let dwIdx = selectedDaewoonIdx
    if (dwIdx === undefined || dwIdx < 0 || dwIdx >= daewoon.length) {
      dwIdx = activeDwIdx >= 0 ? activeDwIdx : 0
    }

    const targetDw = daewoon[dwIdx] ?? daewoon[0]
    const startYear = targetDw?.startDate?.getFullYear() ?? input.year
    const nextDw = daewoon[dwIdx + 1]
    const endYear = nextDw ? nextDw.startDate.getFullYear() : startYear + 10

    lines.push(`- **선택 대운**: ${targetDw.age}세~ (${startYear}년~${endYear - 1}년)`)
    const sewoonBridge = formatDaewoonAgeBridgeNote(
      input.year, input.month, input.day, targetDw,
    )
    if (sewoonBridge) lines.push(sewoonBridge)
    for (const line of YUN_SEWOON_EXPORT_NOTES) lines.push(line)
    lines.push('')

    const sewunData: any[] = []
    for (let year = startYear; year < endYear; year++) {
      const age = getManAgeInCalendarYear(input.year, input.month, input.day, year)
      
      const ganzi = getLiuNianGanziForCalendarYear(year)
      const stem = ganzi.charAt(0)
      const branch = ganzi.charAt(1)
      const isGongmang = gongmangBranches.includes(branch)
      
      // 십신 계산
      const stemRelation = getRelation(dayStem, stem)
      const stemSipsin = stemRelation ? `${stemRelation.hangul}(${stemRelation.hanja})` : '?'
      
      // 지지 정기 십신 계산
      const jeonggi = getJeonggi(branch)
      const branchRelation = getRelation(dayStem, jeonggi)
      const branchSipsin = branchRelation ? `${branchRelation.hangul}(${branchRelation.hanja})` : '?'
      
      // 12운성 계산
      const meteor = getTwelveMeteor(dayStem, branch)
      
      // 12신살 계산 및 명칭 정밀화
      // 12신살 계산 (getTwelveSpirit이 이미 한자 포함: 예: 망신살(亡神))
      const spirit = formatSinsal(getTwelveSpirit(yearBranch, branch))
      
      sewunData.push({
        year,
        age,
        ganzi,
        stem,
        branch,
        isGongmang,
        stemSipsin,
        branchSipsin,
        meteor,
        spirit
      })
    }
    
    // 역순 정렬 (최신 연도부터)
    sewunData.reverse()
    
    // 테이블 생성
    const sewunHeaderRow = ['나이', ...sewunData.map(s => `${s.age}세`)].join(' | ')
    lines.push(`| ${sewunHeaderRow} |`)
    
    const sewunSeparatorRow = Array(sewunData.length + 1).fill('---').join(' | ')
    lines.push(`| ${sewunSeparatorRow} |`)
    
    const sewunYearRow = ['연도', ...sewunData.map(s => `${s.year}年`)].join(' | ')
    lines.push(`| ${sewunYearRow} |`)

    const sewunJieRow = ['절기', ...sewunData.map((s) =>
      formatLichunBoundaryCell(s.year, '<br>').replace(/\|/g, '\\|'),
    )].join(' | ')
    lines.push(`| ${sewunJieRow} |`)
    
    const sewunStemSipsinRow = ['천간십성', ...sewunData.map(s => s.stemSipsin)].join(' | ')
    lines.push(`| ${sewunStemSipsinRow} |`)
    
    const sewunStemRow = ['천간', ...sewunData.map(s => {
      const stemAttr = getStemAttr(s.stem)
      return `${s.stem}(${stemAttr.um})(${stemAttr.ohaeng})`
    })].join(' | ')
    lines.push(`| ${sewunStemRow} |`)
    
    const sewunBranchRow = ['지지', ...sewunData.map(s => {
      const branchAttr = getBranchAttr(s.branch)
      return `${s.branch}(${branchAttr.um})(${branchAttr.ohaeng})`
    })].join(' | ')
    lines.push(`| ${sewunBranchRow} |`)
    
    const sewunBranchSipsinRow = ['지지십성', ...sewunData.map(s => s.branchSipsin)].join(' | ')
    lines.push(`| ${sewunBranchSipsinRow} |`)
    
    const sewunMeteorRow = ['12운성', ...sewunData.map(s => s.meteor)].join(' | ')
    lines.push(`| ${sewunMeteorRow} |`)
    
    const sewunSpiritRow = ['12신살', ...sewunData.map(s => s.spirit)].join(' | ')
    lines.push(`| ${sewunSpiritRow} |`)
    
    const sewunRemarkRow = ['비고', ...sewunData.map((s) => {
      const interArr = collectNatalTransitInteractions(s.ganzi, natalGanzis)
      return formatYunBigoPlainText({
        isGongmang: s.isGongmang,
        interactions: interArr.join(' / '),
        fuYinFanYin: annotateTransit(s.ganzi, natalGanzis, yongsin).fuYinFanYin,
      })
    })].join(' | ')
    lines.push(`| ${sewunRemarkRow} |`)

    const sewunYongsinRow = ['용신', ...sewunData.map((s) =>
      annotateTransit(s.ganzi, natalGanzis, yongsin).yongsinLabel,
    )].join(' | ')
    lines.push(`| ${sewunYongsinRow} |`)
    
    // 월운 섹션
    lines.push('')
    lines.push(sectionTitle('월운 (月運)'))
    pushCurrentYun('월운', currentMonthGanzi, null, { kind: 'yearMonth', year: currentYear, month: currentMonth })
    lines.push('')
    lines.push(YUN_METHOD_NOTES.monthly)
    lines.push(YUN_METHOD_NOTES.yongsinTransit)
    lines.push('')

    // 월운 데이터: 지정 연도(monthlyYear) 1월~12월 동적 생성
    const targetMonthlyYear = monthlyYear ?? new Date().getFullYear()
    const monthlyData: any[] = []

    for (let monthIdx = 1; monthIdx <= 12; monthIdx++) {
      const ganziStr = getLiuYueGanziForCalendarMonth(targetMonthlyYear, monthIdx)
      const year = targetMonthlyYear
      const actualMonth = monthIdx
      const ganzi = ganziStr
      const stem = ganziStr[0]
      const branch = ganziStr[1]
      
      // 공망 확인 (일주 지지 기준)
      const hasKongwang = isKongwang(pillars[1]?.pillar.branch, branch)
      const isGongmang = gongmangBranches.includes(branch)
      
      // 천간십성 계산 (일간 기준)
      const stemRelation = getRelation(dayStem, stem)
      const stemSipsin = stemRelation ? `${stemRelation.hangul}(${stemRelation.hanja})` : '?'
      
      // 지지십성 계산 (일간 기준)
      const jeonggi = getJeonggi(branch)
      const branchRelation = getRelation(dayStem, jeonggi)
      const branchSipsin = branchRelation ? `${branchRelation.hangul}(${branchRelation.hanja})` : '?'
      
      // 12운성 계산
      const meteor = getTwelveMeteor(dayStem, branch)
      
      // 12신살 계산
      const spirit = formatSinsal(getTwelveSpirit(yearBranch, branch))
      
      // [에너지 작용 분석 로직]
      let interArr: string[] = []
      const posLabels = ["년", "월", "일", "시"]
      
      pillars.forEach((p, idx) => {
        const natalStem = p.pillar.stem
        const natalBranch = p.pillar.branch
        const pos = ["년", "월", "일", "시"][3 - idx] // 인덱스 역순 매칭
        
        // 천간 분석 (배열 및 객체 속성 대응)
        const sRel = getStemRelation(natalStem, stem)
        if (sRel) {
          const sRels = Array.isArray(sRel) ? sRel : [sRel]
          sRels.forEach(rel => {
            const label = typeof rel === 'object' ? (rel.hanja || rel.name || rel.type || '') : rel
            if (label) interArr.push(`${natalStem}${stem}${label}(${pos}간)`)
          })
        }
        
        // 지지 분석 (합/충/형 등이 여러 개일 경우 대응)
        const bRel = getBranchRelation(natalBranch, branch)
        if (bRel) {
          const bRels = Array.isArray(bRel) ? bRel : [bRel]
          bRels.forEach(rel => {
            const label = typeof rel === 'object' ? (rel.hanja || rel.name || rel.type || '') : rel
            if (label) interArr.push(`${natalBranch}${branch}${label}(${pos}지)`)
          })
        }
      })
      
      monthlyData.push({
        year,
        month: actualMonth,
        ganzi,
        stem,
        branch,
        isGongmang,
        hasKongwang,
        stemSipsin,
        branchSipsin,
        meteor,
        spirit,
        interactions: interArr.length > 0 ? interArr.join(' / ') : ''
      })
    }

    const stemSipsinMap: Record<string, string> = {
      '正官': '정관(正官)',
      '偏官': '편관(偏官)',
      '正印': '정인(正印)',
      '偏印': '편인(偏印)',
      '正財': '정재(正財)',
      '偏財': '편재(偏財)',
      '食神': '식신(食神)',
      '傷官': '상관(傷官)',
      '比肩': '비견(比肩)',
      '劫財': '겁재(劫財)'
    }
    const branchSipsinMap: Record<string, string> = {
      '正官': '정관(正官)',
      '偏官': '편관(偏官)',
      '正印': '정인(正印)',
      '偏印': '편인(偏印)',
      '正財': '정재(正財)',
      '偏財': '편재(偏財)',
      '食神': '식신(食神)',
      '傷官': '상관(傷官)',
      '比肩': '비견(比肩)',
      '劫財': '겁재(劫財)'
    }
    
    // 테이블 생성 - UI와 동일한 형식
    
    // 헤더 행
    const monthlyHeaderRow = ['월', ...monthlyData.map((m, idx) => `${m.year}년 ${m.month}월`)].join(' | ')
    lines.push(`| ${monthlyHeaderRow} |`)
    
    const monthlySeparatorRow = Array(monthlyData.length + 1).fill('---').join(' | ')
    lines.push(`| ${monthlySeparatorRow} |`)
    
    // 절기 행 (lunar + KST, 월별 전체)
    const monthlySolarTermRow = ['절기', ...monthlyData.map((m) => {
      return formatMonthlyJieQiCell(m.year, m.month, '<br>').replace(/\|/g, '\\|')
    })].join(' | ')
    lines.push(`| ${monthlySolarTermRow} |`)
    
    // 데이터 행들 (UI 순서와 동일)
    
    const monthlyStemSipsinRow = ['천간십성', ...monthlyData.map(m => {
      const match = m.stemSipsin.match(/^(.+?)\((.+?)\)$/)
      const hanja = match ? match[2] : m.stemSipsin
      return stemSipsinMap[hanja] || m.stemSipsin
    })].join(' | ')
    lines.push(`| ${monthlyStemSipsinRow} |`)
    
    const monthlyStemRow = ['천간', ...monthlyData.map(m => {
      const stemAttr = getStemAttr(m.stem)
      return `${m.stem}(${stemAttr.um})(${stemAttr.ohaeng})`
    })].join(' | ')
    lines.push(`| ${monthlyStemRow} |`)
    
    const monthlyBranchRow = ['지지', ...monthlyData.map(m => {
      const branchAttr = getBranchAttr(m.branch)
      return `${m.branch}(${branchAttr.um})(${branchAttr.ohaeng})`
    })].join(' | ')
    lines.push(`| ${monthlyBranchRow} |`)
    
    const monthlyBranchSipsinRow = ['지지십성', ...monthlyData.map(m => {
      const match = m.branchSipsin.match(/^(.+?)\((.+?)\)$/)
      const hanja = match ? match[2] : m.branchSipsin
      return branchSipsinMap[hanja] || m.branchSipsin
    })].join(' | ')
    lines.push(`| ${monthlyBranchSipsinRow} |`)
    
    const monthlyMeteorRow = ['12운성', ...monthlyData.map(m => m.meteor)].join(' | ')
    lines.push(`| ${monthlyMeteorRow} |`)
    
    const monthlySpiritRow = ['12신살', ...monthlyData.map(m => m.spirit)].join(' | ')
    lines.push(`| ${monthlySpiritRow} |`)
    
    const monthlyRemarkRow = ['비고', ...monthlyData.map((m) =>
      formatYunBigoPlainText({
        isGongmang: m.isGongmang,
        interactions: m.interactions,
        fuYinFanYin: annotateTransit(m.ganzi, natalGanzis, yongsin).fuYinFanYin,
      }),
    )].join(' | ')
    lines.push(`| ${monthlyRemarkRow} |`)

    const monthlyYongsinRow = ['용신', ...monthlyData.map((m) =>
      annotateTransit(m.ganzi, natalGanzis, yongsin).yongsinLabel,
    )].join(' | ')
    lines.push(`| ${monthlyYongsinRow} |`)
  }

  // 일운 (日運) - 오늘 ~ 다음달 오늘-1일
  lines.push('')
  lines.push(sectionTitle('일운 (日運)'))
  pushCurrentYun('일운', currentDayGanzi, null, { kind: 'monthDay', month: currentMonth, day: now.getDate() })
  lines.push('')

  const dlToday = new Date()
  const dlEnd = new Date(dlToday)
  dlEnd.setMonth(dlEnd.getMonth() + 1)
  dlEnd.setDate(dlEnd.getDate() - 1)

  const startY = dlToday.getFullYear()
  const startM = dlToday.getMonth() + 1
  const startD = dlToday.getDate()
  const endY = dlEnd.getFullYear()
  const endM = dlEnd.getMonth() + 1
  const endD = dlEnd.getDate()
  lines.push(`(${startY}.${startM}.${startD} ~ ${endY}.${endM}.${endD})`)
  lines.push(YUN_METHOD_NOTES.daily)
  lines.push(YUN_METHOD_NOTES.yongsinTransit)
  lines.push('')

  // 절기 데이터 맵 (일운 달력과 동일 — lunar-javascript + KST)
  const dlJieQiMap = buildJieQiDateKeyMap([dlToday.getFullYear(), dlEnd.getFullYear()])

  // 일운 공망 지지 집합 (원국 일주 기준)
  const dlDayGanzi = pillars[1]?.pillar.ganzi || ''
  const dlDayGanziIdx = HGANJI.indexOf(dlDayGanzi)
  const dlGongmangBranches: Set<string> = dlDayGanziIdx >= 0
    ? new Set(GONGMANG_TABLE[Math.trunc(dlDayGanziIdx / 10)] ?? [])
    : new Set()

  lines.push('| 날짜(음력) / 절기 | 천간십성 | 천간 | 지지 | 지지십성 | 12운성 | 12신살 | 비고 | 용신 |')
  lines.push('|---|---|---|---|---|---|---|---|')

  const dlCurrent = new Date(dlToday)
  while (dlCurrent <= dlEnd) {
    const y = dlCurrent.getFullYear()
    const m = dlCurrent.getMonth() + 1
    const d = dlCurrent.getDate()

    try {
      const solar = Solar.fromYmd(y, m, d)
      const lunar = solar.getLunar()
      const dayGanzi = getDayPillarForDate(y, m, d)
      const dStem   = dayGanzi[0]
      const dBranch = dayGanzi[1]
      const lunarMonth = lunar.getMonth()
      const lunarDay   = lunar.getDay()

      // 천간십성 한글(한자) 병기
      const stemRel = getRelation(dayStem, dStem)
      const stemSipsinStr = stemRel ? `${stemRel.hangul}(${stemRel.hanja})` : ''

      // 지지십성 한글(한자) 병기 (정기 기준)
      const jeonggiChar   = getJeonggi(dBranch)
      const branchRel     = getRelation(dayStem, jeonggiChar)
      const branchSipsinStr = branchRel ? `${branchRel.hangul}(${branchRel.hanja})` : ''

      // 12운성 · 12신살 (이미 한글(한자) 형식으로 반환)
      const meteorStr = getTwelveMeteor(dayStem, dBranch)
      const spiritStr = formatSinsal(getTwelveSpirit(yearBranch, dBranch))

      // 날짜 + 절기
      const jieQiInfo = dlJieQiMap[`${y}-${m}-${d}`]
      const jieQiStr  = jieQiInfo ? ` / ${jieQiInfo.name} ${jieQiInfo.time}` : ''
      const dateStr   = `${m}월${d}일(음${lunarMonth}.${lunarDay})${jieQiStr}`

      // 천간·지지 한글(한자) 병기
      const stemAttrDl   = getStemAttr(dStem)
      const branchAttrDl = getBranchAttr(dBranch)
      const stemColStr   = `${stemAttrDl.um}(${dStem})`
      const branchColStr = `${branchAttrDl.um}(${dBranch})`

      const dayGanziFull = getDayPillarForDate(y, m, d)
      const ann = annotateTransit(dayGanziFull, natalGanzis, yongsin)
      const isGongmang = dlGongmangBranches.has(dBranch)
      const interArr = collectNatalTransitInteractions(dayGanziFull, natalGanzis)
      const bigoStr = formatYunBigoPlainText({
        isGongmang,
        interactions: interArr.join(' / '),
        fuYinFanYin: ann.fuYinFanYin,
      })

      lines.push(`| ${dateStr} | ${stemSipsinStr} | ${stemColStr} | ${branchColStr} | ${branchSipsinStr} | ${meteorStr} | ${spiritStr} | ${bigoStr} | ${ann.yongsinLabel} |`)
    } catch (_e) {
      // 날짜 처리 오류 무시
    }

    dlCurrent.setDate(dlCurrent.getDate() + 1)
  }

  lines.push('')

  return lines.join('\n')
}

/** 자미두수 명반을 텍스트로 변환 */
export function ziweiToText(chart: ZiweiChart, liunian?: LiuNianInfo): string {
  const lines: string[] = []
  const fmt = formatZiweiInline
  const genderChar = chart.isMale ? '男' : '女'

  lines.push(`${fmt('紫微斗數')} ${fmt('命盤')} (${fmt(genderChar)})`)
  lines.push('═════')
  lines.push('')
  lines.push(...buildZiweiBirthInfoLines(chart, fmt))
  lines.push(`${fmt('年柱')}: ${formatGanziKorHanja(`${chart.yearGan}${chart.yearZhi}`)}`)

  const mingPalace = chart.palaces['命宮']
  lines.push(`${fmt('命宮')}: ${mingPalace?.ganZhi ? formatGanziKorHanja(mingPalace.ganZhi) : ''}`)

  let shenPalaceName = ''
  for (const p of Object.values(chart.palaces)) {
    if (p.isShenGong) { shenPalaceName = p.name; break }
  }
  lines.push(`${fmt('身宮')}: ${fmt(shenPalaceName)} (${formatZhiKorHanja(chart.shenGongZhi)})`)
  lines.push(`${fmt('五行局')}: ${fmt(chart.wuXingJu.name)}`)
  lines.push(`${fmt('大限起始')}: ${chart.daXianStartAge}歲`)
  lines.push('')

  lines.push(fmt('十二宮'))
  lines.push('─────')
  lines.push(...buildZiweiPalaceGridText(chart))
  lines.push('')
  lines.push(fmt('四化'))
  lines.push('─────')
  const huaOrder = ['化祿', '化權', '化科', '化忌']
  for (const huaType of huaOrder) {
    for (const palace of Object.values(chart.palaces)) {
      for (const star of palace.stars) {
        if (star.siHua === huaType) {
          lines.push(`${fmt(huaType)}: ${fmt(star.name)} ${fmt('在')} ${fmt(palace.name)}`)
        }
      }
    }
  }

  lines.push('')
  lines.push(fmt('大限'))
  lines.push('─────')
  const daxianList = getDaxianList(chart)
  for (const dx of daxianList) {
    const stars = dx.mainStars.length > 0 ? dx.mainStars.map(s => fmt(s)).join(' ') : `(${fmt('空宮')})`
    lines.push(`${String(dx.ageStart).padStart(3)}-${String(dx.ageEnd).padStart(3)}歲  ${fmt(dx.palaceName)}  ${dx.ganZhi}  ${stars}`)
  }

  if (liunian) {
    lines.push('')
    lines.push(`${fmt('流年')} (${liunian.year}年 ${liunian.gan}${liunian.zhi}年)`)
    lines.push('═════')
    lines.push(`${fmt('大限')}: ${liunian.daxianAgeStart}-${liunian.daxianAgeEnd}歲 ${fmt(liunian.daxianPalaceName)}`)
    lines.push(`${fmt('流年命宮')}: ${liunian.mingGongZhi}${fmt('宮')} → ${fmt('本命')} ${fmt(liunian.natalPalaceAtMing)}`)

    for (const huaType of ['化祿', '化權', '化科', '化忌']) {
      let starName = ''
      for (const [s, h] of Object.entries(liunian.siHua)) {
        if (h === huaType) { starName = s; break }
      }
      const palaceName = liunian.siHuaPalaces[huaType] || '?'
      if (starName) lines.push(`${fmt(huaType)}: ${fmt(starName)} → ${fmt(palaceName)}`)
    }

    lines.push('')
    const lunarMonthNames = ['正月', '二月', '三月', '四月', '五月', '六月',
                              '七月', '八月', '九月', '十月', '冬月', '臘月']
    for (const ly of liunian.liuyue) {
      lines.push(`${fmt(lunarMonthNames[ly.month - 1])} (${ly.mingGongZhi}): ${fmt(ly.natalPalaceName)}`)
    }
  }

  return lines.join('\n')
}

/** Natal Chart를 텍스트로 변환 */
export function natalToText(chart: NatalChart, houseSystemName = 'Placidus'): string {
  const t = makeT('en')
  const lines: string[] = []
  const hasHouses = chart.angles != null

  lines.push('Natal Chart')
  if (!hasHouses) lines.push(`(${t('natal.unknownTime')})`)
  lines.push('═════')
  lines.push('')

  // Angles
  if (chart.angles) {
    lines.push('Angles')
    lines.push('─────')
    for (const [label, a] of [['ASC', chart.angles.asc], ['MC', chart.angles.mc]] as const) {
      lines.push(`${label}  ${ZODIAC_SYMBOLS[a.sign]} ${t(`zodiac.${a.sign}`)} ${formatDegree(a.longitude)}`)
    }
    lines.push('')
  }

  // Planets
  lines.push('Planets')
  lines.push('─────')
  for (const p of chart.planets) {
    const retro = p.isRetrograde ? ' R' : '  '
    const sym = PLANET_SYMBOLS[p.id]
    const signSym = ZODIAC_SYMBOLS[p.sign]
    const planetName = t(`planet.${p.id}`)
    const signName = t(`zodiac.${p.sign}`)
    const housePart = p.house != null ? ` ${ROMAN[p.house - 1].padStart(5)}` : ''
    lines.push(`${sym} ${planetName.padEnd(10)} ${signSym} ${signName.padEnd(12)} ${formatDegree(p.longitude)}${retro}${housePart}`)
  }
  lines.push('')

  // Houses
  if (hasHouses && chart.houses.length > 0) {
    lines.push(`Houses (${houseSystemName})`)
    lines.push('─────')
    for (const h of chart.houses) {
      lines.push(`${ROMAN[h.number - 1].padStart(4)}  ${ZODIAC_SYMBOLS[h.sign]} ${t(`zodiac.${h.sign}`).padEnd(12)} ${formatDegree(h.cuspLongitude)}`)
    }
    lines.push('')
  }

  // Aspects
  lines.push('Major Aspects')
  lines.push('─────')
  for (const a of chart.aspects.slice(0, 15)) {
    const sym1 = PLANET_SYMBOLS[a.planet1]
    const sym2 = PLANET_SYMBOLS[a.planet2]
    const aspSym = ASPECT_SYMBOLS[a.type]
    lines.push(`${sym1} ${t(`planet.${a.planet1}`).padEnd(10)} ${aspSym} ${sym2} ${t(`planet.${a.planet2}`).padEnd(10)} orb ${a.orb.toFixed(1)}°`)
  }

  return lines.join('\n')
}
