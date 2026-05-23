import type { JohuStats, HapHwaStats, GyeokgukStats } from '@core/types'

interface Props {
  johu: JohuStats
  hapHwa: HapHwaStats
  gyeokguk: GyeokgukStats
}

const EVENT_KIND_LABEL: Record<string, string> = {
  stem: '천간합(天干合)',
  branch: '지지합(地支合)',
  triple: '삼합(三合)',
  directional: '방합(方合)',
}

export default function AdvancedAnalysisSection({ johu, hapHwa, gyeokguk }: Props) {
  const pairEvents = hapHwa.events.filter(e => e.kind === 'stem' || e.kind === 'branch')
  const bureauEvents = hapHwa.events.filter(e => e.kind === 'triple' || e.kind === 'directional')

  return (
    <section className="space-y-4">
      <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200">
        조후(調候) · 합화(合化) · 격국(格局)
      </h3>

      <div className="rounded-lg border border-sky-200 dark:border-sky-900/50 bg-sky-50/60 dark:bg-sky-950/20 px-3 py-2.5 text-sm">
        <p className="font-medium text-gray-900 dark:text-gray-100">
          조후(調候)
        </p>
        <p className="mt-1 text-gray-700 dark:text-gray-300">{johu.summary}</p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          {johu.explanation}
        </p>
        {johu.secondaryLabel && (
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            조후희신(調候喜神): {johu.secondaryLabel}
          </p>
        )}
        {johu.avoidLabel && (
          <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
            조후기신(調候忌神): {johu.avoidLabel}
          </p>
        )}
      </div>

      <div className="rounded-lg border border-violet-200 dark:border-violet-900/50 bg-violet-50/60 dark:bg-violet-950/20 px-3 py-2.5 text-sm">
        <p className="font-medium text-gray-900 dark:text-gray-100">
          합화(合化)
        </p>
        <p className="mt-1 text-gray-700 dark:text-gray-300">{hapHwa.summary}</p>

        {hapHwa.hwaGeuk.length > 0 && (
          <div className="mt-2 rounded-md border border-violet-300/60 dark:border-violet-800/60 bg-white/60 dark:bg-violet-950/30 px-2.5 py-2">
            <p className="text-xs font-medium text-violet-800 dark:text-violet-300">
              화격(化格)
            </p>
            <ul className="mt-1 space-y-1 text-xs text-gray-700 dark:text-gray-300">
              {hapHwa.hwaGeuk.map((h, idx) => (
                <li key={idx}>
                  <span className="font-medium">{h.name}({h.hanja})</span>
                  {' — '}
                  <span className="font-hanja">{h.source}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {pairEvents.length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              천·지 합(合)
            </p>
            <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
              {pairEvents.map((e, idx) => (
                <li key={idx}>
                  <span className="text-gray-500">{EVENT_KIND_LABEL[e.kind]}</span>
                  {' '}
                  <span className="font-hanja">{e.label}</span>
                  {' — '}
                  {e.established ? '성립' : '불성립'}
                  {' '}
                  ({e.reason})
                </li>
              ))}
            </ul>
          </div>
        )}

        {bureauEvents.length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              삼합·방합(三合·方合)
            </p>
            <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
              {bureauEvents.map((e, idx) => (
                <li key={idx}>
                  <span className="text-gray-500">{EVENT_KIND_LABEL[e.kind]}</span>
                  {' '}
                  <span className="font-hanja">{e.label}</span>
                  {' — '}
                  {e.established ? '성립' : '불성립'}
                  {' '}
                  ({e.reason})
                </li>
              ))}
            </ul>
          </div>
        )}

        {hapHwa.events.length === 0 && (
          <p className="mt-1 text-xs text-gray-500">원국 천·지 합·삼합·방합 없음</p>
        )}
      </div>

      <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/20 px-3 py-2.5 text-sm">
        <p className="font-medium text-gray-900 dark:text-gray-100">
          격국(格局)
          {gyeokguk.category === '화격' && (
            <span className="ml-1.5 text-xs font-normal text-emerald-700 dark:text-emerald-400">
              (화격·化格)
            </span>
          )}
        </p>
        <p className="mt-1 text-gray-700 dark:text-gray-300">{gyeokguk.summary}</p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          근거: {gyeokguk.basisSource}
          {gyeokguk.basisSipsinHangul !== '-' && (
            <> · {gyeokguk.basisSipsinHangul}({gyeokguk.basisSipsinHanja})</>
          )}
        </p>
        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
          {gyeokguk.explanation}
        </p>
      </div>
    </section>
  )
}
