import { useMemo } from 'react'
import type { SounItem, YongsinStats } from '@core/types'
import { annotateTransit } from '@core/index'
import {
  stemColorClass, branchColorClass, stemSolidBgClass, branchSolidBgClass,
  formatSinsal, getStemAttr, getBranchAttr,
} from '../../utils/format.ts'
import { YUN_METHOD_NOTES } from '../../utils/yun-method-notes.ts'
import YunSectionHeading from './YunSectionHeading.tsx'
import { formatLichunBoundaryCell } from '@core/jieqi-lunar'
import { getEffectiveYunCalendarYear } from '../../utils/yun-period.ts'
import { JieQiBoundaryCell } from './JieQiCell.tsx'

interface Props {
  soun: SounItem[]
  natalGanzis: string[]
  yongsin: YongsinStats
  unknownTime?: boolean
}

const STEM_SIPSIN_MAP: Record<string, string> = {
  '正官': '정관(正官)', '偏官': '편관(偏官)', '正印': '정인(正印)', '偏印': '편인(偏印)',
  '正財': '정재(正財)', '偏財': '편재(偏財)', '食神': '식신(食神)', '傷官': '상관(傷官)',
  '比肩': '비견(比肩)', '劫財': '겁재(劫財)',
}

export default function SounTable({ soun, natalGanzis, yongsin, unknownTime }: Props) {
  const effectiveYear = getEffectiveYunCalendarYear()
  const items = useMemo(() => soun.map((item) => {
    const ann = annotateTransit(item.ganzi, natalGanzis, yongsin)
    return { ...item, ...ann, sinsalFmt: formatSinsal(item.sinsal) }
  }), [soun, natalGanzis, yongsin])

  const currentSounGanzi = items.find((item) => item.year === effectiveYear)?.ganzi ?? null
  const displayItems = [...items].reverse()

  if (items.length === 0) {
    return (
      <section>
        <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-1">
          소운 <span className="font-hanja">(小運)</span>
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 leading-relaxed">
          {YUN_METHOD_NOTES.soun}
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          대운 시작과 동일 시점 — 표시할 소운(小運)이 없습니다.
        </p>
      </section>
    )
  }

  return (
    <section>
      <YunSectionHeading
        title={<>소운 <span className="font-hanja">(小運)</span></>}
        yunLabel="소운"
        currentGanzi={currentSounGanzi}
      />
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 leading-relaxed">
        {YUN_METHOD_NOTES.soun}
        {unknownTime && ' · 출생 시각 미입력 — 月柱 기준.'}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
        {YUN_METHOD_NOTES.yongsinTransit}
      </p>
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              {displayItems.map((item, idx) => {
                const isCurrentYear = item.year === effectiveYear
                return (
                <th
                  key={idx}
                  className={`border border-black px-2 py-2 text-center min-w-[88px] text-xs font-semibold ${
                    isCurrentYear ? 'bg-[#FFFF00]' : 'bg-gray-100'
                  }`}
                >
                  {item.age}세<br />({item.year}년)
                </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            <tr>
              {displayItems.map((item, idx) => (
                <JieQiBoundaryCell key={idx} text={formatLichunBoundaryCell(item.year)} />
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
                <td key={idx} className="border border-black px-2 py-1 text-center text-xs">
                  {item.isGongmang ? '空亡' : '-'}
                </td>
              ))}
            </tr>
            <tr>
              {displayItems.map((item, idx) => (
                <td key={idx} className="border border-black px-2 py-1 text-center text-[10px] leading-tight whitespace-pre-line">
                  {item.fuYinFanYin}
                </td>
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
