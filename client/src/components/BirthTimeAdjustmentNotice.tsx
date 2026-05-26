import type { BirthTimeAdjustmentInfo } from '@core/index'
import { formatSignedMinutes } from '@core/index'
import { useLocale } from '../i18n/index.ts'
import { formatBirthDateTimeForDisplay, type BirthDateTimeParts } from '../utils/birth-datetime-display.ts'

interface Props {
  info: BirthTimeAdjustmentInfo
  unknownTime?: boolean
  className?: string
}

function fill(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replace(new RegExp(`\\{${k}\\}`, 'g'), v),
    template,
  )
}

function sameClock(
  a: BirthTimeAdjustmentInfo['wallClock'],
  b: BirthTimeAdjustmentInfo['adjusted'],
): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day
    && a.hour === b.hour && a.minute === b.minute
}

function formatDateTimeVars(
  dt: BirthDateTimeParts,
  locale: ReturnType<typeof useLocale>['locale'],
): Record<string, string> {
  return { datetime: formatBirthDateTimeForDisplay(dt, locale) }
}

export default function BirthTimeAdjustmentNotice({ info, unknownTime, className = '' }: Props) {
  const { t, locale } = useLocale()

  if (unknownTime) return null

  const wallVars = formatDateTimeVars(info.wallClock, locale)
  const appliedVars = formatDateTimeVars(info.adjusted, locale)

  if (info.mode === 'kst') {
    const normalized = !sameClock(info.wallClock, info.adjusted)
    return (
      <div className={`rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300 ${className}`}>
        <p className="font-medium text-gray-800 dark:text-gray-100">
          {t('timeAdjust.kstTitle')}
        </p>
        <p className="mt-0.5">{t('timeAdjust.kstNoCorrection')}</p>
        {normalized && (
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            {fill(t('timeAdjust.kstHistoricalNote'), {
              input: wallVars.datetime,
              adjusted: appliedVars.datetime,
            })}
          </p>
        )}
      </div>
    )
  }

  const lon = info.longitudeCorrectionMinutes ?? 0
  const eot = info.equationOfTimeMinutes ?? 0
  const total = info.totalCorrectionMinutes ?? 0

  return (
    <div className={`rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/80 dark:bg-blue-950/30 px-3 py-2 text-sm leading-relaxed text-gray-700 dark:text-gray-300 ${className}`}>
      <p className="font-medium text-gray-900 dark:text-gray-100">
        {t('timeAdjust.localSolarTitle')}
      </p>
      <p className="mt-0.5">
        {fill(t('timeAdjust.localSolarInput'), wallVars)}
      </p>
      <ul className="mt-1 space-y-0.5 text-gray-600 dark:text-gray-400">
        <li>{fill(t('timeAdjust.longitudeCorrection'), { value: formatSignedMinutes(lon) })}</li>
        <li>{fill(t('timeAdjust.equationOfTime'), { value: formatSignedMinutes(eot) })}</li>
        <li>{fill(t('timeAdjust.totalCorrection'), { value: formatSignedMinutes(total) })}</li>
      </ul>
      <p className="mt-1.5 font-medium text-gray-800 dark:text-gray-200">
        {fill(t('timeAdjust.appliedTime'), appliedVars)}
      </p>
      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-500">
        {t('timeAdjust.localSolarFootnote')}
      </p>
    </div>
  )
}
