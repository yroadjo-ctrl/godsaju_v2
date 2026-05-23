import type { TaewonTaesikStats } from '@core/types'
import { stemSolidBgClass, branchSolidBgClass, getStemAttr, getBranchAttr } from '../../utils/format.ts'

interface Props {
  stats: TaewonTaesikStats
}

function ganziKorean(stem: string, branch: string): string {
  return `${getStemAttr(stem).um}${getBranchAttr(branch).um}`
}

function PillarCard({
  labelKor,
  labelHanja,
  pillar,
}: {
  labelKor: string
  labelHanja: string
  pillar: TaewonTaesikStats['taewon']
}) {
  return (
    <div className="flex-1 min-w-[140px] rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/40 p-3 text-center">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
        {labelKor}
        <span className="font-hanja">({labelHanja})</span>
      </p>
      <div className="flex items-center justify-center gap-2 mb-2">
        <span className={`inline-flex items-center justify-center w-9 h-9 rounded text-lg font-bold text-white ${stemSolidBgClass(pillar.stem)}`}>
          {pillar.stem}
        </span>
        <span className={`inline-flex items-center justify-center w-9 h-9 rounded text-lg font-bold text-white ${branchSolidBgClass(pillar.branch)}`}>
          {pillar.branch}
        </span>
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-300">{ganziKorean(pillar.stem, pillar.branch)}</p>
      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
        {pillar.stemSipsin} · {pillar.branchSipsin}
      </p>
      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{pillar.nayeon}</p>
    </div>
  )
}

export default function TaewonTaesikSection({ stats }: Props) {
  return (
    <section>
      <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-1">
        태원<span className="font-hanja">(胎元)</span>
        {' · '}
        태식<span className="font-hanja">(胎息)</span>
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
        ※ {stats.methodNote}
      </p>
      <div className="flex flex-wrap gap-3">
        <PillarCard labelKor="태원" labelHanja="胎元" pillar={stats.taewon} />
        <PillarCard labelKor="태식" labelHanja="胎息" pillar={stats.taesik} />
      </div>
    </section>
  )
}
