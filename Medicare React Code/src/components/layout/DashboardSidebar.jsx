import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../supabase/supabaseClient'
import EmergencySOSModal from '../EmergencySOSModal'

function DashboardSidebar({ activeItem = 'dashboard' }) {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [profileName, setProfileName] = useState('')
  const [profileCompleted, setProfileCompleted] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [showEmergencyModal, setShowEmergencyModal] = useState(false)

  const navItems = [
    { key: 'dashboard', icon: 'dashboard', label: 'Dashboard', to: '/dashboard' },
    { key: 'medications', icon: 'medication', label: 'Medications', to: '/medications' },
    { key: 'dose-history', icon: 'history', label: 'Dose History', to: '/dose-history' },
    { key: 'ai-assistant', icon: 'smart_toy', label: 'AI Assistant', to: '/ai-assistant' },
    { key: 'settings', icon: 'settings', label: 'Settings', to: '/settings' },
  ]

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return
      const { data } = await supabase
        .from('profiles')
        .select('full_name,profile_completed')
        .eq('id', user.id)
        .single()

      setProfileName(data?.full_name || '')
      setProfileCompleted(Boolean(data?.profile_completed))
    }

    loadProfile()
  }, [user?.id])

  const displayName = useMemo(
    () => profileName || user?.email?.split('@')?.[0] || 'MediCare User',
    [profileName, user?.email],
  )

  const initials = useMemo(() => {
    const parts = displayName.trim().split(' ').filter(Boolean)
    if (!parts.length) return 'MU'
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }, [displayName])

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut()
    setSigningOut(false)
    navigate('/login')
  }

  const handleEmergencySOS = () => {
    setShowEmergencyModal(true)
  }

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-slate-200/20 bg-slate-50/80 font-body backdrop-blur-xl shadow-2xl shadow-blue-900/5">
      <div className="p-6">
        <div className="mb-0.5 flex items-center gap-1.5 font-headline text-2xl font-black tracking-tighter text-primary">
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: '"FILL" 1' }}>
            guardian
          </span>
          MediCare
        </div>
        <div className="ml-0.5 whitespace-nowrap text-[10px] uppercase tracking-[0.16em] text-slate-500">
          Empathetic Guardian
        </div>
      </div>

      <nav className="mt-4 flex-1 space-y-2 px-4">
        {navItems.map((item) => {
          const isActive = item.key === activeItem

          return (
            <Link
              className={
                isActive
                  ? 'flex items-center gap-3 rounded-r-full bg-gradient-to-r from-blue-900 to-blue-700 px-4 py-3 text-sm font-bold text-white'
                  : 'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-200/50 hover:text-blue-800'
              }
              key={item.key}
              to={item.to}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="font-headline">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto p-6">
        <button
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-error py-4 font-bold text-white shadow-lg shadow-error/20 duration-200 active:scale-95"
          onClick={handleEmergencySOS}
          type="button"
        >
          <span className="material-symbols-outlined">emergency</span>
          Emergency SOS
        </button>

        <div className="mt-6 flex items-center gap-3 border-t border-slate-200/20 pt-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-blue-900">{displayName}</p>
            <p className="truncate text-xs text-slate-500">
              {profileCompleted ? 'Active Guardian' : 'Setup Pending'}
            </p>
          </div>
        </div>

        <button
          className="mt-4 w-full rounded-lg bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
          disabled={signingOut}
          onClick={handleSignOut}
          type="button"
        >
          {signingOut ? 'Signing out...' : 'Sign out'}
        </button>
      </div>
    </aside>

    <EmergencySOSModal isOpen={showEmergencyModal} onClose={() => setShowEmergencyModal(false)} />
    </>
  )
}

export default DashboardSidebar
