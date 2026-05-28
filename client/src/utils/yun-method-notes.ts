/** 대운·세운·월운·일운 계산 방식 안내 (UI · AI 복사 공통) */
export const YUN_METHOD_NOTES = {
  hybrid:
    '※ 연·월 숫자는 양력 기준. 간지·合冲·용신 등 풀이 데이터는 사주원국과 동일(입춘·12節). 전환 시점은 ◆절기 행 참고.',

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
    '※ 월(1~12)은 양력. 월운 간지(流月)는 12節(節入) 기준 — 원국 월주와 동일. ◆표시가 節入(월령 전환), ·는 중气. 절기 시·분: lunar+KST.',

  daily:
    '※ 일진은 원국과 동일. 달력은 양력, 절기 시·분은 lunar+KST.',

  sounCount:
    '※ 소운 칸 수 = 1운 startDate 연도 − 출생 연도. 칸 나이 = ◆시작(생일) 시점 만나이.',

  soun:
    '※ 小運: 时柱(月柱) 기준 · 阳男阴女順·阴男阳女逆 · 간지 교체 = 매년 생일(◆시작).',

  yongsinTransit:
    '※ 용신·伏吟/反吟 = 原局·합화 보정 오행 기준.',
} as const

/** 대운 섹션 UI (3줄) */
export const YUN_DAewoon_UI_NOTES = [
  '※ 칸 나이 = ◆시작 시점 만나이(생일 기준). ◆시작 = 만 N세 생일 + (절기일수−N×3) 나머지(6시=1월·1시=5일·12분=1일·1분=2시간).',
  '※ 월주(12節) 순·역행 · 절기(lunar+KST) · 3일=1년(반올림) · 교체 = ◆시작 행.',
  '※ 1運 첫해: 입춘~◆시작 전 소운+流年 · 이후 大運+流年 · 용신·伏吟/反吟 = 原局·합화 기준.',
] as const

/** 세운 섹션 UI (2줄) */
export const YUN_SEWOON_UI_NOTES = [
  '※ 칸 나이 = ◆시작(생일) 시점 만나이. 세운 간지(流年)는 1/1 기준 연간지. 칸 교체 = 매년 생일(◆시작).',
  '※ 용신·伏吟/反吟 = 原局·합화 기준.',
] as const

/** 소운 섹션 UI (3줄) */
export const YUN_SOUN_UI_NOTES = [
  YUN_METHOD_NOTES.sounCount,
  YUN_METHOD_NOTES.soun,
  YUN_METHOD_NOTES.yongsinTransit,
] as const

/** AI 복사 — 대운 */
export const YUN_DAewoon_EXPORT_NOTES = YUN_DAewoon_UI_NOTES

/** AI 복사 — 세운 */
export const YUN_SEWOON_EXPORT_NOTES = YUN_SEWOON_UI_NOTES

/** AI 복사 — 소운 (yongsinTransit 제외 — 표 아래 별도 행) */
export const YUN_SOUN_EXPORT_NOTES = [
  YUN_METHOD_NOTES.sounCount,
  YUN_METHOD_NOTES.soun,
] as const
