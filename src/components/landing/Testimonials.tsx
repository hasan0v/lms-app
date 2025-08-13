"use client"
import React, { useEffect, useState } from 'react'

interface TestimonialItem {
  name: string
  role: string
  quote: string
}

const items: TestimonialItem[] = [
  { name: 'Elif K.', role: 'Öğrenci', quote: 'AI önerileri sayesinde çalışma süremi %30 azaltıp sonuçlarımı yükselttim.' },
  { name: 'Mert A.', role: 'Geliştirici', quote: 'Platform, öğrenme verilerimi anlamlandırarak hangi modüllere odaklanmam gerektiğini netleştirdi.' },
  { name: 'Zeynep T.', role: 'Data Analyst', quote: 'Adaptif içerik motoru tam ihtiyacım olan noktada ekstra kaynak gösteriyor.' }
]

export const Testimonials: React.FC = React.memo(() => {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setIndex(i => (i + 1) % items.length), 6000)
    return () => clearInterval(id)
  }, [])
  return (
    <section id="testimonials" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white/40 to-transparent">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Öğrenciler Ne Diyor?</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">Deneyimi yaşayan kullanıcılarımızdan kısa geri bildirimler.</p>
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
          {items.map((t, i) => (
            <div key={t.name} className={`glass-card rounded-2xl p-8 flex flex-col justify-between transition ${i === index ? 'ring-2 ring-indigo-500/60' : 'opacity-80 hover:opacity-100'}`}>
              <p className="text-gray-700 leading-relaxed mb-6">“{t.quote}”</p>
              <div>
                <p className="font-semibold text-gray-900">{t.name}</p>
                <p className="text-sm text-gray-500">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-2 mt-10">
          {items.map((_, i) => (
            <button key={i} onClick={() => setIndex(i)} aria-label={`Gösterim ${i + 1}`} className={`w-3 h-3 rounded-full transition ${i === index ? 'bg-gradient-to-r from-indigo-500 to-purple-600' : 'bg-gray-300 hover:bg-gray-400'}`}/>
          ))}
        </div>
      </div>
    </section>
  )
})
Testimonials.displayName = 'Testimonials'
