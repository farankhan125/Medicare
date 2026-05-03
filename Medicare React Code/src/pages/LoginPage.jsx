import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import { supabase } from '../supabase/supabaseClient'

function LoginPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    })

    if (signInError) {
      setLoading(false)
      if (signInError.message.includes('Email not confirmed')) {
        sessionStorage.setItem('otp_email', formData.email)
        navigate('/registration')
      } else if (signInError.message.includes('Invalid login credentials')) {
        setError('Incorrect email or password. Please try again.')
      } else {
        setError(signInError.message)
      }
      return
    }

    setLoading(false)
    navigate('/dashboard')
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col font-body">
      <Navbar showCta={false} />

      <main className="flex-grow flex items-center justify-center pt-28 pb-6 px-6 relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary-fixed-dim/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-secondary-fixed/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-md w-full relative z-10">
          <div className="glass-card p-10 rounded-xl shadow-2xl shadow-primary/5 border border-white/40 flex flex-col gap-8">
            <div className="text-center">
              <h1 className="text-3xl font-extrabold tracking-tight text-primary mb-2 font-headline">Welcome Back</h1>
              <p className="text-on-surface-variant text-sm font-medium">Access your personalized health dashboard</p>
            </div>

            {error && <div className="rounded-lg bg-error-container px-4 py-2 text-sm font-semibold text-on-error-container">{error}</div>}

            <form className="flex flex-col gap-6" onSubmit={handleLogin}>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1" htmlFor="email">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-outline">mail</span>
                  <input
                    className="w-full pl-12 pr-4 py-4 bg-surface-container-high rounded-xl text-on-surface focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest outline-none border-none transition-all placeholder:text-outline-variant"
                    id="email"
                    name="email"
                    onChange={handleChange}
                    placeholder="name@example.com"
                    required
                    type="email"
                    value={formData.email}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant" htmlFor="password">
                    Password
                  </label>
                  <a className="text-xs font-semibold text-primary hover:underline" href="#">
                    Forgot password?
                  </a>
                </div>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-outline">lock</span>
                  <input
                    className="w-full pl-12 pr-4 py-4 bg-surface-container-high rounded-xl text-on-surface focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest outline-none border-none transition-all placeholder:text-outline-variant"
                    id="password"
                    name="password"
                    onChange={handleChange}
                    placeholder="********"
                    required
                    type="password"
                    value={formData.password}
                  />
                </div>
              </div>

              <button className="mt-2 w-full py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex justify-center items-center gap-2 group" disabled={loading} type="submit">
                {loading ? 'Logging in...' : 'Login'}
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
            </form>

            <div className="text-center pt-2">
              <p className="text-sm text-on-surface-variant font-medium">
                New to MediCare?{' '}
                <Link className="text-primary font-bold hover:underline" to="/registration">
                  Register
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex absolute bottom-12 right-12 flex-col gap-4 max-w-sm pointer-events-none">
          <div className="glass-card p-6 rounded-xl border border-white/20 shadow-xl">
            <span className="material-symbols-outlined text-secondary-fixed-dim text-4xl mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>
              format_quote
            </span>
            <p className="italic text-on-surface-variant font-medium leading-relaxed">
              "The Empathetic Guardian of your health journey. Modern care meets human touch."
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-fixed overflow-hidden">
                <img
                  alt="Faran Khan"
                  className="w-full h-full object-cover"
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop"
                />
              </div>
              <div>
                <p className="text-xs font-bold text-primary">Faran Khan</p>
                <p className="text-[10px] text-outline">Software Engineer</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default LoginPage

