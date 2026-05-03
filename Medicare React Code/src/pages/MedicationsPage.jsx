import { useEffect, useMemo, useState } from 'react'
import AddMedicationModal from '../components/medications/AddMedicationModal'
import DeleteConfirmationModal from '../components/DeleteConfirmationModal'
import DashboardSidebar from '../components/layout/DashboardSidebar'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabase/supabaseClient'

const SOLID_FORMS = ['Tablet', 'Capsule', 'Softgel', 'Caplet', 'Lozenge', 'Pill']
const LIQUID_FORMS = ['Syrup', 'Oral Solution', 'Suspension', 'Drops', 'Elixir']
const TOPICAL_FORMS = ['Cream', 'Ointment', 'Gel', 'Paste']

const getCardTheme = (form) => {
  if (SOLID_FORMS.includes(form)) return { icon: 'pill', badgeBg: 'bg-secondary-container', badgeText: 'text-on-secondary-fixed-variant', accent: 'border-primary', iconBg: 'bg-primary-fixed', iconText: 'text-primary', progress: 'bg-primary-container' }
  if (LIQUID_FORMS.includes(form)) return { icon: 'medication', badgeBg: 'bg-secondary-container', badgeText: 'text-on-secondary-fixed-variant', accent: 'border-secondary', iconBg: 'bg-secondary-container', iconText: 'text-secondary', progress: 'bg-secondary' }
  if (TOPICAL_FORMS.includes(form)) return { icon: 'dermatology', badgeBg: 'bg-tertiary-fixed', badgeText: 'text-on-tertiary-fixed-variant', accent: 'border-tertiary', iconBg: 'bg-tertiary-fixed', iconText: 'text-tertiary', progress: 'bg-tertiary' }
  return { icon: 'science', badgeBg: 'bg-primary-fixed', badgeText: 'text-on-primary-fixed', accent: 'border-primary', iconBg: 'bg-primary-fixed', iconText: 'text-primary', progress: 'bg-primary' }
}

