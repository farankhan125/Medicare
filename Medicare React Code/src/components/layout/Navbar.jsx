import { Link } from 'react-router-dom'

function Navbar({ ctaLabel = 'Login', ctaTo = '/login', showCta = true }) {
  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-7xl z-50">
      <div className={`min-h-[76px] md:h-24 px-4 sm:px-5 md:px-8 rounded-2xl border border-white/30 bg-white/65 dark:bg-slate-950/60 backdrop-blur-2xl shadow-xl shadow-blue-900/10 grid items-center gap-4 grid-cols-[1fr_auto] ${showCta ? 'md:grid-cols-[auto_1fr_auto]' : 'md:grid-cols-[1fr_auto_1fr]'}`}>
        <div className="flex items-center">
          <Link to="/" className="py-1.5 px-2">
            <div className="text-xl sm:text-2xl font-black tracking-tighter text-primary font-headline flex items-center gap-1.5 mb-0.5">
              <span className="material-symbols-outlined text-xl sm:text-2xl" style={{ fontVariationSettings: '"FILL" 1' }}>
                guardian
              </span>
              MediCare
            </div>
            <div className="text-[9px] sm:text-[10px] font-body text-slate-500 uppercase tracking-[0.16em] ml-0.5 whitespace-nowrap">
              Empathetic Guardian
            </div>
          </Link>
        </div>

        <div className="hidden md:flex items-center justify-center gap-7 font-headline font-semibold text-sm">
          <a className="text-slate-600 hover:text-blue-800 transition-colors" href="/#feature-suite">
            Features
          </a>
          <a className="text-slate-600 hover:text-blue-800 transition-colors" href="#">
            About Us
          </a>
          <Link className="text-slate-600 hover:text-blue-800 transition-colors" to="/privacy-policy">
            Privacy Policy
          </Link>
        </div>

        {showCta ? (
          <div className="hidden md:flex items-center justify-end gap-3">
            <Link
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-on-primary bg-gradient-to-r from-primary to-primary-container border border-white/30 shadow-[0_12px_24px_-12px_rgba(2,36,72,0.8)] hover:shadow-[0_18px_30px_-14px_rgba(2,36,72,0.9)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300"
              to={ctaTo}
            >
              {ctaLabel}
            </Link>
          </div>
        ) : (
          <div className="hidden md:block"></div>
        )}

        <details className="md:hidden relative">
          <summary className="list-none cursor-pointer w-11 h-11 rounded-xl border border-outline-variant/30 bg-white/70 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">menu</span>
          </summary>
          <div className="absolute right-0 mt-3 w-64 p-4 rounded-2xl border border-white/30 bg-white/90 backdrop-blur-xl shadow-2xl shadow-blue-900/15">
            <div className="flex flex-col gap-1 font-headline font-semibold text-sm mb-3">
              <a className="px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors" href="/#feature-suite">
                Features
              </a>
              <a className="px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors" href="#">
                About Us
              </a>
              <Link className="px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors" to="/privacy-policy">
                Privacy Policy
              </Link>
            </div>
            <div className="flex gap-2">
              {showCta && (
                <Link
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-on-primary bg-gradient-to-r from-primary to-primary-container shadow-[0_12px_24px_-14px_rgba(2,36,72,0.85)] hover:-translate-y-0.5 transition-all duration-300 text-center"
                  to={ctaTo}
                >
                  {ctaLabel}
                </Link>
              )}
            </div>
          </div>
        </details>
      </div>
    </nav>
  )
}

export default Navbar
