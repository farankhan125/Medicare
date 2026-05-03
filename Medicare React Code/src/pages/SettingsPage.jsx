import { useEffect, useMemo, useState, useRef } from 'react'
import DashboardSidebar from '../components/layout/DashboardSidebar'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabase/supabaseClient'

const formatDate = (value) => {
  if (!value) return 'Not set'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not set'
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

const getAge = (dobValue) => {
  if (!dobValue) return null
  const dob = new Date(dobValue)
  if (Number.isNaN(dob.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age -= 1
  return age >= 0 ? age : null
}

function SettingsPage() {
  const { user } = useAuth()
  const isInitialMount = useRef(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const [sendingReset, setSendingReset] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)

  const [notificationPrefs, setNotificationPrefs] = useState({
    emailAlerts: null,
    aiFeature: null,
  })

  const [profile, setProfile] = useState({
    patient_id: '',
    full_name: '',
    gender: '',
    date_of_birth: '',
    blood_type: '',
    allergies: '',
    known_conditions: '',
    weight_kg: '',
    height_cm: '',
    timezone: 'Asia/Karachi',
    organ_donor: false,
    emergency_contact_name: '',
    emergency_contact_number: '',
    emergency_contact_relation: '',
  })

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user?.id) return

      setLoading(true)
      setError('')

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('patient_id,full_name,gender,date_of_birth,blood_type,allergies,known_conditions,weight_kg,height_cm,timezone,organ_donor,emergency_contact_name,emergency_contact_number,emergency_contact_relation,email_alerts,ai_assistant')
        .eq('id', user.id)
        .single()

      if (profileError) {
        setError(profileError.message || 'Could not load settings.')
        setLoading(false)
        return
      }

      setProfile({
        patient_id: data?.patient_id || '',
        full_name: data?.full_name || '',
        gender: data?.gender || '',
        date_of_birth: data?.date_of_birth || '',
        blood_type: data?.blood_type || '',
        allergies: data?.allergies || '',
        known_conditions: data?.known_conditions || '',
        weight_kg: data?.weight_kg || '',
        height_cm: data?.height_cm || '',
        timezone: data?.timezone || 'Asia/Karachi',
        organ_donor: Boolean(data?.organ_donor) || false,
        emergency_contact_name: data?.emergency_contact_name || '',
        emergency_contact_number: data?.emergency_contact_number || '',
        emergency_contact_relation: data?.emergency_contact_relation || '',
      })

      setNotificationPrefs({
        emailAlerts: data?.email_alerts === true,
        aiFeature: data?.ai_assistant === true,
      })

      setLoading(false)
    }

    fetchSettings()
  }, [user?.id])

  useEffect(() => {
    if (!user?.id || isInitialMount.current || notificationPrefs.emailAlerts === null || notificationPrefs.aiFeature === null) return
    const savePrefs = async () => {
      await supabase
        .from('profiles')
        .update({
          email_alerts: notificationPrefs.emailAlerts,
          ai_assistant: notificationPrefs.aiFeature,
        })
        .eq('id', user.id)
    }
    savePrefs()
  }, [notificationPrefs, user?.id])

  useEffect(() => {
    isInitialMount.current = false
  }, [])

  const age = useMemo(() => getAge(profile.date_of_birth), [profile.date_of_birth])
  const conditionList = useMemo(
    () =>
      (profile.known_conditions || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    [profile.known_conditions],
  )

  const displayName = useMemo(
    () => profile.full_name || user?.email?.split('@')?.[0] || 'MediCare User',
    [profile.full_name, user?.email],
  )

  const initials = useMemo(() => {
    const parts = displayName.trim().split(' ').filter(Boolean)
    if (!parts.length) return 'MU'
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }, [displayName])

  const patientId = profile.patient_id || (user?.id ? `P-${user.id.slice(0, 8).toUpperCase()}` : 'P-UNKNOWN')

  const handleProfileField = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
    setError('')
    setSuccess('')
  }

  const handleSaveProfile = async () => {
    if (!user?.id) return

    setSaving(true)
    setError('')
    setSuccess('')

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        known_conditions: profile.known_conditions || null,
        allergies: profile.allergies || null,
        weight_kg: profile.weight_kg || null,
        height_cm: profile.height_cm || null,
        timezone: profile.timezone || 'Asia/Karachi',
        organ_donor: profile.organ_donor,
        emergency_contact_name: profile.emergency_contact_name || null,
        emergency_contact_number: profile.emergency_contact_number || null,
        emergency_contact_relation: profile.emergency_contact_relation || null,
      })
      .eq('id', user.id)

    setSaving(false)

    if (updateError) {
      setError(updateError.message || 'Could not save profile changes.')
      return
    }

    setSuccess('Profile updated successfully.')
    setEditingProfile(false)
  }

  const handleUpdatePassword = async () => {
    if (!user?.email) {
      setError('No email found for this user.')
      return
    }

    setSendingReset(true)
    setError('')
    setSuccess('')

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(user.email)
    setSendingReset(false)

    if (resetError) {
      setError(resetError.message || 'Could not send password reset email.')
      return
    }

    setSuccess('Password reset email sent.')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface font-body text-on-surface">
        <DashboardSidebar activeItem="settings" />
        <main className="ml-64 flex min-h-screen items-center justify-center p-8 lg:p-12">
          <div className="inline-flex items-center gap-3 text-primary">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
            <span className="text-sm font-bold">Loading settings...</span>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface">
      <DashboardSidebar activeItem="settings" />

      <main className="ml-64 min-h-screen p-8 lg:p-12">
        <header className="mb-12">
          <h2 className="mb-2 font-headline text-4xl font-extrabold tracking-tight text-primary">Settings</h2>
          <p className="text-on-surface-variant">Manage your profile, account security, and health notifications.</p>
        </header>

        {error && (
          <div className="mb-6 rounded-xl bg-error-container px-4 py-3 text-sm font-semibold text-on-error-container">{error}</div>
        )}
        {success && (
          <div className="mb-6 rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-white">{success}</div>
        )}

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <div className="flex flex-col gap-8 lg:col-span-8">
            <section className="group relative overflow-hidden rounded-xl bg-surface-container-lowest p-8 shadow-2xl shadow-blue-900/5">
              <div className="flex flex-col items-center gap-8 md:flex-row">
                <div className="relative">
                  <div className="flex h-32 w-32 items-center justify-center rounded-3xl border-4 border-white bg-primary text-4xl font-bold text-white shadow-xl">
                    {initials}
                  </div>
                  <div className="absolute -bottom-2 -right-2 rounded-xl bg-secondary p-2 text-white shadow-lg">
                    <span className="material-symbols-outlined text-sm">verified</span>
                  </div>
                </div>

                <div className="w-full text-center md:text-left">
                  <h3 className="mb-2 text-xl font-bold text-primary">{profile.full_name || 'Name not set'}</h3>
                  <p className="mb-4 text-sm text-on-surface-variant">Patient ID: {patientId}</p>
                  <div className="flex flex-wrap justify-center gap-2 md:justify-start">
                    {profile.gender && (
                      <span className="rounded-full bg-secondary-fixed px-3 py-1 text-xs font-bold text-on-secondary-fixed">
                        {profile.gender}
                      </span>
                    )}
                    {age !== null && (
                      <span className="rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold text-on-primary-fixed">
                        {age} yrs
                      </span>
                    )}
                    {profile.blood_type && (
                      <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-bold text-on-surface-variant">
                        {profile.blood_type}
                      </span>
                    )}
                    {conditionList.map((condition) => (
                      <span className="rounded-full bg-tertiary-fixed px-3 py-1 text-xs font-bold text-on-tertiary-fixed-variant" key={condition}>
                        {condition}
                      </span>
                    ))}
                    {!profile.gender && age === null && !profile.blood_type && !conditionList.length && (
                      <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-bold text-on-surface-variant">No profile tags yet</span>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-xl bg-surface-container-low p-8">
              <div className="mb-8 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">lock</span>
                  <h3 className="font-headline text-xl font-bold text-primary">Account &amp; Security</h3>
                </div>
                <button
                  onClick={() => setEditingProfile(!editingProfile)}
                  className="rounded-lg p-2 text-primary transition-colors hover:bg-surface-container-high"
                  type="button"
                >
                  <span className="material-symbols-outlined">{editingProfile ? 'close' : 'edit'}</span>
                </button>
              </div>

              <div className="space-y-6">
                {!editingProfile ? (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-outline">Gender</label>
                        <p className="rounded-xl bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface">
                          {profile.gender || 'Not set'}
                        </p>
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-outline">Date of Birth</label>
                        <p className="rounded-xl bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface">
                          {formatDate(profile.date_of_birth)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-outline">Blood Type</label>
                        <p className="rounded-xl bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface">
                          {profile.blood_type || 'Not set'}
                        </p>
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-outline">Organ Donor</label>
                        <p className="rounded-xl bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface">
                          {profile.organ_donor ? 'Yes' : 'No'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-outline">Weight (kg)</label>
                        <p className="rounded-xl bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface">
                          {profile.weight_kg ? `${profile.weight_kg} kg` : 'Not set'}
                        </p>
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-outline">Height (cm)</label>
                        <p className="rounded-xl bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface">
                          {profile.height_cm ? `${profile.height_cm} cm` : 'Not set'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-outline">Timezone</label>
                      <p className="rounded-xl bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface">
                        {profile.timezone || 'Asia/Karachi'}
                      </p>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-outline">Known Conditions</label>
                      <p className="rounded-xl bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface">
                        {profile.known_conditions || 'Not set'}
                      </p>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-outline">Allergies</label>
                      <p className="rounded-xl bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface">
                        {profile.allergies || 'Not set'}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-outline">Gender</label>
                        <p className="rounded-xl bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface">
                          {profile.gender || 'Not set'}
                        </p>
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-outline">Date of Birth</label>
                        <p className="rounded-xl bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface">
                          {formatDate(profile.date_of_birth)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-outline">Blood Type</label>
                        <p className="rounded-xl bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface">
                          {profile.blood_type || 'Not set'}
                        </p>
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-outline">Organ Donor</label>
                        <div className="flex items-center justify-between rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3">
                          <p className="text-sm text-on-surface-variant">Register as organ donor</p>
                          <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                            <input
                              checked={profile.organ_donor}
                              className="peer sr-only"
                              onChange={(e) => handleProfileField('organ_donor', e.target.checked)}
                              type="checkbox"
                            />
                            <div className="h-6 w-11 rounded-full bg-surface-dim after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full" />
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-outline">Weight (kg)</label>
                        <input
                          className="w-full rounded-xl border-none bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:ring-2 focus:ring-primary/20"
                          onChange={(e) => handleProfileField('weight_kg', e.target.value)}
                          placeholder="e.g. 70"
                          type="number"
                          step="0.1"
                          value={profile.weight_kg || ''}
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-outline">Height (cm)</label>
                        <input
                          className="w-full rounded-xl border-none bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:ring-2 focus:ring-primary/20"
                          onChange={(e) => handleProfileField('height_cm', e.target.value)}
                          placeholder="e.g. 180"
                          type="number"
                          step="0.1"
                          value={profile.height_cm || ''}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-outline">Timezone</label>
                      <select
                        className="w-full appearance-none rounded-xl border-none bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:ring-2 focus:ring-primary/20"
                        onChange={(e) => handleProfileField('timezone', e.target.value)}
                        value={profile.timezone || 'Asia/Karachi'}
                      >
                        <option value="UTC">UTC</option>
                        <option value="Asia/Karachi">Asia/Karachi (PKT)</option>
                        <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                        <option value="Asia/Bangkok">Asia/Bangkok (ICT)</option>
                        <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                        <option value="Asia/Hong_Kong">Asia/Hong Kong (HKT)</option>
                        <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                        <option value="Australia/Sydney">Australia/Sydney (AEDT)</option>
                        <option value="Europe/London">Europe/London (GMT)</option>
                        <option value="Europe/Paris">Europe/Paris (CET)</option>
                        <option value="America/New_York">America/New York (EST)</option>
                        <option value="America/Los_Angeles">America/Los Angeles (PST)</option>
                        <option value="America/Toronto">America/Toronto (EST)</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-outline">Known Conditions</label>
                      <textarea
                        className="min-h-[70px] w-full rounded-xl border-none bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:ring-2 focus:ring-primary/20"
                        onChange={(e) => handleProfileField('known_conditions', e.target.value)}
                        placeholder="e.g. Diabetes, Hypertension"
                        value={profile.known_conditions || ''}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-outline">Allergies</label>
                      <textarea
                        className="min-h-[70px] w-full rounded-xl border-none bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:ring-2 focus:ring-primary/20"
                        onChange={(e) => handleProfileField('allergies', e.target.value)}
                        placeholder="e.g. Penicillin, Peanuts"
                        value={profile.allergies || ''}
                      />
                    </div>
                  </>
                )}

                <div className="border-t border-outline-variant/20 pt-6">
                  <h4 className="mb-4 text-sm font-bold text-primary">Emergency Contact</h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-outline">Name</label>
                      {editingProfile ? (
                        <input
                          className="w-full rounded-xl border-none bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:ring-2 focus:ring-primary/20"
                          onChange={(e) => handleProfileField('emergency_contact_name', e.target.value)}
                          placeholder="Full name"
                          type="text"
                          value={profile.emergency_contact_name || ''}
                        />
                      ) : (
                        <p className="rounded-xl bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface">
                          {profile.emergency_contact_name || 'Not set'}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-outline">Phone Number</label>
                      {editingProfile ? (
                        <input
                          className="w-full rounded-xl border-none bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:ring-2 focus:ring-primary/20"
                          onChange={(e) => handleProfileField('emergency_contact_number', e.target.value)}
                          placeholder="+1 (555) 000-0000"
                          type="tel"
                          value={profile.emergency_contact_number || ''}
                        />
                      ) : (
                        <p className="rounded-xl bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface">
                          {profile.emergency_contact_number || 'Not set'}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-outline">Relation</label>
                      {editingProfile ? (
                        <select
                          className="w-full appearance-none rounded-xl border-none bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:ring-2 focus:ring-primary/20"
                          onChange={(e) => handleProfileField('emergency_contact_relation', e.target.value)}
                          value={profile.emergency_contact_relation || ''}
                        >
                          <option value="">Select relation</option>
                          <option value="Father">Father</option>
                          <option value="Mother">Mother</option>
                          <option value="Brother">Brother</option>
                          <option value="Sister">Sister</option>
                          <option value="Spouse">Spouse</option>
                          <option value="Son">Son</option>
                          <option value="Daughter">Daughter</option>
                          <option value="Guardian">Guardian</option>
                          <option value="Grandparent">Grandparent</option>
                          <option value="Uncle/Aunt">Uncle/Aunt</option>
                          <option value="Cousin">Cousin</option>
                          <option value="Friend">Friend</option>
                          <option value="Other">Other</option>
                        </select>
                      ) : (
                        <p className="rounded-xl bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface">
                          {profile.emergency_contact_relation || 'Not set'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {editingProfile && (
                  <div className="border-t border-outline-variant/20 pt-6">
                    <div className="flex flex-col justify-between gap-4 rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-4">
                      <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-outline">Password</label>
                        <p className="font-semibold text-on-surface">****************</p>
                      </div>
                      <button
                        className="text-sm font-bold text-primary-container hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={sendingReset}
                        onClick={handleUpdatePassword}
                        type="button"
                      >
                        {sendingReset ? 'Sending...' : 'Update Password'}
                      </button>
                    </div>
                  </div>
                )}

                {editingProfile && (
                  <div className="flex justify-end">
                    <button
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={saving}
                      onClick={handleSaveProfile}
                      type="button"
                    >
                      {saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="flex flex-col gap-8 lg:col-span-4">
            <section className="rounded-xl bg-surface-container-lowest p-8 shadow-lg shadow-blue-900/5">
              <div className="mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">notifications</span>
                <h3 className="font-headline text-xl font-bold text-primary">Notifications</h3>
              </div>

              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-primary">Email Alerts</p>
                    <p className="text-xs text-on-surface-variant">Weekly health summaries and dose reminders</p>
                  </div>
                  <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                    <input
                      checked={notificationPrefs.emailAlerts}
                      className="peer sr-only"
                      onChange={(e) => setNotificationPrefs((prev) => ({ ...prev, emailAlerts: e.target.checked }))}
                      type="checkbox"
                    />
                    <div className="h-6 w-11 rounded-full bg-surface-dim after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full"></div>
                  </label>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-primary">AI Assistant</p>
                    <p className="text-xs text-on-surface-variant">Enable AI Assistant for personalized health guidance</p>
                  </div>
                  <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                    <input
                      checked={notificationPrefs.aiFeature}
                      className="peer sr-only"
                      onChange={(e) => setNotificationPrefs((prev) => ({ ...prev, aiFeature: e.target.checked }))}
                      type="checkbox"
                    />
                    <div className="h-6 w-11 rounded-full bg-surface-dim after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full"></div>
                  </label>
                </div>
              </div>

              <div className="mt-8 border-t border-outline-variant/15 pt-8">
                <div className="flex items-center gap-3 rounded-xl bg-surface-container-low p-4">
                  <span className="material-symbols-outlined text-secondary">bolt</span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-tight text-secondary">AI Insights</p>
                    <p className="text-[10px] leading-tight text-on-surface-variant">Assistant learns your habit patterns to optimize alerts.</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-tertiary/10 bg-tertiary-fixed p-8">
              <div className="mb-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-tertiary">warning</span>
                <h3 className="font-headline text-lg font-bold text-tertiary">Danger Zone</h3>
              </div>
              <p className="mb-6 text-xs leading-relaxed text-tertiary">
                Deleting your account will permanently remove all medical history, dose logs, and AI personalization. This action cannot be undone.
              </p>
              <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-tertiary py-3 text-sm font-bold text-white transition-all hover:opacity-90">
                <span className="material-symbols-outlined text-sm">delete_forever</span>
                Delete Account
              </button>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

export default SettingsPage
