import { useState, useMemo, useEffect, useImperativeHandle, forwardRef } from 'react'
import type { BirthInput, CalendarType, Gender, JasiMethod } from '@core/types'
import {
  getLunarLeapMonth,
  resolveSolarBirthDateTime,
  validateLunarCalendarInput,
  LunarConversionError,
  getBirthTimeAdjustmentInfo,
} from '@core/index'
import { isKoreanDaylightTime, isKoreanHistoricalTimeAnomaly } from '@core/natal'
import type { City } from '@core/cities'
import { SEOUL, formatCityName } from '@core/cities'
import CityCombobox from './CityCombobox.tsx'
import { useLocale } from '../i18n/index.ts'
import {
  getTimeZoneDisplayLabelAtLocalTime,
  inferTimeZoneFromCoordinates,
  isDaylightSavingInEffect,
  validateBirthLocalTime,
} from '../utils/timezones.ts'
import {
  formatCoordinate,
  isCoordinateDraft,
  parseCoordinateDraft,
  stepCoordinate,
} from '../utils/coordinate-input.ts'
import GodsajuLogo from './GodsajuLogo.tsx'
import BirthTimeAdjustmentNotice from './BirthTimeAdjustmentNotice.tsx'
import { getShiChenAutoFillTime, getShiChenEmoji, getShiChenHintParts, SHICHEN_LEGEND_ROWS } from '../utils/shichen-time.ts'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog.tsx'

export interface BirthFormHandle {
  getCurrentState(): SavedFormState
}

interface Props {
  onSubmit: (input: BirthInput) => void
  externalState?: SavedFormState | null
  onExternalStateConsumed?: () => void
}

const STORAGE_KEY = 'orrery-birth-input'

export interface SavedFormState {
  personName: string
  year: number
  month: number
  day: number
  hour: number
  minute: number
  gender: Gender
  calendarType: CalendarType
  unknownTime: boolean
  jasiMethod: JasiMethod
  city: City | null
  manualCoords: boolean
  latitude: number
  longitude: number
}

function loadSaved(): SavedFormState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as SavedFormState
  } catch {
    return null
  }
}

const now = new Date()
const currentYear = now.getFullYear()
const saved = loadSaved()
const initialLatitude = saved?.latitude ?? SEOUL.lat
const initialLongitude = saved?.longitude ?? SEOUL.lon

// 기본값: 1982년 9월 8일 오전 7시 남성 서울
const DEFAULT_YEAR = 1982
const DEFAULT_MONTH = 9
const DEFAULT_DAY = 8
const DEFAULT_HOUR = 7
const DEFAULT_MINUTE = 0

const selectClass =
  'w-full h-10 pl-3 pr-8 border border-gray-200 dark:border-gray-700 rounded-lg text-base text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-900 ' +
  'appearance-none bg-[length:16px_16px] bg-[position:right_8px_center] bg-no-repeat ' +
  "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%239ca3af%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] " +
  'focus:outline-none focus:ring-2 focus:ring-gray-800/20 dark:focus:ring-gray-200/20 focus:border-gray-400 dark:focus:border-gray-500 ' +
  'transition-all disabled:opacity-40 disabled:bg-gray-50 dark:disabled:bg-gray-800'

const inputClass =
  'w-full h-10 px-3 border border-gray-200 dark:border-gray-700 rounded-lg text-base text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-900 ' +
  'focus:outline-none focus:ring-2 focus:ring-gray-800/20 dark:focus:ring-gray-200/20 focus:border-gray-400 dark:focus:border-gray-500 transition-all'

/** 섹션 타이틀(생년월일시·시간·출생 위치)만 굵게, 나머지는 동일 크기·일반 굵기 */
const sectionTitleClass = 'text-base font-bold text-gray-900 dark:text-gray-100'
const sectionMutedClass = 'text-base font-normal text-gray-500 dark:text-gray-400'
const segmentBtnActive =
  'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm font-normal'
const segmentBtnInactive =
  'font-normal text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'


