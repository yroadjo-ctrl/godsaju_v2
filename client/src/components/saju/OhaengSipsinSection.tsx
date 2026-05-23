import { useState } from 'react'
import type { Element, OhaengSipsinStats, BalanceStatus } from '@core/types'
import OhaengDiagram from './OhaengDiagram.tsx'

interface Props {
  surface: OhaengSipsinStats
  weighted: OhaengSipsinStats
  adjusted: OhaengSipsinStats
}

const STATUS_STYLE: Record<BalanceStatus, string> = {
  발달: 'text-emerald-700 dark:text-emerald-400',
  적정: 'text-blue-700 dark:text-blue-400',
  부족: 'text-amber-700 dark:text-amber-400',
  없음: 'text-gray-400 dark:text-gray-500',
}

const SIPSIN_GROUPS: Array<{ label: string; hanja: string; items: string[] }> = [
  { label: '비겁', hanja: '比劫', items: ['比肩', '劫財'] },
  { label: '식상', hanja: '食傷', items: ['食神', '傷官'] },
  { label: '재성', hanja: '財星', items: ['偏財', '正財'] },
  { label: '관성', hanja: '官星', items: ['偏官', '正官'] },
  { label: '인성', hanja: '印星', items: ['偏印', '正印'] },
]

type TabId = 'surface' | 'weighted' | 'adjusted'

const TABS: { id: TabId; label: string }[] = [
  { id: 'surface', label: '표면 8글자' },
  { id: 'weighted', label: '지장간 가중' },
  { id: 'adjusted', label: '합화 보정' },
]

function elementBarClass(el: Element): string {
  const map: Record<Element, string> = {
    tree: 'bg-[#00C459]',
    fire: 'bg-[#FF0000]',
    earth: 'bg-[#FF9900]',
    metal: 'bg-[#808080]',
    water: 'bg-[#3366FF]',
  }
  return map[el] ?? 'bg-gray-400'
}

function StatusBadge({ status }: { status: BalanceStatus }) {
  if (status === '없음') return <span className="text-gray-400">-</span>
  return <span className={STATUS_STYLE[status]}>{status}</span>
}

function balanceStatusFromPercent(percent: number): BalanceStatus {
  if (percent <= 0) return '없음'
  if (percent >= 20) return '발달'
  if (percent >= 10) return '적정'
  return '부족'
}

function OhaengTable({ stats }: { stats: OhaengSipsinStats }) {
  const sipsinMap = Object.fromEntries(stats.sipsin.map(s => [s.hanja, s]))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">
          오행(五行)
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 border-b border-gray-200 dark:border-gray-700">
              <th className="py-1.5 px-2 text-left font-normal">오행</th>
              <th className="py-1.5 px-2 text-right font-normal">비율</th>
              <th className="py-1.5 px-2 text-center font-normal w-14">상태</th>
            </tr>
          </thead>
          <tbody>
            {stats.elements.map(el => (
              <tr key={el.element} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                <td className="py-2 px-2">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block w-2 h-2 rounded-sm ${elementBarClass(el.element)}`} />
                    <span className="font-medium">{el.label}({el.hanja})</span>
                  </div>
                  <div className="mt-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${elementBarClass(el.element)}`}
                      style={{ width: `${Math.min(el.percent, 100)}%` }}
                    />
                  </div>
                </td>
                <td className="py-2 px-2 text-right font-mono text-gray-700 dark:text-gray-300">
                  {el.percent > 0 ? `${el.percent}%` : '-'}
                </td>
                <td className="py-2 px-2 text-center">
                  <StatusBadge status={el.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">
          십성 <span className="font-hanja">(十星)</span>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 border-b border-gray-200 dark:border-gray-700">
              <th className="py-1.5 px-2 text-left font-normal">십성</th>
              <th className="py-1.5 px-2 text-right font-normal">비율</th>
              <th className="py-1.5 px-2 text-center font-normal w-14">상태</th>
            </tr>
          </thead>
          <tbody>
            {SIPSIN_GROUPS.map(group => (
              <tr key={group.hanja} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                <td className="py-2 px-2 align-top">
                  <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {group.label}({group.hanja})
                  </div>
                  {group.items.map(hanja => {
                    const s = sipsinMap[hanja]
                    if (!s) return null
                    return (
                      <div key={hanja} className="flex items-center justify-between gap-2 text-gray-600 dark:text-gray-400 mb-0.5">
                        <span>{s.hangul}({s.hanja})</span>
                        <span className="font-mono shrink-0">{s.percent > 0 ? `${s.percent}%` : '-'}</span>
                      </div>
                    )
                  })}
                </td>
                <td className="py-2 px-2 text-right align-top font-mono text-gray-700 dark:text-gray-300">
                  {(() => {
                    const sum = group.items.reduce((acc, h) => acc + (sipsinMap[h]?.percent ?? 0), 0)
                    return sum > 0 ? `${Math.round(sum * 10) / 10}%` : '-'
                  })()}
                </td>
                <td className="py-2 px-2 text-center align-top">
                  <StatusBadge
                    status={balanceStatusFromPercent(
                      group.items.reduce((acc, h) => acc + (sipsinMap[h]?.percent ?? 0), 0),
                    )}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function OhaengSipsinSection({ surface, weighted, adjusted }: Props) {
  const [tab, setTab] = useState<TabId>('weighted')
  const stats = tab === 'surface' ? surface : tab === 'weighted' ? weighted : adjusted

  return (
    <section>
      <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-1">
        오행 · 십성 <span className="font-hanja">(五行 · 十星)</span> 분석
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        일간 <span className="font-hanja font-medium">{stats.dayStemKor}({stats.dayStem})</span>
        {' '}{stats.dayElementLabel} · {stats.basisLabel ?? '원국 기준'}
      </p>

      <div className="flex flex-wrap gap-1 mb-3">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
              tab === t.id
                ? 'bg-gray-800 text-white border-gray-800 dark:bg-gray-100 dark:text-gray-900'
                : 'bg-white text-gray-600 border-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <OhaengTable stats={stats} />
      <OhaengDiagram stats={stats} />

      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
        ※ 발달(20%↑)·적정(10~20%)·부족(10%↓).
        지장간 가중은 本气60·中气30·余气10%, 합화는 월령·충파 기준 성립 시 반영.
      </p>
    </section>
  )
}
