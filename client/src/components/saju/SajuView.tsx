import { useMemo, useState } from 'react'
import { calculateSaju } from '@core/saju'
import PillarTable from './PillarTable.tsx'
import SpecialSinsalTable from './SpecialSinsalTable.tsx'
import RelationList from './RelationList.tsx'
import SinsalList from './SinsalList.tsx'
import JwabeopChart from './JwabeopChart.tsx'
import InjongbeopChart from './InjongbeopChart.tsx'
import DaewoonTable from './DaewoonTable.tsx'
import MonthlyTable from './MonthlyTable.tsx'
import TransitView from './TransitView.tsx'
import DailyCalendar from './DailyCalendar.tsx'
import CopyButton from '../CopyButton.tsx'
import { sajuToText, generateDailyLuckTextNew } from '../../utils/text-export.ts'
import type { BirthInput } from '@core/types'
import { useLocale } from '../../i18n/index.ts'


interface Props {
  input: BirthInput
}

export default function SajuView({ input }: Props) {
  const { t } = useLocale()

  const result = useMemo(() => calculateSaju(input), [input])
  const [monthlyDisplayYear, setMonthlyDisplayYear] = useState(new Date().getFullYear())

  // DEBUG: pillars 배열 값 로깅
  useMemo(() => {
    if (typeof window !== 'undefined') {
      console.log('=== DEBUG pillars ===')
      result.pillars.forEach((p, i) => {
        const names = ['時柱', '日柱', '月柱', '年柱']
        console.log(`${names[i]}: ${p.pillar.ganzi}`)
      })
    }
  }, [result])

  const ganzis = result.pillars.map(p => p.pillar.ganzi)
  const natalPillars = ganzis // [시, 일, 월, 년]

  return (
    <div className="space-y-6">
      {/* 명식 테이블 */}
      <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-medium text-gray-700 dark:text-gray-200">四柱八字</h2>
          <CopyButton 
            getText={async () => {
              const sajuText = sajuToText(result, undefined, monthlyDisplayYear);
              
              // 31일 고정 기간으로 일운 데이터 추출 (오늘부터 시작)
              const dailyText = generateDailyLuckTextNew(
                result.pillars[1].pillar.stem,
                result.pillars[3].pillar.branch
              );
              
              return dailyText ? sajuText + '\n\n' + dailyText : sajuText;
            }}
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

      {/* 신살 */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <SinsalList sals={result.specialSals} />
      </div>

      {/* 좌법 · 인종법 */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <JwabeopChart jwabeop={result.jwabeop} pillars={result.pillars} unknownTime={input.unknownTime} />
        <InjongbeopChart injongbeop={result.injongbeop} pillars={result.pillars} />
      </div>

      {/* 대운 */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <DaewoonTable
          daewoon={result.daewoon}
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

      {/* 트랜짓 */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <TransitView natalPillars={natalPillars} />
      </div>

      {/* 일운 달력 */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <DailyCalendar 
          dayStem={result.pillars[1].pillar.stem} 
          yearBranch={result.pillars[3].pillar.branch}
          onSelectedDateChange={() => {}} // 선택된 날짜는 내부에서만 사용
        />
      </div>
    </div>
  )
}