const BirthForm = forwardRef<BirthFormHandle, Props>(function BirthForm({ onSubmit, externalState, onExternalStateConsumed }, ref) {
  const { t } = useLocale()
  const [personName, setPersonName] = useState(saved?.personName ?? '')
  const [year, setYear] = useState(saved?.year ?? DEFAULT_YEAR)
  const [month, setMonth] = useState(saved?.month ?? DEFAULT_MONTH)
  const [day, setDay] = useState(saved?.day ?? DEFAULT_DAY)
  const [hour, setHour] = useState(saved?.hour ?? DEFAULT_HOUR)
  const [minute, setMinute] = useState(saved?.minute ?? DEFAULT_MINUTE)
  const [gender, setGender] = useState<Gender>(saved?.gender ?? 'M')
  const [calendarType, setCalendarType] = useState<CalendarType>(saved?.calendarType ?? 'solar')
  const [unknownTime, setUnknownTime] = useState(saved?.unknownTime ?? false)
  const [shichenOpen, setShichenOpen] = useState(false)
  const [jasiMethod, setJasiMethod] = useState<JasiMethod>(saved?.jasiMethod ?? 'unified')
  const [selectedCity, setSelectedCity] = useState<City | null>(saved?.city ?? SEOUL)
  const [manualCoords, setManualCoords] = useState(saved?.manualCoords ?? false)
  const [latitude, setLatitude] = useState(initialLatitude)
  const [longitude, setLongitude] = useState(initialLongitude)
  const [latitudeInput, setLatitudeInput] = useState(() => formatCoordinate(initialLatitude))
  const [longitudeInput, setLongitudeInput] = useState(() => formatCoordinate(initialLongitude))
  const [timezoneError, setTimezoneError] = useState<string | null>(null)
  const [calendarError, setCalendarError] = useState<string | null>(null)

  const leapMonth = useMemo(() => getLunarLeapMonth(year), [year])

  const shichenHint = useMemo(
    () => (unknownTime ? null : getShiChenHintParts(hour, minute)),
    [unknownTime, hour, minute],
  )

  const solarForTz = useMemo(() => {
    try {
      return resolveSolarBirthDateTime({
        year,
        month,
        day,
        hour: unknownTime ? 12 : hour,
        minute: unknownTime ? 0 : minute,
        unknownTime,
        calendarType,
      })
    } catch {
      return null
    }
  }, [year, month, day, hour, minute, unknownTime, calendarType])

  useEffect(() => {
    if (calendarType === 'lunarLeap' && leapMonth == null) {
      setCalendarType('lunar')
    } else if (calendarType === 'lunarLeap' && leapMonth != null && month !== leapMonth) {
      setMonth(leapMonth)
    }
  }, [year, calendarType, leapMonth, month])

  const inferredTimezone = useMemo(
    () => inferTimeZoneFromCoordinates(latitude, longitude),
    [latitude, longitude],
  )
  const locationSummary = useMemo(() => {
    if (manualCoords) {
      return `${t('form.coordInput')} · ${t('form.latitude')} ${latitude.toFixed(4)} · ${t('form.longitude')} ${longitude.toFixed(4)}`
    }
    if (selectedCity) {
      return `${formatCityName(selectedCity)} · ${t('form.latitude')} ${latitude.toFixed(4)} · ${t('form.longitude')} ${longitude.toFixed(4)}`
    }
    return `${t('form.latitude')} ${latitude.toFixed(4)} · ${t('form.longitude')} ${longitude.toFixed(4)}`
  }, [manualCoords, selectedCity, latitude, longitude, t])
  const timezoneDisplayLabel = useMemo(() => {
    if (!inferredTimezone || !solarForTz) return null
    return getTimeZoneDisplayLabelAtLocalTime(
      inferredTimezone,
      solarForTz.year,
      solarForTz.month,
      solarForTz.day,
      solarForTz.hour,
      solarForTz.minute,
    )
  }, [inferredTimezone, solarForTz])

  const timeAdjustmentPreview = useMemo(() => {
    if (!inferredTimezone || !solarForTz) return null
    try {
      return getBirthTimeAdjustmentInfo({
        year,
        month,
        day,
        hour: unknownTime ? 12 : hour,
        minute: unknownTime ? 0 : minute,
        gender,
        calendarType,
        unknownTime,
        ...(!unknownTime && { jasiMethod }),
        latitude,
        longitude,
        timezone: inferredTimezone,
      })
    } catch {
      return null
    }
  }, [
    year, month, day, hour, minute, gender, calendarType, unknownTime, jasiMethod,
    latitude, longitude, inferredTimezone, solarForTz,
  ])

  function getTimezoneValidationError(state: SavedFormState): string | null {
    let solarY = state.year
    let solarM = state.month
    let solarD = state.day
    let effectiveHour = state.unknownTime ? 12 : state.hour
    let effectiveMinute = state.unknownTime ? 0 : state.minute
    try {
      const solar = resolveSolarBirthDateTime({
        year: state.year,
        month: state.month,
        day: state.day,
        hour: effectiveHour,
        minute: effectiveMinute,
        unknownTime: state.unknownTime,
        calendarType: state.calendarType ?? 'solar',
      })
      solarY = solar.year
      solarM = solar.month
      solarD = solar.day
      effectiveHour = solar.hour
      effectiveMinute = solar.minute
    } catch {
      return null
    }
    const result = validateBirthLocalTime(
      state.latitude, state.longitude,
      solarY, solarM, solarD,
      effectiveHour, effectiveMinute,
    )
    if (result.ok) return null
    if (result.reason === 'dst-gap') return t('form.dstGapError')
    return t('form.timezoneAutoDetectFailed')
  }

  function calendarErrorMessage(code: string): string {
    if (code === 'NO_LEAP_YEAR') return t('form.lunarConversion.noLeapYear')
    if (code === 'NOT_LEAP_MONTH') return t('form.lunarConversion.notLeapMonth')
    return t('form.lunarConversion.invalidDate')
  }

  function buildBirthInput(state: SavedFormState): BirthInput | null {
    const lunarErr = validateLunarCalendarInput(
      state.calendarType,
      state.year,
      state.month,
      state.day,
    )
    if (lunarErr) {
      setCalendarError(calendarErrorMessage(lunarErr))
      return null
    }
    try {
      resolveSolarBirthDateTime({
        year: state.year,
        month: state.month,
        day: state.day,
        hour: state.unknownTime ? 12 : state.hour,
        minute: state.unknownTime ? 0 : state.minute,
        unknownTime: state.unknownTime,
        calendarType: state.calendarType,
      })
    } catch (err) {
      if (err instanceof LunarConversionError) {
        setCalendarError(calendarErrorMessage(err.code))
      } else {
        setCalendarError(t('form.lunarConversion.invalidDate'))
      }
      return null
    }

    const effectiveStateTimezone = inferTimeZoneFromCoordinates(state.latitude, state.longitude)
    if (getTimezoneValidationError(state)) return null
    if (!effectiveStateTimezone) return null
    const birthLocation = state.manualCoords
      ? `위도 ${state.latitude.toFixed(4)}, 경도 ${state.longitude.toFixed(4)}`
      : state.city
        ? formatCityName(state.city)
        : undefined
    return {
      ...((state.personName ?? '').trim() && { personName: (state.personName ?? '').trim() }),
      ...(birthLocation && { birthLocation }),
      year: state.year,
      month: state.month,
      day: state.day,
      hour: state.unknownTime ? 12 : state.hour,
      minute: state.unknownTime ? 0 : state.minute,
      gender: state.gender,
      calendarType: state.calendarType,
      unknownTime: state.unknownTime,
      ...(!state.unknownTime && { jasiMethod: state.jasiMethod }),
      latitude: state.latitude,
      longitude: state.longitude,
      timezone: effectiveStateTimezone,
    }
  }

  useImperativeHandle(ref, () => ({
    getCurrentState: (): SavedFormState => ({
      personName,
      year, month, day, hour, minute, gender, calendarType, unknownTime, jasiMethod,
      city: selectedCity, manualCoords, latitude, longitude,
    }),
  }))

  useEffect(() => {
    setTimezoneError(null)
  }, [latitude, longitude])

  function syncCoordinates(nextLatitude: number, nextLongitude: number) {
    setLatitude(nextLatitude)
    setLongitude(nextLongitude)
    setLatitudeInput(formatCoordinate(nextLatitude))
    setLongitudeInput(formatCoordinate(nextLongitude))
  }

  function applyLatitude(nextLatitude: number) {
    setLatitude(nextLatitude)
    setLatitudeInput(formatCoordinate(nextLatitude))
  }

  function applyLongitude(nextLongitude: number) {
    setLongitude(nextLongitude)
    setLongitudeInput(formatCoordinate(nextLongitude))
  }

  function handleCoordinateChange(
    value: string,
    setDraft: (value: string) => void,
    setValue: (value: number) => void,
  ) {
    if (!isCoordinateDraft(value)) return

    setDraft(value)

    const parsed = parseCoordinateDraft(value)
    if (parsed != null) setValue(parsed)
  }

  function handleCoordinateKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    draft: string,
    current: number,
    apply: (value: number) => void,
  ) {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return

    e.preventDefault()
    const baseValue = parseCoordinateDraft(draft) ?? current
    apply(stepCoordinate(baseValue, e.key === 'ArrowUp' ? 1 : -1))
  }

  useEffect(() => {
    if (!externalState) return
    const s = externalState
    setPersonName(s.personName ?? '')
    setYear(s.year)
    setMonth(s.month)
    setDay(s.day)
    setHour(s.hour)
    setMinute(s.minute)
    setGender(s.gender)
    setCalendarType(s.calendarType ?? 'solar')
    setUnknownTime(s.unknownTime)
    setJasiMethod(s.jasiMethod)
    setSelectedCity(s.city)
    setManualCoords(s.manualCoords)
    syncCoordinates(s.latitude, s.longitude)
    setTimezoneError(null)
    onExternalStateConsumed?.()
    const birthInput = buildBirthInput(s)
    if (birthInput) onSubmit(birthInput)
  }, [externalState]) // eslint-disable-line react-hooks/exhaustive-deps

  const tzYear = solarForTz?.year ?? year
  const tzMonth = solarForTz?.month ?? month
  const tzDay = solarForTz?.day ?? day

  const isKDT = useMemo(
    () => inferredTimezone === 'Asia/Seoul' && isKoreanDaylightTime(tzYear, tzMonth, tzDay),
    [inferredTimezone, tzYear, tzMonth, tzDay],
  )
  const isKstHistoricalAnomaly = useMemo(
    () => inferredTimezone === 'Asia/Seoul' && isKoreanHistoricalTimeAnomaly(tzYear, tzMonth, tzDay),
    [inferredTimezone, tzYear, tzMonth, tzDay],
  )
  const isDstActive = useMemo(() => {
    if (!inferredTimezone) return false
    if (isKDT || isKstHistoricalAnomaly) return false
    return isDaylightSavingInEffect(
      inferredTimezone,
      tzYear,
      tzMonth,
      tzDay,
      unknownTime ? 12 : (solarForTz?.hour ?? hour),
      unknownTime ? 0 : (solarForTz?.minute ?? minute),
    )
  }, [inferredTimezone, isKDT, isKstHistoricalAnomaly, tzYear, tzMonth, tzDay, hour, minute, unknownTime, solarForTz])

  function handleCitySelect(city: City) {
    setSelectedCity(city)
    syncCoordinates(city.lat, city.lon)
    setTimezoneError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const resolvedLatitude = manualCoords ? parseCoordinateDraft(latitudeInput) : latitude
    const resolvedLongitude = manualCoords ? parseCoordinateDraft(longitudeInput) : longitude

    if (resolvedLatitude == null || resolvedLongitude == null) {
      setTimezoneError(t('form.coordinateInvalid'))
      return
    }

    if (manualCoords) syncCoordinates(resolvedLatitude, resolvedLongitude)

    const state: SavedFormState = {
      personName,
      year, month, day, hour, minute, gender, calendarType, unknownTime, jasiMethod,
      city: selectedCity, manualCoords, latitude: resolvedLatitude, longitude: resolvedLongitude,
    }
    setCalendarError(null)
    const validationError = getTimezoneValidationError(state)
    if (validationError) {
      setTimezoneError(validationError)
      return
    }
    setTimezoneError(null)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* quota exceeded — ignore */ }
    const birthInput = buildBirthInput(state)
    if (!birthInput) return
    onSubmit(birthInput)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm dark:shadow-none">
      <div className="grid grid-cols-10 gap-3 items-start">
        {/* 로고 30% */}
        <div className="col-span-3 flex justify-center pt-0.5">
          <GodsajuLogo className="w-full max-w-[5.5rem] h-auto aspect-square" />
        </div>

        {/* 입력 폼 70% */}
        <div className="col-span-7 min-w-0 text-base">
          {/* 이름 */}
          <div className="mb-4">
            <label htmlFor="birth-person-name" className={`block ${sectionTitleClass} mb-2`}>
              {t('form.personName')}
            </label>
            <input
              id="birth-person-name"
              type="text"
              value={personName}
              onChange={e => setPersonName(e.target.value)}
              className={inputClass}
              autoComplete="name"
              spellCheck={false}
            />
          </div>

          {/* 생년월일 */}
          <fieldset>
            <legend className={`${sectionTitleClass} mb-2`}>{t('form.birthDate')}</legend>
            <div className="flex flex-col gap-2">
              <select
                value={calendarType}
                onChange={e => {
                  setCalendarType(e.target.value as CalendarType)
                  setCalendarError(null)
                }}
                className={`${selectClass} w-full sm:max-w-[11rem]`}
                aria-label={t('form.calendarType')}
              >
                <option value="solar">{t('form.calendar.solar')}</option>
                <option value="lunar">{t('form.calendar.lunar')}</option>
                <option
                  value="lunarLeap"
                  disabled={leapMonth == null}
                >
                  {leapMonth != null
                    ? t('form.calendar.lunarLeap')
                    : t('form.calendar.lunarLeapDisabled')}
                </option>
              </select>
              <div className="grid grid-cols-3 gap-2">
              <select
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                className={selectClass}
              >
                {Array.from({ length: currentYear - 1900 + 1 }, (_, i) => {
                  const y = currentYear - i
                  return <option key={y} value={y}>{`${y}${t('form.yearSuffix')}`}</option>
                })}
              </select>
              <select
                value={month}
                onChange={e => setMonth(Number(e.target.value))}
                className={selectClass}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{`${i + 1}${t('form.monthSuffix')}`}</option>
                ))}
              </select>
              <select
                value={day}
                onChange={e => setDay(Number(e.target.value))}
                className={selectClass}
              >
                {Array.from({ length: 31 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{`${i + 1}${t('form.daySuffix')}`}</option>
                ))}
              </select>
              </div>
            </div>
            {calendarType !== 'solar' && leapMonth != null && calendarType === 'lunar' && (
              <p className={`mt-1.5 ${sectionMutedClass}`}>
                {t('form.lunarLeapHint').replace('{month}', String(leapMonth))}
              </p>
            )}
          </fieldset>

          {calendarError && (
            <div className="mt-2 px-3 py-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-base font-normal text-red-700 dark:text-red-400 leading-relaxed">
              {calendarError}
            </div>
          )}

          {isKDT && (
            <div className="mt-2 px-3 py-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg text-base font-normal text-amber-700 dark:text-amber-400 leading-relaxed">
              {t('form.kdt')}
            </div>
          )}
          {!isKDT && isKstHistoricalAnomaly && (
            <div className="mt-2 px-3 py-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg text-base font-normal text-amber-700 dark:text-amber-400 leading-relaxed">
              {t('form.kstHistoricalOffset')}
            </div>
          )}

          {/* 시간 + 성별 */}
          <fieldset className="mt-4">
            <div className="flex items-center justify-between mb-2 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <legend className={`${sectionTitleClass} shrink-0`}>{t('form.time')}</legend>
                {!unknownTime && (
                  <Dialog open={shichenOpen} onOpenChange={setShichenOpen}>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className={`flex items-center gap-1 ${sectionMutedClass} hover:text-blue-700 dark:hover:text-blue-400 transition-colors shrink-0`}
                        aria-label={t('form.shichenHelpAria')}
                      >
                        <span>{t('form.shichenHelpLink')}</span>
                        <span className="text-base leading-none" aria-hidden="true">🔎</span>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto bg-white border-gray-200 text-gray-800 shadow-xl">
                      <DialogHeader>
                        <DialogTitle className="text-blue-700">{t('form.shichenHelpTitle')}</DialogTitle>
                      </DialogHeader>
                      <p className="text-sm text-gray-600 leading-relaxed -mt-2">
                        {t('form.shichenHelpIntro')}
                      </p>
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="py-2 pr-4 text-left font-medium text-blue-700">
                              {t('form.shichen.colBranch')}
                            </th>
                            <th className="py-2 text-left font-medium text-blue-700">
                              {t('form.shichen.colTime')}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {SHICHEN_LEGEND_ROWS.map((row, index) => (
                            <tr key={row.labelKey} className="border-b border-gray-100">
                              <td className="py-2 pr-4">
                                <button
                                  type="button"
                                  className="font-medium text-blue-700 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors text-left w-full"
                                  onClick={() => {
                                    const start = getShiChenAutoFillTime(index)
                                    setHour(start.hour)
                                    setMinute(start.minute)
                                    setShichenOpen(false)
                                  }}
                                >
                                  <span className="inline-flex items-center gap-1.5">
                                    <span aria-hidden>{getShiChenEmoji(index)}</span>
                                    <span>{t(row.labelKey)}</span>
                                  </span>
                                </button>
                              </td>
                              <td className="py-2 text-gray-600">{t(row.rangeKey)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={unknownTime}
                  onChange={e => setUnknownTime(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-[18px] bg-gray-200 dark:bg-gray-700 rounded-full peer-checked:bg-gray-800 dark:peer-checked:bg-gray-200 relative transition-colors after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:w-3 after:h-3 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-3.5" />
                <span className={sectionMutedClass}>{t('form.unknown')}</span>
              </label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
              <select
                value={hour}
                onChange={e => setHour(Number(e.target.value))}
                disabled={unknownTime}
                className={selectClass}
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{`${String(i).padStart(2, '0')}${t('form.hourSuffix')}`}</option>
                ))}
              </select>
              <select
                value={minute}
                onChange={e => setMinute(Number(e.target.value))}
                disabled={unknownTime}
                className={selectClass}
              >
                {Array.from({ length: 60 }, (_, i) => (
                  <option key={i} value={i}>{`${String(i).padStart(2, '0')}${t('form.minuteSuffix')}`}</option>
                ))}
              </select>

              {/* 성별 — segmented control */}
              <div>
                <div className="inline-flex h-10 rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
                  {(['M', 'F'] as const).map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`px-4 text-base rounded-md transition-all ${
                        gender === g ? segmentBtnActive : segmentBtnInactive
                      }`}
                    >
                      {g === 'M' ? t('form.male') : t('form.female')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {!unknownTime && shichenHint && (
              <p className={`mt-1.5 flex items-center gap-1.5 ${sectionMutedClass}`}>
                <span aria-hidden>{shichenHint.emoji}</span>
                <span>{shichenHint.text}</span>
              </p>
            )}

            {!unknownTime && (
              <div className="mt-2">
                <div className="flex items-center gap-1 mb-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className={`flex items-center gap-1 ${sectionMutedClass} hover:text-blue-700 dark:hover:text-blue-400 transition-colors`}
                        aria-label={t('form.jasiHelpAria')}
                      >
                        <span>{t('form.jasiMethod')}</span>
                        <span className="text-base leading-none" aria-hidden="true">🔎</span>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto bg-white border-gray-200 text-gray-800 shadow-xl">
                      <DialogHeader>
                        <DialogTitle className="text-blue-700">{t('form.jasiHelpTitle')}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
                        <p>{t('form.jasiHelpIntro')}</p>
                        <div>
                          <h4 className="font-semibold text-blue-700 mb-1">
                            {t('form.unified')}
                          </h4>
                          <p>{t('form.jasiHelpUnifiedBody')}</p>
                          <p className="mt-1.5 text-gray-500">
                            {t('form.jasiHelpUnifiedExample')}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-blue-700 mb-1">
                            {t('form.split')}
                          </h4>
                          <p>{t('form.jasiHelpSplitBody')}</p>
                          <p className="mt-1.5 text-gray-500">
                            {t('form.jasiHelpSplitExample')}
                          </p>
                        </div>
                        <p className="text-sm font-medium text-green-800">
                          {t('form.jasiHelpNote')}
                        </p>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="inline-flex h-10 rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
                  {([
                    { value: 'unified' as const, label: t('form.unified') },
                    { value: 'split' as const, label: t('form.split') },
                  ]).map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setJasiMethod(opt.value)}
                      className={`px-4 text-base rounded-md transition-all ${
                        jasiMethod === opt.value ? segmentBtnActive : segmentBtnInactive
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </fieldset>

          {/* 위치 */}
          <fieldset className="mt-4">
            <legend className={`${sectionTitleClass} mb-2`}>{t('form.birthPlace')}</legend>
            <div className="inline-flex h-10 rounded-lg bg-gray-100 dark:bg-gray-800 p-1 mb-2">
              <button
                type="button"
                onClick={() => {
                  setManualCoords(false)
                  setTimezoneError(null)
                  if (selectedCity) {
                    syncCoordinates(selectedCity.lat, selectedCity.lon)
                  }
                }}
                className={`px-4 text-base rounded-md transition-all ${
                  !manualCoords ? segmentBtnActive : segmentBtnInactive
                }`}
              >
                {t('form.citySearch')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setManualCoords(true)
                  setTimezoneError(null)
                }}
                className={`px-4 text-base rounded-md transition-all ${
                  manualCoords ? segmentBtnActive : segmentBtnInactive
                }`}
              >
                {t('form.coordInput')}
              </button>
            </div>
            {manualCoords ? (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`block ${sectionMutedClass} mb-1`}>{t('form.latitude')}</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={latitudeInput}
                    onChange={e => handleCoordinateChange(e.target.value, setLatitudeInput, setLatitude)}
                    onBlur={() => setLatitudeInput(formatCoordinate(latitude))}
                    onKeyDown={e => handleCoordinateKeyDown(e, latitudeInput, latitude, applyLatitude)}
                    autoComplete="off"
                    spellCheck={false}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={`block ${sectionMutedClass} mb-1`}>{t('form.longitude')}</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={longitudeInput}
                    onChange={e => handleCoordinateChange(e.target.value, setLongitudeInput, setLongitude)}
                    onBlur={() => setLongitudeInput(formatCoordinate(longitude))}
                    onKeyDown={e => handleCoordinateKeyDown(e, longitudeInput, longitude, applyLongitude)}
                    autoComplete="off"
                    spellCheck={false}
                    className={inputClass}
                  />
                </div>
              </div>
            ) : (
              <>
                <CityCombobox selectedCity={selectedCity} onSelect={handleCitySelect} />
                <p className={`mt-1.5 ${sectionMutedClass} leading-relaxed`}>
                  {locationSummary}
                </p>
              </>
            )}
            {manualCoords && (
              <p className={`mt-1.5 ${sectionMutedClass} leading-relaxed`}>
                {locationSummary}
              </p>
            )}
            {timezoneDisplayLabel && (
              <p className={`mt-1.5 ${sectionMutedClass} leading-relaxed`}>
                {t('form.timezoneDefault')} {timezoneDisplayLabel}
                {isDstActive && (
                  <span className="block mt-0.5">
                    ↳ {t('form.dstActive')}
                  </span>
                )}
              </p>
            )}
            {timeAdjustmentPreview && !timezoneError && (
              <BirthTimeAdjustmentNotice
                info={timeAdjustmentPreview}
                unknownTime={unknownTime}
                className="mt-2"
              />
            )}
            {timezoneError && (
              <div className="mt-2 px-3 py-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-base font-normal text-red-700 dark:text-red-400 leading-relaxed">
                {timezoneError}
              </div>
            )}
          </fieldset>

          {/* 계산 버튼 */}
          <button
            type="submit"
            className="mt-5 w-full h-11 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 text-base font-normal rounded-lg hover:bg-gray-700 dark:hover:bg-gray-300 active:scale-[0.98] transition-all"
          >
            {t('form.calculate')}
          </button>

          <p className={`mt-3 text-center ${sectionMutedClass} leading-relaxed`}>
            🔒 {t('form.privacy1')}<br />
            {t('form.privacy2')}
          </p>
        </div>
      </div>
    </form>
  )
})

export default BirthForm
