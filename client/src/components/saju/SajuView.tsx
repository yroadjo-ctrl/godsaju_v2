import { useMemo, useState } from 'react'
import { calculateSaju } from '@core/index'
import PillarTable from './PillarTable.tsx'
import OhaengSipsinSection from './OhaengSipsinSection.tsx'
import SinGangSection from './SinGangSection.tsx'
import YongsinSection from './YongsinSection.tsx'
import SpecialSinsalTable from './SpecialSinsalTable.tsx'
import RelationList from './RelationList.tsx'
import JwaInjongTable from './JwaInjongTable.tsx'
import DaewoonTable from './DaewoonTable.tsx'
import MonthlyTable from './MonthlyTable.tsx'
import DailyCalendar from './DailyCalendar.tsx'
import CopyButton from '../CopyButton.tsx'
import { sajuToText } from '../../utils/text-export.ts'
import type { BirthInput } from '@core/types'
import { useLocale } from '../../i18n/index.ts'


interface Props {
  input: BirthInput
}

export default function SajuView({ input }: Props) {
  const { t } = useLocale()

  const result = useMemo(() => calculateSaju(input), [input])
  const [monthlyDisplayYear, setMonthlyDisplayYear] = useState(new Date().getFullYear())

  const ganzis = result.pillars.map(p => p.pillar.ganzi)
  const natalPillars = ganzis // [시, 일, 월, 년]

  return (
    <div className="space-y-6">
      {/* 명식 테이블 */}
      <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-700 dark:text-gray-200">
            사주원국 <span className="font-hanja">(四柱原局)</span>
          </h2>
          <CopyButton 
            getText={async () => sajuToText(result, undefined, monthlyDisplayYear)}
            label={t('copy.aiCopy')}
          />
        </div>
        <PillarTable
          pillars={result.pillars} 
          unknownTime={input.unknownTime} 
          gongmang={result.gongmang} 
          godSinsal={result.godSinsal} 
        />
      </section>

      {/* 오행·십성 분석 */}
      <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <OhaengSipsinSection stats={result.ohaengSipsin} />
      </section>

      {/* 신강·신약 */}
      <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <SinGangSection stats={result.sinGangYak} />
      </section>

      {/* 용신 */}
      <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <YongsinSection yongsin={result.yongsin} />
      </section>

      {/* 특수신살 표 */}
      <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <SpecialSinsalTable
          pillars={result.pillars}
          dayStem={result.pillars[1].pillar.stem}
          stems={result.pillars.map(p => p.pillar.stem)}
          branches={result.pillars.map(p => p.pillar.branch)}
          dayPillar={[result.pillars[1].pillar.stem, result.pillars[1].pillar.branch]}
          yearPillar={[result.pillars[3].pillar.stem, result.pillars[3].pillar.branch]}
          unknownTime={input.unknownTime}
          godSinsal={result.godSinsal}
        />
      </section>

      {/* 팔자 관계 */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <RelationList relations={result.relations} pillars={ganzis} />
      </div>


      {/* 좌법 · 인종법 */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <JwaInjongTable
          jwabeop={result.jwabeop}
          injongbeop={result.injongbeop}
          pillars={result.pillars}
          unknownTime={input.unknownTime}
        />
      </div>

      {/* 대운 */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <DaewoonTable
          daewoon={result.daewoon}
          daewoonMeta={result.daewoonMeta}
          unknownTime={input.unknownTime}
          birthYear={input.year}
          dayStem={result.pillars[1].pillar.stem}
          yearBranch={result.pillars[3].pillar.branch}
          gongmangBranches={result.gongmang.branches}
          pillars={result.pillars.map(p => p.pillar.ganzi)}
        />
      </div>

      {/* 월운 */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <MonthlyTable
          currentYear={new Date().getFullYear()}
          currentMonth={new Date().getMonth() + 1}
          pillars={result.pillars.map(p => p.pillar.ganzi)}
          dayStem={result.pillars[1].pillar.stem}
          yearBranch={result.pillars[3].pillar.branch}
          gongmangBranches={result.gongmang.branches}
          onYearChange={setMonthlyDisplayYear}
        />
      </div>

      {/* 일운 달력 */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <DailyCalendar 
          dayStem={result.pillars[1].pillar.stem} 
          yearBranch={result.pillars[3].pillar.branch}
          natalPillars={natalPillars}
          onSelectedDateChange={() => {}} // 선택된 날짜는 내부에서만 사용
        />
      </div>
    </div>
  )
}
