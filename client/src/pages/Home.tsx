import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronRight, Zap, TrendingUp, Shield, Code2, Lightbulb } from "lucide-react";
import { useState } from "react";
import App from "@/components/App";

export default function Home() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-slate-50 dark:to-slate-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="absolute inset-0 -z-10">
          <img 
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663620541667/mEMGKNMJyS4HaKSQrNU9t8/hero-banner-hvezDJUCCNGakGEvbjLKwq.webp"
            alt="Hero Banner"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent"></div>
        </div>
        
        <div className="container max-w-6xl mx-auto px-4 relative z-10">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight text-foreground">
              명리학 기반<br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">사주 AI 비즈니스</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              전통 명리학과 현대 AI 기술의 만남. 사주팔자 프로그램 개발부터 비즈니스 전략까지 종합 연구 보고서입니다.
            </p>
            <div className="flex gap-4">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                보고서 읽기 <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline">
                기술 스택 살펴보기
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Key Metrics Section */}
      <section className="py-16 bg-slate-50 dark:bg-slate-900/50">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: '개발 기간', value: '6-8주', icon: Zap },
              { label: '초기 투자', value: '450-600만원', icon: TrendingUp },
              { label: '월 운영비', value: '5-15만원', icon: Code2 },
              { label: '손익분기점', value: '1-2개월', icon: Lightbulb },
            ].map((metric, i) => {
              const Icon = metric.icon;
              return (
                <Card key={i} className="p-6 border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
                  <Icon className="h-8 w-8 text-blue-600 mb-3" />
                  <p className="text-sm text-muted-foreground mb-2">{metric.label}</p>
                  <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Content Tabs Section */}
      <section className="py-20">
        <div className="container max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold mb-12 text-center text-foreground">
            종합 연구 내용
          </h2>

          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 mb-12 border-b border-border">
            {[
              { id: 'saju', label: '사주 계산' },
              { id: 'overview', label: '개요' },
              { id: 'technology', label: '기술 구현' },
              { id: 'business', label: '비즈니스' },
              { id: 'costs', label: '비용 분석' },
              { id: 'roadmap', label: '실행 계획' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="space-y-8">
            {activeTab === 'saju' && (
              <div className="space-y-6">
                <Card className="p-8 bg-white dark:bg-gray-900">
                  <App />
                </Card>
              </div>
            )}

            {activeTab === 'overview' && (
              <div className="space-y-6">
                <Card className="p-8">
                  <h3 className="text-2xl font-bold mb-4 text-foreground">프로젝트 개요</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    본 보고서는 명리학 기반 사주팔자 프로그램 개발 및 비즈니스 전략에 대한 종합 연구 결과를 담고 있습니다. 사주 원국 로직 구현부터 AI 연계 해석, 플랫폼 전략, 개발 비용 산정, 그리고 운영상 고려사항까지 실무 기반의 실질적인 정보를 제공합니다.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    {[
                      { title: '기술적 구현', desc: '사주 계산 + AI 해석' },
                      { title: '비즈니스 전략', desc: '당근마켓 + 멀티채널' },
                      { title: '수익화 모델', desc: 'B2C + B2B + 교육' },
                    ].map((item, i) => (
                      <div key={i} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <p className="font-semibold text-foreground mb-1">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'technology' && (
              <div className="space-y-6">
                <Card className="p-8">
                  <h3 className="text-2xl font-bold mb-4 text-foreground">기술 스택</h3>
                  <img 
                    src="https://d2xsxph8kpxj0f.cloudfront.net/310519663620541667/mEMGKNMJyS4HaKSQrNU9t8/tech-stack-visual-mwfgessBqKgK6N9B4wM8eZ.webp"
                    alt="Technology Stack"
                    className="w-full rounded-lg mb-6"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { label: '사주 계산', tech: 'sajupy / manseryeok' },
                      { label: 'AI 해석', tech: 'GPT-4o / Claude 3.5' },
                      { label: '프론트엔드', tech: 'React / Flutter' },
                      { label: '백엔드', tech: 'Node.js / FastAPI' },
                    ].map((item, i) => (
                      <div key={i} className="p-4 border border-border rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">{item.label}</p>
                        <p className="font-semibold text-foreground">{item.tech}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'business' && (
              <div className="space-y-6">
                <Card className="p-8">
                  <h3 className="text-2xl font-bold mb-4 text-foreground">비즈니스 프로세스</h3>
                  <img 
                    src="https://d2xsxph8kpxj0f.cloudfront.net/310519663620541667/mEMGKNMJyS4HaKSQrNU9t8/business-process-flow-DnABPaMVfFykEcnbmsA6Gp.webp"
                    alt="Business Process"
                    className="w-full rounded-lg mb-6"
                  />
                  <p className="text-muted-foreground leading-relaxed">
                    당근마켓을 초기 진입 채널로 활용하여 지역 기반 신뢰를 구축하고, 이후 유튜브, 블로그, 스레드 등 멀티채널로 확장합니다. 자동화 도구(n8n)를 통해 운영 공수를 최소화하고, B2B 제휴로 장기적 수익성을 확보합니다.
                  </p>
                </Card>
              </div>
            )}

            {activeTab === 'costs' && (
              <div className="space-y-6">
                <Card className="p-8">
                  <h3 className="text-2xl font-bold mb-4 text-foreground">수익 모델</h3>
                  <img 
                    src="https://d2xsxph8kpxj0f.cloudfront.net/310519663620541667/mEMGKNMJyS4HaKSQrNU9t8/revenue-model-chart-UdTwBrX7VNo3pxR9UrbBVm.webp"
                    alt="Revenue Model"
                    className="w-full rounded-lg mb-6"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { title: 'B2C (60%)', items: ['무료 기본 운세', '심층 리포트: 2,900-9,900원', '구독: 9,900-14,900원/월'] },
                      { title: 'B2B (30%)', items: ['API 제공: 100-500만원/월', '화이트라벨: 200-1,000만원/월'] },
                      { title: '교육 (10%)', items: ['콘텐츠 제공: 500-2,000만원/과정'] },
                    ].map((model, i) => (
                      <Card key={i} className="p-4 bg-slate-50 dark:bg-slate-900">
                        <p className="font-bold text-foreground mb-3">{model.title}</p>
                        <ul className="space-y-2">
                          {model.items.map((item, j) => (
                            <li key={j} className="text-sm text-muted-foreground flex items-start">
                              <span className="mr-2">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </Card>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'roadmap' && (
              <div className="space-y-6">
                <Card className="p-8">
                  <h3 className="text-2xl font-bold mb-4 text-foreground">실행 로드맵</h3>
                  <img 
                    src="https://d2xsxph8kpxj0f.cloudfront.net/310519663620541667/mEMGKNMJyS4HaKSQrNU9t8/timeline-roadmap-i4Jim2gvCs5yWE5nSRrru7.webp"
                    alt="Timeline Roadmap"
                    className="w-full rounded-lg"
                  />
                </Card>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">전체 보고서 다운로드</h2>
          <p className="text-xl mb-8 opacity-90">
            명리학 기반 사주 AI 비즈니스의 모든 정보를 담은 종합 보고서를 지금 확인하세요.
          </p>
          <Button size="lg" className="bg-white text-blue-600 hover:bg-slate-100">
            PDF 보고서 다운로드
          </Button>
        </div>
      </section>
    </div>
  );
}
