import type { Element, OhaengSipsinStats } from '@core/types'

interface Props {
  stats: OhaengSipsinStats
}

/** 오행 순서: 상(목)→우(화)→우하(토)→좌하(금)→좌(수) — 생(生) 순환 */
const NODES: Array<{ element: Element; sipsinKor: string; sipsinHanja: string }> = [
  { element: 'tree', sipsinKor: '비겁', sipsinHanja: '比劫' },
  { element: 'fire', sipsinKor: '식상', sipsinHanja: '食傷' },
  { element: 'earth', sipsinKor: '재성', sipsinHanja: '財星' },
  { element: 'metal', sipsinKor: '관성', sipsinHanja: '官星' },
  { element: 'water', sipsinKor: '인성', sipsinHanja: '印星' },
]

const ELEMENT_FILL: Record<Element, string> = {
  tree: '#00C459',
  fire: '#FF0000',
  earth: '#FF9900',
  metal: '#808080',
  water: '#3366FF',
}

const ELEMENT_BG: Record<Element, string> = {
  tree: '#e8f8ef',
  fire: '#ffe8e8',
  earth: '#fff4e0',
  metal: '#f0f0f0',
  water: '#e8f0ff',
}

const CX = 150
const CY = 138
const RING_R = 88
const CIRCLE_R = 36

const SAENG_COLOR = '#3366FF'
const GEUK_COLOR = '#FF0000'

const ARROW_HEAD_LEGEND = { w: 7, h: 7, refX: 6, refY: 3.5, d: 'M0,0 L7,3.5 L0,7 Z' } as const
const ARROW_HEAD_DIAGRAM = { w: 10, h: 10, refX: 9, refY: 5, d: 'M0,0 L10,5 L0,10 Z' } as const

/** 剋(剋) 순서: 목→토→수→화→금→목 (인덱스) */
const GEUK_EDGES = [[0, 2], [2, 4], [4, 1], [1, 3], [3, 0]] as const

function nodePositions(): Array<{ x: number; y: number }> {
  return NODES.map((_, i) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / 5
    return {
      x: CX + RING_R * Math.cos(angle),
      y: CY + RING_R * Math.sin(angle),
    }
  })
}

function shorten(x1: number, y1: number, x2: number, y2: number, margin: number) {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  return {
    x1: x1 + ux * margin,
    y1: y1 + uy * margin,
    x2: x2 - ux * margin,
    y2: y2 - uy * margin,
  }
}

function LegendArrow({ color, markerId }: { color: string; markerId: string }) {
  const { w, h, refX, refY, d } = ARROW_HEAD_LEGEND
  return (
    <svg width="28" height="10" viewBox="0 0 28 10" className="inline-block shrink-0" aria-hidden>
      <defs>
        <marker
          id={markerId}
          markerWidth={w}
          markerHeight={h}
          refX={refX}
          refY={refY}
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path d={d} fill={color} />
        </marker>
      </defs>
      <line
        x1="1"
        y1="5"
        x2="24"
        y2="5"
        stroke={color}
        strokeWidth="2"
        markerEnd={`url(#${markerId})`}
      />
    </svg>
  )
}

function ArrowMarkerDef({ id, color }: { id: string; color: string }) {
  const { w, h, refX, refY, d } = ARROW_HEAD_DIAGRAM
  return (
    <marker
      id={id}
      markerWidth={w}
      markerHeight={h}
      refX={refX}
      refY={refY}
      orient="auto"
      markerUnits="userSpaceOnUse"
    >
      <path d={d} fill={color} />
    </marker>
  )
}

