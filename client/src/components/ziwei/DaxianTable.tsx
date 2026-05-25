import { useRef, useEffect } from 'react'
import type { ZiweiChart } from '@core/types'
import { getManAge } from '@core/age'
import { getDaxianList } from '@core/ziwei'
import { stemSolidBgClass, branchSolidBgClass } from '../../utils/format.ts'
import { ZiweiInline, ZiweiStacked, ZiweiSectionTitleKey } from './ZiweiLabel.tsx'

interface Props {
  chart: ZiweiChart
}

function findActiveDaxianIndex(
  daxianList: Array<{ ageStart: number; ageEnd: number }>,
  birthYear: number,
  birthMonth: number,
  birthDay: number,
): number {
  const currentAge = getManAge(birthYear, birthMonth, birthDay, new Date())
  for (let i = daxianList.length - 1; i >= 0; i--) {
    if (currentAge >= daxianList[i].ageStart) return i
  }
  return -1
}

export default function DaxianTable({ chart }: Props) {
  const daxianList = getDaxianList(chart)
  const activeIdx = findActiveDaxianIndex(daxianList, chart.solarYear, chart.solarMonth, chart.solarDay)
  const activeRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current
      const el = activeRef.current
      container.scrollLeft = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2
    }
  }, [activeIdx])

  return (
    <section>
      <ZiweiSectionTitleKey text="大限" className="mb-2" />
      <div ref={scrollRef} className="overflow-x-auto py-1">
        <div className="flex flex-row-reverse gap-1 w-fit">
          {daxianList.map((dx, i) => {
            const isActive = i === activeIdx
            const gan = dx.ganZhi[0]
            const zhi = dx.ganZhi[1]
            return (
              <div
                key={i}
                ref={isActive ? activeRef : undefined}
                className={`flex flex-col items-center gap-0.5 rounded-lg px-1 py-1 min-w-[52px] ${isActive ? 'ring-2 ring-amber-400 dark:ring-amber-500 bg-amber-50 dark:bg-amber-950' : ''}`}
              >
                <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                  {dx.ageStart}-{dx.ageEnd}歲
                </span>
                <ZiweiStacked text={dx.palaceName} />
                <span className={`inline-flex items-center justify-center w-8 h-8 leading-none text-base font-hanja rounded pb-[2px] ${stemSolidBgClass(gan)}`}>
                  {gan}
                </span>
                <span className={`inline-flex items-center justify-center w-8 h-8 leading-none text-base font-hanja rounded pb-[2px] ${branchSolidBgClass(zhi)}`}>
                  {zhi}
                </span>
                {dx.mainStars.length > 0 ? (
                  <div className="text-center leading-tight mt-0.5 space-y-0.5">
                    {dx.mainStars.map(s => (
                      <div key={s}>
                        <ZiweiStacked text={s} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-0.5">
                    <ZiweiStacked text="空宮" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
