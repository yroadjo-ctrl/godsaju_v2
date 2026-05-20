import type { PillarDetail, Gongmang, SpecialSinsal } from '@core/index'
import {
  stemColorClass,
  branchColorClass,
  stemSolidBgClass,
  branchSolidBgClass,
  elementSolidBgClass,
  stemElement,
} from '../../utils/format.ts'
import { useLocale } from '../../i18n/index.ts'

interface Props {
  pillars: PillarDetail[]
  unknownTime?: boolean
  gongmang: Gongmang
  godSinsal?: SpecialSinsal[]
}

export default function PillarTable({ pillars, unknownTime, gongmang, godSinsal }: Props) {
  const { t } = useLocale()
  const gmSet = new Set(gongmang.branches)
  
  const stemKoreanMap: Record<string, string> = {
    '甲': '갑', '乙': '을', '丙': '병', '丁': '정',
    '戊': '무', '己': '기', '庚': '경', '辛': '신',
    '壬': '임', '癸': '계'
  }
  
  const branchKoreanMap: Record<string, string> = {
    '子': '자', '丑': '축', '寅': '인', '卯': '묘',
    '辰': '진', '巳': '사', '午': '오', '未': '미',
    '申': '신', '酉': '유', '戌': '술', '亥': '해'
  }
    const stemYinYangMap: Record<string, string> = {
    '甲': '陽木', '乙': '陰木', '丙': '陽火', '丁': '陰火',
    '戊': '陽土', '己': '陰土', '庚': '陽金', '辛': '陰金',
    '壬': '陽水', '癸': '陰水',
  }
  
  const branchYinYangMap: Record<string, string> = {
    '子': '陽水', '丑': '陰土', '寅': '陽木', '卯': '陰木',
    '辰': '陽土', '巳': '陰火', '午': '陽火', '未': '陰土',
    '申': '陽金', '酉': '陰金', '戌': '陽土', '亥': '陰水',
  }

  // 귀인 한자 병기 매핑 (귀인 제외)
  const GUIIN_HANJA: Record<string, string> = {
    '천을귀인': '天乙',
    '천덕귀인': '天德',
    '월덕귀인': '月德',
    '태극귀인': '太極',
    '문창귀인': '文昌',
    '복성귀인': '福星',
    '홍란귀인': '紅鸞',
  }

  // 귀인 정보 추출 → 배열 반환 (없으면 ['-'])
  const getGuiinForPillar = (pillarIndex: number): string[] => {
    const pillar = pillars[pillarIndex] as any
    if (pillar?.guiin && Array.isArray(pillar.guiin) && pillar.guiin.length > 0) {
      return pillar.guiin.map((g: any) => {
        const hanja = GUIIN_HANJA[g.name]
        return hanja ? `${g.name}(${hanja})` : g.name
      })
    }
    return ['-']
  }

  // 여러 항목을 줄바꿈으로 표시하는 헬퍼 (빈값은 '-' 표시)
  const multiLine = (value: string) => {
    if (!value || value.trim() === '') return <span>-</span>
    const parts = value.split(/, |,/).map(v => v.trim()).filter(Boolean)
    if (parts.length <= 1) return <span>{parts[0] ?? '-'}</span>
    return <>{parts.map((v, i) => <div key={i}>{v}</div>)}</>
  }

  return (
    <div className="overflow-x-auto border border-gray-300 dark:border-gray-600 rounded-lg">
      <table className="w-full text-center text-sm border-collapse table-fixed">
        <colgroup>
          <col className="w-14" />
          <col />
          <col />
          <col />
          <col />
        </colgroup>
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600">
            <td className="px-2 py-2 border-r border-gray-300 dark:border-gray-600 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">구분</td>
            <td className="px-3 py-2 border-r border-gray-300 dark:border-gray-600"><div className="font-semibold">時柱</div><div className="text-xs text-gray-600 dark:text-gray-400">말년운 (60세~)<br/>자녀운, 결실</div></td>
            <td className="px-3 py-2 border-r border-gray-300 dark:border-gray-600"><div className="font-semibold">日柱</div><div className="text-xs text-gray-600 dark:text-gray-400">중년운 (40~60세)<br/>정체성, 자아</div></td>
            <td className="px-3 py-2 border-r border-gray-300 dark:border-gray-600"><div className="font-semibold">月柱</div><div className="text-xs text-gray-600 dark:text-gray-400">청년운 (20~40세)<br/>부모, 사회상</div></td>
            <td className="px-3 py-2"><div className="font-semibold">年柱</div><div className="text-xs text-gray-600 dark:text-gray-400">초년운 (0~20세)<br/>조상, 시대상</div></td>
          </tr>
        </thead>
        
        <tbody className="font-hanja">
          <tr className="border-b border-gray-300 dark:border-gray-600">
            <td className="px-2 py-4 border-r border-gray-300 dark:border-gray-600 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">천간</td>
            {pillars.map((p, i) => (
              <td key={i} className="flex-1 px-3 py-2 border-r border-gray-300 dark:border-gray-600 last:border-r-0">
                <div className="flex flex-col items-center gap-1">
                  {i === 0 && unknownTime ? (
                    <span className="inline-flex items-center justify-center w-10 h-10 text-2xl rounded bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-600">?</span>
                  ) : (
                    <>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {stemKoreanMap[p.pillar.stem]}({stemYinYangMap[p.pillar.stem].replace(/陽|陰/, m => m === '陽' ? '양' : '음').replace(/木/, '목').replace(/火/, '화').replace(/土/, '토').replace(/金/, '금').replace(/水/, '수')})
                      </span>
                      <span className={`inline-flex items-center justify-center w-10 h-10 text-2xl rounded pb-[2px] ${stemSolidBgClass(p.pillar.stem)}`}>
                        {p.pillar.stem}
                      </span>
                    </>
                  )}
                  <div className="text-xs text-gray-500 dark:text-gray-500 text-center">
                    {i === 0 ? '(아들)' : i === 1 ? '(자신)' : i === 2 ? '(부친)' : '(조부)'}
                  </div>
                </div>
              </td>
            ))}
          </tr>

          <tr className="border-b border-gray-300 dark:border-gray-600">
            <td className="px-2 py-2 border-r border-gray-300 dark:border-gray-600 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">십성</td>
            {pillars.map((p, i) => (
              <td key={i} className={`px-3 py-2 border-r border-gray-300 dark:border-gray-600 last:border-r-0 text-sm font-semibold ${stemColorClass(p.pillar.stem)}`}>
                {i === 0 && unknownTime ? '?' : p.stemSipsin}
              </td>
            ))}
          </tr>

          <tr className="border-b border-gray-300 dark:border-gray-600">
            <td className="px-2 py-2 border-r border-gray-300 dark:border-gray-600 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">지지</td>
            {pillars.map((p, i) => (
              <td key={i} className="flex-1 px-3 py-2 border-r border-gray-300 dark:border-gray-600 last:border-r-0">
                <div className="flex flex-col items-center gap-1">
                  {i === 0 && unknownTime ? (
                    <span className="inline-flex items-center justify-center w-10 h-10 text-2xl rounded bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-600">?</span>
                  ) : (
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {branchKoreanMap[p.pillar.branch]}({branchYinYangMap[p.pillar.branch].replace(/陽|陰/, m => m === '陽' ? '양' : '음').replace(/木/, '목').replace(/火/, '화').replace(/土/, '토').replace(/金/, '금').replace(/水/, '수')})
                      </span>
                      <span className={`inline-flex items-center justify-center w-10 h-10 text-2xl rounded pb-[2px] ${branchSolidBgClass(p.pillar.branch)}`}>
                        {p.pillar.branch}
                      </span>
                    </div>
                  )}
                  <div className="text-xs text-gray-500 dark:text-gray-500 text-center">
                    {i === 0 ? '(딸)' : i === 1 ? '(배우자)' : i === 2 ? '(모친)' : '(조모)'}
                  </div>
                </div>
              </td>
            ))}
          </tr>

          <tr className="border-b border-gray-300 dark:border-gray-600">
            <td className="px-2 py-2 border-r border-gray-300 dark:border-gray-600 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">십성</td>
            {pillars.map((p, i) => (
              <td key={i} className={`px-3 py-2 border-r border-gray-300 dark:border-gray-600 last:border-r-0 text-sm font-semibold ${branchColorClass(p.pillar.branch)}`}>
                {i === 0 && unknownTime ? '?' : p.branchSipsin}
              </td>
            ))}
          </tr>

          <tr className="border-b border-gray-300 dark:border-gray-600">
            <td className="px-2 py-2 border-r border-gray-300 dark:border-gray-600 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">지장간</td>
            {pillars.map((p, i) => (
              <td key={i} className="px-3 py-2 border-r border-gray-300 dark:border-gray-600 last:border-r-0 text-xs text-gray-600 dark:text-gray-400">
                {i === 0 && unknownTime ? '?' : multiLine(p.jigang)}
              </td>
            ))}
          </tr>

          <tr className="border-b border-gray-300 dark:border-gray-600">
            <td className="px-2 py-2 border-r border-gray-300 dark:border-gray-600 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">12운성</td>
            {pillars.map((p, i) => (
              <td key={i} className="px-3 py-2 border-r border-gray-300 dark:border-gray-600 last:border-r-0 text-xs text-gray-600 dark:text-gray-400">
                {i === 0 && unknownTime ? '?' : multiLine(p.unseong)}
              </td>
            ))}
          </tr>

          <tr className="border-b border-gray-300 dark:border-gray-600">
            <td className="px-2 py-2 border-r border-gray-300 dark:border-gray-600 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">納音</td>
            {pillars.map((p, i) => (
              <td key={i} className="px-3 py-2 border-r border-gray-300 dark:border-gray-600 last:border-r-0 text-xs text-gray-600 dark:text-gray-400 font-medium">
                {i === 0 && unknownTime ? '?' : p.nayeon}
              </td>
            ))}
          </tr>

          <tr className="border-b border-gray-300 dark:border-gray-600">
            <td className="px-2 py-2 border-r border-gray-300 dark:border-gray-600 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">12신살</td>
            {pillars.map((p, i) => (
              <td key={i} className="px-3 py-2 border-r border-gray-300 dark:border-gray-600 last:border-r-0 text-xs text-gray-600 dark:text-gray-400">
                {i === 0 && unknownTime ? '?' : multiLine(p.sinsal)}
              </td>
            ))}
          </tr>

          <tr className="border-b border-gray-300 dark:border-gray-600">
            <td className="px-2 py-2 border-r border-gray-300 dark:border-gray-600 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">귀인</td>
            {pillars.map((p, i) => {
              const guiinList = i === 0 && unknownTime ? ['?'] : getGuiinForPillar(i)
              return (
                <td key={i} className="px-3 py-2 border-r border-gray-300 dark:border-gray-600 last:border-r-0 text-xs text-gray-600 dark:text-gray-400 font-medium">
                  {guiinList.map((name, j) => <div key={j}>{name}</div>)}
                </td>
              )
            })}
          </tr>

          <tr>
            <td className="px-2 py-2 border-r border-gray-300 dark:border-gray-600 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">공망</td>
            {pillars.map((p, i) => {
              const hasGongmang = gongmang.pillarIndices.includes(i)
              return (
                <td key={i} className={`px-3 py-2 border-r border-gray-300 dark:border-gray-600 last:border-r-0 text-xs font-semibold ${hasGongmang ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-600'}`}>
                  {hasGongmang
                    ? <>
                        <div className="font-bold">空亡</div>
                        <div className="text-xs opacity-70">({gongmang.branches[0]}{gongmang.branches[1]})</div>
                      </>
                    : '-'}
                </td>
              )
            })}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
