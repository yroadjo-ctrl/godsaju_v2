import { useMemo } from 'react'
import type { DaewoonItem, DaewoonMeta, YongsinStats } from '@core/types'
import { annotateTransit } from '@core/index'
import { getStemRelation, getBranchRelation } from '@core/pillars'
import { stemColorClass, branchColorClass, stemSolidBgClass, branchSolidBgClass, getStemAttr, getBranchAttr } from '../../utils/format.ts'
import { useLocale } from '../../i18n/index.ts'
import { YUN_METHOD_NOTES } from '../../utils/yun-method-notes.ts'

interface Props {
  daewoon: DaewoonItem[]
  daewoonMeta: DaewoonMeta
  unknownTime?: boolean
  natalGanzis: string[]
  yongsin: YongsinStats
  selectedIdx: number
  autoIndex: number
  onSelectDaewoon: (idx: number) => void
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
  fuYinFanYin: string
  yongsinLabel: string
}

function buildDaewoonTableItems(
  daewoon: DaewoonItem[],
  natalGanzis: string[],
  yongsin: YongsinStats,
): DaewoonTableItem[] {
  const posLabels = ['시', '일', '월', '년']

  return daewoon.map((dw) => {
    const stem = dw.ganzi[0]
    const branch = dw.ganzi[1]
    const ann = annotateTransit(dw.ganzi, natalGanzis, yongsin)

    const interArr: string[] = []

    natalGanzis.forEach((natal, idx) => {
      const natalStem = natal[0]
      const natalBranch = natal[1]
      const pos = posLabels[idx]

      const sRel = getStemRelation(natalStem, stem)
      if (sRel) {
        const sRels = Array.isArray(sRel) ? sRel : [sRel]
        sRels.forEach(rel => {
          const label = typeof rel === 'object' ? (rel.hanja || rel.name || rel.type || '') : rel
          if (label) interArr.push(`${natalStem}${stem}${label}(${pos}간)`)
        })
      }

      const bRel = getBranchRelation(natalBranch, branch)
      if (bRel) {
        const bRels = Array.isArray(bRel) ? bRel : [bRel]
        bRels.forEach(rel => {
          const label = typeof rel === 'object' ? (rel.hanja || rel.name || rel.type || '') : rel
          if (label) interArr.push(`${natalBranch}${branch}${label}(${pos}지)`)
        })
      }
    })

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
      fuYinFanYin: ann.fuYinFanYin,
      yongsinLabel: ann.yongsinLabel,
    }
  })
}

export default function DaewoonTable({
  daewoon, daewoonMeta, unknownTime, natalGanzis, yongsin, selectedIdx, autoIndex, onSelectDaewoon,
}: Props) {
  const { t } = useLocale()

  if (daewoon.length === 0) {
    return (
      <section>
        <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-2">
          대운 <span className="font-hanja">(大運)</span>
        </h3>
        <p className="text-base text-gray-400 dark:text-gray-500">{t('saju.noData')}</p>
      </section>
    )
  }

  const daewoonTableItems = useMemo(
    () => buildDaewoonTableItems(daewoon, natalGanzis, yongsin),
    [daewoon, natalGanzis, yongsin],
  )

  return (
    <section>
      <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-1">
        대운 <span className="font-hanja">(大運)</span>
      </h3>
      <div className="mb-3 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm">
        <span className="font-medium text-gray-700 dark:text-gray-200">
          대운수 : {daewoonMeta.daewoonSuDisplay}({daewoonMeta.monthGanziKor})
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
          (정밀 {daewoonMeta.daewoonSu})
        </span>
        <span className="text-gray-500 dark:text-gray-400 mx-2">·</span>
        <span className="text-gray-600 dark:text-gray-300">
          {daewoonMeta.directionKor}({daewoonMeta.direction})
        </span>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {daewoonMeta.termLabel} · 절기까지 {daewoonMeta.daysToTerm}일 (3일=1년)
          {daewoonMeta.firstGanzi && (
            <> · 1運 {daewoonMeta.firstGanzi}({daewoonMeta.firstStartDate.getFullYear()}년~)</>
          )}
        </p>
      </div>
      {unknownTime && (
        <p className="text-sm text-amber-600 dark:text-amber-400 mb-2">
          {t('saju.unknownTimeWarning')}
        </p>
      )}
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 leading-relaxed">
        {YUN_METHOD_NOTES.daewoon}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 leading-relaxed">
        {YUN_METHOD_NOTES.yongsinTransit}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        열을 클릭하면 해당 대운 구간의 세운을 아래에서 볼 수 있습니다.
      </p>
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
                    onClick={() => onSelectDaewoon(actualIdx)}
                  >
                    {item.age}세<br />({item.startYear}년~)
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
                  '正官': '정관(正官)', '偏官': '편관(偏官)', '正印': '정인(正印)', '偏印': '편인(偏印)',
                  '正財': '정재(正財)', '偏財': '편재(偏財)', '食神': '식신(食神)', '傷官': '상관(傷官)',
                  '比肩': '비견(比肩)', '劫財': '겁재(劫財)',
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
                    {hangul}<br />{hanja}
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
            <tr className="bg-blue-50/30">
              {[...daewoonTableItems].reverse().map((item, idx) => (
                <td key={idx} className="border border-black px-2 py-1 text-center text-[10px] leading-tight whitespace-pre-line break-keep min-h-[50px]">
                  {item.interactions || '-'}
                </td>
              ))}
            </tr>
            <tr>
              {[...daewoonTableItems].reverse().map((item, idx) => (
                <td key={idx} className="border border-black px-2 py-1 text-center text-[10px] leading-tight whitespace-pre-line">
                  {item.fuYinFanYin}
                </td>
              ))}
            </tr>
            <tr>
              {[...daewoonTableItems].reverse().map((item, idx) => (
                <td key={idx} className="border border-black px-2 py-1 text-center text-[10px] leading-tight">
                  {item.yongsinLabel}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
