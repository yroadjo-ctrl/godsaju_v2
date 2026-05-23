import type { JohuStats, HapHwaStats, GyeokgukStats } from '@core/types'

interface Props {
  johu: JohuStats
  hapHwa: HapHwaStats
  gyeokguk: GyeokgukStats
}

export default function AdvancedAnalysisSection({ johu, hapHwa, gyeokguk }: Props) {
  return (
    <section className="space-y-4">
      <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200">
        조후 · 합화 · 격국
      </h3>

      <div className="rounded-lg border border-sky-200 dark:border-sky-900/50 bg-sky-50/60 dark:bg-sky-950/20 px-3 py-2.5 text-sm">
        <p className="font-medium text-gray-900 dark:text-gray-100">
          조후
          <span className="font-hanja ml-1">(調候)</span>
        </p>
        <p className="mt-1 text-gray-700 dark:text-gray-300">{johu.summary}</p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          {johu.explanation}
        </p>
        {johu.secondaryLabel && (
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            조후희신: {johu.secondaryLabel}
          </p>
        )}
      </div>

      <div className="rounded-lg border border-violet-200 dark:border-violet-900/50 bg-violet-50/60 dark:bg-violet-950/20 px-3 py-2.5 text-sm">
        <p className="font-medium text-gray-900 dark:text-gray-100">
          합화
          <span className="font-hanja ml-1">(合化)</span>
        </p>
        <p className="mt-1 text-gray-700 dark:text-gray-300">{hapHwa.summary}</p>
        {hapHwa.events.length > 0 ? (
          <ul className="mt-1.5 space-y-1 text-xs text-gray-600 dark:text-gray-400">
            {hapHwa.events.map((e, idx) => (
              <li key={idx}>
                <span className="font-hanja">{e.label}</span>
                {' '}
                —
                {e.established ? ' 성립' : ' 불성립'}
                {' '}
                ({e.reason})
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-xs text-gray-500">원국 천·지 합 없음</p>
        )}
      </div>

      <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/20 px-3 py-2.5 text-sm">
        <p className="font-medium text-gray-900 dark:text-gray-100">
          격국
          <span className="font-hanja ml-1">(格局)</span>
          {' '}
          <span className="font-hanja text-base">{gyeokguk.hanja}</span>
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
