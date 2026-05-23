import { useMemo } from 'react'
import type { BirthInput } from '@core/types'
import { calculateMonthPillarBasisFromInput, formatMonthPillarBasisDateTime } from '@core/index'

interface Props {
  input: BirthInput
  className?: string
}

export default function MonthPillarBasisNotice({ input, className = '' }: Props) {
  const basis = useMemo(() => calculateMonthPillarBasisFromInput(input), [input])

  const boundaryDt = formatMonthPillarBasisDateTime(
    basis.boundaryYear, basis.boundaryMonth, basis.boundaryDay,
    basis.boundaryHour, basis.boundaryMinute,
  )
  const appliedDt = formatMonthPillarBasisDateTime(
    basis.appliedYear, basis.appliedMonth, basis.appliedDay,
    basis.appliedHour, basis.appliedMinute,
  )

  return (
    <div className={`rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/20 px-3 py-2.5 text-sm leading-relaxed text-gray-700 dark:text-gray-300 ${className}`}>
      <p className="font-medium text-gray-900 dark:text-gray-100">
        절기·월주 근거
      </p>
      <ul className="mt-1.5 space-y-1 text-gray-600 dark:text-gray-400">
        <li>
          기준 절기(節入):
          {' '}
          <span className="font-hanja">{basis.boundaryTermHanja}</span>
          ({basis.boundaryTermKor})
          {' '}
          {boundaryDt}
        </li>
        <li>
          적용 출생시각:
          {' '}
          {appliedDt}
          {' '}
          <span className="text-gray-500 dark:text-gray-500">({basis.relativeToBoundary})</span>
        </li>
        <li>
          월주:
          {' '}
          <span className="font-hanja font-medium text-gray-800 dark:text-gray-200">{basis.monthGanzi}</span>
          ({basis.monthGanziKor})
          {' '}
          —
          {' '}
          <span className="font-hanja">{basis.monthLabel}</span>
          (
          {basis.monthBranchKor}
          월,
          {' '}
          {basis.boundaryTermKor}
          {' '}
          ~
          {' '}
          <span className="font-hanja">{basis.nextTermHanja}</span>
          (
          {basis.nextTermKor}
          )
          {' '}
          전)
        </li>
      </ul>
    </div>
  )
}
