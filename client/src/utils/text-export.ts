import { Solar } from 'lunar-javascript'
import type { SajuResult, ZiweiChart, LiuNianInfo, NatalChart } from '@core/types'
import { ELEMENT_HANJA, PILLAR_NAMES, PALACE_NAMES, MAIN_STAR_NAMES, JIJANGGAN, GONGMANG_TABLE, HGANJI } from '@core/constants'
import { getDaxianList } from '@core/ziwei'
import { formatRelation, fmt2, formatSinsal, getStemAttr, getBranchAttr } from './format.ts'
import { ZODIAC_SYMBOLS, PLANET_SYMBOLS, ASPECT_SYMBOLS, ROMAN, formatDegree } from '@core/natal'
import { t as translate, getLocale } from '../i18n/index.ts'
import { getYearGanzi, getTwelveMeteor, getTwelveSpirit, getRelation, getJeonggi, getStemRelation, getBranchRelation } from '@core/pillars'
import {
  formatHelpSipsinRatio,
  buildSinsalSummaryLine,
  buildRelationsSummaryLine,
  calendarTypeLabel,
  resolveSolarBirthDateTime,
} from '@core/index'
import { PILLAR_TABLE_LABELS, pillarLabelForExport } from './pillar-table-labels.ts'
import { MONTHLY_DATA, isKongwang, calculateMonthGanzi } from '@core/monthly-data'
import type { Locale } from '../i18n/index.ts'

/** 현재 로케일의 t() 래퍼 생성 */
function makeT(locale?: Locale) {
  const l = locale ?? getLocale()
  return (key: string) => translate(l, key)
}

