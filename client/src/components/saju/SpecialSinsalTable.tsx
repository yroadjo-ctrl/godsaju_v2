import { getPillarSinsals } from '@core/saju'
import type { Pillar } from '@core/types'

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
  '壬': '임', '癸': '계'
}
const BRANCH_KOREAN: Record<string, string> = {
  '子': '자', '丑': '축', '寅': '인', '卯': '묘',
  '辰': '진', '巳': '사', '午': '오', '未': '미',
  '申': '신', '酉': '유', '戌': '술', '亥': '해'
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
  // godSinsal이 전달되면 그것을 사용, 아니면 재계산
  const pillarSinsals = godSinsal 
    ? [
        godSinsal.filter(s => s.pillarIndex === 0),
        godSinsal.filter(s => s.pillarIndex === 1),
        godSinsal.filter(s => s.pillarIndex === 2),
        godSinsal.filter(s => s.pillarIndex === 3),
      ].map(sinsals => sinsals.map(s => ({ name: s.name, position: s.position })))
    : pillars.map((_, i) =>
        getPillarSinsals(i, dayStem, stems, branches, dayPillar, yearPillar, pillars.map(p => p.pillar))
      )

  // 천간 신살만 필터링
  const heavenSinsals = pillarSinsals.map(sinsals => sinsals.filter(s => s.position === 'heaven'))

  // 지지 신살만 필터링
  const earthSinsals = pillarSinsals.map(sinsals => sinsals.filter(s => s.position === 'earth'))

  // 신살이 하나도 없으면 표 렌더링 안 함
  const hasAnySinsal = pillarSinsals.some(sinsals => sinsals.length > 0)
  if (!hasAnySinsal) return null

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        特殊神殺 (길성과 흉성)
      </h3>
      <table className="w-full border-collapse border border-gray-300 dark:border-gray-600" style={{ tableLayout: 'fixed' }}>
        <tbody>
          {/* 헤더 행 */}
          <tr className="border-b border-gray-300 dark:border-gray-600">
            <td className="px-2 py-2 border-r border-gray-300 dark:border-gray-600 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 w-12">
              구분
            </td>
            {PILLAR_LABELS.map((label, i) => (
              <td
                key={i}
                className="px-3 py-2 border-r border-gray-300 dark:border-gray-600 last:border-r-0 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800"
                style={{ width: '25%' }}
              >
                {label}
              </td>
            ))}
          </tr>

          {/* 천간 행 - 세로 정렬 */}
          <tr className="border-b border-gray-300 dark:border-gray-600">
            <td className="px-2 py-2 border-r border-gray-300 dark:border-gray-600 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">
              天干
            </td>
            {stems.map((stem, i) => (
              <td
                key={i}
                className="px-3 py-3 border-r border-gray-300 dark:border-gray-600 last:border-r-0 text-center text-xs font-medium text-gray-600 dark:text-gray-400"
                style={{ width: '25%' }}
              >
                <div className="flex flex-col items-center gap-0.5">
                  {i === 0 && unknownTime ? (
                    <span>?</span>
                  ) : (
                    <>
                      <span>{STEM_KOREAN[stem] || stem}</span>
                      <span className="text-xs">{stem}</span>
                    </>
                  )}
                </div>
              </td>
            ))}
          </tr>

          {/* 천간 신살 행 - 여러 신살 세로 정렬 */}
          <tr className="border-b border-gray-300 dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20">
            <td className="px-2 py-2 border-r border-gray-300 dark:border-gray-600 text-center text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40">
              神殺
            </td>
            {heavenSinsals.map((sinsals, i) => (
              <td
                key={i}
                className="px-3 py-2 border-r border-gray-300 dark:border-gray-600 last:border-r-0 text-xs font-medium text-blue-700 dark:text-blue-300"
                style={{ width: '25%' }}
              >
                {i === 0 && unknownTime ? (
                  <span className="block text-center">?</span>
                ) : sinsals.length > 0 ? (
                  <div className="flex flex-col items-center gap-0.5">
                    {sinsals.map((s, idx) => (
                      <span key={idx} className="whitespace-nowrap">{s.name}</span>
                    ))}
                  </div>
                ) : (
                  <span className="block text-center text-gray-400 dark:text-gray-500">x</span>
                )}
              </td>
            ))}
          </tr>

          {/* 지지 행 - 세로 정렬 */}
          <tr className="border-b border-gray-300 dark:border-gray-600">
            <td className="px-2 py-2 border-r border-gray-300 dark:border-gray-600 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">
              地支
            </td>
            {branches.map((branch, i) => (
              <td
                key={i}
                className="px-3 py-3 border-r border-gray-300 dark:border-gray-600 last:border-r-0 text-center text-xs font-medium text-gray-600 dark:text-gray-400"
                style={{ width: '25%' }}
              >
                <div className="flex flex-col items-center gap-0.5">
                  {i === 0 && unknownTime ? (
                    <span>?</span>
                  ) : (
                    <>
                      <span>{BRANCH_KOREAN[branch] || branch}</span>
                      <span className="text-xs">{branch}</span>
                    </>
                  )}
                </div>
              </td>
            ))}
          </tr>

          {/* 지지 신살 행 - 여러 신살 세로 정렬 */}
          <tr className="border-b border-gray-300 dark:border-gray-600 bg-amber-50 dark:bg-amber-900/20">
            <td className="px-2 py-2 border-r border-gray-300 dark:border-gray-600 text-center text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40">
              神殺
            </td>
            {earthSinsals.map((sinsals, i) => (
              <td
                key={i}
                className="px-3 py-2 border-r border-gray-300 dark:border-gray-600 last:border-r-0 text-xs font-medium text-amber-700 dark:text-amber-300"
                style={{ width: '25%' }}
              >
                {i === 0 && unknownTime ? (
                  <span className="block text-center">?</span>
                ) : sinsals.length > 0 ? (
                  <div className="flex flex-col items-center gap-0.5">
                    {sinsals.map((s, idx) => (
                      <span key={idx} className="whitespace-nowrap">{s.name}</span>
                    ))}
                  </div>
                ) : (
                  <span className="block text-center text-gray-400 dark:text-gray-500">x</span>
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
