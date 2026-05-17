/**
 * 월운(月運) 데이터 - 2026년 5월 ~ 2027년 4월
 * 
 * 2026년은 丙午(병오)년입니다.
 * 월두법에 따라 각 월의 간지는 고정되어 있습니다.
 * 
 * 이 데이터는 명리학의 표준 월두법 규칙에 따라 정의되었습니다.
 */

export interface MonthlyData {
  year: number
  month: number
  term: string // 절기 (입하, 망종, 소서, ...)
  stem: string // 천간 (甲, 乙, 丙, ...)
  branch: string // 지지 (子, 丑, 寅, ...)
}

/**
 * 2026년 5월 ~ 2027년 4월 월운 데이터
 * 각 월의 절기와 간지는 명리학 월두법에 따라 고정됨
 */
export const MONTHLY_DATA: MonthlyData[] = [
  // 2026년
  { year: 2026, month: 5, term: '입하', stem: '癸', branch: '巳' },
  { year: 2026, month: 6, term: '망종', stem: '甲', branch: '午' },
  { year: 2026, month: 7, term: '소서', stem: '乙', branch: '未' },
  { year: 2026, month: 8, term: '입추', stem: '丙', branch: '申' },
  { year: 2026, month: 9, term: '백로', stem: '丁', branch: '酉' },
  { year: 2026, month: 10, term: '한로', stem: '戊', branch: '戌' },
  { year: 2026, month: 11, term: '입동', stem: '己', branch: '亥' },
  { year: 2026, month: 12, term: '대설', stem: '庚', branch: '子' },
  
  // 2027년
  { year: 2027, month: 1, term: '소한', stem: '辛', branch: '丑' },
  { year: 2027, month: 2, term: '입춘', stem: '壬', branch: '寅' },
  { year: 2027, month: 3, term: '경칩', stem: '癸', branch: '卯' },
  { year: 2027, month: 4, term: '청명', stem: '甲', branch: '辰' }
]

/**
 * 연도와 월로 월운 데이터 조회
 * @param year 연도
 * @param month 월 (1~12)
 * @returns 월운 데이터 또는 undefined
 */
export function getMonthlyDataByYearMonth(year: number, month: number): MonthlyData | undefined {
  return MONTHLY_DATA.find(m => m.year === year && m.month === month)
}

/**
 * 월운 간지 조회 (간지 문자열 반환)
 * @param year 연도
 * @param month 월 (1~12)
 * @returns 월운 간지 (예: '癸巳') 또는 undefined
 */
export function getMonthGanzi(year: number, month: number): string | undefined {
  const data = getMonthlyDataByYearMonth(year, month)
  return data ? data.stem + data.branch : undefined
}

/**
 * 공망(空亡) 확인
 * 일주가 甲午인 경우, 공망은 辰(진)과 巳(사)입니다.
 * @param dayBranch 일주의 지지
 * @param monthBranch 월운의 지지
 * @returns 공망 여부
 */
export function isKongwang(dayBranch: string, monthBranch: string): boolean {
  // 일주가 甲午인 경우 공망 확인
  if (dayBranch === '午') {
    return monthBranch === '辰' || monthBranch === '巳'
  }
  // 다른 일주의 공망 규칙은 추후 추가 가능
  return false
}
