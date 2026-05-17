import type { Relation } from '@core/types'

export function stemColorClass(stem: string): string {
  const map: Record<string, string> = {
    '甲': 'text-green-600 dark:text-green-400',
    '乙': 'text-green-500 dark:text-green-300',
    '丙': 'text-red-600 dark:text-red-400',
    '丁': 'text-red-500 dark:text-red-300',
    '戊': 'text-yellow-600 dark:text-yellow-400',
    '己': 'text-yellow-500 dark:text-yellow-300',
    '庚': 'text-gray-600 dark:text-gray-400',
    '辛': 'text-gray-500 dark:text-gray-300',
    '壬': 'text-blue-600 dark:text-blue-400',
    '癸': 'text-blue-500 dark:text-blue-300',
  }
  return map[stem] || ''
}

export function branchColorClass(branch: string): string {
  const map: Record<string, string> = {
    '子': 'text-blue-600 dark:text-blue-400',
    '丑': 'text-yellow-600 dark:text-yellow-400',
    '寅': 'text-green-600 dark:text-green-400',
    '卯': 'text-green-500 dark:text-green-300',
    '辰': 'text-yellow-500 dark:text-yellow-300',
    '巳': 'text-red-600 dark:text-red-400',
    '午': 'text-red-500 dark:text-red-300',
    '未': 'text-yellow-600 dark:text-yellow-400',
    '申': 'text-gray-600 dark:text-gray-400',
    '酉': 'text-gray-500 dark:text-gray-300',
    '戌': 'text-yellow-500 dark:text-yellow-300',
    '亥': 'text-blue-500 dark:text-blue-300',
  }
  return map[branch] || ''
}

export function stemSolidBgClass(stem: string): string {
  const map: Record<string, string> = {
    '甲': 'bg-green-600 text-white',
    '乙': 'bg-green-500 text-white',
    '丙': 'bg-red-600 text-white',
    '丁': 'bg-red-500 text-white',
    '戊': 'bg-yellow-600 text-white',
    '己': 'bg-yellow-500 text-white',
    '庚': 'bg-gray-600 text-white',
    '辛': 'bg-gray-500 text-white',
    '壬': 'bg-blue-600 text-white',
    '癸': 'bg-blue-500 text-white',
  }
  return map[stem] || ''
}

export function branchSolidBgClass(branch: string): string {
  const map: Record<string, string> = {
    '子': 'bg-blue-600 text-white',
    '丑': 'bg-yellow-600 text-white',
    '寅': 'bg-green-600 text-white',
    '卯': 'bg-green-500 text-white',
    '辰': 'bg-yellow-500 text-white',
    '巳': 'bg-red-600 text-white',
    '午': 'bg-red-500 text-white',
    '未': 'bg-yellow-600 text-white',
    '申': 'bg-gray-600 text-white',
    '酉': 'bg-gray-500 text-white',
    '戌': 'bg-yellow-500 text-white',
    '亥': 'bg-blue-500 text-white',
  }
  return map[branch] || ''
}

/** 신살 명칭 표준화: [한글명칭]살([한자명칭]) 형식 */
export function formatSinsal(sinsal: string): string {
  if (!sinsal) return sinsal

  // 한자 추출: "화개살(華蓋)" → "華蓋"
  const hanjaMatch = sinsal.match(/[\(（]([^\)）]+)[\)）]/)
  const hanja = hanjaMatch ? hanjaMatch[1] : ''

  // 한글명칭 추출: "화개살살(華蓋)" → "화개살"
  let korName = sinsal.replace(/[\(（][^\)）]*[\)）]/g, '').trim()
  // 중복 '살' 제거: "화개살살" → "화개살"
  korName = korName.replace(/살살$/, '살')

  // 표준 명칭 매핑
  const sinsalMap: Record<string, string> = {
    '망신살': '망신살',
    '망살': '망신살',
    '겁살': '겁살',
    '겁': '겁살',
    '재살': '재살',
    '재': '재살',
    '천살': '천살',
    '천': '천살',
    '지살': '지살',
    '지': '지살',
    '연살': '연살',
    '연': '연살',
    '월살': '월살',
    '월': '월살',
    '장성살': '장성살',
    '장성': '장성살',
    '반안살': '반안살',
    '반안': '반안살',
    '역마살': '역마살',
    '역마': '역마살',
    '육해살': '육해살',
    '육해': '육해살',
    '화개살': '화개살',
    '화개': '화개살',
  }

  const standardName = sinsalMap[korName] || korName

  // 한자 표준화 매핑
  const hanjaMap: Record<string, string> = {
    '겁': '劫',
    '재': '災',
    '천': '天',
    '지': '地',
    '연': '年',
    '월': '月',
    '망': '亡神',
    '장성': '將星',
    '반안': '攀鞍',
    '역마': '驛馬',
    '육해': '六害',
    '화개': '華蓋',
  }

  // 한자가 없거나 불완전한 경우 표준 한자 사용
  const finalHanja = hanja || hanjaMap[standardName] || ''

  // 최종 형식: [한글명칭]살([한자명칭])
  return finalHanja ? `${standardName}(${finalHanja})` : standardName
}

/** 십신 관계 포맷팅 */
export function formatRelation(rel: Relation | null): string {
  if (!rel) return '?'
  return rel.hanja || rel.name || '?'
}

/** 십신 관계 약자 포맷팅 */
export function fmt2(rel: Relation | null): string {
  if (!rel) return '?'
  return rel.name || '?'
}


/**
 * 천간의 한글음과 음양오행 정보를 반환합니다.
 */
export function getStemAttr(stem: string) {
  const map: Record<string, { um: string; ohaeng: string }> = {
    '甲': { um: '갑', ohaeng: '양목' }, '乙': { um: '을', ohaeng: '음목' },
    '丙': { um: '병', ohaeng: '양화' }, '丁': { um: '정', ohaeng: '음화' },
    '戊': { um: '무', ohaeng: '양토' }, '己': { um: '기', ohaeng: '음토' },
    '庚': { um: '경', ohaeng: '양금' }, '辛': { um: '신', ohaeng: '음금' },
    '壬': { um: '임', ohaeng: '양수' }, '癸': { um: '계', ohaeng: '음수' },
  }
  return map[stem] || { um: '', ohaeng: '' }
}

/**
 * 지지의 한글음과 음양오행 정보를 반환합니다.
 */
export function getBranchAttr(branch: string) {
  const map: Record<string, { um: string; ohaeng: string }> = {
    '子': { um: '자', ohaeng: '음수' }, '丑': { um: '축', ohaeng: '음토' },
    '寅': { um: '인', ohaeng: '양목' }, '卯': { um: '묘', ohaeng: '음목' },
    '辰': { um: '진', ohaeng: '양토' }, '巳': { um: '사', ohaeng: '음화' },
    '午': { um: '오', ohaeng: '양화' }, '未': { um: '미', ohaeng: '음토' },
    '申': { um: '신', ohaeng: '양금' }, '酉': { um: '유', ohaeng: '음금' },
    '戌': { um: '술', ohaeng: '양토' }, '亥': { um: '해', ohaeng: '양수' },
  }
  return map[branch] || { um: '', ohaeng: '' }
}
