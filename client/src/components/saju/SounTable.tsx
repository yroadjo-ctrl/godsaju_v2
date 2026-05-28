import { useMemo } from 'react'
import type { DaewoonItem, DaewoonMeta, SounItem, YongsinStats } from '@core/types'
import { annotateTransit } from '@core/index'
import { collectNatalTransitInteractions } from '../../utils/yun-bigo.ts'
import YunBigoCell from './YunBigoCell.tsx'
import {
  stemColorClass, branchColorClass, stemSolidBgClass, branchSolidBgClass,
  formatSinsal, getStemAttr, getBranchAttr,
} from '../../utils/format.ts'
import { YUN_SOUN_UI_NOTES } from '../../utils/yun-method-notes.ts'
import YunSectionHeading from './YunSectionHeading.tsx'
import { formatDaewoonStartCell } from '@core/jieqi-lunar'
import { getActiveSounIndex } from '../../utils/yun-period.ts'
import { SOUN_EMPTY_REASON } from '../../utils/ganzi-display.ts'
import { JieQiBoundaryCell } from './JieQiCell.tsx'

interface Props {
  soun: SounItem[]
  daewoon: DaewoonItem[]
  daewoonMeta: DaewoonMeta
  natalGanzis: string[]
  yongsin: YongsinStats
  unknownTime?: boolean
}

const STEM_SIPSIN_MAP: Record<string, string> = {
  '正官': '정관(正官)', '偏官': '편관(偏官)', '正印': '정인(正印)', '偏印': '편인(偏印)',
  '正財': '정재(正財)', '偏財': '편재(偏財)', '食神': '식신(食神)', '傷官': '상관(傷官)',
  '比肩': '비견(比肩)', '劫財': '겁재(劫財)',
}

export default function SounTable({ soun, daewoon, daewoonMeta, natalGanzis, yongsin, unknownTime }: Props) {
  const activeSounIdx = getActiveSounIndex(soun, daewoon)
  const items = useMemo(() => soun.map((item) => {
    const ann = annotateTransit(item.ganzi, natalGanzis, yongsin)
    const interactions = collectNatalTransitInteractions(item.ganzi, natalGanzis)
    return {
      ...item,
      ...ann,
      interactions: interactions.length > 0 ? interactions.join('\n') : '',
      sinsalFmt: formatSinsal(item.sinsal),
    }
  }), [soun, natalGanzis, yongsin])

  const currentSounGanzi = activeSounIdx >= 0 ? items[activeSounIdx]?.ganzi ?? null : null
  const currentSounYear = activeSounIdx >= 0 ? items[activeSounIdx]?.year : null
  const displayItems = [...items].reverse()

  if (items.length === 0) {
    return (
      <section>
        <YunSectionHeading
          title={<>소운 <span className="font-hanja">(小運)</span></>}
          yunLabel="소운"
          emptyReason={SOUN_EMPTY_REASON}
        />
        {YUN_SOUN_UI_NOTES.slice(0, 2).map((line, i) => (
          <p key={line} className={`text-xs text-gray-500 dark:text-gray-400 leading-relaxed ${i === 1 ? 'mb-2' : 'mb-1'}`}>
            {line}{i === 1 && unknownTime && ' · 출생 시각 미입력 — 月柱 기준.'}
          </p>
        ))}
      </section>
    )
  }

  return (
    <section>
      <YunSectionHeading
        title={<>소운 <span className="font-hanja">(小運)</span></>}
        yunLabel="소운"
        currentGanzi={currentSounGanzi}
        context={currentSounGanzi && currentSounYear != null ? { kind: 'year', year: currentSounYear } : null}
      />
      <div className="mb-3 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm">
        <span className="text-gray-600 dark:text-gray-300">
          {daewoonMeta.directionKor}({daewoonMeta.direction})
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
          [{daewoonMeta.yinYangGenderLabel}]
        </span>
      </div>
      {YUN_SOUN_UI_NOTES.map((line, i) => (
        <p
          key={line}
          className={`text-xs text-gray-500 dark:text-gray-400 leading-relaxed ${i === YUN_SOUN_UI_NOTES.length - 1 ? 'mb-3' : 'mb-1'}`}
        >
          {line}{i === 1 && unknownTime && ' · 출생 시각 미입력 — 月柱 기준.'}
        </p>
      ))}
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              {displayItems.map((item, idx) => {
                const actualIdx = items.length - 1 - idx
                const isActive = activeSounIdx >= 0 && actualIdx === activeSounIdx
                return (
                <th
                  key={idx}
                  className={`border border-black px-2 py-2 text-center min-w-[88px] text-xs font-semibold ${
                    isActive ? 'bg-[#FFFF00]' : 'bg-gray-100'
                  }`}
                >
                  만 {item.age}세<br />({item.year}년)
                </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            <tr>
              {displayItems.map((item, idx) => (
                <JieQiBoundaryCell key={idx} text={formatDaewoonStartCell(item.startDate)} />
              ))}
            </tr>
            <tr>
              {displayItems.map((item, idx) => (
                <td key={idx} className={`border border-black px-2 py-1 text-center text-xs font-medium ${stemColorClass(item.ganzi[0])}`}>
                  {STEM_SIPSIN_MAP[item.stemSipsin] || item.stemSipsin}
                </td>
              ))}
            </tr>
            <tr>
              {displayItems.map((item, idx) => {
                const stemAttr = getStemAttr(item.ganzi[0])
                return (
                  <td key={idx} className="border border-black px-2 py-2 text-center">
                    <div className="relative inline-flex items-center justify-center">
                      <span className={`px-1.5 py-0.5 rounded text-white font-bold text-sm ${stemSolidBgClass(item.ganzi[0])}`}>
                        {item.ganzi[0]}
                      </span>
                      <span className="sr-only">{stemAttr.um}{stemAttr.ohaeng}</span>
                    </div>
                  </td>
                )
              })}
            </tr>
            <tr>
              {displayItems.map((item, idx) => {
                const branchAttr = getBranchAttr(item.ganzi[1])
                return (
                  <td key={idx} className="border border-black px-2 py-2 text-center">
                    <div className="relative inline-flex items-center justify-center">
                      <span className={`px-1.5 py-0.5 rounded text-white font-bold text-sm ${branchSolidBgClass(item.ganzi[1])}`}>
                        {item.ganzi[1]}
                      </span>
                      <span className="sr-only">{branchAttr.um}{branchAttr.ohaeng}</span>
                    </div>
                  </td>
                )
              })}
            </tr>
            <tr>
              {displayItems.map((item, idx) => (
                <td key={idx} className={`border border-black px-2 py-1 text-center text-xs font-medium ${branchColorClass(item.ganzi[1])}`}>
                  {STEM_SIPSIN_MAP[item.branchSipsin] || item.branchSipsin}
                </td>
              ))}
            </tr>
            <tr>
              {displayItems.map((item, idx) => (
                <td key={idx} className="border border-black px-2 py-1 text-center text-xs">
                  {item.unseong}
                </td>
              ))}
            </tr>
            <tr>
              {displayItems.map((item, idx) => (
                <td key={idx} className="border border-black px-2 py-1 text-center text-xs whitespace-pre-line">
                  {item.sinsalFmt}
                </td>
              ))}
            </tr>
            <tr>
              {displayItems.map((item, idx) => (
                <YunBigoCell
                  key={idx}
                  isGongmang={item.isGongmang}
                  interactions={item.interactions}
                  fuYinFanYin={item.fuYinFanYin}
                />
              ))}
            </tr>
            <tr>
              {displayItems.map((item, idx) => (
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
