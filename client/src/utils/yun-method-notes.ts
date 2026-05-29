/** AI·UI 공통 — 「지금」·📍 현재 O운 시각 기준 */
export const YUN_AI_NOW_KST_NOTE =
  '※ **「지금」·📍 현재 O운** = 보는(복사) 그 순간을 **한국 표준시(KST) 벽시계** 로 해석해 입춘·◆節入·◆시작과 비교. 접속 국가·PC 시간대와 무관.';

/** 대운·세운·월운·일운 계산 방식 안내 (UI · AI 복사 공통) */
export const YUN_METHOD_NOTES = {
  hybrid:
    '※ 연·월 숫자는 양력 기준. 간지·合冲·용신 등 풀이 데이터는 사주원국과 동일(입춘·12節). 전환 시점은 ◆절기 행 참고.',

  nowKst: YUN_AI_NOW_KST_NOTE,

  /** @deprecated YUN_DAewoon_UI_NOTES 사용 */
  manAge:
    '※ 칸 나이 = 해당년 12/31 만나이. ◆시작·활성·현재 O운 = startDate·오늘.',

  daewoon:
    '※ 월주(12節) 순·역행 · 절기(lunar+KST) · 3일=1년 · 교체 = ◆시작(6시=1월·1시=5일·12분=1일·1분=2시간).',

  daewoonFirstYear:
    '※ 1運 첫해: 입춘~◆시작 전 소운+流年 · 이후 大運+流年.',

  sewoon:
    '※ 流年 = 입춘 기준(원국 년주). 입춘 전 = 전년 流年(◆절기 행).',

  monthly:
    '※ 월(1~12)은 양력. 월운 간지(流月) = 그 달 첫 節入(◆) 직후 — 원국 월주와 동일. ·는 中气. 절기 시·분: lunar+KST.',

  daily:
    '※ 일진은 원국과 동일. 달력은 양력, 절기 시·분은 lunar+KST.',

  sounCount:
    '※ 소운 칸 수 = 1운 startDate 연도 − 출생 연도. 칸 나이 = ◆소운 시작(생일) 시점 만나이.',

  soun:
    '※ 小運: 时柱(月柱) 기준 · 阳男阴女順·阴男阳女逆 · 간지 교체 = 매년 생일(◆소운 시작).',

  yongsinTransit:
    '※ 용신·伏吟/反吟 = 原局·합화 보정 오행 기준.',
} as const

/** 대운 섹션 UI */
export const YUN_DAewoon_UI_NOTES = [
  '※ 칸 나이 = ◆대운 시작 시점 만나이. ◆대운 시작 = 만 N세 생일 + (절기일수−N×3) 나머지(6시=1월·1시=5일·12분=1일·1분=2시간).',
  '※ 노란 칸 = 📍 현재 대운 = 지금 적용 大運(다음 ◆대운 시작 전이면 직전 運 칸). 하늘색 = 세운 보려고 고른 運.',
  '※ 1運 ◆시작 전: 소운 구간 · 대운 하이라이트·📍 없음.',
  YUN_METHOD_NOTES.yongsinTransit,
] as const

/** 세운 섹션 UI (2줄) */
export const YUN_SEWOON_UI_NOTES = [
  '※ 칸 나이 = 생일 시점 만나이(만 N세). 칸 流年 간지 = 해당년 ◆입춘 직후(레퍼런스).',
  '※ 노란 칸 = 📍 현재 세운 = 지금 적용 流年(입춘 전이면 전년도 칸). AI 풀이도 동일.',
  '※ 용신·伏吟/反吟 = 原局·합화 기준.',
] as const

/** 월운 섹션 UI */
export const YUN_MONTHLY_UI_NOTES = [
  '※ 칸 流月 간지 = 그 달 첫 ◆節入 직후(레퍼런스). ·는 中气. 절기 시·분: lunar+KST.',
  '※ 노란 칸 = 📍 현재 월운 = 지금 적용 流月(첫 ◆節入 전이면 전월 칸). AI 풀이도 동일.',
  YUN_METHOD_NOTES.yongsinTransit,
] as const

/** 소운 섹션 UI */
export const YUN_SOUN_UI_NOTES = [
  YUN_METHOD_NOTES.sounCount,
  YUN_METHOD_NOTES.soun,
  '※ 노란 칸 = 📍 현재 소운 = 지금 적용 小運(올해 ◆소운 시작 전이면 직전 연도 칸). 1운 ◆시작 후 소운 없음.',
  YUN_METHOD_NOTES.yongsinTransit,
] as const

/** AI 복사 — 대운 */
export const YUN_DAewoon_EXPORT_NOTES = [
  YUN_AI_NOW_KST_NOTE,
  ...YUN_DAewoon_UI_NOTES,
  '※ **노란 칸 = 📍 현재 대운 = AI 풀이**: 복사 시점 기준. 다음 ◆대운 시작 전까지 **직전 運** 칸 간지·(◆시작 연도).',
  '※ 1運 ◆대운 시작 전: 소운+流年 · 대운 풀이·하이라이트 없음.',
] as const

/** AI 복사 — 세운 */
export const YUN_SEWOON_EXPORT_NOTES = [
  YUN_AI_NOW_KST_NOTE,
  '※ 표: 양력 「연도」 칸. 칸 流年·십신 등 = 해당년 ◆입춘 직후(레퍼런스). ◆입춘 행 시각 참고.',
  '※ **노란 칸 = 📍 현재 세운 = AI 풀이(지금 적용 流年)**: 복사 시점 기준. ◆입춘 전이면 **전년도 칸** 간지·(전년). 입춘 후부터 해당 연도 칸.',
  '※ 예: 2026년 1월 → 노란 칸·📍·풀이 모두 2025년 칸(乙巳·을사). 2026년 칸(丙午)은 입춘 전 적용·하이라이트 없음.',
  '※ 과거·미래 **특정 일자** 풀이도 동일(그 날짜가 입춘 전이면 전년 칸).',
  YUN_METHOD_NOTES.yongsinTransit,
] as const

/** AI 복사 — 월운 */
export const YUN_MONTHLY_EXPORT_NOTES = [
  YUN_AI_NOW_KST_NOTE,
  '※ 표: 양력 「월」 칸. 칸 流月·십신 등 = 그 달 첫 ◆節入 직후(레퍼런스). ·=中气.',
  '※ **노란 칸 = 📍 현재 월운 = AI 풀이(지금 적용 流月)**: 복사 시점 기준. 해당 월 첫 ◆節入 전이면 **전월 칸** 간지·(전년·전월). ◆節入 후 해당 월 칸.',
  '※ 예: 2026년 5월 1일(◆입하 전) → 노란 칸·📍·풀이 모두 4월 칸(壬辰·임진). 5월 칸(癸巳)은 입하 전 적용·하이라이트 없음.',
  '※ 과거·미래 **특정 일자** 풀이도 절기 행 시각과 비교해 동일 규칙.',
  YUN_METHOD_NOTES.yongsinTransit,
] as const

/** AI 복사 — 소운 */
export const YUN_SOUN_EXPORT_NOTES = [
  YUN_AI_NOW_KST_NOTE,
  YUN_METHOD_NOTES.sounCount,
  YUN_METHOD_NOTES.soun,
  '※ **노란 칸 = 📍 현재 소운 = AI 풀이(1운 ◆전)**: 복사 시점 기준. 올해 ◆소운 시작 전이면 **직전 연도** 칸.',
  '※ 1운 ◆대운 시작 후: 소운 구간 종료 — 표는 참고만.',
] as const
