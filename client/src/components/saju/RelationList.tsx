import { useMemo, useState } from 'react'
import type { AllRelations, RelationResult } from '@core/types'
import { ELEMENT_HANJA } from '@core/constants'
import {
  buildRelationsSummaryLine,
  RELATION_TABS,
  collectRelationListItems,
  formatRelationListItem,
  countByTab,
  type RelationTabId,
  type RelationListItem,
} from '@core/index'

interface Props {
  relations: AllRelations
  pillars: string[]  // 간지 [시, 일, 월, 년]
}

function getTagStyle(type: string): string {
  if (type === '合' || type === '半合' || type === '三合' || type === '方合')
    return 'bg-[#00C459] text-white'
  if (type === '沖')
    return 'bg-[#FF0000] text-white'
  if (type === '刑')
    return 'bg-[#CC00CC] text-white'
  if (type === '破' || type === '害')
    return 'bg-[#FF9900] text-white'
  if (type === '怨嗔' || type === '鬼門')
    return 'bg-[#FFCCFF] text-[#660066]'
  return 'bg-gray-200 text-gray-700'
}

function formatTag(r: RelationResult, char1: string, char2: string): { text: string; style: string } {
  const detail = r.detail && ELEMENT_HANJA[r.detail]
    ? ELEMENT_HANJA[r.detail]
    : r.detail ? `(${r.detail})` : ''
  return {
    text: `${char1}${char2} ${r.type}${detail}`,
    style: getTagStyle(r.type),
  }
}

const COL_ORDER = [0, 1, 2, 3]
const COL_LABELS = ['時柱', '日柱', '月柱', '年柱']
const ROW_ORDER = [3, 2, 1, 0]
const ROW_LABELS = ['年柱', '月柱', '日柱', '時柱']

function pairKey(a: number, b: number): string {
  return `${Math.min(a, b)},${Math.max(a, b)}`
}

function RelationTabList({ items }: { items: RelationListItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
        해당 관계 없음
      </p>
    )
  }

  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li
          key={i}
          className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
        >
          <span
            className={`inline-flex self-start px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap ${getTagStyle(item.type)}`}
          >
            {item.type}
          </span>
          <div className="text-sm text-gray-700 dark:text-gray-300 min-w-0">
            <p className="font-medium break-words">{formatRelationListItem(item)}</p>
            {item.note && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.note}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

export default function RelationList({ relations, pillars }: Props) {
  const [activeTab, setActiveTab] = useState<RelationTabId>('all')

  const listItems = useMemo(
    () => collectRelationListItems(relations, pillars),
    [relations, pillars],
  )
  const tabCounts = useMemo(() => countByTab(listItems), [listItems])

  function getCellTags(rowIdx: number, colIdx: number) {
    const key = pairKey(rowIdx, colIdx)
    const rel = relations.pairs.get(key)
    if (!rel) return []

    const tags: Array<{ text: string; style: string }> = []
    for (const r of rel.stem) {
      tags.push(formatTag(r, pillars[rowIdx][0], pillars[colIdx][0]))
    }
    for (const r of rel.branch) {
      tags.push(formatTag(r, pillars[rowIdx][1], pillars[colIdx][1]))
    }
    return tags
  }

  const multiTags: Array<{ text: string; style: string }> = []
  for (const rel of relations.triple) {
    const el = rel.detail && ELEMENT_HANJA[rel.detail] ? ELEMENT_HANJA[rel.detail] : ''
    multiTags.push({ text: `${rel.type}${el}局`, style: getTagStyle('三合') })
  }
  for (const rel of relations.directional) {
    const el = rel.detail && ELEMENT_HANJA[rel.detail] ? ELEMENT_HANJA[rel.detail] : ''
    multiTags.push({ text: `${rel.type}${el}`, style: getTagStyle('方合') })
  }

  const hasAny = ROW_ORDER.some(ri =>
    COL_ORDER.some(ci => ri !== ci && getCellTags(ri, ci).length > 0),
  ) || multiTags.length > 0 || listItems.length > 0
  if (!hasAny) return null

  const summaryLine = buildRelationsSummaryLine(relations, pillars)
  const filteredItems = activeTab === 'all'
    ? []
    : listItems.filter(item => item.tab === activeTab)

  return (
    <section>
      <h3 className="text-base font-medium text-gray-700 dark:text-gray-200 mb-1">
        合沖刑破害(四柱原局)
      </h3>
      {summaryLine && (
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 leading-relaxed break-words">
          <span className="font-medium text-gray-500 dark:text-gray-500">요약 </span>
          {summaryLine}
        </p>
      )}

      <div className="flex flex-wrap gap-1 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">
        {RELATION_TABS.map(tab => {
          const count = tab.id === 'all'
            ? listItems.length
            : tabCounts[tab.id]
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
              <span className="opacity-70 ml-0.5">({count})</span>
            </button>
          )
        })}
      </div>

      {activeTab !== 'all' ? (
        <RelationTabList items={filteredItems} />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm table-fixed">
              <colgroup>
                <col className="w-14" />
                {COL_ORDER.map((_, c) => <col key={c} />)}
              </colgroup>
              <thead>
                <tr>
                  <th className="border border-slate-200 bg-slate-50 p-1.5 text-center text-xs text-slate-400 dark:bg-slate-800"></th>
                  {COL_ORDER.map((colPillarIdx, c) => (
                    <th
                      key={c}
                      className="border border-slate-200 bg-slate-50 p-1.5 text-center text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {COL_LABELS[c]}
                      <div className="text-[10px] font-normal text-slate-400 mt-0.5">
                        {pillars[colPillarIdx]}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROW_ORDER.map((rowPillarIdx, r) => (
                  <tr key={r}>
                    <td className="border border-slate-200 bg-slate-50 p-1.5 text-center text-xs font-semibold text-slate-600 whitespace-nowrap dark:bg-slate-800 dark:text-slate-300">
                      {ROW_LABELS[r]}
                      <div className="text-[10px] font-normal text-slate-400 mt-0.5">
                        {pillars[rowPillarIdx]}
                      </div>
                    </td>
                    {COL_ORDER.map((colPillarIdx, c) => {
                      if (rowPillarIdx === colPillarIdx) {
                        return (
                          <td key={c} className="border border-slate-200 bg-slate-100 p-1.5 text-center text-slate-300 dark:bg-slate-900">
                            —
                          </td>
                        )
                      }
                      const tags = getCellTags(rowPillarIdx, colPillarIdx)
                      return (
                        <td
                          key={c}
                          className="border border-slate-200 bg-white p-1.5 text-center align-top dark:bg-slate-900"
                        >
                          {tags.length > 0 ? (
                            <div className="flex flex-col gap-0.5 items-center">
                              {tags.map((tag, ti) => (
                                <span
                                  key={ti}
                                  className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-bold whitespace-nowrap ${tag.style}`}
                                >
                                  {tag.text}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-300 text-xs">-</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {multiTags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5 items-center">
              <span className="text-xs text-slate-500 mr-1">3자 관계:</span>
              {multiTags.map((tag, i) => (
                <span
                  key={i}
                  className={`inline-block px-2 py-0.5 rounded text-sm font-bold ${tag.style}`}
                >
                  {tag.text}
                </span>
              ))}
            </div>
          )}
        </>
      )}

      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-[#00C459]"></span>합(合)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-[#FF0000]"></span>충(沖)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-[#CC00CC]"></span>형(刑)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-[#FF9900]"></span>파(破)/해(害)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-[#FFCCFF]"></span>원진/귀문
        </span>
      </div>
    </section>
  )
}
