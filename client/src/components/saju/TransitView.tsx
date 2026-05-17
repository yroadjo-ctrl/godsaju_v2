import { useState, useMemo } from 'react'
import { findTransits, getFourPillars } from '@core/pillars'
import type { TransitItem } from '@core/types'
import { useLocale } from '../../i18n/index.ts'

interface Props {
  natalPillars: string[]  // [시주, 일주, 월주, 년주]
}

interface DailyTransitData {
  date: Date
  dayPillar: string
  events: Array<{
    type: '月運' | '日運'
    natalName: string
    relations: Array<{ prefix: string; relation: any }>
  }>
}

export default function TransitView({ natalPillars }: Props) {
  const { t, locale } = useLocale()
  const [months, setMonths] = useState(1)
  const [backward, setBackward] = useState(false)

  // 원본 findTransits 로직 (이벤트만 필터링)
  const eventTransits = useMemo(
    () => findTransits(natalPillars, months, backward),
    [natalPillars, months, backward],
  )

  // 매일의 간지를 순차적으로 생성
  const dailySequence = useMemo(() => {
    const today = new Date()
    const msPerDay = 86400000
    const endDate = new Date(today.getTime() + (backward ? -1 : 1) * months * 30 * msPerDay)

    const sequence: DailyTransitData[] = []
    const current = new Date(today)
    const step = backward ? -msPerDay : msPerDay

    // 이벤트를 날짜별로 맵핑
    const eventMap = new Map<string, DailyTransitData['events']>()
    for (const tr of eventTransits) {
      const dateKey = `${tr.date.getFullYear()}-${tr.date.getMonth()}-${tr.date.getDate()}`
      if (!eventMap.has(dateKey)) {
        eventMap.set(dateKey, [])
      }
      eventMap.get(dateKey)!.push({
        type: tr.type,
        natalName: tr.natalName,
        relations: tr.relations,
      })
    }

    // 매일 순차적으로 간지 생성
    while (backward ? current >= endDate : current <= endDate) {
      const [, , , dayP] = getFourPillars(
        current.getFullYear(), current.getMonth() + 1, current.getDate(), 12, 0,
      )

      const dateKey = `${current.getFullYear()}-${current.getMonth()}-${current.getDate()}`
      const events = eventMap.get(dateKey) || []

      sequence.push({
        date: new Date(current),
        dayPillar: dayP,
        events,
      })

      current.setTime(current.getTime() + step)
    }

    return sequence
  }, [natalPillars, months, backward])

  const direction = backward ? t('saju.transit.past') : t('saju.transit.future')

  return (
    <section>
      <div className="flex items-center gap-3 mb-2">
        <h3 className="text-base font-medium text-gray-700 dark:text-gray-200">運勢</h3>
        <select
          value={months}
          onChange={e => setMonths(Number(e.target.value))}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded px-1.5 py-0.5 text-gray-600 dark:text-gray-300"
        >
          <option value={1}>{t('saju.transit.1month')}</option>
          <option value={3}>{t('saju.transit.3months')}</option>
          <option value={6}>{t('saju.transit.6months')}</option>
        </select>
        <button
          onClick={() => setBackward(!backward)}
          className={`text-sm px-2 py-0.5 rounded border transition-colors ${
            backward
              ? 'bg-gray-100 dark:bg-gray-800 border-gray-400 dark:border-gray-500 text-gray-700 dark:text-gray-200'
              : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
          }`}
        >
          {backward ? t('saju.transit.pastBtn') : t('saju.transit.futureBtn')}
        </button>
      </div>

      {dailySequence.length === 0 ? (
        <p className="text-base text-gray-400 dark:text-gray-500">({direction} {months}{t('saju.transit.noRelation')})</p>
      ) : (
        <div className="text-sm space-y-1 max-h-96 overflow-y-auto">
          {dailySequence.map((daily, i) => {
            const date = daily.date
            const mm = String(date.getMonth() + 1).padStart(2, ' ')
            const dd = String(date.getDate()).padStart(2, ' ')
            const dateStr = locale === 'en' ? `${mm}/${dd}` : `${mm}${t('form.monthSuffix')} ${dd}${t('form.daySuffix')}`
            const prefixMap: Record<string, string> = { '천간': t('transit.stem'), '지지': t('transit.branch') }

            return (
              <div key={i} className="space-y-0.5">
                {/* 매일의 간지 표시 */}
                <div className="flex items-baseline gap-2 text-gray-600 dark:text-gray-300">
                  <span className="text-gray-400 dark:text-gray-500 w-16 shrink-0">{dateStr}</span>
                  <span className="text-gray-500 dark:text-gray-400">日運</span>
                  <span className="font-hanja shrink-0 whitespace-nowrap">{daily.dayPillar}</span>
                </div>

                {/* 이벤트(합·충·형 등) 부가 정보 */}
                {daily.events.length > 0 && (
                  <div className="ml-16 space-y-0.5 text-gray-500 dark:text-gray-400 text-xs border-l border-gray-300 dark:border-gray-600 pl-2">
                    {daily.events.map((event, j) => {
                      const relStrs = event.relations.map(r => `${prefixMap[r.prefix] ?? r.prefix}${r.relation.type}${r.relation.detail ? `(${r.relation.detail})` : ''}`)
                      return (
                        <div key={j} className="flex items-baseline gap-1">
                          <span className={`w-6 shrink-0 ${event.type === '月運' ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                            {event.type}
                          </span>
                          <span className="w-6 shrink-0">{event.natalName}</span>
                          <span>{relStrs.join(', ')}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
