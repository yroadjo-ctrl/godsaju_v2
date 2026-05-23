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

const SOURCE_LABEL: Record<string, string> = {
  '억부': '억부(抑扶)',
  '조후': '조후(調候)',
  '화격': '화격(化格)',
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
  const sourceLabel = SOURCE_LABEL[yongsin.primarySource] ?? yongsin.primarySource

  return (
    <section>
      <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-1">
        용신 <span className="font-hanja">(用神)</span>
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        일간 <span className="font-hanja font-medium">{yongsin.dayStemKor}({yongsin.dayStem})</span>
        {' '}· {yongsin.method}({yongsin.methodHanja}) · 신강약(身強弱) {yongsin.sinGangLevel}
        {' '}· 주용신(主用神): {sourceLabel}
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
          {yongsin.eokbuPrimary && yongsin.primarySource !== '억부' && (
            <ElementRow
              tag="억부"
              tagClass="bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
              info={yongsin.eokbuPrimary}
            />
          )}
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
          {yongsin.johuPrimary && yongsin.primarySource !== '조후' && (
            <p className="mt-1.5 text-xs text-sky-700 dark:text-sky-400">
              조후용신(調候用神): {yongsin.johuPrimary.label}({yongsin.johuPrimary.hanja})
            </p>
          )}
          {yongsin.hwaGeukSummary && yongsin.primarySource !== '화격' && (
            <p className="mt-0.5 text-xs text-violet-700 dark:text-violet-400">
              화격(化格): {yongsin.hwaGeukSummary}
            </p>
          )}
          {yongsin.gyeokgukSummary && (
            <p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-400">
              격국(格局): {yongsin.gyeokgukSummary}
            </p>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
        ※ {yongsin.method}({yongsin.methodHanja}) · 오행 기준: {yongsin.ohaengBasis ?? '원국'}
      </p>
    </section>
  )
}
