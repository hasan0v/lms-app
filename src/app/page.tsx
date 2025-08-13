"use client"
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { useAuth } from '@/contexts/AuthContext'
import { usePathname, useRouter } from 'next/navigation'
import { BookIcon, CheckCircleIcon, UsersIcon, ArrowRightIcon } from '@/components/landing/Icons'
import { AIInsights } from '@/components/landing/AIInsights'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  useEffect(() => { if (!loading && user && pathname !== '/dashboard') router.replace('/dashboard') }, [user, loading, router, pathname])

  if (loading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="relative">
          <div className="animate-spin rounded-full h-32 w-32 border-4 border-indigo-200" />
          <div className="animate-spin rounded-full h-32 w-32 border-4 border-indigo-600 border-t-transparent absolute top-0 left-0" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-pulse">
              <Logo size="lg" showText uppercase={false} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-32 w-[500px] h-[500px] bg-gradient-to-br from-purple-400/20 to-indigo-400/20 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-32 w-[500px] h-[500px] bg-gradient-to-tr from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-purple-300/10 to-pink-300/10 rounded-full blur-2xl animate-pulse-gentle" />
      </div>
      <div className="relative z-10">
        <nav className="glass backdrop-blur-xl border-0 shadow-xl bg-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <Logo size="md" uppercase showText />
              </div>
              <div className="flex items-center space-x-3">
                {/* Sign In (Access Portal) */}
                <Link
                  href="/auth/signin"
                  aria-label="Panelə giriş"
                  className="relative group font-semibold text-gray-700 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300/40 rounded-xl"
                >
                  <span className="inline-flex items-center px-6 py-3 rounded-xl border border-gray-300/50 bg-white/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 hover:bg-white/80 hover:border-indigo-300/60">
                    <span className="relative flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span>Panelə Giriş</span>
                    </span>
                  </span>
                  <span className="absolute inset-0 rounded-xl ring-2 ring-transparent group-hover:ring-indigo-400/40 transition duration-300" />
                </Link>
                {/* Sign Up (Begin Evolution) */}
                <Link
                  href="/auth/signup"
                  aria-label="İnkişafını başlat"
                  className="relative group font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-300/40 rounded-2xl"
                >
                  <span className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                    <span className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-white/20 blur-md transition" />
                    <span className="relative flex items-center gap-2">
                      <span className="text-yellow-300">⚡</span>
                      <span>İnkişafa Başla</span>
                      <ArrowRightIcon className="w-5 h-5 ml-1" />
                    </span>
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main>
          {/* HERO */}
          <section id="hero" className="relative pt-24 md:pt-32 pb-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="inline-flex items-center px-5 py-2 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm text-sm font-medium text-gray-700">
                  <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                  Real vaxtlı AI Dəstəklı Təhsil • 2025
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
                  Öyrənməni <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Yenidən Tərif Et</span>
                </h1>
                <p className="text-lg md:text-xl text-gray-600 max-w-xl leading-relaxed">
                  SÜNİ İNTELLEKT; fərdiləşdirilmiş məzmun, adaptiv tapşırıqlar və dərin analitika ilə öyrənmə yolunuzu optimallaşdıran AI əsaslı yeni nəsil platformadır.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/auth/signup" className="btn btn-primary px-8 py-4 text-base font-semibold shadow-lg hover:shadow-xl">
                    İndi Başla <ArrowRightIcon className="w-5 h-5 ml-2" />
                  </Link>
                  <a href="#features" className="btn btn-secondary px-8 py-4 text-base font-semibold">
                    Xüsusiyyətlərə Bax
                  </a>
                </div>
                <div className="flex flex-wrap gap-6 pt-4 text-sm text-gray-500">
                  <div className="flex items-center gap-2"><span className="text-green-500">✓</span> Pulsuz başla</div>
                  <div className="flex items-center gap-2"><span className="text-green-500">✓</span> Kredit kartı tələb olunmur</div>
                  <div className="flex items-center gap-2"><span className="text-green-500">✓</span> Ani izləmə</div>
                </div>
              </div>
              {/* Illustration / Preview Panel */}
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-200/40 via-purple-200/40 to-pink-200/40 rounded-3xl blur-2xl opacity-70 group-hover:opacity-90 transition" />
                <div className="relative glass-card rounded-3xl p-6 md:p-8 overflow-hidden">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-gray-800">Canlı İrəliləyiş Paneli</h3>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600">Demo</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {[
                      { label: 'Tamamlanmış Tapşırıq', value: 82, color: 'from-green-400 to-emerald-500' },
                      { label: 'Aktiv Kurs', value: 6, color: 'from-indigo-400 to-indigo-600' },
                      { label: 'Uğur Faizi', value: 94, color: 'from-purple-400 to-purple-600' },
                      { label: 'Tövsiyə Edilən Məzmun', value: 12, color: 'from-pink-400 to-pink-600' }
                    ].map((s) => (
                      <div key={s.label} className="rounded-xl p-4 bg-white/70 border border-gray-200/70 shadow-sm">
                        <p className="text-xs font-medium text-gray-500 mb-2">{s.label}</p>
                        <div className="flex items-end justify-between">
                          <span className="text-2xl font-bold text-gray-800">{s.value}<span className="text-sm font-medium">{s.label.includes('%') ? '' : s.label === 'Uğur Faizi' ? '%' : ''}</span></span>
                          <span className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} opacity-80`} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="grid gap-3 text-sm">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
                      <span className="font-medium text-gray-700">AI Tövsiyəsi</span>
                      <span className="text-indigo-600 font-semibold">Yeni Tapşırıq</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/70 border border-gray-200">
                      <span className="font-medium text-gray-700">Diqqət Səviyyəsi</span>
                      <span className="text-gray-800">Yüksək</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/70 border border-gray-200">
                      <span className="font-medium text-gray-700">Öyrənmə Ritmi</span>
                      <span className="text-gray-800">Optimal</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* STEPS / HOW IT WORKS */}
          <section id="how" className="py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-14">
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Necə İşləyir?</h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">Ağıllı alqoritmlər öyrənmə tərzinizi analiz edir və şəxsi hədəflərinizə uyğun yeni marşrut qurur.</p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { step: 1, title: 'Profilini Yarat', desc: 'Hədəflərin və maraqlarınla şəxsi öyrənmə xəritən başlasın.' },
                  { step: 2, title: 'AI Analizi', desc: 'Platform performans və davranışlarını analiz edib adaptiv məzmun yaradır.' },
                  { step: 3, title: 'Optimallaşdırılmış Öyrən', desc: 'Fərdiləşdirilmiş tapşırıqlar, izləmə və tövsiyələrlə inkişafını sürətləndir.' }
                ].map(s => (
                  <div key={s.step} className="glass-card rounded-2xl p-8 hover:shadow-xl transition group">
                    <div className="w-14 h-14 mb-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xl shadow-lg group-hover:scale-105 transition">{s.step}</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{s.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CORE FEATURES */}
          <section id="features" className="py-20 bg-gradient-to-b from-white/60 to-white/20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-14">
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Güclü AI Əsaslı Xüsusiyyətlər</h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">Öyrənmə təcrübəsini real vaxtlı geri bildirim və avtomatik fərdiləşdirmə ilə dəyişən modullar.</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                  { icon: <BookIcon className="w-8 h-8" />, title: 'Adaptiv Məzmun Mühərriki', desc: 'İrəliləyiş və davranışını analiz edib hər istifadəçiyə xüsusi marşrut yaradır.' },
                  { icon: <CheckCircleIcon className="w-8 h-8" />, title: 'Performans Proqnozu', desc: 'Statistik modellər yaxın imtahan göstəricilərinizi öncədən təxmin edir.' },
                  { icon: <UsersIcon className="w-8 h-8" />, title: 'Kollektiv Zəka', desc: 'İcma daxilində qarşılıqlı əlaqələri şərh edib əməkdaşlıq tövsiyələri verir.' },
                  { icon: <BookIcon className="w-8 h-8" />, title: 'Tapşırıq Prioritetləşdirmə', desc: 'Zaman və çətinlik parametrlərinə görə edəcəklərin siyahısını tərtib edir.' },
                  { icon: <UsersIcon className="w-8 h-8" />, title: 'Sosial Öyrənmə Analitikası', desc: 'Komanda daxili inkişaf balansını və sinerjini ölçür.' },
                  { icon: <CheckCircleIcon className="w-8 h-8" />, title: 'Ani Geri Bildirim', desc: 'Tamamlanan tapşırıqlardan dərhal mənalı nəticələr çıxarır.' }
                ].map(f => (
                  <div key={f.title} className="glass-card rounded-2xl p-7 flex flex-col hover:shadow-xl transition">
                    <div className="w-14 h-14 mb-5 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg">
                      {f.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed flex-1">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* INTERACTIVE AI INSIGHTS */}
          <AIInsights />

          {/* CATEGORIES (commented out on request)
          <section id="categories" className="py-20 px-4 sm:px-6 lg:px-8">
            ...original categories section removed...
          </section>
          */}

          {/* TESTIMONIALS (commented out on request)
          <Testimonials />
          */}

          {/* CTA */}
          <section id="cta" className="py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto text-center glass-card rounded-3xl p-12 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-64 h-64 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl" />
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6">Öyrənmə Təcrübəni Dönüşdürməyə Hazırsan?</h2>
              <p className="text-lg text-gray-600 mb-10 max-w-3xl mx-auto">Bu gün pulsuz başlayın və platformanın AI gücü ilə şəxsi öyrənmə səyahətinizi necə sürətləndirəcəyini kəşf edin.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/signup" className="btn btn-primary px-10 py-4 text-base font-semibold shadow-lg hover:shadow-xl">Pulsuz Başla <ArrowRightIcon className="w-5 h-5 ml-2" /></Link>
                <Link href="/auth/signin" className="btn btn-secondary px-10 py-4 text-base font-semibold">Daxil Ol</Link>
              </div>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="border-t border-gray-200/60 bg-white/70 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid md:grid-cols-4 gap-12 text-sm">
              <div className="space-y-4">
                <Logo size="md" uppercase showText />
                <p className="text-gray-600 leading-relaxed">AI ile güçlendirilmiş uyarlanabilir içerik ve veriye dayalı öğrenme deneyimi.</p>
                <p className="text-gray-400 text-xs">© {new Date().getFullYear()} SÜNİ İNTELLEKT. Tüm hakları saklıdır.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Platforma</h4>
                <ul className="space-y-2 text-gray-600">
                  <li><a href="#features" className="hover:text-indigo-600 transition">Xüsusiyyətlər</a></li>
                  <li><a href="#how" className="hover:text-indigo-600 transition">Necə İşləyir</a></li>
                  <li><a href="#categories" className="hover:text-indigo-600 transition">Kateqoriyalar</a></li>
                  <li><a href="#cta" className="hover:text-indigo-600 transition">Başla</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Resurslar</h4>
                <ul className="space-y-2 text-gray-600">
                  <li><span className="opacity-70">Bloq (tezliklə)</span></li>
                  <li><span className="opacity-70">Kömək Mərkəzi</span></li>
                  <li><span className="opacity-70">Məxfilik</span></li>
                  <li><span className="opacity-70">Şərtlər</span></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">İcma</h4>
                <ul className="space-y-2 text-gray-600">
                  <li><span className="opacity-70">Discord</span></li>
                  <li><span className="opacity-70">Twitter / X</span></li>
                  <li><span className="opacity-70">LinkedIn</span></li>
                  <li><span className="opacity-70">GitHub</span></li>
                </ul>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  )
}
