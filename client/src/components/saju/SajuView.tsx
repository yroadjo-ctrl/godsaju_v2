import PillarTable from './PillarTable.tsx'
import TaewonTaesikSection from './TaewonTaesikSection.tsx'
import OhaengSipsinSection from './OhaengSipsinSection.tsx'
import AdvancedAnalysisSection from './AdvancedAnalysisSection.tsx'
import SinGangSection from './SinGangSection.tsx'
import YongsinSection from './YongsinSection.tsx'
import SpecialSinsalTable from './SpecialSinsalTable.tsx'
import RelationList from './RelationList.tsx'
import JwaInjongTable from './JwaInjongTable.tsx'
import DaewoonTable from './DaewoonTable.tsx'
import SounTable from './SounTable.tsx'
import SewoonTable from './SewoonTable.tsx'
import MonthlyTable from './MonthlyTable.tsx'
import DailyCalendar from './DailyCalendar.tsx'
import CopyButton from '../CopyButton.tsx'
import BirthInfoSummary from './BirthInfoSummary.tsx'
import MonthPillarBasisNotice from './MonthPillarBasisNotice.tsx'
import { sajuToText } from '../../utils/text-export.ts'
import type { BirthInput, SajuResult } from '@core/types'
import { useLocale } from '../../i18n/index.ts'

interface Props {
  input: BirthInput
  result: SajuResult
  monthlyDisplayYear: number
  onMonthlyDisplayYearChange: (year: number) => void
  selectedDaewoonIdx: number
  onSelectedDaewoonIdxChange: (idx: number) => void
  autoDaewoonIdx: number
  displayDaewoonIdx: number
}

export default function SajuView({
  input,
  result,
  monthlyDisplayYear,
  onMonthlyDisplayYearChange,
  selectedDaewoonIdx,
  onSelectedDaewoonIdxChange,
  autoDaewoonIdx,
  displayDaewoonIdx,
}: Props) {
  const { t } = useLocale()

  const ganzis = result.pillars.map(p => p.pillar.ganzi)
  const natalPillars = ganzis // [시, 일, 월, 년]

  return (
    <div className="space-y-6">
      <BirthInfoSummary input={input} />

      {/* 명식 테이블 */}
      <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-700 dark:text-gray-200">
            사주원국 <span className="font-hanja">(四柱原局)</span>
          </h2>
          <CopyButton
            getText={async () => sajuToText(result, undefined, monthlyDisplayYear, displayDaewoonIdx)}
            label={t('copy.aiCopy')}
          />
        </div>
        <MonthPillarBasisNotice input={input} className="mb-3" />
        <PillarTable
          pillars={result.pillars}
          unknownTime={input.unknownTime}
          gongmang={result.gongmang}
          godSinsal={result.godSinsal}
        />
      </section>

      {/* 胎元 · 胎息 */}
      <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <TaewonTaesikSection stats={result.taewonTaesik} />
      </section>

      {/* 오행·십성 분석 */}
      <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <OhaengSipsinSection
          surface={result.ohaengSipsin}
          weighted={result.ohaengSipsinWeighted}
          adjusted={result.ohaengSipsinAdjusted}
        />
      </section>

      {/* 신강·신약 */}
      <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <SinGangSection stats={result.sinGangYak} />
      </section>

      {/* 조후·합화·격국 */}
      <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <AdvancedAnalysisSection
          johu={result.johu}
          hapHwa={result.hapHwa}
          gyeokguk={result.gyeokguk}
        />
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

      {/* 소운(小運) */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <SounTable
          soun={result.soun}
          daewoon={result.daewoon}
          daewoonMeta={result.daewoonMeta}
          natalGanzis={ganzis}
          yongsin={result.yongsin}
          unknownTime={input.unknownTime}
        />
      </div>

      {/* 대운 */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <DaewoonTable
          daewoon={result.daewoon}
          daewoonMeta={result.daewoonMeta}
          birthYear={input.year}
          birthMonth={input.month}
          birthDay={input.day}
          unknownTime={input.unknownTime}
          natalGanzis={ganzis}
          yongsin={result.yongsin}
          selectedIdx={selectedDaewoonIdx}
          autoIndex={autoDaewoonIdx}
          onSelectDaewoon={onSelectedDaewoonIdxChange}
        />
      </div>

      {/* 세운 */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <SewoonTable
          daewoon={result.daewoon}
          displayIndex={displayDaewoonIdx}
          birthYear={input.year}
          birthMonth={input.month}
          birthDay={input.day}
          birthHour={input.hour}
          birthMinute={input.minute}
          dayStem={result.pillars[1].pillar.stem}
          yearBranch={result.pillars[3].pillar.branch}
          gongmangBranches={result.gongmang.branches}
          natalGanzis={ganzis}
          yongsin={result.yongsin}
          unknownTime={input.unknownTime}
        />
      </div>

      {/* 월운 */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <MonthlyTable
          currentYear={new Date().getFullYear()}
          currentMonth={new Date().getMonth() + 1}
          displayYear={monthlyDisplayYear}
          pillars={result.pillars.map(p => p.pillar.ganzi)}
          dayStem={result.pillars[1].pillar.stem}
          yearBranch={result.pillars[3].pillar.branch}
          gongmangBranches={result.gongmang.branches}
          yongsin={result.yongsin}
          onYearChange={onMonthlyDisplayYearChange}
        />
      </div>

      {/* 일운 달력 */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <DailyCalendar
          dayStem={result.pillars[1].pillar.stem}
          yearBranch={result.pillars[3].pillar.branch}
          natalPillars={natalPillars}
          yongsin={result.yongsin}
          onSelectedDateChange={() => {}}
        />
      </div>
    </div>
  )
}
