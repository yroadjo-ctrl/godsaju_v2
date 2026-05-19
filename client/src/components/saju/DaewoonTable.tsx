import { useState, useRef, useEffect, useMemo } from 'react'
import type { DaewoonItem } from '@core/types'
import { getYearGanzi, getRelation, getJeonggi, getTwelveMeteor, getTwelveSpirit, getStemRelation, getBranchRelation } from '@core/pillars'
import { stemColorClass, branchColorClass, stemSolidBgClass, branchSolidBgClass, formatSinsal, getStemAttr, getBranchAttr } from '../../utils/format.ts'
import { useLocale } from '../../i18n/index.ts'

interface Props {
  daewoon: DaewoonItem[]
  unknownTime?: boolean
  birthYear: number
  dayStem: string
  yearBranch: string
  gongmangBranches: [string, string]
  pillars: string[][]
}

function findActiveDaewoonIndexByAge(daewoon: DaewoonItem[], currentAge: number): number {
  for (let i = 0; i < daewoon.length; i++) {
    const d = daewoon[i]
    if (currentAge >= d.age && currentAge <= d.age + 9) {
      return i
    }
  }
  return 0
}

interface DaewoonTableItem {
  index: number
  age: number
  startYear: number
  endYear: number
  ganzi: string
  stemSipsin: string
  branchSipsin: string
  unseong: string
  sinsal: string
  isGongmang: boolean
  interactions: string
}

interface SewoonItem {
  year: number
  age: number
  ganzi: string
  stemSipsin: string
  branchSipsin: string
  unseong: string
  sinsal: string
  isGongmang: boolean
  interactions: string
}

function buildDaewoonTableItems(daewoon: DaewoonItem[], pillars: string[][]): DaewoonTableItem[] {
  // DaewoonTable이 받는 pillars는 [시, 일, 월, 년] 순서이므로 역순 라벨 사용
  const posLabels = ["시", "일", "월", "년"];
  
  return daewoon.map((dw) => {
    const stem = dw.ganzi[0];
    const branch = dw.ganzi[1];
    
    // [절대 수정 금지] 라벨과 인덱스 강제 매칭
    let interArr: string[] = [];
    
    // pillars가 [년, 월, 일, 시] 순서라고 가정하고 정방향으로 매칭
    pillars.forEach((p, idx) => {
      const natalStem = p[0];
      const natalBranch = p[1];
      const pos = posLabels[idx]; // idx 0='년', 1='월', 2='일', 3='시'
      
      // 천간 분석
      const sRel = getStemRelation(natalStem, stem);
      if (sRel) {
        const sRels = Array.isArray(sRel) ? sRel : [sRel];
        sRels.forEach(rel => {
          const label = typeof rel === 'object' ? (rel.hanja || rel.name || rel.type || '') : rel;
          if (label) interArr.push(`${natalStem}${stem}${label}(${pos}간)`);
        });
      }
      
      // 지지 분석
      const bRel = getBranchRelation(natalBranch, branch);
      if (bRel) {
        const bRels = Array.isArray(bRel) ? bRel : [bRel];
        bRels.forEach(rel => {
          const label = typeof rel === 'object' ? (rel.hanja || rel.name || rel.type || '') : rel;
          if (label) interArr.push(`${natalBranch}${branch}${label}(${pos}지)`);
        });
      }
    });
    
    return {
      index: dw.index,
      age: dw.age,
      startYear: dw.startDate.getFullYear(),
      endYear: new Date(dw.startDate.getFullYear() + 10, dw.startDate.getMonth(), dw.startDate.getDate()).getFullYear(),
      ganzi: dw.ganzi,
      stemSipsin: dw.stemSipsin,
      branchSipsin: dw.branchSipsin,
      unseong: dw.unseong,
      sinsal: dw.sinsal,
      isGongmang: dw.isGongmang,
      interactions: interArr.length > 0 ? interArr.join('\n') : '',
    }
  })
}

