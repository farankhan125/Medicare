import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabase/supabaseClient'

function EmergencySOSModal({ isOpen, onClose }) {
  const { user } = useAuth()
  const [emergencyInfo, setEmergencyInfo] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !user?.id) return

    const fetchEmergencyInfo = async () => {
      setLoading(true)

      const { data } = await supabase
        .from('profiles')
        .select(
          'patient_id,full_name,blood_type,allergies,known_conditions,organ_donor,emergency_contact_name,emergency_contact_number,emergency_contact_relation,date_of_birth,weight_kg,height_cm',
        )
        .eq('id', user.id)
        .single()

      setEmergencyInfo(data)
      setLoading(false)
    }

    fetchEmergencyInfo()
  }, [isOpen, user?.id])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-outline-variant/20 bg-error px-8 py-6">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-3xl text-white">emergency</span>
            <div>
              <h2 className="font-headline text-2xl font-bold text-white">Emergency Information</h2>
              <p className="text-sm text-white/80">Patient Medical & Contact Details</p>
            </div>
          </div>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/20"
            onClick={onClose}
            type="button"
          >
            <span className="material-symbols-outlined text-white">close</span>
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-on-surface-variant">Loading emergency information...</p>
          </div>
        ) : emergencyInfo ? (
          <div className="p-8 space-y-6">
            {/* Emergency Contact */}
            {emergencyInfo.emergency_contact_name && (
              <div className="rounded-xl border-l-4 border-l-secondary border border-outline-variant/20 bg-secondary-container/20 p-6">
                <h3 className="mb-4 font-headline text-lg font-bold text-secondary">Emergency Contact</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Name</p>
                    <p className="mt-1 text-sm font-bold text-on-surface">{emergencyInfo.emergency_contact_name}</p>
                  </div>
                  {emergencyInfo.emergency_contact_number && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Phone Number</p>
                      <p className="mt-1 font-mono text-sm font-bold text-secondary">
                        {emergencyInfo.emergency_contact_number}
                      </p>
                    </div>
                  )}
                  {emergencyInfo.emergency_contact_relation && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Relation</p>
                      <p className="mt-1 text-sm font-bold text-on-surface">{emergencyInfo.emergency_contact_relation}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* No Emergency Contact Warning */}
            {!emergencyInfo.emergency_contact_name && (
              <div className="rounded-xl border border-outline-variant/20 bg-error-container/10 p-6">
                <p className="flex items-center gap-2 text-sm font-semibold text-error">
                  <span className="material-symbols-outlined">warning</span>
                  No emergency contact configured. Please set one in Settings.
                </p>
              </div>
            )}

            {/* Patient Identity */}
            <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-6">
              <h3 className="mb-4 font-headline text-lg font-bold text-primary">Patient Identity</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Patient ID</p>
                  <p className="mt-1 font-mono text-sm font-bold text-primary">{emergencyInfo.patient_id}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Full Name</p>
                  <p className="mt-1 text-sm font-bold text-on-surface">{emergencyInfo.full_name}</p>
                </div>
              </div>
            </div>

            {/* Critical Medical Info */}
            <div className="rounded-xl border-l-4 border-l-error border border-outline-variant/20 bg-error-container/20 p-6">
              <h3 className="mb-4 font-headline text-lg font-bold text-error">Critical Medical Info</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Blood Type</p>
                  <p className="mt-1 font-headline text-lg font-bold text-on-surface">
                    {emergencyInfo.blood_type || 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Organ Donor</p>
                  <p className="mt-1 text-sm font-bold text-on-surface">
                    {emergencyInfo.organ_donor ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
            </div>

            {/* Allergies */}
            {emergencyInfo.allergies && (
              <div className="rounded-xl border-l-4 border-l-tertiary border border-outline-variant/20 bg-tertiary-fixed/20 p-6">
                <h3 className="mb-2 font-headline text-lg font-bold text-tertiary">Allergies</h3>
                <p className="text-sm leading-relaxed text-on-surface">{emergencyInfo.allergies}</p>
              </div>
            )}

            {/* Known Conditions */}
            {emergencyInfo.known_conditions && (
              <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-6">
                <h3 className="mb-2 font-headline text-lg font-bold text-primary">Known Conditions</h3>
                <p className="text-sm leading-relaxed text-on-surface">{emergencyInfo.known_conditions}</p>
              </div>
            )}

            {/* Vital Stats */}
            {(emergencyInfo.weight_kg || emergencyInfo.height_cm) && (
              <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-6">
                <h3 className="mb-4 font-headline text-lg font-bold text-primary">Vital Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  {emergencyInfo.height_cm && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Height</p>
                      <p className="mt-1 text-sm font-bold text-on-surface">{emergencyInfo.height_cm} cm</p>
                    </div>
                  )}
                  {emergencyInfo.weight_kg && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Weight</p>
                      <p className="mt-1 text-sm font-bold text-on-surface">{emergencyInfo.weight_kg} kg</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* No Emergency Contact Warning */}
            {!emergencyInfo.emergency_contact_name && (
              <div className="rounded-xl border border-outline-variant/20 bg-error-container/10 p-6">
                <p className="flex items-center gap-2 text-sm font-semibold text-error">
                  <span className="material-symbols-outlined">warning</span>
                  No emergency contact configured. Please set one in Settings.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center">
            <p className="text-on-surface-variant">Could not load emergency information.</p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-outline-variant/20 bg-surface-container-lowest p-6">
          <button
            className="w-full rounded-lg bg-primary px-6 py-3 font-bold text-white transition-colors hover:bg-primary-container"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default EmergencySOSModal
