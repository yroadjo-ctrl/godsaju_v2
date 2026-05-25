import { ziweiKor } from '../../utils/ziwei-labels.ts'

interface LabelProps {
  text: string
  className?: string
  hanjaClassName?: string
}

/** 한글(한자) — 한 줄 */
export function ZiweiInline({ text, className = '', hanjaClassName = 'font-hanja text-gray-500 dark:text-gray-400' }: LabelProps) {
  const kor = ziweiKor(text)
  if (!kor) {
    return <span className={`font-hanja ${className}`}>{text}</span>
  }
  return (
    <span className={className}>
      {kor}
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
