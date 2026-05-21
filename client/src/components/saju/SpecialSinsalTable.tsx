import { getPillarSinsals } from '@core/saju'
import { buildSinsalSummaryLine } from '@core/index'
import type { Pillar } from '@core/types'
import { stemSolidBgClass, branchSolidBgClass } from '../../utils/format.ts'

interface Props {
  pillars: Array<{ pillar: Pillar; stem?: string; branch?: string }>
  dayStem: string
  stems: string[]
  branches: string[]
  dayPillar: string[]
  yearPillar: string[]
  unknownTime?: boolean
  godSinsal?: Array<{ name: string; position: 'heaven' | 'earth'; pillarIndex: number }>
}

const PILLAR_LABELS = ['時柱', '日柱', '月柱', '年柱']
const STEM_KOREAN: Record<string, string> = {
  '甲': '갑', '乙': '을', '丙': '병', '丁': '정',
  '戊': '무', '己': '기', '庚': '경', '辛': '신',
  '壬': '임', '癸': '계',
}
const BRANCH_KOREAN: Record<string, string> = {
  '子': '자', '丑': '축', '寅': '인', '卯': '묘',
  '辰': '진', '巳': '사', '午': '오', '未': '미',
  '申': '신', '酉': '유', '戌': '술', '亥': '해',
}

const SINSAL_HANJA: Record<string, string> = {
  '현침살': '懸針殺', '백호대살': '白虎大殺', '괴강살': '魁罡殺',
  '천을귀인': '天乙貴人', '태극귀인': '太極貴人', '월덕귀인': '月德貴人',
  '천덕귀인': '天德貴人', '홍염살': '紅艶殺', '도화살': '桃花殺',
  '양인살': '羊刃殺', '원진살': '怨嗔殺', '귀문관살': '鬼門關殺',
  '천문성': '天門星', '역마살': '驛馬殺', '망신살': '亡身殺',
  '장성살': '將星殺', '화개살': '華蓋殺', '겁살': '劫殺',
  '재살': '災殺', '천살': '天殺', '지살': '地殺',
  '연살': '年殺', '월살': '月殺', '일살': '日殺',
  '시살': '時殺',
}

const GRAY_CELL =
  'px-2 py-2 border-r border-gray-300 dark:border-gray-600 text-center text-xs font-semibold text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800'
const DATA_CELL =
  'px-3 py-2 border-r border-gray-300 dark:border-gray-600 last:border-r-0 text-center text-xs text-gray-900 dark:text-gray-100'

function sinsalLabel(name: string): string {
  const hanja = SINSAL_HANJA[name]
  return hanja ? `${name}(${hanja})` : name
}