const formatDate = (value) => {
  if (!value) return 'Ongoing'
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

const getStockPercent = (left, threshold) => {
  const safeLeft = Number(left || 0)
  const safeThreshold = Number(threshold || 1)
  const reference = Math.max(safeThreshold * 2, 1)
  const percent = (safeLeft / reference) * 100
  return Math.max(5, Math.min(100, percent))
}

const getDosageDisplay = (dosageAmount, dosageUnit) => {
  return `${dosageAmount}${dosageUnit}`
}

const getMedicationNameWithStrength = (name, dosageAmount, dosageUnit) => {
  if (dosageAmount && dosageUnit) {
    const strengthDisplay = `${dosageAmount}${dosageUnit}`
    return `${name} ${strengthDisplay}`
  }
  return name
}

const getDailyConsumption = (amountPerTime, dosesPerDay, consumptionUnit) => {
  if (!amountPerTime || !dosesPerDay || !consumptionUnit) return null
  
  const totalDaily = parseFloat(amountPerTime) * parseInt(dosesPerDay, 10)
  const unitLabel = totalDaily === 1 ? consumptionUnit.slice(0, -1) : consumptionUnit
  return `${totalDaily} ${unitLabel} per day`
}

const getFrequencyDisplay = (frequency, frequencyDetails) => {
  const frequencyOptions = [
    { value: 'daily', label: 'Every day' },
    { value: 'weekly', label: 'Specific days of week' },
    { value: 'interval', label: 'Every N days' },
    { value: 'monthly', label: 'Monthly' },
  ]
  
  const baseLabel = frequencyOptions.find((f) => f.value === frequency)?.label || frequency
  
  if (frequency === 'daily') {
    return baseLabel
  }
  
  try {
    const details = frequencyDetails || {}
    
    if (frequency === 'weekly' && details?.selectedDays) {
      const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const selectedDayNames = details.selectedDays
        .sort((a, b) => a - b)
        .map((i) => weekdays[i])
        .join(', ')
      return `${baseLabel}: ${selectedDayNames}`
    }
    
    if (frequency === 'interval' && details?.intervalDays) {
      return `Every ${details.intervalDays} days`
    }
    
    if (frequency === 'monthly' && details) {
      if (details.monthlyMode === 'dates' && details.selectedMonthDates) {
        const selectedDatesStr = details.selectedMonthDates
          .sort((a, b) => {
            const aNum = parseInt(a)
            const bNum = parseInt(b)
            return aNum - bNum
          })
          .join(', ')
        return `${baseLabel}: ${selectedDatesStr}`
      } else if (details.monthlyMode === 'count' && details.monthCount) {
        return `${baseLabel}: ${details.monthCount}x/month`
      }
    }
  } catch (e) {
  }
  
  return baseLabel
}

function MedicationsPage() {
  const { user } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMedication, setEditingMedication] = useState(null)
  const [medications, setMedications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [medicationToDelete, setMedicationToDelete] = useState(null)

  const activeCount = useMemo(() => medications.filter((medication) => medication.is_active).length, [medications])

  const fetchMedications = async () => {
    if (!user?.id) return

    setLoading(true)
    setError('')

    const { data, error: fetchError } = await supabase
      .from('medications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message || 'Could not fetch medications.')
      setLoading(false)
      return
    }

    setMedications(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchMedications()
  }, [user?.id])

  useEffect(() => {
    if (!toastMessage) return
    const timer = setTimeout(() => setToastMessage(''), 3000)
    return () => clearTimeout(timer)
  }, [toastMessage])

  const openCreateModal = () => {
    setEditingMedication(null)
    setIsModalOpen(true)
  }

  const openEditModal = (medication) => {
    setEditingMedication(medication)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingMedication(null)
  }

  const openDeleteModal = (medication) => {
    setMedicationToDelete(medication)
    setIsDeleteModalOpen(true)
  }

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setMedicationToDelete(null)
  }

  const handleConfirmDelete = async () => {
    if (!medicationToDelete) return

    setDeletingId(medicationToDelete.id)
    const { error: deleteError } = await supabase
      .from('medications')
      .delete()
      .eq('id', medicationToDelete.id)
      .eq('user_id', user.id)

    setDeletingId(null)
    closeDeleteModal()

    if (deleteError) {
      setToastMessage(deleteError.message || 'Could not delete medication.')
      return
    }

    setToastMessage('Medication deleted successfully ✅')
    await fetchMedications()
  }

  const handleDelete = (medication) => {
    openDeleteModal(medication)
  }

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface">
      <DashboardSidebar activeItem="medications" />

      <main className="ml-64 min-h-screen p-8 lg:p-12">
        <header className="mb-12 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-headline text-4xl font-extrabold tracking-tight text-primary">Your Pharmacy</h2>
            <p className="mt-2 font-medium text-on-surface-variant">Tracking {activeCount} active medication{activeCount === 1 ? '' : 's'}.</p>
          </div>
          <button
            className="group inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-4 text-sm font-bold text-white shadow-2xl shadow-primary/20 transition-all hover:opacity-90 active:scale-95"
            onClick={openCreateModal}
            type="button"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Add Medication
            <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
          </button>
        </header>

        {error && (
          <div className="mb-6 rounded-xl bg-error-container px-4 py-3 text-sm font-semibold text-on-error-container">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-outline-variant/20 bg-surface-container-lowest">
            <div className="inline-flex items-center gap-3 text-primary">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
              <span className="text-sm font-bold">Loading medications...</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 xl:grid-cols-3">
            {medications.map((medication) => {
              const theme = getCardTheme(medication.form)
              const stockPercent = getStockPercent(medication.dose_amount_left, medication.low_stock_threshold)
              const lowStock = Number(medication.dose_amount_left) <= Number(medication.low_stock_threshold)

              return (
                <div key={medication.id} className="glass-card group relative overflow-hidden rounded-xl p-6 transition-all hover:shadow-2xl hover:shadow-primary/5">
                  <div className="absolute right-0 top-0 flex gap-1 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      className="rounded-lg p-2 text-primary transition-colors hover:bg-surface-container-high"
                      onClick={() => openEditModal(medication)}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-error-container hover:text-error disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={deletingId === medication.id}
                      onClick={() => handleDelete(medication)}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {deletingId === medication.id ? 'hourglass_top' : 'delete'}
                      </span>
                    </button>
                  </div>

                  <div className="mb-6 flex items-start gap-4">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${theme.iconBg} ${theme.iconText}`}>
                      <span className="material-symbols-outlined text-3xl">{theme.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-headline text-xl font-extrabold text-primary">{getMedicationNameWithStrength(medication.name, medication.dosage_amount, medication.dosage_unit)}</h3>
                      <div className="mt-1 flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${theme.badgeBg} ${theme.badgeText}`}>
                          {lowStock ? 'Low Stock' : medication.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-xs font-semibold text-on-surface-variant">
                          {medication.form}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-tighter text-slate-400">Frequency</p>
                        <p className="text-sm font-semibold text-primary">{getFrequencyDisplay(medication.frequency, medication.frequency_details)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-tighter text-slate-400">Duration</p>
                        <p className="text-sm font-semibold text-primary">
                          {formatDate(medication.start_date)} - {formatDate(medication.end_date)}
                        </p>
                      </div>
                    </div>

                    {getDailyConsumption(medication.amount_per_time, 
                      (() => {
                        try {
                          const details = medication.frequency_details || {}
                          return details?.dosesPerDay
                        } catch {
                          return null
                        }
                      })(),
                      medication.consumption_unit) ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-tighter text-slate-400">Prescribed by</p>
                          <p className="text-sm font-semibold text-primary">{medication.prescribed_by || 'Not specified'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-tighter text-slate-400">Daily Dosage</p>
                          <p className="text-sm font-semibold text-primary">
                            {getDailyConsumption(medication.amount_per_time, 
                              (() => {
                                try {
                                  const details = medication.frequency_details || {}
                                  return details?.dosesPerDay
                                } catch {
                                  return null
                                }
                              })(),
                              medication.consumption_unit)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-tighter text-slate-400">Prescribed by</p>
                        <p className="text-sm font-semibold text-primary">{medication.prescribed_by || 'Not specified'}</p>
                      </div>
                    )}

                    <div className={`rounded-lg border-l-4 bg-surface-container-low p-3 ${theme.accent}`}>
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-tighter text-primary/60">Notes</p>
                      <p className="text-xs italic leading-relaxed text-on-surface">
                        {medication.notes || 'No additional notes added.'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-end justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-tighter text-slate-400">Stock Progress</p>
                      <p className={`text-xs font-bold ${lowStock ? 'text-error' : 'text-primary'}`}>
                        {medication.dose_amount_left} {medication.stock_unit || 'units'} left
                      </p>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
                      <div className={`h-full rounded-full ${theme.progress}`} style={{ width: `${stockPercent}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}

            <button
              className="group flex min-h-[400px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 p-8 text-left transition-all hover:border-primary/20 hover:bg-surface-container-lowest"
              onClick={openCreateModal}
              type="button"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-high text-slate-400 transition-all group-hover:bg-primary group-hover:text-white">
                <span className="material-symbols-outlined text-3xl">add</span>
              </div>
              <p className="font-headline font-bold text-primary">Add New Entry</p>
              <p className="mt-2 max-w-[180px] text-center text-xs text-slate-400">Keep your health journey organized and safe.</p>
            </button>
          </div>
        )}
      </main>

      <AddMedicationModal
        isOpen={isModalOpen}
        existingMedication={editingMedication}
        onClose={closeModal}
        onSaved={(message) => {
          setToastMessage(message || 'Medication saved successfully ✅')
          setEditingMedication(null)
          fetchMedications()
        }}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        itemName={medicationToDelete?.name}
        itemType="Medication"
        onConfirm={handleConfirmDelete}
        onCancel={closeDeleteModal}
        isLoading={deletingId === medicationToDelete?.id}
      />

      <div className="pointer-events-none fixed bottom-6 right-6 z-[90] space-y-2">
        {toastMessage && (
          <div className="rounded-xl bg-secondary px-4 py-3 text-sm font-bold text-white shadow-2xl shadow-secondary/20">
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  )
}

export default MedicationsPage
