/**
 * 월운(月運) 참조 데이터
 * 2026년 5월(입하)부터 2027년 4월(청명)까지 12개월
 * 
 * 월두법 공식: (연간 번호 × 2 + 1) mod 10
 * 2026년(丙午년): 병(丙)은 천간 3번 → (3 × 2 + 1) = 7 → 경(庚)
 * 즉, 2026년 정월(寅월)은 경인(庚寅)월부터 시작
 */

export interface MonthlyReference {
  year: number
  month: number
  solarTerm: string
  ganzi: string
  gan: string
  zhi: string
  stemSipsin: string
  branchSipsin: string
  meteor: string
  spirit: string
}

/**
 * 2026년 5월 ~ 2027년 4월 월운 참조 데이터
 * 이 데이터는 사주 입력 월을 기준으로 12개월 월운을 생성할 때 검증용으로 사용
 */
export const MONTHLY_REFERENCE_DATA: MonthlyReference[] = [
  // 2026년
  { year: 2026, month: 5, solarTerm: '입하', ganzi: '癸巳', gan: '癸', zhi: '巳', stemSipsin: '정관(正官)', branchSipsin: '식신(食神)', meteor: '목욕(沐浴)', spirit: '망신살(亡神)' },
  { year: 2026, month: 6, solarTerm: '망종', ganzi: '甲午', gan: '甲', zhi: '午', stemSipsin: '정재(正財)', branchSipsin: '상관(傷官)', meteor: '태(胎)', spirit: '망신살(亡神)' },
  { year: 2026, month: 7, solarTerm: '소서', ganzi: '乙未', gan: '乙', zhi: '未', stemSipsin: '비견(比肩)', branchSipsin: '편관(偏官)', meteor: '양(養)', spirit: '연살(年殺)' },
  { year: 2026, month: 8, solarTerm: '입추', ganzi: '丙申', gan: '丙', zhi: '申', stemSipsin: '식신(食神)', branchSipsin: '식신(食神)', meteor: '병(病)', spirit: '여마살(驛馬)' },
  { year: 2026, month: 9, solarTerm: '백로', ganzi: '丁酉', gan: '丁', zhi: '酉', stemSipsin: '상관(傷官)', branchSipsin: '정관(正官)', meteor: '사(死)', spirit: '육해살(六害)' },
  { year: 2026, month: 10, solarTerm: '한로', ganzi: '戊戌', gan: '戊', zhi: '戌', stemSipsin: '편재(偏財)', branchSipsin: '편인(偏印)', meteor: '묘(墓)', spirit: '화개살(華蓋)' },
  { year: 2026, month: 11, solarTerm: '입동', ganzi: '己亥', gan: '己', zhi: '亥', stemSipsin: '정인(正印)', branchSipsin: '정인(正印)', meteor: '절(絶)', spirit: '겁살(劫)' },
  { year: 2026, month: 12, solarTerm: '대설', ganzi: '庚子', gan: '庚', zhi: '子', stemSipsin: '편관(偏官)', branchSipsin: '정재(正財)', meteor: '관대(冠帶)', spirit: '재살(災)' },
  
  // 2027년
  { year: 2027, month: 1, solarTerm: '소한', ganzi: '辛丑', gan: '辛', zhi: '丑', stemSipsin: '정관(正官)', branchSipsin: '정인(正印)', meteor: '건록(乾祿)', spirit: '천살(天)' },
  { year: 2027, month: 2, solarTerm: '입춘', ganzi: '壬寅', gan: '壬', zhi: '寅', stemSipsin: '정재(正財)', branchSipsin: '비견(比肩)', meteor: '장생(長生)', spirit: '지살(地)' },
  { year: 2027, month: 3, solarTerm: '경칩', ganzi: '癸卯', gan: '癸', zhi: '卯', stemSipsin: '비견(比肩)', branchSipsin: '겁재(劫財)', meteor: '제왕(帝旺)', spirit: '연살(年殺)' },
  { year: 2027, month: 4, solarTerm: '청명', ganzi: '甲辰', gan: '甲', zhi: '辰', stemSipsin: '겁재(劫財)', branchSipsin: '편재(偏財)', meteor: '쇠(衰)', spirit: '식(食)' }
]

/**
 * 12개 절기 (중기 제외)
 * 소만, 대서 같은 중간 절기는 제외
 */
export const SOLAR_TERMS = [
  '입하',    // 5월
  '망종',    // 6월
  '소서',    // 7월
  '입추',    // 8월
  '백로',    // 9월
  '한로',    // 10월
  '입동',    // 11월
  '대설',    // 12월
  '소한',    // 1월
  '입춘',    // 2월
  '경칩',    // 3월
  '청명'     // 4월
]

/**
 * 월두법 공식 구현
 * 연간에 따른 정월(寧월)의 천간 결정
 * @param yearGan 연간 (예: '丙')
 * @returns 정월 천간 인덱스 (0~9)
 */
export function getJanuaryStemIndexByYearGan(yearGan: string): number {
  const SKY = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
  const yearGanIdx = SKY.indexOf(yearGan)
  
  if (yearGanIdx < 0) return 0
  
  // 월두법: (연간 번호 × 2 + 1) mod 10
  // 하지만 일반적인 표로는:
  // 갑기(甲己)년: 정월 천간 0 (甲)
  // 을경(乙庚)년: 정월 천간 2 (丙)
  // 병신(丙辛)년: 정월 천간 4 (戊)
  // 정임(丁壬)년: 정월 천간 6 (庚)
  // 무계(戊癸)년: 정월 천간 8 (壬)
  const januaryStemTable = [0, 2, 4, 6, 8, 0, 2, 4, 6, 8]
  
  return januaryStemTable[yearGanIdx]
}

/**
 * 월운 간지 생성 (월두법 기반)
 * @param yearGan 연간 (예: '丙')
 * @param monthIndex 월 인덱스 (0=정월, 1=2월, ..., 11=12월)
 * @returns 월운 간지 (예: '癸巳')
 */
export function generateMonthlyGanzi(yearGan: string, monthIndex: number): string {
  const SKY = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
  const BRANCHES = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑']
  
  // 정월 천간 결정
  const januaryStemIdx = getJanuaryStemIndexByYearGan(yearGan)
  
  // 해당 월의 천간 = 정월 천간 + 월 오프셋
  const currentStemIdx = (januaryStemIdx + monthIndex) % 10
  const currentStem = SKY[currentStemIdx]
  
  // 월의 지지는 고정
  const currentBranch = BRANCHES[monthIndex % 12]
  
  return currentStem + currentBranch
}