function HanjaWithKorean({
  hanja,
  korean,
  solidClass,
}: {
  hanja: string
  korean: string
  solidClass: string
}) {
  return (
    <span className="inline-flex items-center justify-center gap-1">
      <span
        className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-white font-bold text-sm font-hanja leading-none ${solidClass}`}
      >
        {hanja}
      </span>
      <span className="text-[10px] font-medium text-gray-900 dark:text-gray-100 leading-none">
        ({korean})
      </span>
    </span>
  )
}

export default function SpecialSinsalTable({
  pillars,
  dayStem,
  stems,
  branches,
  dayPillar,
  yearPillar,
  unknownTime,
  godSinsal,
}: Props) {
  const pillarSinsals = godSinsal
    ? [
        godSinsal.filter(s => s.pillarIndex === 0),
        godSinsal.filter(s => s.pillarIndex === 1),
        godSinsal.filter(s => s.pillarIndex === 2),
        godSinsal.filter(s => s.pillarIndex === 3),
      ].map(sinsals => sinsals.map(s => ({ name: s.name, position: s.position })))
    : pillars.map((_, i) =>
        getPillarSinsals(i, dayStem, stems, branches, dayPillar, yearPillar, pillars.map(p => p.pillar)),
      )

  const heavenSinsals = pillarSinsals.map(sinsals => sinsals.filter(s => s.position === 'heaven'))
  const earthSinsals = pillarSinsals.map(sinsals => sinsals.filter(s => s.position === 'earth'))

  const hasAnySinsal = pillarSinsals.some(sinsals => sinsals.length > 0)
  if (!hasAnySinsal) return null

  const summaryLine = godSinsal
    ? buildSinsalSummaryLine(godSinsal, unknownTime)
    : buildSinsalSummaryLine(
        pillarSinsals.flatMap((sinsals, pillarIndex) =>
          sinsals.map(s => ({ name: s.name, position: s.position, pillarIndex })),
        ),
        unknownTime,
      )

  return (
    <div className="mt-6">
      <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-1">
        특수신살 <span className="font-hanja">(特殊神殺)</span> (길성과 흉성)
      </h3>
      {summaryLine && (
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 leading-relaxed break-words">
          <span className="font-medium text-gray-500 dark:text-gray-500">[요약] </span>
          {summaryLine}
        </p>
      )}
      <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 table-fixed">
        <colgroup>
          <col className="w-14" />
          <col />
          <col />
          <col />
          <col />
        </colgroup>
        <tbody>
          <tr className="border-b border-gray-300 dark:border-gray-600">
            <td className={GRAY_CELL}>구분</td>
            {PILLAR_LABELS.map((label, i) => (
              <td key={i} className={GRAY_CELL}>
                {label}
              </td>
            ))}
          </tr>

          <tr className="border-b border-gray-300 dark:border-gray-600">
            <td className={GRAY_CELL}>天干</td>
            {stems.map((stem, i) => (
              <td key={i} className={`${DATA_CELL} py-3`}>
                {i === 0 && unknownTime ? (
                  <span className="text-gray-400">?</span>
                ) : (
                  <HanjaWithKorean
                    hanja={stem}
                    korean={STEM_KOREAN[stem] || stem}
                    solidClass={stemSolidBgClass(stem)}
                  />
                )}
              </td>
            ))}
          </tr>

          <tr className="border-b border-gray-300 dark:border-gray-600">
            <td className={`${GRAY_CELL} leading-tight`}>
              <div>天干</div>
              <div>神殺</div>
            </td>
            {heavenSinsals.map((sinsals, i) => (
              <td key={i} className={DATA_CELL}>
                {i === 0 && unknownTime ? (
                  <span className="text-gray-400">?</span>
                ) : sinsals.length > 0 ? (
                  <div className="flex flex-col items-center gap-0.5">
                    {sinsals.map((s, idx) => (
                      <span key={idx} className="whitespace-nowrap">{sinsalLabel(s.name)}</span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
            ))}
          </tr>

          <tr className="border-b border-gray-300 dark:border-gray-600">
            <td className={GRAY_CELL}>地支</td>
            {branches.map((branch, i) => (
              <td key={i} className={`${DATA_CELL} py-3`}>
                {i === 0 && unknownTime ? (
                  <span className="text-gray-400">?</span>
                ) : (
                  <HanjaWithKorean
                    hanja={branch}
                    korean={BRANCH_KOREAN[branch] || branch}
                    solidClass={branchSolidBgClass(branch)}
                  />
                )}
              </td>
            ))}
          </tr>

          <tr className="border-b border-gray-300 dark:border-gray-600">
            <td className={`${GRAY_CELL} leading-tight`}>
              <div>地支</div>
              <div>神殺</div>
            </td>
            {earthSinsals.map((sinsals, i) => (
              <td key={i} className={DATA_CELL}>
                {i === 0 && unknownTime ? (
                  <span className="text-gray-400">?</span>
                ) : sinsals.length > 0 ? (
                  <div className="flex flex-col items-center gap-0.5">
                    {sinsals.map((s, idx) => (
                      <span key={idx} className="whitespace-nowrap">{sinsalLabel(s.name)}</span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
