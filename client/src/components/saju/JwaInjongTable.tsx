import type { JwaEntry, InjongEntry, PillarDetail } from '@core/types'
import { stemColorClass } from '../../utils/format.ts'

interface Props {
  jwabeop: JwaEntry[][]    // [시=0, 일=1, 월=2, 년=3]
  injongbeop: InjongEntry[]
  pillars: PillarDetail[]  // [시, 일, 월, 년]
  unknownTime?: boolean
}

const CATEGORIES = ['比劫', '食傷', '財星', '官星', '印星'] as const
type Category = (typeof CATEGORIES)[number]

const CATEGORY_KOR: Record<Category, string> = {
  比劫: '비겁', 食傷: '식상', 財星: '재성', 官星: '관성', 印星: '인성',
}

const SIPSIN_TO_CATEGORY: Record<string, Category> = {
  比肩: '比劫', 劫財: '比劫',
  食神: '食傷', 傷官: '食傷',
  偏財: '財星', 正財: '財星',
  偏官: '官星', 正官: '官星',
  偏印: '印星', 正印: '印星',
}

const SIPSIN_KOR: Record<string, string> = {
  比肩: '비견', 劫財: '겁재',
  食神: '식신', 傷官: '상관',
  偏財: '편재', 正財: '정재',
  偏官: '편관', 正官: '정관',
  偏印: '편인', 正印: '정인',
}

// 표시 순서: 年→月→日→時 (jwabeop 인덱스: 년=3, 월=2, 일=1, 시=0)
const PILLAR_DISPLAY = [
  { label: '年柱', idx: 3 },
  { label: '月柱', idx: 2 },
  { label: '日柱', idx: 1 },
  { label: '時柱', idx: 0 },
] as const

export default function JwaInjongTable({ jwabeop, injongbeop, pillars, unknownTime }: Props) {
  const dayBranch = pillars[1].pillar.branch

  // 카테고리별 맵: pillarIdx → category → JwaEntry[]
  const catMap: Record<number, Partial<Record<Category, JwaEntry[]>>> = {}
  jwabeop.forEach((entries, pi) => {
    catMap[pi] = {}
    entries.forEach(entry => {
      const cat = SIPSIN_TO_CATEGORY[entry.sipsin]
      if (cat) {
        const arr = catMap[pi][cat]
        if (arr) arr.push(entry)
        else catMap[pi][cat] = [entry]
      }
    })
  })

  // 인종법 맵: category → InjongEntry
  const injongMap: Partial<Record<Category, InjongEntry>> = {}
  injongbeop.forEach(e => { injongMap[e.category as Category] = e })

  return (
    <section>
      <h3 className="text-base font-medium text-gray-700 dark:text-gray-200 mb-1">坐法 · 引從法</h3>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
        日支 <span className="font-hanja font-medium text-gray-600 dark:text-gray-300">{dayBranch}</span> 기준 지장간 12운성
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-center text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 text-xs text-gray-500">
              <th className="py-1.5 px-2 text-left font-medium border border-gray-200 dark:border-gray-700 w-16">
                십성
              </th>
              {PILLAR_DISPLAY.map(({ label, idx }) => {
                const branch = pillars[idx].pillar.branch
                const isUnknown = label === '時柱' && unknownTime
                return (
                  <th key={label} className="py-1.5 px-1 font-medium border border-gray-200 dark:border-gray-700">
                    <div>{label}</div>
                    <div className="font-hanja text-sm text-gray-700 dark:text-gray-300 mt-0.5">
                      {isUnknown ? '?' : branch}
                    </div>
                  </th>
                )
              })}
              <th className="py-1.5 px-1 font-medium text-blue-500 border border-gray-200 dark:border-gray-700 w-20">
                引從法
              </th>
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map(cat => {
              const injong = injongMap[cat]
              return (
                <tr key={cat}>
                  <td className="py-2 px-2 text-left border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <div className="font-medium text-gray-700 dark:text-gray-300">{CATEGORY_KOR[cat]}</div>
                    <div className="font-hanja text-gray-400 dark:text-gray-500">({cat})</div>
                  </td>
                  {PILLAR_DISPLAY.map(({ label, idx }) => {
                    const isUnknown = label === '時柱' && unknownTime
                    if (isUnknown) {
                      return (
                        <td key={label} className="py-2 px-1 text-gray-300 dark:text-gray-600 border border-gray-200 dark:border-gray-700">-</td>
                      )
                    }
                    const entries = catMap[idx]?.[cat] ?? []
                    if (entries.length === 0) {
                      return (
                        <td key={label} className="py-2 px-1 text-gray-300 dark:text-gray-600 border border-gray-200 dark:border-gray-700">-</td>
                      )
                    }
                    return (
                      <td key={label} className="py-2 px-1 border border-gray-200 dark:border-gray-700">
                        {entries.map((entry, ei) => (
                          <div key={ei} className="leading-snug">
                            <span className={`font-hanja font-semibold ${stemColorClass(entry.stem)}`}>{entry.stem}</span>
                            {' '}
                            <span className="text-gray-500 dark:text-gray-400 font-hanja">
                              {SIPSIN_KOR[entry.sipsin]
                                ? `${SIPSIN_KOR[entry.sipsin]}(${entry.sipsin})`
                                : entry.sipsin}
                            </span>
                            <div className="text-gray-500 dark:text-gray-400 font-hanja">{entry.unseong}坐</div>
                          </div>
                        ))}
                      </td>
                    )
                  })}
                  <td className="py-2 px-1 border border-gray-200 dark:border-gray-700">
                    {injong ? (
                      <div className="leading-snug">
                        <span className={`font-hanja font-semibold ${stemColorClass(injong.yangStem)}`}>{injong.yangStem}</span>
                        <div className="text-blue-500 font-hanja">{injong.unseong}從</div>
                      </div>
                    ) : (
                      <span className="text-gray-300 dark:text-gray-600">-</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
        坐: 지장간이 일지(日支)에서의 12운성 · 從: 사주에 없는 십성이 일지에서의 12운성
      </p>
    </section>
  )
}
