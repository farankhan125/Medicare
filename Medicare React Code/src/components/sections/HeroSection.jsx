import { Link } from 'react-router-dom'

function HeroSection() {
  return (
    <section className="relative min-h-[620px] md:min-h-[700px] flex items-center pt-24 pb-8 overflow-hidden hero-gradient">
      <div
        className="absolute inset-0 opacity-20"
        data-alt="smooth gradient flowing from deep navy to soft lavender with subtle grain texture and ethereal light pulses"
      ></div>
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/10 to-transparent"></div>
      <div className="absolute top-1/4 left-10 w-24 h-24 bg-secondary-container/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-10 w-48 h-48 bg-primary-container/30 rounded-full blur-3xl"></div>
      <div className="absolute -top-16 right-[18%] w-72 h-72 bg-secondary-fixed/20 rounded-full blur-[120px]"></div>

      <div className="container mx-auto px-8 relative z-10 flex flex-col md:flex-row items-center gap-14 lg:gap-20">
        <div className="w-full md:w-1/2 space-y-9">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold tracking-widest uppercase backdrop-blur-md">
            <span className="material-symbols-outlined text-[14px]">verified_user</span>
            Your Personal Health Guardian
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-headline font-extrabold text-white leading-[1.05] tracking-tight">
            Take Control of Your <span className="text-secondary-fixed drop-shadow-sm">Health</span>
          </h1>

          <p className="text-lg text-primary-fixed/90 leading-relaxed max-w-xl font-body">
            MediCare seamlessly blends clinical precision with empathetic guidance. Manage medications, track vitals,
            and consult our AI assistant in one high-end health ecosystem.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link className="group px-8 py-4 rounded-2xl font-bold text-lg text-on-secondary-fixed bg-gradient-to-r from-secondary-fixed to-secondary-container border border-white/40 shadow-[0_12px_30px_-12px_rgba(0,110,28,0.65)] hover:shadow-[0_20px_44px_-16px_rgba(0,110,28,0.8)] hover:-translate-y-1 hover:saturate-125 transition-all duration-300 active:scale-95" to="/get-started">
              Get Started
            </Link>
          </div>
        </div>

        <div className="w-full md:w-1/2 relative max-w-[460px] md:max-w-[520px] mx-auto">
          <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-secondary-fixed/30 to-transparent blur-3xl scale-95"></div>
          <div className="relative z-10 p-4 rounded-[2.5rem] bg-white/10 backdrop-blur-xl border border-white/25 shadow-2xl">
            <img
              alt="professional medical dashboard interface on a sleek tablet showing heart rate graphs and medication schedules"
              className="rounded-[2rem] w-full max-h-[520px] object-cover shadow-inner"
              data-alt="high-end tablet displaying a clean medical dashboard with soft green pulse waves and elegant health statistics cards"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA4KqeCcue6ZckejBdV4mhAe57NQ5xo8k-8hwICefB-1yK131uzZtMhYtWHKgcT5abEtJJb98rgbxFAJsWtLxBvzuHl9uZgPjrV3U_BFwEazQ1CdV6TKcLX9AYP2ngyzkPdDGK8KtqU55vj8eaDEXNPArJ9RK3hvfrD0vvzlY1r3auRljfkO5Oj9EeevFdh7fuXF4fZRtL-U08kOkQQAlTbAGzbA2JnPgIAsoxtR16wC_OnmUsrAb3LloyrjEex2up7ucrVJnzlx0_r"
            />
          </div>

          <div className="absolute top-4 sm:top-6 md:top-8 right-1 sm:right-0 z-30 translate-x-0 sm:translate-x-1/4 md:translate-x-1/2">
            <div className="w-24 sm:w-28 md:w-32 glass-panel p-2.5 sm:p-3 md:p-4 rounded-2xl shadow-xl border border-white/40 flex flex-col items-center gap-1.5 sm:gap-2 animate-bounce">
              <span className="material-symbols-outlined text-3xl md:text-4xl text-secondary" data-weight="fill">
                pill
              </span>
              <span className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Medication</span>
            </div>
          </div>

          <div className="absolute top-[56%] sm:top-1/2 left-1 sm:left-0 z-30 -translate-x-0 sm:-translate-x-1/4 md:-translate-x-1/2 -translate-y-1/2">
            <div
              className="w-28 sm:w-28 md:w-32 glass-panel p-2.5 sm:p-3 md:p-4 rounded-2xl shadow-xl border border-white/40 flex flex-col items-center gap-1.5 sm:gap-2 animate-bounce"
              style={{ animationDelay: '0.2s' }}
            >
              <span className="material-symbols-outlined text-3xl md:text-4xl text-blue-600" data-weight="fill">
                notifications_active
              </span>
              <span className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-tight text-center leading-tight">
                <span className="block">Smart</span>
                <span className="block">Reminder</span>
              </span>
            </div>
          </div>

          <div className="absolute bottom-1 sm:bottom-0 left-1/2 z-30 -translate-x-1/2 translate-y-1/4 sm:translate-y-1/3">
            <div
              className="w-24 sm:w-28 md:w-32 glass-panel p-2.5 sm:p-3 md:p-4 rounded-2xl shadow-xl border border-white/40 flex flex-col items-center gap-1.5 sm:gap-2 animate-bounce"
              style={{ animationDelay: '0.4s' }}
            >
              <span className="material-symbols-outlined text-3xl md:text-4xl text-tertiary">smart_toy</span>
              <span className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-tighter">AI Assistant</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection



