import { getRelation, getJeonggi, getTwelveMeteor, getTwelveSpirit, getStemRelation, getBranchRelation } from '@core/pillars'
import { getMonthGanzi } from '@core/monthly-data'
import { stemColorClass, branchColorClass, stemSolidBgClass, branchSolidBgClass, formatSinsal, getStemAttr, getBranchAttr } from '../../utils/format.ts'
import { useLocale } from '../../i18n/index.ts'

interface Props {
  currentYear: number
  currentMonth: number
  pillars: string[][]
  dayStem: string
  yearBranch: string
  gongmangBranches: [string, string]
}

interface MonthlyItem {
  year: number
  month: number
  ganzi: string
  stemSipsin: string
  branchSipsin: string
  unseong: string
  sinsal: string
  interactions: string // 줄바꿈(\n)이 포함된 문자열
  isGongmang: boolean
  monthLabel: string
}

const MONTH_LABELS = ['5월(입하)', '6월(망종)', '7월(소서)', '8월(입추)', '9월(백로)', '10월(한로)', '11월(입동)', '12월(대설)', '1월(소한)', '2월(입춘)', '3월(경칩)', '4월(청명)']

const SOLAR_TERM_MAP: Record<string, string> = {
  '입하': '입하(入夏)',
  '망종': '망종(芒種)',
  '소서': '소서(小暑)',
  '입추': '입추(立秋)',
  '백로': '백로(白露)',
  '한로': '한로(寒露)',
  '입동': '입동(立冬)',
  '대설': '대설(大雪)',
  '소한': '소한(小寒)',
  '입춘': '입춘(立春)',
  '경칩': '경칩(驚蟄)',
  '청명': '청명(清明)'
}

