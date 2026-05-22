import { useState, useRef, useCallback } from 'react'
import BirthForm from './BirthForm.tsx'
import type { BirthFormHandle, SavedFormState } from './BirthForm.tsx'
import ProfileModal from './ProfileModal.tsx'
import Guide from './Guide.tsx'
import CopyButton from './CopyButton.tsx'
import ThemeToggle from './ThemeToggle.tsx'
import LanguageToggle from './LanguageToggle.tsx'
import { useLocale } from '../i18n/index.ts'
import SajuView from './saju/SajuView.tsx'
import ZiweiView from './ziwei/ZiweiView.tsx'
import NatalView from './natal/NatalView.tsx'
import { calculateSaju } from '@core/saju'
import { createChart } from '@core/ziwei'
import { calculateNatal } from '@core/natal'
import { sajuToText, ziweiToText, natalToText } from '../utils/text-export.ts'
import type { BirthInput } from '@core/types'

type Tab = 'saju' | 'ziwei' | 'natal'

function AppContent() {
  const { t } = useLocale()
  const [tab, setTab] = useState<Tab>('saju')
  const [birthInput, setBirthInput] = useState<BirthInput | null>(null)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [externalFormState, setExternalFormState] = useState<SavedFormState | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const birthFormRef = useRef<BirthFormHandle>(null)

  function handleSubmit(input: BirthInput) {
    setBirthInput(input)
    requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' })
    })
  }

  const getCurrentFormState = useCallback(() => {
    return birthFormRef.current?.getCurrentState() ?? null
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 relative">
      <ThemeToggle />
      <LanguageToggle />
      <a
        href="https://github.com/rath/orrery"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed top-0 right-0 z-50 pointer-events-none"
        aria-label="View source on GitHub"
      >
        <svg width="60" height="60" viewBox="0 0 250 250" className="fill-gray-700 text-white" aria-hidden="true">
          <path d="M0 0l115 115h15l12 27 108 108V0z" />
          <path d="M128.3 109c-14.5-9.3-9.3-19.4-9.3-19.4 3-6.9 1.5-11 1.5-11-1.3-6.6 2.9-2.3 2.9-2.3 3.9 4.6 2.1 11 2.1 11-2.6 10.3 5.1 14.6 8.9 15.9" fill="currentColor" style={{ transformOrigin: '130px 106px' }} />
          <path d="M115 115c-.1.1 3.7 1.5 4.8.4l13.9-13.8c3.2-2.4 6.2-3.2 8.5-3 -8.4-10.6-14.7-24.2 1.6-40.6 4.7-4.6 10.2-6.8 15.9-7 .6-1.6 3.5-7.4 11.7-10.9 0 0 4.7 2.4 7.4 16.1 4.3 2.4 8.4 5.6 12.1 9.2 3.6 3.6 6.8 7.8 9.2 12.2 13.7 2.6 16.2 7.3 16.2 7.3-3.6 8.2-9.4 11.1-10.9 11.7-.3 5.8-2.4 11.2-7.1 15.9-16.4 16.4-29.4 11.6-36.4 8.8 .2 2.8-1 6.8-5 10.8L141 136.5c-1.2 1.2.6 5.4.8 5.3z" fill="currentColor" />
        </svg>
      </a>
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* 갓사주 헤더 */}
        <div className="text-center mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="mb-4">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              <span className="text-gray-900">God</span><span className="text-yellow-500">sAju</span>
            </h1>
            <p className="text-xs text-yellow-500 mt-2 tracking-widest font-semibold">갓 사 주</p>
          </div>
          <p className="text-xl sm:text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            AI 과학으로 푸는 당신의 운명
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            사주팔자 · 자미두수 · 별자리 · 대운 · 운세를 한눈에 분석합니다
          </p>
        </div>

        <div className="text-center mb-6 hidden">
          <p className="text-base text-gray-500 dark:text-gray-400 tracking-wide">
            {t('app.subtitle1')}<br className="sm:hidden" /> <span className="font-medium text-gray-700 dark:text-gray-200">{t('app.subtitle.tool')}</span> {t('app.subtitle2')}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t('app.subtitle3')}</p>
        </div>

        <BirthForm ref={birthFormRef} onSubmit={handleSubmit} externalState={externalFormState} />

        {birthInput && (
          <div ref={resultsRef} className="mt-12">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex gap-4 flex-wrap">
                <button
                  onClick={() => setTab('saju')}
                  className={`px-4 py-2 rounded font-medium transition-colors ${
                    tab === 'saju'
                      ? 'bg-yellow-500 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  {t('app.tab.saju')}
                </button>
                <button
                  onClick={() => setTab('ziwei')}
                  className={`px-4 py-2 rounded font-medium transition-colors ${
                    tab === 'ziwei'
                      ? 'bg-yellow-500 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  {t('app.tab.ziwei')}
                </button>
                <button
                  onClick={() => setTab('natal')}
                  className={`px-4 py-2 rounded font-medium transition-colors ${
                    tab === 'natal'
                      ? 'bg-yellow-500 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  {t('app.tab.natal')}
                </button>
              </div>
              <div className="ml-auto pb-1">
                <CopyButton
                  label={<>{t('app.copyAll')}<br />{t('app.copyAllSub')}</>}
                  getText={async () => {
                    const saju = calculateSaju(birthInput)
                    const parts = [sajuToText(saju)]
                    if (!birthInput.unknownTime) {
                      const chart = createChart(birthInput)
                      parts.push(ziweiToText(chart))
                    }
                    const natal = await calculateNatal(birthInput)
                    parts.push(natalToText(natal))

                    return parts.join('\n\n')
                  }}
                />
              </div>
            </div>

            {tab === 'saju' && <SajuView input={birthInput} />}
            {tab === 'ziwei' && <ZiweiView input={birthInput} />}
            {tab === 'natal' && <NatalView input={birthInput} />}
          </div>
        )}

        <Guide />
      </main>
      <ProfileModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        getCurrentFormState={getCurrentFormState}
        onSelect={setExternalFormState}
      />
    </div>
  )
}

export default function App() {
  return <AppContent />
}
