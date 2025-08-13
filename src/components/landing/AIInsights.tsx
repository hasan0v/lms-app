"use client"
import React, { useState } from 'react'

const tabs = [
  { key: 'performance', label: 'Performans', color: 'from-indigo-500 to-indigo-600' },
  { key: 'recommendations', label: 'Öneriler', color: 'from-purple-500 to-purple-600' },
  { key: 'progress', label: 'İlerleme', color: 'from-pink-500 to-pink-600' }
] as const

const content: Record<string, { title: string; desc: string; bullets: string[] }> = {
  performance: {
    title: 'Gerçek Zamanlı Performans Haritalama',
    desc: 'AI motoru hız, doğruluk ve kavrama oranlarını anlık işler, kritik eşiklere ulaştığında uyarılar üretir.',
    bullets: ['Zayıf konu tespiti', 'Tahmini sınav skoru', 'Odak süresi analizi']
  },
  recommendations: {
    title: 'Öneri Motoru',
    desc: 'Öğrenme stiline göre mikro içeriği, tekrar sıklığını ve görev zorluğunu dengeler.',
    bullets: ['Spaced repetition', 'Zorluk eşleştirme', 'Bağlamsal kaynak seçimi']
  },
  progress: {
    title: 'Derin İlerlemenin Görselleştirilmesi',
    desc: 'Çok katmanlı ilerleme modeli; hedeflere, modüllere ve mikro görev segmentlerine ayrılmıştır.',
    bullets: ['Modül tamamlama trendi', 'Hedef uyum skoru', 'Momentum ölçümü']
  }
}

export const AIInsights: React.FC = React.memo(() => {
  const [active, setActive] = useState<typeof tabs[number]['key']>('performance')
  const activeData = content[active]
  return (
    <section id="insights" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-12 items-start">
          <div className="flex-1 space-y-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">AI İçgörü Katmanı</h2>
              <p className="text-lg text-gray-600 max-w-2xl">Öğrenme sürecini sadece ölçmek değil; anlamlandırmak ve optimize etmek için tasarlanmış veri zekâsı.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => setActive(t.key)}
                  className={`relative px-5 py-2.5 rounded-xl text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${active === t.key ? 'text-white shadow-lg' : 'text-gray-600 hover:text-gray-800 bg-white/70 border border-gray-200'} ${active === t.key ? `bg-gradient-to-r ${t.color}` : ''}`}
                  aria-pressed={active === t.key}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="glass-card rounded-3xl p-8 space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{activeData.title}</h3>
                <p className="text-gray-600 leading-relaxed">{activeData.desc}</p>
              </div>
              <ul className="grid sm:grid-cols-3 gap-4">
                {activeData.bullets.map(b => (
                  <li key={b} className="flex items-center gap-2 text-sm text-gray-700 bg-white/70 border border-gray-200 rounded-xl px-3 py-2">
                    <span className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="text-xs text-gray-500 pt-2">Veriler örnek amaçlıdır. Gerçek panel giriş sonrası gösterilir.</div>
            </div>
          </div>
          <div className="flex-1 w-full relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-indigo-200/30 via-purple-200/30 to-pink-200/30 rounded-3xl blur-2xl" />
            <div className="relative grid gap-4 md:grid-cols-2">
              {['Konsantrasyon', 'Bilgi Kalıcılığı', 'Hız', 'Derinlik'].map((m, i) => (
                <div key={m} className="glass-card p-5 rounded-2xl flex flex-col gap-3 hover:shadow-xl transition">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">{m}</span>
                    <span className="text-xs text-gray-400">AI</span>
                  </div>
                  <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500`} style={{ width: `${65 + i * 8}%` }} />
                  </div>
                  <div className="text-right text-xs font-medium text-gray-500">{65 + i * 8}%</div>
                </div>
              ))}
              <div className="glass-card p-6 rounded-2xl md:col-span-2 flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 mb-2">Öğrenme Momentum Analizi</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">Son 14 gün içinde ilerleme eğrisi yükselişte. AI daha yüksek seviyeli görevler önermeye hazır.</p>
                </div>
                <div className="w-full md:w-56 h-28 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-xs text-gray-500 font-medium">Mini Grafik</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
})
AIInsights.displayName = 'AIInsights'