const STEM_SIPSIN_MAP: Record<string, string> = {
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

const BRANCH_SIPSIN_MAP: Record<string, string> = {
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

function buildMonthlyItems(
  startYear: number, startMonth: number,
  pillars: string[][], dayStem: string, yearBranch: string,
  gmSet: Set<string>,
): MonthlyItem[] {
  const items: MonthlyItem[] = []
  const posLabels = ["년", "월", "일", "시"];
  
  for (let i = 0; i < 12; i++) {
    let actualMonth = startMonth + i
    let year = startYear
    
    if (actualMonth > 12) {
      actualMonth -= 12
      year += 1
    }
    
    const ganzi = getMonthGanzi(year, actualMonth)
    const stem = ganzi[0]
    const branch = ganzi[1]
    
    const rel = getRelation(dayStem, stem)
    const stemSipsin = rel ? rel.hanja : '?'
    const jeonggi = getJeonggi(branch)
    const bRel = getRelation(dayStem, jeonggi)
    const branchSipsin = bRel ? bRel.hanja : '?'

    // [개선된 에너지 작용 분석 로직]
    let interArr: string[] = [];
    
    // 8글자(4기둥 * 2글자)를 전수 조사합니다.
    pillars.forEach((p, idx) => {
      const natalStem = p[0];
      const natalBranch = p[1];
      const pos = posLabels[idx]; // 정방향 매칭: idx 0=년, 1=월, 2=일, 3=시

      // 1. 천간 분석 (배열 및 객체 속성 대응)
      const sRel = getStemRelation(natalStem, stem);
      if (sRel) {
        const sRels = Array.isArray(sRel) ? sRel : [sRel]; // 배열이 아닐 경우 배열로 감쌈
        sRels.forEach(rel => {
          // 객체일 경우 hanja -> name -> type 순으로 찾고, 없으면 문자열 그대로 사용
          const label = typeof rel === 'object' ? (rel.hanja || rel.name || rel.type || '') : rel;
          if (label) interArr.push(`${natalStem}${stem}${label}(${pos}간)`);
        });
      }

      // 2. 지지 분석 (합/충/형 등이 여러 개일 경우 대응)
      const bRel = getBranchRelation(natalBranch, branch);
      if (bRel) {
        const bRels = Array.isArray(bRel) ? bRel : [bRel];
        bRels.forEach(rel => {
          const label = typeof rel === 'object' ? (rel.hanja || rel.name || rel.type || '') : rel;
          if (label) interArr.push(`${natalBranch}${branch}${label}(${pos}지)`);
        });
      }
    });
    
    let labelIndex = (actualMonth - 5 + 12) % 12
    
    items.push({
      year,
      month: actualMonth,
      ganzi,
      stemSipsin,
      branchSipsin,
      unseong: getTwelveMeteor(dayStem, branch),
      sinsal: formatSinsal(getTwelveSpirit(yearBranch, branch)),
      // 쉼표 없이 줄바꿈(\n)으로 합침
      interactions: interArr.length > 0 ? interArr.join('\n') : '',
      isGongmang: gmSet.has(branch),
      monthLabel: MONTH_LABELS[labelIndex],
    })
  }
  return items
}

export default function MonthlyTable({
  currentYear, currentMonth, pillars, dayStem, yearBranch, gongmangBranches,
}: Props) {
  const { t } = useLocale()
  const gmSet = new Set(gongmangBranches)
  const monthlyItems = buildMonthlyItems(currentYear, currentMonth, pillars, dayStem, yearBranch, gmSet)
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-3">월운(月運)</h3>
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              {monthlyItems.map((item, idx) => {
                const monthNum = item.monthLabel.match(/\d+/)?.[0]
                return (
                  <th key={idx} className="border border-black px-2 py-1 text-center min-w-[100px] text-xs">
                    {item.year}년<br/>{monthNum}월
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            <tr>
              {monthlyItems.map((item, idx) => {
                const solarTermMatch = item.monthLabel.match(/\((.+?)\)/)?.at(1) || ''
                return (
                  <td key={idx} className="border border-black px-2 py-1 text-center text-xs">
                    {SOLAR_TERM_MAP[solarTermMatch] || solarTermMatch}
                  </td>
                )
              })}
            </tr>
            <tr>
              {monthlyItems.map((item, idx) => (
                <td key={idx} className={`border border-black px-2 py-1 text-center text-xs font-medium ${stemColorClass(item.ganzi[0])}`}>
                  {STEM_SIPSIN_MAP[item.stemSipsin] || item.stemSipsin}
                </td>
              ))}
            </tr>
            <tr>
              {monthlyItems.map((item, idx) => {
                const stemAttr = getStemAttr(item.ganzi[0])
                return (
                  <td key={idx} className="border border-black px-2 py-2 text-center">
                    <div className="relative inline-flex items-center justify-center">
                      <span className="absolute -top-1.5 -right-5 text-[9px] font-bold text-slate-900 leading-none">
                        {stemAttr.um}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-white font-bold text-sm ${stemSolidBgClass(item.ganzi[0])}`}>
                        {item.ganzi[0]}
                      </span>
                      <span className="absolute -bottom-1.5 -right-9 text-[9px] font-bold text-slate-900 leading-none whitespace-nowrap">
                        ({stemAttr.ohaeng})
                      </span>
                    </div>
                  </td>
                )
              })}
            </tr>
            <tr>
              {monthlyItems.map((item, idx) => {
                const branchAttr = getBranchAttr(item.ganzi[1])
                return (
                  <td key={idx} className="border border-black px-2 py-2 text-center">
                    <div className="relative inline-flex items-center justify-center">
                      <span className="absolute -top-1.5 -right-5 text-[9px] font-bold text-slate-900 leading-none">
                        {branchAttr.um}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-white font-bold text-sm ${branchSolidBgClass(item.ganzi[1])}`}>
                        {item.ganzi[1]}
                      </span>
                      <span className="absolute -bottom-1.5 -right-9 text-[9px] font-bold text-slate-900 leading-none whitespace-nowrap">
                        ({branchAttr.ohaeng})
                      </span>
                    </div>
                  </td>
                )
              })}
            </tr>
            <tr>
              {monthlyItems.map((item, idx) => (
                <td key={idx} className={`border border-black px-2 py-1 text-center text-xs font-medium ${branchColorClass(item.ganzi[1])}`}>
                  {BRANCH_SIPSIN_MAP[item.branchSipsin] || item.branchSipsin}
                </td>
              ))}
            </tr>
            <tr>
              {monthlyItems.map((item, idx) => (
                <td key={idx} className="border border-black px-2 py-1 text-center text-xs">
                  {item.unseong}
                </td>
              ))}
            </tr>
            <tr>
              {monthlyItems.map((item, idx) => {
                const match = item.sinsal.match(/^(.+?)\((.+?)\)$/)
                const hangul = match ? match[1] : item.sinsal
                const hanja = match ? `(${match[2]})` : ''
                return (
                  <td key={idx} className="border border-black px-2 py-1 text-center text-xs">
                    {hangul}<br/>{hanja}
                  </td>
                )
              })}
            </tr>
            <tr>
              {monthlyItems.map((item, idx) => (
                <td key={idx} className="border border-black px-2 py-1 text-center text-xs">
                  {item.isGongmang ? '空亡' : '-'}
                </td>
              ))}
            </tr>
            {/* 에너지 작용 (줄바꿈 적용) */}
            <tr className="bg-blue-50/30">
              {monthlyItems.map((item, idx) => (
                <td key={idx} className="border border-black px-2 py-1 text-center text-[10px] leading-tight whitespace-pre-line break-keep">
                  {item.interactions || '-'}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
