function FeaturesSection() {
  return (
    <section className="py-20 md:py-24 bg-surface relative overflow-hidden" id="feature-suite">
      <div className="absolute -top-20 -left-16 w-72 h-72 bg-primary/10 rounded-full blur-[110px]"></div>
      <div className="absolute -bottom-24 -right-10 w-80 h-80 bg-secondary/10 rounded-full blur-[120px]"></div>
      <div className="container mx-auto px-8 relative z-10">
        <div className="max-w-3xl mb-12 md:mb-14 mx-auto text-center">
          <div className="feature-suite-badge">
            <span className="material-symbols-outlined text-base">auto_awesome</span>
            Feature Suite
          </div>
          <h2 className="text-4xl md:text-5xl font-headline font-extrabold text-primary mb-5 tracking-tight">
            Precision tools for modern care.
          </h2>
          <p className="text-on-surface-variant text-lg leading-relaxed">
            We've redesigned the medical experience to be intuitive, respectful, and powerful.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-7">
          <div className="group p-8 rounded-[1.75rem] bg-white/75 backdrop-blur-xl border border-white/60 hover:border-secondary/30 transition-all duration-300 shadow-[0_18px_45px_-20px_rgba(2,36,72,0.25)] hover:-translate-y-1 flex flex-col">
            <div className="w-14 h-14 rounded-2xl bg-secondary-container flex items-center justify-center mb-7 mx-auto group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl text-on-secondary-container" data-weight="fill">
                notifications_active
              </span>
            </div>
            <h3 className="text-2xl font-headline font-bold text-primary mb-3 text-center">Smart Reminders</h3>
            <p className="text-on-surface-variant font-body leading-relaxed mb-7">
              Adaptive alerts that understand your routine. Never miss a dose, even when your schedule shifts.
            </p>
            <div className="mt-auto">
              <a className="inline-flex items-center gap-2 text-primary font-bold text-sm group-hover:gap-3 transition-all" href="#">
                Learn More
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </a>
            </div>
          </div>

          <div className="group p-8 rounded-[1.75rem] bg-white/80 backdrop-blur-xl border border-primary/25 transition-all duration-300 shadow-[0_24px_52px_-24px_rgba(2,36,72,0.45)] hover:-translate-y-1 flex flex-col relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-7 mx-auto group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl text-on-primary">smart_toy</span>
            </div>
            <h3 className="text-2xl font-headline font-bold text-primary mb-3 text-center">AI Health Assistant</h3>
            <p className="text-on-surface-variant font-body leading-relaxed mb-7">
              Empathetic analysis of your health data. Ask questions, get insights, and stay informed 24/7.
            </p>
            <div className="mt-auto">
              <a className="inline-flex items-center gap-2 text-primary font-bold text-sm group-hover:gap-3 transition-all" href="#">
                Meet Your Guardian
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </a>
            </div>
          </div>

          <div className="group p-8 rounded-[1.75rem] bg-white/75 backdrop-blur-xl border border-white/60 hover:border-tertiary/30 transition-all duration-300 shadow-[0_18px_45px_-20px_rgba(2,36,72,0.25)] hover:-translate-y-1 flex flex-col">
            <div className="w-14 h-14 rounded-2xl bg-tertiary-fixed flex items-center justify-center mb-7 mx-auto group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl text-tertiary" data-weight="fill">
                history_edu
              </span>
            </div>
            <h3 className="text-2xl font-headline font-bold text-primary mb-3 text-center">Medication Tracking</h3>
            <p className="text-on-surface-variant font-body leading-relaxed mb-7">
              A comprehensive, effortless log of your pharmaceutical journey. Precision data for your doctor visits.
            </p>
            <div className="mt-auto">
              <a className="inline-flex items-center gap-2 text-primary font-bold text-sm group-hover:gap-3 transition-all" href="#">
                View Logs
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FeaturesSection
