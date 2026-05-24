import { buildYunBigoLines, type YunBigoLine } from '../../utils/yun-bigo.ts'

const RELATION_EMOJI: Record<string, string> = {
  '合': '🔗',
  '半合': '🤝',
  '沖': '⚡',
  '刑': '⚠',
  '破': '💥',
  '害': '🗡',
  '怨嗔': '😤',
  '鬼門': '👻',
}

const RELATION_CLASS: Record<string, string> = {
  '沖': 'text-red-600 dark:text-red-400 font-semibold',
  '刑': 'text-[#CC00CC] dark:text-[#E066FF] font-semibold',
  '合': 'text-green-700 dark:text-green-400',
  '半合': 'text-green-700 dark:text-green-400',
  '破': 'text-amber-600 dark:text-amber-400',
  '害': 'text-yellow-700 dark:text-yellow-400',
  '怨嗔': 'text-purple-500 dark:text-purple-300',
  '鬼門': 'text-purple-500 dark:text-purple-300',
}

interface Props {
  isGongmang: boolean
  interactions?: string
  fuYinFanYin?: string
  className?: string
}

function renderLine(line: YunBigoLine, idx: number) {
  if (line.kind === 'gongmang') {
    return (
      <div key={idx} className="text-[#FF0000] font-bold">
        ◇{line.text}
      </div>
    )
  }

  if (line.kind === 'fuyin') {
    const icon = line.text.startsWith('反吟') ? '↩' : '↺'
    return (
      <div key={idx} className="text-amber-700 dark:text-amber-300">
        {icon}{line.text}
      </div>
    )
  }

  const emoji = line.relationType ? RELATION_EMOJI[line.relationType] ?? '' : ''
  const cls = line.relationType ? RELATION_CLASS[line.relationType] ?? '' : ''
  return (
    <div key={idx} className={cls || undefined}>
      {emoji && <span className="mr-0.5">{emoji}</span>}
      {line.text}
    </div>
  )
}

export default function YunBigoCell({
  isGongmang,
  interactions,
  fuYinFanYin,
  className = '',
}: Props) {
  const lines = buildYunBigoLines({ isGongmang, interactions, fuYinFanYin })

  return (
    <td
      className={`border border-black px-2 py-1 text-center text-[10px] leading-tight whitespace-pre-line break-keep min-h-[50px] bg-slate-50/60 dark:bg-slate-800/40 ${className}`}
    >
      {lines.length === 0 ? (
        '-'
      ) : (
        <div className="flex flex-col gap-0.5 items-center">
          {lines.map(renderLine)}
        </div>
      )}
    </td>
  )
}
