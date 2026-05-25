import type { ZiweiChart, ZiweiPalace } from '@core/types'
import { DI_ZHI } from '@core/constants'
import { MAIN_STAR_NAMES, LUCKY_STAR_NAMES, SHA_STAR_NAMES } from '@core/constants'
import { getDaxianList } from '@core/ziwei'
import { ZiweiInline } from './ZiweiLabel.tsx'
import { formatPalaceTheme, formatZiweiInline, formatZhiKorHanja } from '../../utils/ziwei-labels.ts'
import { formatGanziKorHanja } from '../../utils/ganzi-display.ts'
import { ZHI_GRID, getPalaceByZhi } from '../../utils/ziwei-palace-grid.ts'

interface Props {
  chart: ZiweiChart
}

/** 명반 셀 — 한자 병기 이전 원래 크기 */
const CELL = 'text-sm leading-tight'
const HANJA_PAIR = `font-hanja ${CELL} text-gray-500 dark:text-gray-400`
/** 12궁 명칭·신(身) 한글만 한 단계 크게 */
const PALACE_KOR = 'text-base leading-tight font-medium text-gray-800 dark:text-gray-100'
const SHEN_KOR = 'text-base leading-tight font-medium text-purple-600 dark:text-purple-400'
const SHEN_HANJA = `font-hanja ${CELL} text-purple-600 dark:text-purple-400`
const GANZI = `${CELL} text-gray-400 dark:text-gray-500`
const THEME = 'text-xs text-gray-400 dark:text-gray-500 leading-snug whitespace-nowrap'

function siHuaColor(siHua: string): string {
  switch (siHua) {
    case '化祿': return 'text-green-600 dark:text-green-400'
    case '化權': return 'text-yellow-600 dark:text-yellow-400'
    case '化科': return 'text-blue-600 dark:text-blue-400'
    case '化忌': return 'text-red-600 dark:text-red-400'
    default: return ''
  }
}

function brightnessColor(b: string): string {
  if (b === '廟' || b === '旺') return 'text-green-600 dark:text-green-400'
  if (b === '陷') return 'text-red-500 dark:text-red-400'
  return 'text-gray-500 dark:text-gray-400'
}