export default function OhaengDiagram({ stats }: Props) {
  const elMap = Object.fromEntries(stats.elements.map(e => [e.element, e]))
  const pts = nodePositions()
  const edgeMargin = CIRCLE_R + 6

  return (
    <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/80 dark:bg-gray-800/40 p-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          나의 오행:{' '}
          <span className="font-hanja">
            {stats.dayStemKor}
            {elMap[stats.dayElement]?.label ?? ''}
          </span>
          <span className="text-gray-500 font-normal text-xs ml-1">
            ({stats.dayStemKor}({stats.dayStem}) {stats.dayElementLabel})
          </span>
        </p>
        <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <LegendArrow color={SAENG_COLOR} markerId="legend-saeng" />
            생(生)
          </span>
          <span className="flex items-center gap-1">
            <LegendArrow color={GEUK_COLOR} markerId="legend-geuk" />
            극(剋)
          </span>
        </div>
      </div>

      <svg
        viewBox="0 0 300 276"
        className="w-full max-w-[320px] mx-auto block"
        role="img"
        aria-label="오행 생극 관계도"
      >
        <defs>
          <ArrowMarkerDef id="arrow-saeng" color={SAENG_COLOR} />
          <ArrowMarkerDef id="arrow-geuk" color={GEUK_COLOR} />
          {pts.map((p, i) => (
            <clipPath key={`clip-${i}`} id={`ohaeng-clip-${i}`}>
              <circle cx={p.x} cy={p.y} r={CIRCLE_R} />
            </clipPath>
          ))}
        </defs>

        {/* 극(剋) — 빨간 내부 별 */}
        {GEUK_EDGES.map(([from, to], i) => {
          const a = pts[from]
          const b = pts[to]
          const s = shorten(a.x, a.y, b.x, b.y, CIRCLE_R + 4)
          return (
            <line
              key={i}
              x1={s.x1}
              y1={s.y1}
              x2={s.x2}
              y2={s.y2}
              stroke={GEUK_COLOR}
              strokeWidth="2"
              markerEnd="url(#arrow-geuk)"
              opacity={0.8}
            />
          )
        })}

        {/* 오행 원 5개 */}
        {NODES.map((node, i) => {
          const el = elMap[node.element]
          const pct = el?.percent ?? 0
          const { x, y } = pts[i]
          const fillH = (pct / 100) * (CIRCLE_R * 2)
          const fillY = y + CIRCLE_R - fillH

          return (
            <g key={node.element}>
              <circle cx={x} cy={y} r={CIRCLE_R} fill={ELEMENT_BG[node.element]} />
              {pct > 0 && (
                <g clipPath={`url(#ohaeng-clip-${i})`}>
                  <rect
                    x={x - CIRCLE_R}
                    y={fillY}
                    width={CIRCLE_R * 2}
                    height={fillH + 1}
                    fill={ELEMENT_FILL[node.element]}
                    opacity={0.42}
                  />
                </g>
              )}
              <circle
                cx={x}
                cy={y}
                r={CIRCLE_R}
                fill="none"
                stroke="#d1d5db"
                strokeWidth="1"
              />
              <text
                x={x}
                y={y - 6}
                textAnchor="middle"
                className="fill-gray-800 dark:fill-gray-200"
                fontSize="11"
                fontWeight="600"
              >
                {el?.label ?? ''}({node.sipsinKor})
              </text>
              <text
                x={x}
                y={y + 10}
                textAnchor="middle"
                className="fill-gray-600 dark:fill-gray-400"
                fontSize="10"
              >
                {pct > 0 ? `${pct}%` : '-'}
              </text>
            </g>
          )
        })}

        {/* 생(生) — 파란 직선 화살표 5개, 시계방향 (목→화→토→금→수→목) */}
        {[0, 1, 2, 3, 4].map(i => {
          const a = pts[i]
          const b = pts[(i + 1) % 5]
          const s = shorten(a.x, a.y, b.x, b.y, edgeMargin)
          return (
            <line
              key={`saeng-${i}`}
              x1={s.x1}
              y1={s.y1}
              x2={s.x2}
              y2={s.y2}
              stroke={SAENG_COLOR}
              strokeWidth="2"
              markerEnd="url(#arrow-saeng)"
              opacity={0.85}
            />
          )
        })}
      </svg>
    </div>
  )
}
