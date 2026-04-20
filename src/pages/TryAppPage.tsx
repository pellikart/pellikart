import LandingNav from '@/components/LandingNav'

export default function TryAppPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontSize: '16px' }}>
      <LandingNav />

      <section className="pt-28 pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[2px] text-mustard mb-3">
            SEE IT IN ACTION
          </p>
          <h1 className="font-serif text-center text-[36px] md:text-[44px] font-bold text-dark leading-tight mb-3">
            This isn't a vendor list.<br />It's your wedding planner.
          </h1>
          <p className="text-center text-[16px] text-gray-500 max-w-2xl mx-auto mb-10">
            Try Pellikart right now — explore real ritual boards, compare vendors side by side, build your own dream wedding board. No signup needed.
          </p>

          {/* Embedded mock app */}
          <div className="flex flex-col items-center mb-12">
            <p className="text-[11px] text-gray-500 mb-3 font-medium">Live preview · Tap to interact</p>
            <div className="relative" style={{ width: '380px', maxWidth: '100%', height: '760px' }}>
              <div className="w-full h-full bg-dark rounded-[40px] p-3.5 shadow-2xl">
                <div className="w-full h-full bg-white rounded-[28px] overflow-hidden relative">
                  <iframe
                    src="/?embed=1"
                    className="w-full h-full border-0"
                    title="Pellikart interactive preview"
                  />
                </div>
              </div>
              <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-28 h-6 bg-dark rounded-b-2xl z-10" />
            </div>
          </div>

          {/* Feature grid */}
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { title: 'Visual mood boards', body: 'Pinterest-style ritual boards for every event. Nischitartham, Pelli, Reception, Sangeeth — each with its own dates, vendors, and budget.' },
              { title: 'Side-by-side comparison', body: 'Compare shortlisted vendors across price, style, capacity, area, and ratings. Best values highlighted automatically. Decisions made easy.' },
              { title: 'Slot booking', body: 'Book all your vendors at once with just 10% upfront. Or book individually at 11%. Either way, your slots are locked the moment you pay.' },
              { title: 'Family collaboration', body: 'Share boards with family. They like, suggest, and stay updated — all in the app. No more 6 WhatsApp groups.' },
              { title: 'Live progress tracking', body: 'Every vendor has a live milestone timeline. Know exactly where things stand at any moment. Your family does too.' },
              { title: 'Transparent pricing', body: 'Every vendor has fixed packages with real prices. No hidden charges. No surprise invoices. What you see is what you pay.' },
            ].map((f, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 hover:shadow-md transition-shadow">
                <div className="w-8 h-8 rounded-lg bg-magenta-light flex items-center justify-center mb-2.5">
                  <span className="text-magenta text-xs">✦</span>
                </div>
                <h4 className="text-[15px] font-bold text-dark mb-1.5">{f.title}</h4>
                <p className="text-[13px] text-gray-500 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
