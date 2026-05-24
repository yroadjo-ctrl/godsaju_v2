import type { ReactNode } from 'react'
import { formatCurrentYunLine } from '../../utils/ganzi-display.ts'

interface Props {
  title: ReactNode
  /** 소운 · 대운 · 세운 · 월운 · 일운 */
  yunLabel: string
  currentGanzi?: string | null
}

export default function YunSectionHeading({ title, yunLabel, currentGanzi }: Props) {
  const currentLine = formatCurrentYunLine(yunLabel, currentGanzi)

  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mb-1">
      <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200">{title}</h3>
      {currentLine && (
        <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
          <span className="font-medium font-hanja">{currentLine}</span>
        </span>
      )}
    </div>
  )
}
