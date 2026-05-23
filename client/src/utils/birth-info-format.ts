import type { BirthInput, JasiMethod } from '@core/types'
import type { MonthPillarBasis } from '@core/index'
import {
  calendarTypeLabel,
  resolveSolarBirthDateTime,
  solarToLunar,
  getBirthTimeAdjustmentInfo,
  formatClockTime,
  formatSignedMinutes,
  formatMonthPillarBasisDateTime,
} from '@core/index'
import { getShiChenBranchIndex } from './shichen-time.ts'
import { isDaylightSavingInEffect } from './timezones.ts'

const SHICHEN_KOR = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'] as const

export function jasiMethodLabel(method?: JasiMethod): string {
  return method === 'split' ? '야자시' : '통자시'
}

export interface BirthInfoDisplay {
  name: string
  calendarLabel: string
  birthDate: string
  timeText: string
  shichen: string
  jasiMethod: string
  gender: string
  location: string
  unknownTime: boolean
}

/** 양력 입력 → 음력 생일 표기 (윤달 포함) */
export function formatLunarBirthDisplay(input: BirthInput): string | null {
  const cal = input.calendarType ?? 'solar'
  if (cal !== 'solar') return null
  try {
    const solar = resolveSolarBirthDateTime(input)
    const lunar = solarToLunar(solar.year, solar.month, solar.day)
    const leap = lunar.isLeap ? ' (윤달)' : ''
    return `${lunar.lunarYear}년 ${lunar.lunarMonth}월 ${lunar.lunarDay}일${leap}`
  } catch {
    return null
  }
}

export function buildBirthInfoDisplay(input: BirthInput): BirthInfoDisplay {
  const name = input.personName?.trim() || '-'
  const calendarLabel = calendarTypeLabel(input.calendarType)
  const birthDate = `${input.year}년 ${input.month}월 ${input.day}일`
  const gender = input.gender === 'M' ? '남성' : '여성'
  const location = input.birthLocation ?? '-'

  if (input.unknownTime) {
    return {
      name,
      calendarLabel,
      birthDate,
      timeText: '모름',
      shichen: '-',
      jasiMethod: '-',
      gender,
      location,
      unknownTime: true,
    }
  }

  const hh = String(input.hour).padStart(2, '0')
  const mm = String(input.minute).padStart(2, '0')
  const shiIdx = getShiChenBranchIndex(input.hour, input.minute)

  return {
    name,
    calendarLabel,
    birthDate,
    timeText: `${hh}:${mm}`,
    shichen: `${SHICHEN_KOR[shiIdx]}시`,
    jasiMethod: jasiMethodLabel(input.jasiMethod),
    gender,
    location,
    unknownTime: false,
  }
}

function formatIsoDateTime(y: number, m: number, d: number, h: number, min: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')} ${formatClockTime(h, min)}`
}

function formatShichenLabel(hour: number, minute: number): string {
  return `${SHICHEN_KOR[getShiChenBranchIndex(hour, minute)]}시`
}

/** AI 복사용 출생정보 표 행 */
export function formatBirthInfoRow(input: BirthInput): string {
  const info = buildBirthInfoDisplay(input)
  const birthDate = `${info.calendarLabel} ${info.birthDate}`
  const timeCol = info.unknownTime
    ? `모름 / - / ${info.gender}`
    : `${info.timeText} (${info.shichen}) / ${info.jasiMethod} / ${info.gender}`
  return `| ${info.name} | ${birthDate} | ${timeCol} | ${info.location} |`
}

/** AI 복사용 사주원국 계산 기준 설명 */
export function formatCalculationBasisLines(input: BirthInput): string[] {
  const lines: string[] = []

  if (input.calendarType && input.calendarType !== 'solar') {
    try {
      const solar = resolveSolarBirthDateTime(input)
      lines.push(`양력 변환: ${formatIsoDateTime(solar.year, solar.month, solar.day, solar.hour, solar.minute)}`)
      if (input.calendarType === 'lunarLeap') {
        lines.push('(음력 윤달 입력)')
      }
    } catch {
      lines.push('(양력 변환 실패 — 입력값 확인 필요)')
      return lines
    }
  } else {
    const lunarText = formatLunarBirthDisplay(input)
    if (lunarText) {
      lines.push(`음력 생일: ${lunarText}`)
    }
  }

  if (input.unknownTime) {
    lines.push('계산 기준: 출생 시각 미입력 — 일·월·년주·대운 기준 (시주 제외)')
    return lines
  }

  try {
    const info = getBirthTimeAdjustmentInfo(input)
    const wall = info.wallClock
    const adj = info.adjusted
    const wallTime = formatIsoDateTime(wall.year, wall.month, wall.day, wall.hour, wall.minute)
    const adjTime = formatIsoDateTime(adj.year, adj.month, adj.day, adj.hour, adj.minute)
    const adjShichen = formatShichenLabel(adj.hour, adj.minute)

    if (info.mode === 'kst') {
      lines.push('계산 기준: KST 벽시계 (경도 보정 없음)')
      const sameMoment = wall.year === adj.year && wall.month === adj.month && wall.day === adj.day
        && wall.hour === adj.hour && wall.minute === adj.minute
      if (sameMoment) {
        lines.push(`사주·대운 적용 시각: ${adjTime} (${adjShichen}, 입력 시각 그대로)`)
      } else {
        lines.push(`입력 ${wallTime} → KST 적용 ${adjTime} (${adjShichen})`)
      }
    } else {
      const dstNote = isDaylightSavingInEffect(
        info.timezone, wall.year, wall.month, wall.day, wall.hour, wall.minute,
      ) ? ', 서머타임 반영' : ''
      lines.push(`계산 기준: 현지 진태양시 (${info.timezone})`)
      lines.push(`입력 벽시계: ${wallTime}${dstNote}`)
      lines.push(
        `경도 보정 (출생경도 − 표준경선)×4분: ${formatSignedMinutes(info.longitudeCorrectionMinutes ?? 0)} · 균시차: ${formatSignedMinutes(info.equationOfTimeMinutes ?? 0)} · 합계: ${formatSignedMinutes(info.totalCorrectionMinutes ?? 0)}`,
      )
      lines.push(`사주·대운 적용 시각: ${adjTime} (${adjShichen})`)
    }
  } catch {
    lines.push('(시간 보정 정보를 계산할 수 없습니다)')
  }

  return lines
}

/** AI 복사용 절기·월주 근거 */
export function formatMonthPillarBasisLines(basis: MonthPillarBasis): string[] {
  const boundaryDt = formatMonthPillarBasisDateTime(
    basis.boundaryYear, basis.boundaryMonth, basis.boundaryDay,
    basis.boundaryHour, basis.boundaryMinute,
  )
  const appliedDt = formatMonthPillarBasisDateTime(
    basis.appliedYear, basis.appliedMonth, basis.appliedDay,
    basis.appliedHour, basis.appliedMinute,
  )

  return [
    `기준 절기(節入): ${basis.boundaryTermHanja}(${basis.boundaryTermKor}) ${boundaryDt}`,
    `적용 출생시각: ${appliedDt} (${basis.relativeToBoundary})`,
    `월주: ${basis.monthGanzi}(${basis.monthGanziKor}) — ${basis.monthLabel}(${basis.monthBranchKor}월, ${basis.boundaryTermKor} ~ ${basis.nextTermHanja}(${basis.nextTermKor}) 전)`,
  ]
}