function PalaceCell({ palace, daxianRange }: { palace: ZiweiPalace; daxianRange?: string }) {
  const mainStars = palace.stars.filter(s => MAIN_STAR_NAMES.has(s.name))
  const luckyStars = palace.stars.filter(s => LUCKY_STAR_NAMES.has(s.name))
  const shaStars = palace.stars.filter(s => SHA_STAR_NAMES.has(s.name))
  const theme = formatPalaceTheme(palace.name)

  return (
    <div className={`flex flex-col justify-between h-full p-2 min-w-0 ${CELL}`}>
      <div>
        <div>
          {palace.isShenGong ? (
            <>
              <div className="flex items-end flex-wrap">
                <ZiweiInline text={palace.name} korClassName={PALACE_KOR} hanjaClassName={HANJA_PAIR} />
                <span className="ml-0.5">
                  ·<ZiweiInline text="身" korClassName={SHEN_KOR} hanjaClassName={SHEN_HANJA} />
                </span>
              </div>
              <div className="flex items-end justify-between gap-1 mt-0.5">
                {theme ? <div className={THEME}>{theme}</div> : <span />}
                <span className={`${GANZI} shrink-0`}>
                  {formatGanziKorHanja(palace.ganZhi)}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-end justify-between gap-1">
                <ZiweiInline text={palace.name} korClassName={PALACE_KOR} hanjaClassName={HANJA_PAIR} />
                <span className={`${GANZI} shrink-0`}>
                  {formatGanziKorHanja(palace.ganZhi)}
                </span>
              </div>
              {theme && <div className={`${THEME} mt-0.5`}>{theme}</div>}
            </>
          )}
        </div>

        <div className="mt-1.5 space-y-0.5">
          {mainStars.length > 0 ? (
            mainStars.map(s => (
              <div key={s.name} className={`flex flex-wrap items-baseline gap-x-0.5 gap-y-0 ${CELL}`}>
                <ZiweiInline text={s.name} className={CELL} hanjaClassName={HANJA_PAIR} />
                {s.brightness && (
                  <span className={brightnessColor(s.brightness)}>
                    <ZiweiInline
                      text={s.brightness}
                      className={brightnessColor(s.brightness)}
                      hanjaClassName={`font-hanja ${CELL} ${brightnessColor(s.brightness)}`}
                    />
                  </span>
                )}
                {s.siHua && (
                  <span className={siHuaColor(s.siHua)}>
                    <ZiweiInline
                      text={s.siHua}
                      className={siHuaColor(s.siHua)}
                      hanjaClassName={`font-hanja ${CELL} ${siHuaColor(s.siHua)}`}
                    />
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className={`text-gray-400 dark:text-gray-500 ${CELL}`}>
              (<ZiweiInline text="空宮" className={CELL} hanjaClassName={HANJA_PAIR} />)
            </div>
          )}
        </div>

        {(luckyStars.length > 0 || shaStars.length > 0) && (
          <div className={`mt-1 pt-1 border-t border-dashed border-gray-200 dark:border-gray-700 ${CELL}`}>
            {luckyStars.length > 0 && (
              <div className={`text-green-600 dark:text-green-400 ${CELL}`}>
                {luckyStars.map(s => formatZiweiInline(s.name)).join(' ')}
              </div>
            )}
            {shaStars.length > 0 && (
              <div className={`text-red-500 dark:text-red-400 ${CELL}`}>
                {shaStars.map(s => formatZiweiInline(s.name)).join(' ')}
              </div>
            )}
          </div>
        )}
      </div>

      {daxianRange && (
        <div className={`text-gray-400 dark:text-gray-500 text-right mt-1 ${CELL}`}>{daxianRange}</div>
      )}
    </div>
  )
}

export default function MingPanGrid({ chart }: Props) {
  const genderHanja = chart.isMale ? '男' : '女'

  let shenPalaceName = ''
  for (const p of Object.values(chart.palaces)) {
    if (p.isShenGong) { shenPalaceName = p.name; break }
  }

  const daxianList = getDaxianList(chart)
  const daxianByZhi = new Map<string, string>()
  for (const dx of daxianList) {
    const palace = chart.palaces[dx.palaceName]
    if (palace) {
      daxianByZhi.set(palace.zhi, `${dx.ageStart}-${dx.ageEnd}歲`)
    }
  }

  return (
    <div>
      <div
        className="grid grid-cols-4 grid-rows-4 border-t border-l border-gray-300 dark:border-gray-600 w-full"
      >
        {DI_ZHI.split('').map(zhi => {
          const pos = ZHI_GRID[zhi]
          if (!pos) return null
          const palace = getPalaceByZhi(chart, zhi)
          if (!palace) return null

          return (
            <div
              key={zhi}
              className="border-r border-b border-gray-300 dark:border-gray-600 min-h-[148px] min-w-0"
              style={{ gridRow: pos[0], gridColumn: pos[1] }}
            >
              <PalaceCell palace={palace} daxianRange={daxianByZhi.get(zhi)} />
            </div>
          )
        })}

        <div
          className="border-r border-b border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center p-3"
          style={{ gridRow: '2 / 4', gridColumn: '2 / 4' }}
        >
          <div className={`space-y-0.5 text-gray-600 dark:text-gray-300 w-max max-w-full ${CELL}`}>
            <div className="whitespace-nowrap">
              <ZiweiInline text="陽曆" className={CELL} hanjaClassName={HANJA_PAIR} />
              {': '}
              {chart.solarYear}年 {chart.solarMonth}月 {chart.solarDay}日 {chart.hour}時 {chart.minute}分
            </div>
            <div>
              <ZiweiInline text="陰曆" className={CELL} hanjaClassName={HANJA_PAIR} />
              {': '}
              {chart.lunarYear}年 {chart.lunarMonth}月 {chart.lunarDay}日
              {chart.isLeapMonth && (
                <span className="text-orange-600 dark:text-orange-400 ml-1">
                  (<ZiweiInline text="閏月" className={CELL} hanjaClassName={`font-hanja ${CELL} text-orange-600 dark:text-orange-400`} />)
                </span>
              )}
            </div>
            <div>
              <ZiweiInline text="性別" className={CELL} hanjaClassName={HANJA_PAIR} />
              {': '}
              <ZiweiInline text={genderHanja} className={CELL} hanjaClassName={HANJA_PAIR} />
            </div>
            <div className="pt-1">
              <ZiweiInline text="年柱" className={CELL} hanjaClassName={HANJA_PAIR} />
              {': '}
              {formatGanziKorHanja(`${chart.yearGan}${chart.yearZhi}`)}
            </div>
            <div>
              <ZiweiInline text="命宮" className={CELL} hanjaClassName={HANJA_PAIR} />
              {': '}
              {chart.palaces['命宮']?.ganZhi
                ? formatGanziKorHanja(chart.palaces['命宮'].ganZhi)
                : ''}
            </div>
            <div>
              <ZiweiInline text="身宮" className={CELL} hanjaClassName={HANJA_PAIR} />
              {': '}
              {shenPalaceName && <ZiweiInline text={shenPalaceName} className={CELL} hanjaClassName={HANJA_PAIR} />}
              {' '}
              ({formatZhiKorHanja(chart.shenGongZhi)})
            </div>
            <div>
              <ZiweiInline text="五行局" className={CELL} hanjaClassName={HANJA_PAIR} />
              {': '}
              <ZiweiInline text={chart.wuXingJu.name} className={CELL} hanjaClassName={HANJA_PAIR} />
            </div>
            <div>
              <ZiweiInline text="大限起始" className={CELL} hanjaClassName={HANJA_PAIR} />
              {': '}
              {chart.daXianStartAge}歲
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
