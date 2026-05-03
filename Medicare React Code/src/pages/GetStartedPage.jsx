import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'

function GetStartedPage() {
  return (
    <div className="bg-surface font-body text-on-surface selection:bg-primary-container selection:text-white min-h-screen">
      <Navbar showCta={false} />

      <div className="fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]"></div>
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-secondary/5 rounded-full blur-[100px]"></div>
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] bg-primary-container/5 rounded-full blur-[150px]"></div>
      </div>

      <main className="min-h-screen flex items-center justify-center pt-24 pb-12 px-6">
        <div className="max-w-md w-full relative">
          <div className="glass-card rounded-xl shadow-2xl shadow-primary/5 border border-white/40 p-8 md:p-10 relative overflow-hidden">
            <div className="relative z-10">
              <header className="mb-10 text-center">
                <h1 className="font-headline text-3xl font-extrabold text-primary tracking-tight mb-2">Get Started</h1>
                <p className="text-on-surface-variant font-body text-sm font-medium leading-relaxed">
                  Join MediCare and start your journey toward personalized, empathetic health management.
                </p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <Link
                  className="w-full bg-surface-container-high text-primary font-headline font-bold py-4 rounded-xl border border-outline-variant/20 hover:bg-surface-container-low transition-all flex items-center justify-center gap-2 group"
                  to="/login"
                >
                  Login
                  <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </Link>
                <Link className="w-full bg-gradient-to-r from-primary to-primary-container text-white font-headline font-bold py-4 rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-2 group" to="/registration">Register<span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span></Link>
              </div>
            </div>

            <div className="absolute -top-10 -right-10 w-32 h-32 bg-secondary/10 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl"></div>
          </div>

          <div className="mt-8 bg-surface-container-lowest/60 backdrop-blur-md rounded-xl p-4 border border-white/40 flex items-center gap-4">
            <div className="w-10 h-10 flex items-center justify-center bg-secondary-container rounded-lg shrink-0">
              <span className="material-symbols-outlined text-on-secondary-container text-xl leading-none">verified_user</span>
            </div>
            <div>
              <h4 className="font-headline font-bold text-sm text-primary leading-tight">Secure Enrollment</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed mt-1">
                Your data is securely stored in our database with RLS protocols to ensure complete medical privacy.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default GetStartedPage

