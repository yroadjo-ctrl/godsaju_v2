import type { YongsinStats } from '@core/types'

interface Props {
  yongsin: YongsinStats
}

const ELEMENT_DOT: Record<string, string> = {
  tree: 'bg-[#00C459]',
  fire: 'bg-[#FF0000]',
  earth: 'bg-[#FF9900]',
  metal: 'bg-[#808080]',
  water: 'bg-[#3366FF]',
}

function ElementRow({
  tag,
  tagClass,
  info,
}: {
  tag: string
  tagClass: string
  info: YongsinStats['primary']
}) {
  return (
    <div className="flex items-start gap-2 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded ${tagClass}`}>
        {tag}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`inline-block w-2 h-2 rounded-sm ${ELEMENT_DOT[info.element] ?? 'bg-gray-400'}`} />
          <span className="font-medium text-gray-800 dark:text-gray-200">
            {info.label}({info.hanja})
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {info.sipsinRole}({info.sipsinHanja})
          </span>
          <span className="text-xs font-mono text-gray-500 dark:text-gray-400 ml-auto">
            {info.percent > 0 ? `${info.percent}%` : '-'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function YongsinSection({ yongsin }: Props) {
  return (
    <section>
      <h3 className="text-base font-medium text-gray-700 dark:text-gray-200 mb-1">
        용신 <span className="font-hanja">(用神)</span>
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        일간 <span className="font-hanja font-medium">{yongsin.dayStemKor}({yongsin.dayStem})</span>
        {' '}· {yongsin.method}({yongsin.methodHanja}) · 신강약 {yongsin.sinGangLevel}
      </p>

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            {yongsin.summary}
          </p>
        </div>

        <div className="px-3 py-1">
          <ElementRow
            tag="용신"
            tagClass="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
            info={yongsin.primary}
          />
          <ElementRow
            tag="희신"
            tagClass="bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
            info={yongsin.secondary}
          />
          {yongsin.avoid.map(a => (
            <ElementRow
              key={a.element}
              tag="기신"
              tagClass="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
              info={a}
            />
          ))}
        </div>

        <div className="px-3 py-2.5 bg-gray-50/80 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            {yongsin.explanation}
          </p>
        </div>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
        ※ 억부용신(抑扶用神) 기준. 조후·통관·합화·격국 보정은 미포함(추후 단계).
      </p>
    </section>
  )
}
