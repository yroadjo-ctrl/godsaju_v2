import type { MonthlyJieQiEntry } from '@core/jieqi-lunar'

interface Props {
  text: string
  className?: string
}

/** 절기 경계 셀 (◆줄바꿈 형식) */
export function JieQiBoundaryCell({ text, className = '' }: Props) {
  if (text === '-') {
    return <td className={`border border-black px-2 py-1 text-center text-xs text-gray-400 ${className}`}>-</td>
  }

  const lines = text.split('\n')
  return (
    <td className={`border border-black px-2 py-1 text-center text-xs whitespace-pre-line leading-tight ${className}`}>
      {lines.map((line, i) => (
        <span
          key={i}
          className={line.startsWith('◆') ? 'font-semibold text-amber-700 dark:text-amber-400' : 'text-gray-600 dark:text-gray-400'}
        >
          {i > 0 && <br />}
          {line}
        </span>
      ))}
    </td>
  )
}

/** 월운 절기 셀 — 節入(◆) 강조 */
export function MonthlyJieQiCell({ entries }: { entries: MonthlyJieQiEntry[] }) {
  if (entries.length === 0) {
    return <td className="border border-black px-2 py-1 text-center text-xs text-gray-400">-</td>
  }

  return (
    <td className="border border-black px-2 py-1 text-center text-xs whitespace-pre-line leading-tight">
      {entries.map((e, i) => {
        const time = `${String(e.hour).padStart(2, '0')}:${String(e.minute).padStart(2, '0')}`
        return (
          <span
            key={`${e.jieIndex}-${i}`}
            className={e.isJieRu
              ? 'font-semibold text-amber-700 dark:text-amber-400'
              : 'text-gray-500 dark:text-gray-400'}
          >
            {i > 0 && <br />}
            {e.isJieRu ? '◆' : '·'}{e.kor}({e.hanja})
            <br />
            {e.month}/{e.day} {time}
          </span>
        )
      })}
    </td>
  )
}