function buildSewoonItems(
  startYear: number, endYear: number,
  birthYear: number, dayStem: string, yearBranch: string,
  gmSet: Set<string>,
  pillars: string[][] = [],
): SewoonItem[] {
  const items: SewoonItem[] = []
  const posLabels = ["시", "일", "월", "년"];
  
  for (let y = startYear; y < endYear; y++) {
    const ganzi = getYearGanzi(y)
    const stem = ganzi[0]
    const branch = ganzi[1]
    const rel = getRelation(dayStem, stem)
    const stemSipsin = rel ? rel.hanja : '?'
    const jeonggi = getJeonggi(branch)
    const bRel = getRelation(dayStem, jeonggi)
    const branchSipsin = bRel ? bRel.hanja : '?'
    
    // 합충형파해 분석 로직
    let interArr: string[] = [];
    pillars.forEach((p, idx) => {
      const natalStem = p[0];
      const natalBranch = p[1];
      const pos = posLabels[idx];
      
      // 천간 분석
      const sRel = getStemRelation(natalStem, stem);
      if (sRel) {
        const sRels = Array.isArray(sRel) ? sRel : [sRel];
        sRels.forEach(rel => {
          const label = typeof rel === 'object' ? (rel.hanja || rel.name || rel.type || '') : rel;
          if (label) interArr.push(`${natalStem}${stem}${label}(${pos}간)`);
        });
      }
      
      // 지지 분석
      const bRel = getBranchRelation(natalBranch, branch);
      if (bRel) {
        const bRels = Array.isArray(bRel) ? bRel : [bRel];
        bRels.forEach(rel => {
          const label = typeof rel === 'object' ? (rel.hanja || rel.name || rel.type || '') : rel;
          if (label) interArr.push(`${natalBranch}${branch}${label}(${pos}지)`);
        });
      }
    });
    
    items.push({
      year: y,
      age: y - birthYear,
      ganzi,
      stemSipsin,
      branchSipsin,
      unseong: getTwelveMeteor(dayStem, branch),
      sinsal: formatSinsal(getTwelveSpirit(yearBranch, branch)),
      isGongmang: gmSet.has(branch),
      interactions: interArr.length > 0 ? interArr.join('\n') : '',
    })
  }
  return items
}

