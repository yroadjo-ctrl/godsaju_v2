import type { AllRelations, RelationResult } from '@core/types'
import { ELEMENT_HANJA } from '@core/constants'

interface Props {
  relations: AllRelations
  pillars: string[]  // 간지 [시, 일, 월, 년] (원래 인덱스 순서 유지)
}

// 관계 타입별 배지 색상 (일운 테두리 색상과 동일 기준)
// 합=초록, 충=빨강, 형=자주, 파/해=주황, 원진/귀문=보라
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
    return 'bg-[#9900CC] text-white'
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

// 기둥 표시 순서: 년(3) → 월(2) → 일(1) → 시(0)
const COL_ORDER = [3, 2, 1, 0]
const COL_LABELS = ['年柱', '月柱', '日柱', '時柱']

// 쌍 키는 항상 작은 인덱스,큰 인덱스 형태 (예: "0,3")
function pairKey(a: number, b: number): string {
  return `${Math.min(a, b)},${Math.max(a, b)}`
}

export default function RelationList({ relations, pillars }: Props) {
  // 각 셀(row, col)에 들어갈 태그 계산
  // 매트릭스: row=COL_ORDER[r], col=COL_ORDER[c], col > row 인 상삼각형만 사용
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

  // 삼합/방합 태그
  const multiTags: Array<{ text: string; style: string }> = []
  for (const rel of relations.triple) {
    const el = rel.detail && ELEMENT_HANJA[rel.detail] ? ELEMENT_HANJA[rel.detail] : ''
    multiTags.push({ text: `${rel.type}${el}局`, style: getTagStyle('三合') })
  }
  for (const rel of relations.directional) {
    const el = rel.detail && ELEMENT_HANJA[rel.detail] ? ELEMENT_HANJA[rel.detail] : ''
    multiTags.push({ text: `${rel.type}${el}`, style: getTagStyle('方合') })
  }

  // 관계가 하나도 없으면 렌더링 안 함
  const hasAny = COL_ORDER.some((ri, r) =>
    COL_ORDER.some((ci, c) => c > r && getCellTags(ri, ci).length > 0)
  ) || multiTags.length > 0
  if (!hasAny) return null

  return (
    <section>
      <h3 className="text-base font-medium text-gray-700 mb-3">八字關係</h3>

      {/* 매트릭스 표 */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {/* 좌상단 빈 헤더 */}
              <th className="w-16 border border-slate-200 bg-slate-50 p-1.5 text-center text-xs text-slate-500"></th>
              {COL_LABELS.map((label, c) => (
                <th
                  key={c}
                  className="border border-slate-200 bg-slate-50 p-1.5 text-center text-xs font-semibold text-slate-600 whitespace-nowrap"
                >
                  {label}
                  <div className="text-[10px] font-normal text-slate-400 mt-0.5">
                    {pillars[COL_ORDER[c]]}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COL_ORDER.map((rowPillarIdx, r) => (
              <tr key={r}>
                {/* 행 헤더 */}
                <td className="border border-slate-200 bg-slate-50 p-1.5 text-center text-xs font-semibold text-slate-600 whitespace-nowrap">
                  {COL_LABELS[r]}
                  <div className="text-[10px] font-normal text-slate-400 mt-0.5">
                    {pillars[rowPillarIdx]}
                  </div>
                </td>
                {COL_ORDER.map((colPillarIdx, c) => {
                  // 대각선 (자기 자신)
                  if (c === r) {
                    return (
                      <td key={c} className="border border-slate-200 bg-slate-100 p-1.5 text-center text-slate-300">
                        —
                      </td>
                    )
                  }
                  // 하삼각형: 상삼각형과 동일 데이터이므로 미러링
                  const isUpper = c > r
                  const riIdx = isUpper ? rowPillarIdx : colPillarIdx
                  const ciIdx = isUpper ? colPillarIdx : rowPillarIdx
                  const tags = getCellTags(riIdx, ciIdx)

                  return (
                    <td
                      key={c}
                      className={`border border-slate-200 p-1.5 text-center align-middle ${
                        isUpper ? 'bg-white' : 'bg-slate-50'
                      }`}
                    >
                      {tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1 justify-center">
                          {tags.map((tag, ti) => (
                            <span
                              key={ti}
                              className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-bold ${tag.style}`}
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

      {/* 삼합 / 방합 (3글자 관계) */}
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

      {/* 색상 범례 */}
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
          <span className="inline-block w-3 h-3 rounded bg-[#9900CC]"></span>원진/귀문
        </span>
      </div>
    </section>
  )
}