/** 사주 결과를 CLI 형식 텍스트로 변환 */
export function sajuToText(result: SajuResult, locale?: Locale, monthlyYear?: number): string {
  const t = makeT(locale)
  const { input, pillars, daewoon, daewoonMeta, relations, specialSals, gongmang, ohaengSipsin, sinGangYak, yongsin } = result
  const lines: string[] = []
  const genderChar = input.gender === 'M' ? '男' : '女'

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

  lines.push(`사주원국 (四柱原局) (${genderChar})`)
  const calLabel = calendarTypeLabel(input.calendarType)
  const enteredDate = `${input.year}-${String(input.month).padStart(2, '0')}-${String(input.day).padStart(2, '0')}`
  const enteredTime = input.unknownTime
    ? '시간모름'
    : `${String(input.hour).padStart(2, '0')}:${String(input.minute).padStart(2, '0')}`
  let birthLine = input.personName?.trim()
    ? `이름: ${input.personName.trim()}\n입력 달력: ${calLabel} · ${enteredDate} ${enteredTime}`
    : `입력 달력: ${calLabel} · ${enteredDate} ${enteredTime}`
  if (input.calendarType && input.calendarType !== 'solar') {
    try {
      const solar = resolveSolarBirthDateTime(input)
      birthLine += `\n계산 기준(양력 변환): ${solar.year}-${String(solar.month).padStart(2, '0')}-${String(solar.day).padStart(2, '0')} ${String(solar.hour).padStart(2, '0')}:${String(solar.minute).padStart(2, '0')}`
      if (input.calendarType === 'lunarLeap') {
        birthLine += ' (음력 윤달 입력)'
      }
    } catch {
      birthLine += '\n(양력 변환 실패 — 입력값 확인 필요)'
    }
  } else {
    birthLine += '\n계산 기준: 위 양력 시각 그대로 (KST/출생지 타임존 보정 후 사주·대운 계산)'
  }
  lines.push(birthLine)
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

  // 오행·십성 분석
  if (ohaengSipsin) {
    const os = ohaengSipsin
    lines.push(`오행 · 십성 (五行 · 十星) 분석 (일간 ${os.dayStemKor}(${os.dayStem}) ${os.dayElementLabel}, 원국 ${os.totalCharSlots}글자 기준)`)
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
    lines.push('※ 발달(20%↑)·적정(10~20%)·부족(10%↓). 지장간·합화·조후 보정 미포함.')
    lines.push('')
  }

  // 신강·신약
  if (sinGangYak) {
    const sg = sinGangYak
    lines.push(`신강·신약 (일간 ${sg.dayStemKor}(${sg.dayStem}))`)
    lines.push('')
    lines.push(`| 항목 | 판정 |`)
    lines.push(`|------|------|`)
    for (const f of sg.flags) {
      lines.push(`| ${f.label}(${f.hanja}) | ${f.ok ? '○' : '×'} |`)
    }
    lines.push('')
    lines.push(`- **결론**: ${sg.level} — ${sg.conclusion}`)
    lines.push(`- **득력**: ${sg.score}/4 (득령·득지·득시·득세)`)
    lines.push(`- **일간 세력 비율**: ${formatHelpSipsinRatio(sg.helpCount, sg.totalCount)} → 약 ${sg.strengthPercent}% (일간 제외 원국 십성 칸 중 인성·비겁 해당)`)
    lines.push('')
    lines.push('※ 득지=일지, 득시=시지. 조후·합화 보정 미포함.')
    lines.push('')
  }

  // 용신
  if (yongsin) {
    const ys = yongsin
    lines.push(`용신 (用神) (일간 ${ys.dayStemKor}(${ys.dayStem}), ${ys.method}/${ys.methodHanja}, 신강약 ${ys.sinGangLevel})`)
    lines.push('')
    lines.push(`- **용신(用神)**: ${ys.primary.label}(${ys.primary.hanja}) · ${ys.primary.sipsinRole}(${ys.primary.sipsinHanja}) · 원국 ${ys.primary.percent > 0 ? `${ys.primary.percent}%` : '-'}`)
    lines.push(`- **희신(喜神)**: ${ys.secondary.label}(${ys.secondary.hanja}) · ${ys.secondary.sipsinRole}(${ys.secondary.sipsinHanja}) · 원국 ${ys.secondary.percent > 0 ? `${ys.secondary.percent}%` : '-'}`)
    lines.push(`- **기신(忌神)**: ${ys.avoid.map(a => `${a.label}(${a.hanja})`).join(' · ')}`)
    lines.push(`- **요약**: ${ys.summary}`)
    lines.push(`- **설명**: ${ys.explanation}`)
    lines.push('')
    lines.push('※ 억부용신 기준. 조후·통관·합화·격국 보정 미포함.')
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
    lines.push('특수신살 (特殊神殺) (길성과 흉성)')
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
  lines.push('합충형파해 (合沖刑破害)')
  const relSummary = buildRelationsSummaryLine(relations, bzGanzis)
  if (relSummary) lines.push(`- **요약**: ${relSummary}`)
  lines.push(bzHeader)
  lines.push(bzDivider)
  bzRows.forEach(row => lines.push(row))
  if (bzMulti.length > 0) {
    lines.push(`3자 관계: ${bzMulti.join(', ')}`)
  }
  lines.push('')

  // 신살 목록 제거 - 특수신살 표에서 모두 표시됨

  // 坐法 · 引從法 통합 마크다운 표
  if (result.jwabeop) {
    const dayBranch = result.pillars[1].pillar.branch
    lines.push(`좌법 · 인종법 (坐法 · 引從法) (日支 ${dayBranch} 기준 지장간 12운성)`)
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

  // 대운 (마크단운 표 형식, 가로 배열)
  if (daewoon.length > 0) {
    lines.push(input.unknownTime ? `대운 (大運) (${t('saju.unknownTimeWarning')})` : '대운 (大運)')
    const dm = daewoonMeta
    if (dm) {
      lines.push(`- **대운수**: ${dm.daewoonSuDisplay}(${dm.monthGanziKor}) (정밀 ${dm.daewoonSu})`)
      lines.push(`- **順逆行**: ${dm.directionKor}(${dm.direction})`)
      lines.push(`- **절기 기준**: ${dm.termLabel} (출생→절기 ${dm.daysToTerm}일, 3일=1년)`)
      if (dm.firstGanzi) {
        lines.push(`- **1運**: ${dm.firstGanzi} · ${dm.firstStartDate.getFullYear()}년부터`)
      }
    }
    lines.push('')
    
    // 역순 정렬 (10운부터 0운까지)
    const reversedDaewoon = [...daewoon].reverse()
    
    // 헤더 행: 운 번호
    const headerRow = ['순번', ...reversedDaewoon.map(dw => `[${dw.index}運]`)].join(' | ')
    lines.push(`| ${headerRow} |`)
    
    // 구분선
    const separatorRow = Array(reversedDaewoon.length + 1).fill('---').join(' | ')
    lines.push(`| ${separatorRow} |`)
    
    // 나이 행
    const ageRow = ['나이', ...reversedDaewoon.map(dw => `${dw.age}${t('saju.ageSuffix')}`)].join(' | ')
    lines.push(`| ${ageRow} |`)
    
    // 시작연도 행
    const yearRow = ['시작연도', ...reversedDaewoon.map(dw => `${dw.startDate.getFullYear()}年`)].join(' | ')
    lines.push(`| ${yearRow} |`)
    
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
    
    // 비고 행 (공망 표시)
    const remarkRow = ['비고', ...reversedDaewoon.map(dw => dw.isGongmang ? '空亡' : '')].join(' | ')
    lines.push(`| ${remarkRow} |`)
    
    // 합충형파해 행 (에너지 작용) - 월운과 동일한 방식
    // 대운 각 간지와 원국 간지의 천간/지지 관계를 분석
    // 예: 대운 스지가 신(신)일 때, 원국 시간 스지가 정(정)이면 두 간지 간 관계를 분석
    // 결과: 대운 간지 단위로 동동 관계 나열
    const interactionRow = ['합충형파해', ...reversedDaewoon.map(dw => {
      const stem = dw.ganzi.charAt(0); // 대운 천간
      const branch = dw.ganzi.charAt(1); // 대운 지지
      let interArr: string[] = []; // 분석 결과 저장
      
      // 원국의 네 간지(년/월/일/시) 각 간지와 대운 간지 비교
      pillars.forEach((p, idx) => {
        const natalStem = p.pillar.stem; // 원국 천간
        const natalBranch = p.pillar.branch; // 원국 지지
        // 역순 매칭: idx 0=시, 1=일, 2=월, 3=년 -> 역순으로 매칭
        const pos = ["년", "월", "일", "시"][3 - idx];
        
        // 천간 분석: 원국 천간 vs 대운 천간 관계 (합/충/형/파/해 등)
        const sRel = getStemRelation(natalStem, stem);
        if (sRel) {
          const sRels = Array.isArray(sRel) ? sRel : [sRel];
          sRels.forEach(rel => {
            const label = typeof rel === 'object' ? (rel.hanja || rel.name || rel.type || '') : rel;
            if (label) interArr.push(`${natalStem}${stem}${label}(${pos}간)`);
          });
        }
        
        // 지지 분석: 원국 지지 vs 대운 지지 관계 (합/충/형/파/해 등)
        const bRel = getBranchRelation(natalBranch, branch);
        if (bRel) {
          const bRels = Array.isArray(bRel) ? bRel : [bRel];
          bRels.forEach(rel => {
            const label = typeof rel === 'object' ? (rel.hanja || rel.name || rel.type || '') : rel;
            if (label) interArr.push(`${natalBranch}${branch}${label}(${pos}지)`);
          });
        }
      });
      
      // 분석 결과를 ' / '로 연결하여 반환 (동동 관계가 여러 개일 수 있음)
      return interArr.length > 0 ? interArr.join(' / ') : '-';
    })].join(' | ')
    lines.push(`| ${interactionRow} |`)
  }

  // 세운 (Annual Cycles - 기존 엔진 함수 활용)
  const dayStem = pillars[1]?.pillar.stem || ''
  const yearBranch = pillars[3]?.pillar.branch || ''
  
  if (dayStem && yearBranch) {
    lines.push('') // 빈 줄
    lines.push('세운 (歲運)')
    lines.push('')
    
    // 공망 계산
    const dayGanzi = pillars[1]?.pillar.ganzi || ''
    const dayGanziIdx = HGANJI.indexOf(dayGanzi)
    const gongmangBranches: string[] = dayGanziIdx >= 0 ? GONGMANG_TABLE[Math.trunc(dayGanziIdx / 10)] : []
    
    // 현재 활성 대운 찾기 (실제 대운 시작 나이 기준)
    const currentYear = new Date().getFullYear()
    const currentAge = currentYear - input.year // 만 나이

    let activeDaewoonIdx = 0
    for (let i = 0; i < daewoon.length; i++) {
      if (daewoon[i].age <= currentAge) {
        activeDaewoonIdx = i
      } else {
        break
      }
    }
    const activeDw = daewoon[activeDaewoonIdx]
    const nextDw   = daewoon[activeDaewoonIdx + 1]
    const daewunStartAge = activeDw?.age ?? 0
    const daewunEndAge   = nextDw ? nextDw.age - 1 : daewunStartAge + 9

    // 연도 범위: 실제 대운 구간에 맞춰 표시
    const startYear = input.year + daewunStartAge
    const endYear   = input.year + daewunEndAge

    const sewunData: any[] = []
    for (let year = startYear; year <= endYear; year++) {
      const age = year - input.year
      
      const ganzi = getYearGanzi(year)
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
      const spirit = getTwelveSpirit(yearBranch, branch)
      
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
    
    const sewunRemarkRow = ['비고', ...sewunData.map(s => s.isGongmang ? '空亡' : '')].join(' | ')
    lines.push(`| ${sewunRemarkRow} |`)
    
    // 합충형파해 행 (에너지 작용) - 월운과 동일한 방식
    // 세운 각 년도의 간지와 원국 간지의 천간/지지 관계를 분석
    // 예: 세운 년도 간지가 신(신)일 때, 원국 시간 간지가 정(정)이면 두 간지 간 관계를 분석
    // 결과: 세운 년도 단위로 동동 관계 나열
    const sewunInteractionRow = ['합충형파해', ...sewunData.map(s => {
      const stem = s.stem; // 세운 천간
      const branch = s.branch; // 세운 지지
      let interArr: string[] = []; // 분석 결과 저장
      
      // 원국의 네 간지(년/월/일/시) 각 간지와 세운 간지 비교
      pillars.forEach((p, idx) => {
        const natalStem = p.pillar.stem; // 원국 천간
        const natalBranch = p.pillar.branch; // 원국 지지
        // 역순 매칭: idx 0=시, 1=일, 2=월, 3=년 -> 역순으로 매칭
        const pos = ["년", "월", "일", "시"][3 - idx];
        
        // 천간 분석: 원국 천간 vs 세운 천간 관계 (합/충/형/파/해 등)
        const sRel = getStemRelation(natalStem, stem);
        if (sRel) {
          const sRels = Array.isArray(sRel) ? sRel : [sRel];
          sRels.forEach(rel => {
            const label = typeof rel === 'object' ? (rel.hanja || rel.name || rel.type || '') : rel;
            if (label) interArr.push(`${natalStem}${stem}${label}(${pos}간)`);
          });
        }
        
        // 지지 분석: 원국 지지 vs 세운 지지 관계 (합/충/형/파/해 등)
        const bRel = getBranchRelation(natalBranch, branch);
        if (bRel) {
          const bRels = Array.isArray(bRel) ? bRel : [bRel];
          bRels.forEach(rel => {
            const label = typeof rel === 'object' ? (rel.hanja || rel.name || rel.type || '') : rel;
            if (label) interArr.push(`${natalBranch}${branch}${label}(${pos}지)`);
          });
        }
      });
      
      // 분석 결과를 ' / '로 연결하여 반환 (동동 관계가 여러 개일 수 있음)
      return interArr.length > 0 ? interArr.join(' / ') : '-';
    })].join(' | ')
    lines.push(`| ${sewunInteractionRow} |`)
    
    // 월운 섹션
    lines.push('')
    lines.push('월운 (月運)')
    lines.push('')

    // 월운 데이터: 지정 연도(monthlyYear) 1월~12월 동적 생성
    const targetMonthlyYear = monthlyYear ?? new Date().getFullYear()
    const monthlyData: any[] = []

    for (let monthIdx = 1; monthIdx <= 12; monthIdx++) {
      const ganziStr = calculateMonthGanzi(targetMonthlyYear, monthIdx)
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

    // 월별 절기 매핑 (1월~12월 고정)
    const solarTermMap: Record<number, string> = {
      1: '소한(小寒)', 2: '입춘(立春)', 3: '경칩(驚蟄)', 4: '청명(清明)',
      5: '입하(入夏)', 6: '망종(芒種)', 7: '소서(小暑)', 8: '입추(立秋)',
      9: '백로(白露)', 10: '한로(寒露)', 11: '입동(立冬)',
      '대설': '대설(大雪)',
      12: '대설(大雪)',
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
    
    // 절기 행
    const monthlySolarTermRow = ['절기', ...monthlyData.map((m) => {
      return solarTermMap[m.month] || `${m.month}월`
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
    
    const monthlyRemarkRow = ['비고', ...monthlyData.map(m => m.isGongmang ? '空亡' : '')].join(' | ')
    lines.push(`| ${monthlyRemarkRow} |`)
    
    // 합충형파해 행
    const monthlyInteractionsRow = ['합충형파해', ...monthlyData.map(m => m.interactions || '-')].join(' | ')
    lines.push(`| ${monthlyInteractionsRow} |`)
  }

  // 일운 (日運) - 오늘 ~ 다음달 오늘-1일
  lines.push('')
  lines.push('일운 (日運)')
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
  lines.push('')

  // 합충형파해 한글 매핑
  const DL_RELATION_KOR: Record<string, string> = {
    '合': '합', '半合': '반합', '沖': '충', '刑': '형',
    '破': '파', '害': '해', '怨嗔': '원진', '鬼門': '귀문관살',
  }

  // 절기 데이터 맵 생성 (날짜 범위에 포함된 연도)
  const DL_JIEQI_HAN = [
    "小寒","大寒","立春","雨水","驚蟄","春分",
    "清明","穀雨","立夏","小滿","芒種","夏至",
    "小暑","大暑","立秋","處暑","白露","秋分",
    "寒露","霜降","立冬","小雪","大雪","冬至",
  ]
  const DL_JIEQI_KOR = [
    "소한","대한","입춘","우수","경칩","춘분",
    "청명","곡우","입하","소만","망종","하지",
    "소서","대서","입추","처서","백로","추분",
    "한로","상강","입동","소설","대설","동지",
  ]
  const DL_JIEQI_FALLBACK: Record<number, string> = {
    4:"惊蛰", 7:"谷雨", 9:"小满", 10:"芒种", 15:"处暑",
  }
  const dlJieQiMap: Record<string, { name: string; time: string }> = {}
  new Set([dlToday.getFullYear(), dlEnd.getFullYear()]).forEach(yr => {
    try {
      const tbl = Solar.fromYmd(yr, 1, 1).getLunar().getJieQiTable()
      DL_JIEQI_HAN.forEach((han, idx) => {
        let data = tbl[han] ?? tbl[DL_JIEQI_FALLBACK[idx] ?? '']
        if (!data) return
        const parts = data.toYmdHms().split(/[-: ]/).map(Number)
        const dt = new Date(parts[0], parts[1]-1, parts[2], parts[3], parts[4])
        dt.setHours(dt.getHours() + 1)
        const key = `${dt.getFullYear()}-${dt.getMonth()+1}-${dt.getDate()}`
        dlJieQiMap[key] = {
          name: DL_JIEQI_KOR[idx],
          time: `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`,
        }
      })
    } catch (_e) {}
  })

  // 일운 공망 지지 집합 (원국 일주 기준)
  const dlDayGanzi = pillars[1]?.pillar.ganzi || ''
  const dlDayGanziIdx = HGANJI.indexOf(dlDayGanzi)
  const dlGongmangBranches: Set<string> = dlDayGanziIdx >= 0
    ? new Set(GONGMANG_TABLE[Math.trunc(dlDayGanziIdx / 10)] ?? [])
    : new Set()

  lines.push('| 날짜(음력) / 절기 | 천간십성 | 천간 | 지지 | 지지십성 | 12운성 | 12신살 | 합충형파해 | 비고 |')
  lines.push('|---|---|---|---|---|---|---|---|---|')

  const dlCurrent = new Date(dlToday)
  while (dlCurrent <= dlEnd) {
    const y = dlCurrent.getFullYear()
    const m = dlCurrent.getMonth() + 1
    const d = dlCurrent.getDate()

    try {
      const solar = Solar.fromYmd(y, m, d)
      const lunar = solar.getLunar()
      const dStem   = lunar.getDayGan()
      const dBranch = lunar.getDayZhi()
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

      // 합충형파해 한글(한자) 병기
      const interArr: string[] = []
      const dlPosLabels = ['시', '일', '월', '년']
      pillars.forEach((p, idx) => {
        const nStem   = p.pillar.stem
        const nBranch = p.pillar.branch
        const pos     = dlPosLabels[idx]

        getStemRelation(nStem, dStem).forEach(rel => {
          if (rel.type) {
            const kor       = DL_RELATION_KOR[rel.type] ?? rel.type
            const detailStr = rel.detail ? (ELEMENT_HANJA[rel.detail] ?? rel.detail) : ''
            interArr.push(`${nStem}${dStem} ${kor}(${rel.type})${detailStr}(${pos}간)`)
          }
        })

        getBranchRelation(nBranch, dBranch).forEach(rel => {
          if (rel.type) {
            const kor       = DL_RELATION_KOR[rel.type] ?? rel.type
            const detailStr = rel.detail ? (ELEMENT_HANJA[rel.detail] ?? rel.detail) : ''
            interArr.push(`${nBranch}${dBranch} ${kor}(${rel.type})${detailStr}(${pos}지)`)
          }
        })
      })
      const interStr = interArr.length > 0 ? interArr.join(' / ') : '-'

      // 날짜 + 절기
      const jieQiInfo = dlJieQiMap[`${y}-${m}-${d}`]
      const jieQiStr  = jieQiInfo ? ` / ${jieQiInfo.name} ${jieQiInfo.time}` : ''
      const dateStr   = `${m}월${d}일(음${lunarMonth}.${lunarDay})${jieQiStr}`

      // 천간·지지 한글(한자) 병기
      const stemAttrDl   = getStemAttr(dStem)
      const branchAttrDl = getBranchAttr(dBranch)
      const stemColStr   = `${stemAttrDl.um}(${dStem})`
      const branchColStr = `${branchAttrDl.um}(${dBranch})`

      // 공망 비고
      const bigoStr = dlGongmangBranches.has(dBranch) ? '空亡' : ''

      lines.push(`| ${dateStr} | ${stemSipsinStr} | ${stemColStr} | ${branchColStr} | ${branchSipsinStr} | ${meteorStr} | ${spiritStr} | ${interStr} | ${bigoStr} |`)
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
  const genderChar = chart.isMale ? '男' : '女'

  lines.push(`紫微斗數 命盤 (${genderChar})`)
  lines.push('═════')
  lines.push('')
  lines.push(`年柱: ${chart.yearGan}${chart.yearZhi}`)

  const mingPalace = chart.palaces['命宮']
  lines.push(`命宮: ${mingPalace?.gan ?? ''}${mingPalace?.zhi ?? ''}`)

  // 신궁 찾기
  let shenPalaceName = ''
  for (const p of Object.values(chart.palaces)) {
    if (p.isShenGong) { shenPalaceName = p.name; break }
  }
  lines.push(`身宮: ${shenPalaceName} (${chart.shenGongZhi})`)
  lines.push(`五行局: ${chart.wuXingJu.name}`)
  lines.push(`大限起始: ${chart.daXianStartAge}歲`)
  lines.push('')

  // 12궁
  lines.push('十二宮')
  lines.push('─────')
  for (const palaceName of PALACE_NAMES) {
    const palace = chart.palaces[palaceName]
    if (!palace) continue

    const shenMark = palace.isShenGong ? '·身' : '  '
    const mainStars = palace.stars.filter(s => MAIN_STAR_NAMES.has(s.name))
    const auxStars = palace.stars.filter(s => !MAIN_STAR_NAMES.has(s.name))

    const mainStr = mainStars.length > 0
      ? mainStars.map(s => {
          let name = s.name
          if (s.brightness) name += ` ${s.brightness}`
          if (s.siHua) name += ` ${s.siHua}`
          return name
        }).join(', ')
      : '(空宮)'

    lines.push(`${palace.name}${shenMark} ${palace.ganZhi}  ${mainStr}`)

    if (auxStars.length > 0) {
      const luckyNames = new Set(['左輔', '右弼', '文昌', '文曲', '天魁', '天鉞', '祿存', '天馬'])
      const lucky = auxStars.filter(s => luckyNames.has(s.name)).map(s => s.name)
      const sha = auxStars.filter(s => !luckyNames.has(s.name)).map(s => s.name)
      const parts: string[] = []
      if (lucky.length > 0) parts.push(`吉: ${lucky.join(' ')}`)
      if (sha.length > 0) parts.push(`煞: ${sha.join(' ')}`)
      if (parts.length > 0) lines.push(`          ${parts.join(' | ')}`)
    }
  }

  // 사화 요약
  lines.push('')
  lines.push('四化')
  lines.push('─────')
  const huaOrder = ['化祿', '化權', '化科', '化忌']
  for (const huaType of huaOrder) {
    for (const palace of Object.values(chart.palaces)) {
      for (const star of palace.stars) {
        if (star.siHua === huaType) {
          lines.push(`${huaType}: ${star.name} 在 ${palace.name}`)
        }
      }
    }
  }

  // 대운
  lines.push('')
  lines.push('大限')
  lines.push('─────')
  const daxianList = getDaxianList(chart)
  for (const dx of daxianList) {
    const stars = dx.mainStars.length > 0 ? dx.mainStars.join(' ') : '(空宮)'
    lines.push(`${String(dx.ageStart).padStart(3)}-${String(dx.ageEnd).padStart(3)}歲  ${dx.palaceName}  ${dx.ganZhi}  ${stars}`)
  }

  // 유년
  if (liunian) {
    lines.push('')
    lines.push(`流年 (${liunian.year}年 ${liunian.gan}${liunian.zhi}年)`)
    lines.push('═════')
    lines.push(`大限: ${liunian.daxianAgeStart}-${liunian.daxianAgeEnd}歲 ${liunian.daxianPalaceName}`)
    lines.push(`流年命宮: ${liunian.mingGongZhi}宮 → 本命 ${liunian.natalPalaceAtMing}`)

    for (const huaType of ['化祿', '化權', '化科', '化忌']) {
      let starName = ''
      for (const [s, h] of Object.entries(liunian.siHua)) {
        if (h === huaType) { starName = s; break }
      }
      const palaceName = liunian.siHuaPalaces[huaType] || '?'
      if (starName) lines.push(`${huaType}: ${starName} → ${palaceName}`)
    }

    lines.push('')
    const lunarMonthNames = ['正月', '二月', '三月', '四月', '五月', '六月',
                              '七月', '八月', '九月', '十月', '冬月', '臘月']
    for (const ly of liunian.liuyue) {
      lines.push(`${lunarMonthNames[ly.month - 1]} (${ly.mingGongZhi}): ${ly.natalPalaceName}`)
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


/** 일운(日運) 데이터를 AI해석용 복사본 양식으로 변환 */
export function dailyCalendarToText(
  year: number,
  month: number,
  dayStem: string,
  yearBranch: string,
  days: Array<{
    day: number;
    lunarMonth: number;
    lunarDay: number;
    ganzi: { stem: string; branch: string };
    jieqi?: { name: string; time: string };
    stemTenStem: string | null;
    branchTenStem: string | null;
    twelveMeteor: string | null;
    twelveSpirit: string | null;
  }>
): string {
  const lines: string[] = []

  // 제목
  lines.push(`日運 (${year}년 ${String(month).padStart(2, '0')}월)`)
  lines.push('')

  // 테이블 헤더
  lines.push('| 날짜(음력) / 절기 | 천간십성 | 천간 | 지지 | 지지십성 | 12운성 | 12신살 | 합충형파해 | 비고(공망 등) |')
  lines.push('|---|---|---|---|---|---|---|---|---|')

  // 각 날짜별 데이터 행
  for (const d of days) {
    const lunarDate = `${month}월${d.lunarDay}일(음${d.lunarMonth}.${d.lunarDay})`
    const jieqiInfo = d.jieqi ? ` / ${d.jieqi.name}${d.jieqi.time}` : ''
    const dateCol = `${lunarDate}${jieqiInfo}`
    
    const stemTenStemCol = d.stemTenStem || ''
    const stemCol = d.ganzi.stem
    const branchCol = d.ganzi.branch
    const branchTenStemCol = d.branchTenStem || ''
    const meteorCol = d.twelveMeteor || ''
    const spiritCol = d.twelveSpirit || ''
    const hoaChungCol = '' // 합충형파해 - 나중에 채워질 예정
    const bigoCol = '' // 비고(공망 등) - 나중에 채워질 예정

    lines.push(
      `| ${dateCol} | ${stemTenStemCol} | ${stemCol} | ${branchCol} | ${branchTenStemCol} | ${meteorCol} | ${spiritCol} | ${hoaChungCol} | ${bigoCol} |`
    )
  }

  lines.push('')

  return lines.join('\n')
}


/** 
 * 일운(日運) 데이터를 설정된 범위만큼 추출하여 AI해석용 양식으로 생성
 * @param dayStem - 사용자 일간 (예: 甲)
 * @param yearBranch - 사용자 년지 (예: 子)
 * @param copyDirection - 복사 방향 ('future' | 'past')
 * @param copyMonths - 복사 개월수 ('1' | '3' | '6')
 * @returns 설정된 범위의 일운 데이터를 테이블 양식으로 변환한 문자열
 */
export function generateDailyLuckText(
  dayStem: string,
  yearBranch: string,
  copyDirection: 'future' | 'past',
  copyMonths: string
): string {
  try {
    // 범위 계산
    const today = new Date();
    let startDate = new Date(today);
    let endDate = new Date(today);
    const months = parseInt(copyMonths) || 3;

    if (copyDirection === 'future') {
      // 미래: 오늘부터 N개월 뒤까지
      endDate.setMonth(endDate.getMonth() + months);
    } else {
      // 과거: N개월 전부터 오늘까지
      startDate.setMonth(startDate.getMonth() - months);
    }

    // 범위 내의 모든 날짜 추출
    const days: Array<{
      day: number;
      lunarMonth: number;
      lunarDay: number;
      ganzi: { stem: string; branch: string };
      jieqi?: { name: string; time: string };
      stemTenStem: string | null;
      branchTenStem: string | null;
      twelveMeteor: string | null;
      twelveSpirit: string | null;
    }> = [];

    const { Solar } = require('lunar-javascript');
    const { getRelation, getHiddenStems, getTwelveMeteor, getTwelveSpirit } = require('@core/pillars');

    // 범위 내 모든 날짜 순회
    const current = new Date(startDate);
    while (current <= endDate) {
      const year = current.getFullYear();
      const month = current.getMonth() + 1;
      const day = current.getDate();

      try {
        const solar = Solar.fromYmd(year, month, day);
        const lunar = solar.getLunar();
        const ganzi = solar.getGanzi();

        // 천간십성 계산
        const relation = getRelation(dayStem, ganzi.stem);
        const stemTenStem = relation || null;

        // 지지십성 계산 (정기 기준)
        const branchRelation = getRelation(dayStem, ganzi.branch);
        const branchTenStem = branchRelation || null;

        // 12운성 계산
        const twelveMeteor = getTwelveMeteor(dayStem, ganzi.branch) || null;

        // 12신살 계산 (년지 기준)
        const twelveSpirit = getTwelveSpirit(yearBranch, ganzi.branch) || null;

        // 절기 정보 추출
        let jieqi: { name: string; time: string } | undefined;
        try {
          const jieQiTable = lunar.getJieQiTable();
          // 절기 정보는 복잡하므로 여기서는 생략 (필요시 추가)
        } catch (e) {
          // 절기 정보 없음
        }

        days.push({
          day,
          lunarMonth: lunar.getMonth(),
          lunarDay: lunar.getDay(),
          ganzi: { stem: ganzi.stem, branch: ganzi.branch },
          jieqi,
          stemTenStem,
          branchTenStem,
          twelveMeteor,
          twelveSpirit
        });
      } catch (e) {
        console.warn(`날짜 ${year}-${month}-${day} 처리 오류:`, e);
      }

      // 다음 날짜로 이동
      current.setDate(current.getDate() + 1);
    }

    // 데이터가 없으면 빈 문자열 반환
    if (days.length === 0) {
      return '';
    }

    // 첫 번째 날짜의 연/월 기준으로 제목 생성
    const firstDay = days[0];
    const year = startDate.getFullYear();
    const month = startDate.getMonth() + 1;

    // dailyCalendarToText 함수 사용하여 테이블 생성
    return dailyCalendarToText(year, month, dayStem, yearBranch, days);
  } catch (e) {
    console.error('[generateDailyLuckText] 오류:', e);
    return '';
  }
}

// ============================================
// 범위 필터링 기반 일운 데이터 추출 함수들
// ============================================

/** 범위 내 일운 데이터 추출 */
export function extractDailyLuckData(
  dayStem: string,
  yearBranch: string,
  selectedDate?: Date
): Array<{
  date: string;
  lunarDate: string;
  ganzi: string;
  stem: string;
  branch: string;
  stemSipsin: string;
  branchSipsin: string;
  meteor: string;
  spirit: string;
}> {
  try {
    const { Solar } = require('lunar-javascript');
    const { getRelation, getTwelveMeteor, getTwelveSpirit } = require('@core/pillars');
    
    // 선택된 날짜 또는 오늘부터 시작
    const startDate = selectedDate ? new Date(selectedDate) : new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30); // 31일 = 시작일 + 30일

    const dailyData: Array<any> = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const year = current.getFullYear();
      const month = current.getMonth() + 1;
      const day = current.getDate();

      try {
        const solar = Solar.fromYmd(year, month, day);
        const lunar = solar.getLunar();
        const ganzi = solar.getGanzi();
        
        const stem = ganzi.stem;
        const branch = ganzi.branch;

        const stemSipsin = getRelation(dayStem, stem) || '';
        const branchSipsin = getRelation(dayStem, branch) || '';
        const meteor = getTwelveMeteor(dayStem, branch) || '';
        const spirit = getTwelveSpirit(yearBranch, branch) || '';

        const lunarMonth = lunar.getMonth();
        const lunarDay = lunar.getDay();

        dailyData.push({
          date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          lunarDate: `${lunarMonth}월${lunarDay}일`,
          ganzi: `${stem}${branch}`,
          stem,
          branch,
          stemSipsin,
          branchSipsin,
          meteor,
          spirit
        });
      } catch (e) {
        // 날짜 처리 오류 무시
      }

      current.setDate(current.getDate() + 1);
    }

    return dailyData;
  } catch (e) {
    console.error('[extractDailyLuckData] 오류:', e);
    return [];
  }
}

/** 추출된 일운 데이터를 테이블로 변환 */
export function dailyDataToText(
  dailyData: Array<any>,
  year: number,
  month: number
): string {
  const lines: string[] = [];

  lines.push(`日運 (${year}년 ${String(month).padStart(2, '0')}월)`);
  lines.push('');
  lines.push('| 날짜(음력) | 천간십성 | 천간 | 지지 | 지지십성 | 12운성 | 12신살 |');
  lines.push('|---|---|---|---|---|---|---|');

  for (const d of dailyData) {
    lines.push(
      `| ${d.lunarDate} | ${d.stemSipsin || ''} | ${d.stem} | ${d.branch} | ${d.branchSipsin || ''} | ${d.meteor || ''} | ${d.spirit || ''} |`
    );
  }

  lines.push('');
  return lines.join('\n');
}

/** 일운 데이터 생성 (31일 고정 기간) */
export function generateDailyLuckTextNew(
  dayStem: string,
  yearBranch: string,
  selectedDate?: Date
): string {
  try {
    const dailyData = extractDailyLuckData(dayStem, yearBranch, selectedDate);

    if (dailyData.length === 0) {
      return '';
    }

    const firstDate = dailyData[0].date;
    const [year, monthStr] = firstDate.split('-');
    const month = parseInt(monthStr);

    return dailyDataToText(dailyData, parseInt(year), month);
  } catch (e) {
    console.error('[generateDailyLuckTextNew] 오류:', e);
    return '';
  }
}
