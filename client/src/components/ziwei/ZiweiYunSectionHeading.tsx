import type { LiuNianInfo, ZiweiChart } from '@core/types'
import { formatZiweiCurrentYunLine } from '../../utils/ziwei-liunian-export.ts'
import { getActiveDaxianToday } from '../../utils/ziwei-yun-period.ts'

interface Props {
  chart: ZiweiChart
  liunian: LiuNianInfo
  className?: string
}

/** 사주 YunSectionHeading과 동일 — 현재 大限 · 流年 한 줄 */
export default function ZiweiYunSectionHeading({ chart, liunian, className = '' }: Props) {
  const activeDaxian = getActiveDaxianToday(chart)
  const line = formatZiweiCurrentYunLine(liunian, activeDaxian)

  return (
    <p className={`text-sm text-gray-600 dark:text-gray-400 mb-3 ${className}`}>
      <span className="font-medium">{line}</span>
    </p>
  )
}