export default function DaewoonTable({
  daewoon, unknownTime, birthYear, dayStem, yearBranch, gongmangBranches, pillars,
}: Props) {
  const { t } = useLocale()

  if (daewoon.length === 0) {
    return (
      <section>
        <h3 className="text-base font-medium text-gray-700 dark:text-gray-200 mb-2">大運</h3>
        <p className="text-base text-gray-400 dark:text-gray-500">{t('saju.noData')}</p>
      </section>
    )
  }

  const currentAge = new Date().getFullYear() - birthYear
  const autoIndex = useMemo(() => findActiveDaewoonIndexByAge(daewoon, currentAge), [daewoon, currentAge])
  
  const [selectedIdx, setSelectedIdx] = useState(-1)
  const sewoonScrollRef = useRef<HTMLDivElement>(null)

  // 사주 재계산 시 선택 초기화
  useEffect(() => {
    setSelectedIdx(autoIndex)
  }, [daewoon, autoIndex])

  const gmSet = useMemo(() => new Set(gongmangBranches), [gongmangBranches])

  const daewoonTableItems = useMemo(() => buildDaewoonTableItems(daewoon, pillars), [daewoon, pillars])

  const displayIndex = selectedIdx !== -1 ? selectedIdx : autoIndex
  const targetDaewoon = daewoon[displayIndex] || daewoon[0]

  const startYearForSewoon = birthYear + targetDaewoon.age
  const endYearForSewoon = startYearForSewoon + 10

  const sewoonItems = useMemo(() => {
    return buildSewoonItems(
      startYearForSewoon,
      endYearForSewoon,
      birthYear,
      dayStem,
      yearBranch,
      gmSet,
      pillars
    )
  }, [startYearForSewoon, endYearForSewoon, birthYear, dayStem, yearBranch, gmSet, pillars])

  return (
    <section className="space-y-6">
      {/* 대운 테이블 */}
      <div>
        <h3 className="text-lg font-semibold mb-3">대운(大運)</h3>
        {unknownTime && (
          <p className="text-sm text-amber-600 dark:text-amber-400 mb-2">
            {t('saju.unknownTimeWarning')}
          </p>
        )}
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                {[...daewoonTableItems].reverse().map((item, idx) => {
                  const actualIdx = daewoonTableItems.length - 1 - idx
                  const isActive = actualIdx === autoIndex
                  const isSelected = actualIdx === selectedIdx && actualIdx !== autoIndex
                  return (
                    <th 
                      key={idx} 
                      className={`border border-black px-2 py-2 text-center min-w-[100px] text-xs font-semibold cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#66FFFF]' : isActive ? 'bg-[#FFFF00]' : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                      onClick={() => setSelectedIdx(actualIdx)}
                    >
                      {item.age}세<br/>({item.startYear}년~)
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              <tr>
                {[...daewoonTableItems].reverse().map((item, idx) => (
                  <td key={idx} className={`border border-black px-2 py-1 text-center text-xs font-medium ${stemColorClass(item.ganzi[0])}`}>
                    {item.stemSipsin}
                  </td>
                ))}
              </tr>
              <tr>
                {[...daewoonTableItems].reverse().map((item, idx) => {
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
                {[...daewoonTableItems].reverse().map((item, idx) => {
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
                {[...daewoonTableItems].reverse().map((item, idx) => {
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
                  return (
                    <td key={idx} className={`border border-black px-2 py-1 text-center text-xs font-medium ${branchColorClass(item.ganzi[1])}`}>
                      {branchSipsinMap[item.branchSipsin] || item.branchSipsin}
                    </td>
                  )
                })}
              </tr>
              <tr>
                {[...daewoonTableItems].reverse().map((item, idx) => (
                  <td key={idx} className="border border-black px-2 py-1 text-center text-xs">
                    {item.unseong}
                  </td>
                ))}
              </tr>
              <tr>
                {[...daewoonTableItems].reverse().map((item, idx) => {
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
                {[...daewoonTableItems].reverse().map((item, idx) => (
                  <td key={idx} className="border border-black px-2 py-1 text-center text-xs">
                    {item.isGongmang ? '空亡' : '-'}
                  </td>
                ))}
              </tr>
              {/* 에너지 작용 (합충형파해) */}
              <tr className="bg-blue-50/30">
                {[...daewoonTableItems].reverse().map((item, idx) => (
                  <td key={idx} className="border border-black px-2 py-1 text-center text-[10px] leading-tight whitespace-pre-line break-keep min-h-[50px]">
                    {item.interactions || '-'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 세운 테이블 */}
      {selectedIdx >= 0 && sewoonItems.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">세운(歲運)</h3>
          <div ref={sewoonScrollRef} className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  {[...sewoonItems].reverse().map((item, idx) => {
                    const actualIdx = sewoonItems.length - 1 - idx
                    const isCurrentYear = item.year === new Date().getFullYear()
                    return (
                      <th key={idx} className={`border border-black px-2 py-2 text-center min-w-[100px] text-xs font-semibold ${
                        isCurrentYear ? 'bg-[#FFFF00]' : 'bg-gray-100'
                      }`}>
                        {item.age}세<br/>({item.year}년)
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {[...sewoonItems].reverse().map((item, idx) => {
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
                    return (
                      <td key={idx} className={`border border-black px-2 py-1 text-center text-xs font-medium ${stemColorClass(item.ganzi[0])}`}>
                        {stemSipsinMap[item.stemSipsin] || item.stemSipsin}
                      </td>
                    )
                  })}
                </tr>
                <tr>
                  {[...sewoonItems].reverse().map((item, idx) => {
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
                  {[...sewoonItems].reverse().map((item, idx) => {
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
                  {[...sewoonItems].reverse().map((item, idx) => {
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
                    return (
                      <td key={idx} className={`border border-black px-2 py-1 text-center text-xs font-medium ${branchColorClass(item.ganzi[1])}`}>
                        {branchSipsinMap[item.branchSipsin] || item.branchSipsin}
                      </td>
                    )
                  })}
                </tr>
                <tr>
                  {[...sewoonItems].reverse().map((item, idx) => (
                    <td key={idx} className="border border-black px-2 py-1 text-center text-xs">
                      {item.unseong}
                    </td>
                  ))}
                </tr>
                <tr>
                  {[...sewoonItems].reverse().map((item, idx) => {
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
                  {[...sewoonItems].reverse().map((item, idx) => (
                    <td key={idx} className="border border-black px-2 py-1 text-center text-xs">
                      {item.isGongmang ? '空亡' : '-'}
                    </td>
                  ))}
                </tr>
                {/* 에너지 작용 (합충형파해) */}
                <tr className="bg-blue-50/30">
                  {[...sewoonItems].reverse().map((item, idx) => (
                    <td key={idx} className="border border-black px-2 py-1 text-center text-[10px] leading-tight whitespace-pre-line break-keep min-h-[50px]">
                      {item.interactions || '-'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
