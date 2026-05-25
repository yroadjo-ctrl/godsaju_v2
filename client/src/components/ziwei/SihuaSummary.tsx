import type { ZiweiChart } from '@core/types'
import { ZiweiInline, ZiweiSectionTitleKey } from './ZiweiLabel.tsx'

interface Props {
  chart: ZiweiChart
}

export default function SihuaSummary({ chart }: Props) {
  const siHuaInfo: Record<string, { star: string; palace: string } | null> = {
    '化祿': null, '化權': null, '化科': null, '化忌': null,
  }

  for (const palace of Object.values(chart.palaces)) {
    for (const star of palace.stars) {
      if (star.siHua) {
        siHuaInfo[star.siHua] = { star: star.name, palace: palace.name }
      }
    }
  }

  const colorMap: Record<string, string> = {
    '化祿': 'text-green-600 dark:text-green-400',
    '化權': 'text-yellow-600 dark:text-yellow-400',
    '化科': 'text-blue-600 dark:text-blue-400',
    '化忌': 'text-red-600 dark:text-red-400',
  }

  return (
    <section>
      <ZiweiSectionTitleKey text="四化" className="mb-2" />
      <div className="space-y-0.5">
        {Object.entries(siHuaInfo).map(([huaType, info]) => {
          if (!info) return null
          return (
            <div key={huaType} className="text-base text-gray-600 dark:text-gray-300">
              <span className={colorMap[huaType] || ''}>
                <ZiweiInline text={huaType} hanjaClassName={`font-hanja ${colorMap[huaType] || ''}`} />
              </span>
              <span className="text-gray-400 dark:text-gray-500 mx-1">:</span>
              <ZiweiInline text={info.star} />
              <span className="text-gray-400 dark:text-gray-500 mx-1">
                <ZiweiInline text="在" hanjaClassName="font-hanja text-gray-400 dark:text-gray-500" />
              </span>
              <ZiweiInline text={info.palace} />
            </div>
          )
        })}
      </div>
    </section>
  )
}
