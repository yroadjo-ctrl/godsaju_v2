import type { SinGangLevel, SinGangYakStats } from '@core/types'
import { SINGANG_LEVELS, formatHelpSipsinRatio } from '@core/index'

interface Props {
  stats: SinGangYakStats
}

function levelLabel(level: SinGangLevel): string {
  if (level === '중화신약') return '중화\n신약'
  if (level === '중화신강') return '중화\n신강'
  return level
}

export default function SinGangSection({ stats }: Props) {
  const fillPct = Math.min(100, Math.max(0, stats.strengthPercent))

  return (
    <section>
      <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-1">
        신강·신약 <span className="font-hanja">(身強·身弱)</span>
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        일간 <span className="font-hanja font-medium">{stats.dayStemKor}({stats.dayStem})</span>
        {' '}· 득령(월령)·득지(일지)·득시(시지)·득세(원국 세력)
      </p>

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            득력 {stats.score}/4
          </span>
          <span
            className="text-xs text-gray-600 dark:text-gray-300"
            title="일간 제외 원국 십성 칸 중 인성·비겁(일간을 돕는 십성) 개수"
          >
            {formatHelpSipsinRatio(stats.helpCount, stats.totalCount)}
          </span>
        </div>

        <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-gray-100 dark:border-gray-800">
          {stats.flags.map(f => (
            <div
              key={f.key}
              className="flex flex-col items-center rounded-md py-2 px-1 bg-gray-50 dark:bg-gray-800/60"
            >
              <span className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                {f.label}({f.hanja})
              </span>
              <span
                className={`text-lg font-bold font-hanja ${
                  f.ok
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-gray-300 dark:text-gray-600'
                }`}
              >
                {f.ok ? '○' : '×'}
              </span>
            </div>
          ))}
        </div>

        <div className="px-3 py-3">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            {stats.conclusion}
          </p>

          {/* 세력 스케일 바 (극약 ~ 극왕) */}
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400 w-8">세력</span>
            <div className="flex-1 min-w-0">
              <div className="relative h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-orange-400 dark:bg-orange-500 rounded-full transition-all"
                  style={{ width: `${fillPct}%` }}
                />
                <div className="absolute inset-0 flex pointer-events-none">
                  {SINGANG_LEVELS.map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 border-r border-white/60 dark:border-gray-900/40 last:border-0"
                    />
                  ))}
                </div>
              </div>
              <div className="flex mt-1.5">
                {SINGANG_LEVELS.map(level => {
                  const active = level === stats.level
                  return (
                    <span
                      key={level}
                      className={`flex-1 text-center text-[10px] leading-tight whitespace-pre-line ${
                        active
                          ? 'font-bold text-gray-900 dark:text-gray-100'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      {levelLabel(level)}
                    </span>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
        ※ 주황 채움=인성·비겁 비율(일간 제외 칸 기준). 굵은 글자=득력 4항목 종합 판정.
        조후·합화 보정은 미포함(추후 단계).
      </p>
    </section>
  )
}
