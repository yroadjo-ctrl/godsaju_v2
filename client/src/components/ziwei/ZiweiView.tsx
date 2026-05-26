import { useMemo, useState, useEffect, useCallback } from 'react'
import { calculateLiunian, createChart, getDaxianList } from '@core/ziwei'
import MingPanGrid from './MingPanGrid.tsx'
import SihuaSummary from './SihuaSummary.tsx'
import DaxianTable from './DaxianTable.tsx'
import LiunianTable from './LiunianTable.tsx'
import LiuyueTable from './LiuyueTable.tsx'
import ZiweiYunSectionHeading from './ZiweiYunSectionHeading.tsx'
import CopyButton from '../CopyButton.tsx'
import { ZiweiSectionTitle } from './ZiweiLabel.tsx'
import { ziweiToText } from '../../utils/text-export.ts'
import type { BirthInput } from '@core/types'
import { useLocale } from '../../i18n/index.ts'
import {
  findActiveZiweiDaxianIndex,
  snapLiunianYearForDaxian,
} from '../../utils/ziwei-yun-period.ts'
interface Props {
  input: BirthInput
}

export default function ZiweiView({ input }: Props) {
  const { t } = useLocale()

  if (input.unknownTime) {
    return (
      <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <p className="text-base text-amber-800 dark:text-amber-300 font-medium">
          {t('ziwei.needTime')}
        </p>
        <p className="text-base text-amber-600 dark:text-amber-400 mt-1">
          {t('ziwei.needTimeDesc')}
        </p>
      </div>
    )
  }

  const chart = useMemo(() => createChart(input), [input])
  const daxianList = useMemo(() => getDaxianList(chart), [chart])
  const autoDaxianIdx = useMemo(
    () => findActiveZiweiDaxianIndex(daxianList, chart.solarYear),
    [daxianList, chart.solarYear],
  )
  const [selectedDaxianIdx, setSelectedDaxianIdx] = useState(-1)
  const displayDaxianIdx = selectedDaxianIdx >= 0 ? selectedDaxianIdx : autoDaxianIdx
  const displayDaxian = daxianList[displayDaxianIdx] ?? daxianList[0]

  const [liunianYear, setLiunianYear] = useState(() => new Date().getFullYear())
  const liunian = useMemo(
    () => calculateLiunian(chart, liunianYear),
    [chart, liunianYear],
  )

  useEffect(() => {
    setLiunianYear(new Date().getFullYear())
    setSelectedDaxianIdx(-1)
  }, [input, autoDaxianIdx])

  const handleSelectDaxian = useCallback((idx: number) => {
    setSelectedDaxianIdx(idx)
    const daxian = daxianList[idx]
    if (daxian) {
      setLiunianYear(snapLiunianYearForDaxian(chart, daxian))
    }
  }, [chart, daxianList])
  return (
    <div className="space-y-6">
      {/* 命盤 그리드 (기본 정보 + 12궁) */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <ZiweiSectionTitle kor="자미두수 명반" hanja="紫微斗數 命盤" as="h2" />
          <CopyButton
            getText={() => ziweiToText(chart, input, liunianYear)}
            label={t('copy.aiCopy')}
          />
        </div>
        <MingPanGrid chart={chart} />
      </div>

      {/* 사화 */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <SihuaSummary chart={chart} />
      </div>

      {/* 대한 · 유년 */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-6">
        <ZiweiYunSectionHeading chart={chart} liunian={liunian} />
        <DaxianTable
          chart={chart}
          selectedIdx={selectedDaxianIdx}
          autoIndex={autoDaxianIdx}
          onSelectDaxian={handleSelectDaxian}
        />
        {displayDaxian && (
          <LiunianTable
            chart={chart}
            daxian={displayDaxian}
            displayYear={liunianYear}
            onYearChange={setLiunianYear}
          />
        )}
        <LiuyueTable
          chart={chart}
          displayYear={liunianYear}
          onYearChange={setLiunianYear}
        />
      </div>
    </div>
  )
}
