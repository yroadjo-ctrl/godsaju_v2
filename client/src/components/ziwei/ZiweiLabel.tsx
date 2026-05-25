import { ziweiKor } from '../../utils/ziwei-labels.ts'

interface LabelProps {
  text: string
  className?: string
  korClassName?: string
  hanjaClassName?: string
}

/** 한글(한자) — 한 줄 */
export function ZiweiInline({ text, className = '', korClassName, hanjaClassName = 'font-hanja text-gray-500 dark:text-gray-400' }: LabelProps) {
  const kor = ziweiKor(text)
  if (!kor) {
    return <span className={`font-hanja ${className}`}>{text}</span>
  }
  return (
    <span className={className}>
      {korClassName ? <span className={korClassName}>{kor}</span> : kor}
      <span className={hanjaClassName}>({text})</span>
    </span>
  )
}

/** 한글 / (한자) — 두 줄 (대한표 등 좁은 칸) */
export function ZiweiStacked({ text, className = '' }: LabelProps) {
  const kor = ziweiKor(text)
  if (!kor) {
    return <span className={`font-hanja text-xs ${className}`}>{text}</span>
  }
  return (
    <span className={`inline-block text-center leading-tight ${className}`}>
      <span className="block text-xs">{kor}</span>
      <span className="block font-hanja text-[10px] text-gray-500 dark:text-gray-400">({text})</span>
    </span>
  )
}

/** 사주 섹션 타이틀과 동일 — text-lg font-bold */
export const ZIWEI_SECTION_TITLE = 'text-lg font-bold text-gray-700 dark:text-gray-200'

interface SectionTitleProps {
  kor: string
  hanja: string
  as?: 'h2' | 'h3'
  className?: string
}

/** 섹션 타이틀 — 예: 사화 (四化) */
export function ZiweiSectionTitle({ kor, hanja, as: Tag = 'h3', className = '' }: SectionTitleProps) {
  return (
    <Tag className={`${ZIWEI_SECTION_TITLE} ${className}`.trim()}>
      {kor} <span className="font-hanja">({hanja})</span>
    </Tag>
  )
}

/** 매핑 키(한자)로 섹션 타이틀 */
export function ZiweiSectionTitleKey({ text, as = 'h3', className = '' }: { text: string; as?: 'h2' | 'h3'; className?: string }) {
  const kor = ziweiKor(text)
  return <ZiweiSectionTitle kor={kor ?? text} hanja={text} as={as} className={className} />
}
