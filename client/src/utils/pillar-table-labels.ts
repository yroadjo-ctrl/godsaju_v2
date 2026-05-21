/** 사주원국표 행·구분 라벨 (한글 + 한자) */
export interface PillarRowLabel {
  kor: string
  hanja: string
}

export const PILLAR_TABLE_LABELS = {
  category: { kor: '구분', hanja: '區分' },
  stem: { kor: '천간', hanja: '天干' },
  sipsin: { kor: '십성', hanja: '十星' },
  branch: { kor: '지지', hanja: '地支' },
  jigang: { kor: '지장간', hanja: '地藏干' },
  unseong: { kor: '12운성', hanja: '十二運星' },
  nayeon: { kor: '나음', hanja: '納音' },
  sinsal: { kor: '12신살', hanja: '十二神殺' },
  guiin: { kor: '귀인', hanja: '貴人' },
  gongmang: { kor: '공망', hanja: '空亡' },
} as const satisfies Record<string, PillarRowLabel>

/** AI 복사 마크다운 표 셀용 */
export function pillarLabelForExport(label: PillarRowLabel): string {
  return `${label.kor}<br>(${label.hanja})`
}
