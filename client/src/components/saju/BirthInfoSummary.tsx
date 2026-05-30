import { useMemo } from 'react'
import type { BirthInput } from '@core/types'
import { getBirthTimeAdjustmentInfo, resolveSolarBirthDateTime } from '@core/index'
import { buildBirthInfoDisplay, formatLunarBirthDisplay } from '../../utils/birth-info-format.ts'
import BirthTimeAdjustmentNotice from '../BirthTimeAdjustmentNotice.tsx'

interface Props {
  input: BirthInput
}

export default function BirthInfoSummary({ input }: Props) {
  const info = useMemo(() => buildBirthInfoDisplay(input), [input])

  const lunarBirth = useMemo(() => formatLunarBirthDisplay(input), [input])

  const solarConversion = useMemo(() => {
    if (!input.calendarType || input.calendarType === 'solar') return null
    try {
      const solar = resolveSolarBirthDateTime(input)
      const pad = (n: number) => String(n).padStart(2, '0')
      const time = input.unknownTime
        ? ''
        : ` ${pad(solar.hour)}:${pad(solar.minute)}`
      return {
        text: `${solar.year}년 ${solar.month}월 ${solar.day}일${time}`,
        isLeap: input.calendarType === 'lunarLeap',
      }
    } catch {
      return { text: '(변환 실패)', isLeap: false }
    }
  }, [input])

  const timeAdjustInfo = useMemo(() => {
    if (input.unknownTime) return null
    try {
      return getBirthTimeAdjustmentInfo(input)
    } catch {
      return null
    }
  }, [input])

  return (
    <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <h2 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-3">
        출생정보 <span className="font-hanja">(出生情報)</span>
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
              <th className="py-2 pr-3 font-medium">이름</th>
              <th className="py-2 pr-3 font-medium">생년월일</th>
              <th className="py-2 pr-3 font-medium">시간 / 12간지 / 자시법 / 성별</th>
              <th className="py-2 font-medium">출생위치</th>
            </tr>
          </thead>
          <tbody>
            <tr className="text-gray-800 dark:text-gray-100">
              <td className="py-2.5 pr-3 align-top">{info.name}</td>
              <td className="py-2.5 pr-3 align-top">
                <div className="leading-snug">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 text-xs mr-1">{info.calendarLabel}</span>
                    {info.birthDate}
                  </div>
                  {lunarBirth && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      (음력 {lunarBirth})
                    </div>
                  )}
                </div>
              </td>
              <td className="py-2.5 pr-3 align-top">
                {info.unknownTime ? (
                  <span>모름 / {info.gender}</span>
                ) : (
                  <span>
                    {info.timeText}
                    {' '}
                    <span className="text-gray-500 dark:text-gray-400">({info.shichen})</span>
                    {' / '}
                    {info.jasiMethod}
                    {' / '}
                    {info.gender}
                  </span>
                )}
              </td>
              <td className="py-2.5 align-top">{info.location}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {solarConversion && (
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
          양력 변환:
          {' '}
          {solarConversion.text}
          {solarConversion.isLeap && (
            <span className="ml-1 text-gray-500 dark:text-gray-400">(윤달(음력))</span>
          )}
        </p>
      )}

      {timeAdjustInfo && (
        <BirthTimeAdjustmentNotice
          info={timeAdjustInfo}
          unknownTime={input.unknownTime}
          className="mt-3"
        />
      )}

      {input.unknownTime && (
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
          출생 시각 미입력 — 일·월·년주·대운 기준 (시주 제외)
        </p>
      )}
    </section>
  )
}
