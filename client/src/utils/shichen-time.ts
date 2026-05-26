/** 시진별 구간 시작 시각 (간지 클릭 → 시·분 자동 입력용) */
export const SHICHEN_START_TIMES: ReadonlyArray<{ hour: number; minute: number }> = [
  { hour: 23, minute: 30 }, // 子
  { hour: 1, minute: 30 },  // 丑
  { hour: 3, minute: 30 },  // 寅
  { hour: 5, minute: 30 },  // 卯
  { hour: 7, minute: 30 },  // 辰
  { hour: 9, minute: 30 },  // 巳
  { hour: 11, minute: 30 }, // 午
  { hour: 13, minute: 30 }, // 未
  { hour: 15, minute: 30 }, // 申
  { hour: 17, minute: 30 }, // 酉
  { hour: 19, minute: 30 }, // 戌
  { hour: 21, minute: 30 }, // 亥
]

export function getShiChenStartTime(branchIndex: number): { hour: number; minute: number } {
  const i = ((branchIndex % 12) + 12) % 12
  return SHICHEN_START_TIMES[i]
}

/** 간지 클릭 자동 입력 — 구간 시작 +1시간 (자시 23:30→00:30, 전날 넘김 방지) */
export function getShiChenAutoFillTime(branchIndex: number): { hour: number; minute: number } {
  const start = getShiChenStartTime(branchIndex)
  const total = start.hour * 60 + start.minute + 60
  const wrapped = ((total % (24 * 60)) + 24 * 60) % (24 * 60)
  return { hour: Math.floor(wrapped / 60), minute: wrapped % 60 }
}

/** 12시진(時辰) — pillars.ts 시주 반시(30분) 경계와 동일 */

export const SHICHEN_HANJA = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const

/** 12시진 동물 이모지 (子→鼠 … 亥→猪) */
export const SHICHEN_EMOJI = ['🐭', '🐮', '🐯', '🐰', '🐲', '🐍', '🐴', '🐑', '🐵', '🐔', '🐶', '🐷'] as const

export function getShiChenEmoji(branchIndex: number): string {
  const i = ((branchIndex % 12) + 12) % 12
  return SHICHEN_EMOJI[i]
}

/** 시·분 → 시진 인덱스 (0=子 … 11=亥) */
export function getShiChenBranchIndex(hour: number, minute: number): number {
  if (hour === 0 || (hour === 1 && minute < 30)) return 0
  if ((hour === 1 && minute >= 30) || hour === 2 || (hour === 3 && minute < 30)) return 1
  if ((hour === 3 && minute >= 30) || hour === 4 || (hour === 5 && minute < 30)) return 2
  if ((hour === 5 && minute >= 30) || hour === 6 || (hour === 7 && minute < 30)) return 3
  if ((hour === 7 && minute >= 30) || hour === 8 || (hour === 9 && minute < 30)) return 4
  if ((hour === 9 && minute >= 30) || hour === 10 || (hour === 11 && minute < 30)) return 5
  if ((hour === 11 && minute >= 30) || hour === 12 || (hour === 13 && minute < 30)) return 6
  if ((hour === 13 && minute >= 30) || hour === 14 || (hour === 15 && minute < 30)) return 7
  if ((hour === 15 && minute >= 30) || hour === 16 || (hour === 17 && minute < 30)) return 8
  if ((hour === 17 && minute >= 30) || hour === 18 || (hour === 19 && minute < 30)) return 9
  if ((hour === 19 && minute >= 30) || hour === 20 || (hour === 21 && minute < 30)) return 10
  if ((hour === 21 && minute >= 30) || hour === 22 || (hour === 23 && minute < 30)) return 11
  return 0 // 23:30~23:59 → 子
}

/** 선택 시각이 속한 구간 (확인용, 종료는 :29) */
export function getShiChenRangeLabel(hour: number, minute: number): string {
  const i = getShiChenBranchIndex(hour, minute)
  if (i === 0) {
    if (hour === 23 && minute >= 30) return '23:30~00:29'
    return '00:00~01:29'
  }
  const ranges: Record<number, string> = {
    1: '01:30~03:29',
    2: '03:30~05:29',
    3: '05:30~07:29',
    4: '07:30~09:29',
    5: '09:30~11:29',
    6: '11:30~13:29',
    7: '13:30~15:29',
    8: '15:30~17:29',
    9: '17:30~19:29',
    10: '19:30~21:29',
    11: '21:30~23:29',
  }
  return ranges[i] ?? ''
}

/** 子時 조(00:00~01:29) — 23:30 전날 구간과 구분 */
export function isZiMorningSegment(hour: number, minute: number): boolean {
  return hour === 0 || (hour === 1 && minute < 30)
}

export interface ShiChenHintLabels {
  ziRange: string
  ziBirthdayNote: string
}

export function getShiChenHintParts(
  hour: number,
  minute: number,
  labels?: ShiChenHintLabels,
): { emoji: string; text: string; note?: string } {
  const i = getShiChenBranchIndex(hour, minute)
  if (i === 0 && labels?.ziRange) {
    return {
      emoji: getShiChenEmoji(i),
      text: `${SHICHEN_HANJA[i]}時 (${labels.ziRange})`,
      note: isZiMorningSegment(hour, minute) ? labels.ziBirthdayNote : undefined,
    }
  }
  return {
    emoji: getShiChenEmoji(i),
    text: `${SHICHEN_HANJA[i]}時(${getShiChenRangeLabel(hour, minute)})`,
  }
}

export function formatShiChenHint(hour: number, minute: number): string {
  const { emoji, text } = getShiChenHintParts(hour, minute)
  return `${emoji} ${text}`
}

/** 12간지 시간표 팝업용 (범례) */
export const SHICHEN_LEGEND_ROWS: { labelKey: string; rangeKey: string }[] = [
  { labelKey: 'form.shichen.branch.zi', rangeKey: 'form.shichen.legend.zi' },
  { labelKey: 'form.shichen.branch.chou', rangeKey: 'form.shichen.legend.chou' },
  { labelKey: 'form.shichen.branch.yin', rangeKey: 'form.shichen.legend.yin' },
  { labelKey: 'form.shichen.branch.mao', rangeKey: 'form.shichen.legend.mao' },
  { labelKey: 'form.shichen.branch.chen', rangeKey: 'form.shichen.legend.chen' },
  { labelKey: 'form.shichen.branch.si', rangeKey: 'form.shichen.legend.si' },
  { labelKey: 'form.shichen.branch.wu', rangeKey: 'form.shichen.legend.wu' },
  { labelKey: 'form.shichen.branch.wei', rangeKey: 'form.shichen.legend.wei' },
  { labelKey: 'form.shichen.branch.shen', rangeKey: 'form.shichen.legend.shen' },
  { labelKey: 'form.shichen.branch.you', rangeKey: 'form.shichen.legend.you' },
  { labelKey: 'form.shichen.branch.xu', rangeKey: 'form.shichen.legend.xu' },
  { labelKey: 'form.shichen.branch.hai', rangeKey: 'form.shichen.legend.hai' },
]
