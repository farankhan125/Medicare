import { useEffect, useMemo, useState } from 'react'
import DashboardSidebar from '../components/layout/DashboardSidebar'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabase/supabaseClient'

const SOLID_FORMS = [
  'Solid',
  'Tablet',
  'Capsule',
  'Chewable tablet',
  'Powder sachet',
  'Lozenge',
  'Softgel',
  'Caplet',
  'Pill',
]
const LIQUID_FORMS = ['Liquid', 'Syrup', 'Suspension', 'Drops', 'Solution', 'Elixir', 'Oral Solution']

const getFormType = (form) => {
  if (SOLID_FORMS.includes(form)) return 'solid'
  if (LIQUID_FORMS.includes(form)) return 'liquid'
  return 'other'
}

const formatLongDate = (date) =>
  date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

const getTimeGreeting = (date = new Date()) => {
  const hour = date.getHours()
  if (hour >= 5 && hour < 12) return 'Good Morning'
  if (hour >= 12 && hour < 17) return 'Good Afternoon'
  if (hour >= 17 && hour < 22) return 'Good Evening'
  return 'Good Night'
}

const formatShortTime = (timeValue) => {
  if (!timeValue) return '--:--'
  const [hour, minute] = timeValue.split(':')
  const date = new Date()
  date.setHours(Number(hour), Number(minute), 0, 0)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const calculateMonthlyDates = (monthlyCount, referenceDate = new Date()) => {
  const year = referenceDate.getFullYear()
  const month = referenceDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const dates = []
  for (let i = 1; i <= monthlyCount; i++) {
    const dayOfMonth = Math.round((daysInMonth / (monthlyCount + 1)) * i)
    dates.push(dayOfMonth)
  }
  return dates
}

const isMedicationDueToday = (medication, today = new Date()) => {
  const parseLocalDate = (dateString) => {
    if (!dateString) return null
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  const start = parseLocalDate(medication.start_date)
  const end = parseLocalDate(medication.end_date)

  if (start && today < start) return false
  if (end && today > end) return false

  let details = medication.frequency_details || {}

  if (medication.frequency === 'daily') {
    return true
  }

  if (medication.frequency === 'weekly') {
    if (!details.selectedDays || details.selectedDays.length === 0) return false
    return details.selectedDays.includes(today.getDay())
  }

  if (medication.frequency === 'interval') {
    if (!start || !details.intervalDays) return false
    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate())
    const currentDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const diffDays = Math.floor((currentDay - startDay) / (1000 * 60 * 60 * 24))
    const intervalDaysNum = parseInt(details.intervalDays, 10)
    return diffDays >= 0 && diffDays % intervalDaysNum === 0
  }

  if (medication.frequency === 'monthly') {
    const todayDate = today.getDate()

    if (details.monthlyMode === 'dates' && details.selectedMonthDates) {
      return details.selectedMonthDates.some((dateStr) => parseInt(dateStr) === todayDate)
    } else if (details.monthlyMode === 'count' && details.monthCount) {
      const calculatedDates = calculateMonthlyDates(details.monthCount, today)
      return calculatedDates.includes(todayDate)
    }
  }

  return false
}

function DashboardPage() {
  const { user } = useAuth()

  const [profileName, setProfileName] = useState('there')
  const [medications, setMedications] = useState([])
  const [schedules, setSchedules] = useState([])
  const [doseLogs, setDoseLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [error, setError] = useState('')
  const [updatingDoseId, setUpdatingDoseId] = useState(null)

  const handleUpdateDoseStatus = async (medicationName, scheduledTime, newStatus) => {
    if (!user?.id) return

    const today = new Date().toISOString().split('T')[0]
    const doseId = `${medicationName}|${scheduledTime}`
    setUpdatingDoseId(doseId)

    try {
      const { error: updateError } = await supabase
        .from('dose_logs')
        .update({ status: newStatus })
        .eq('user_id', user.id)
        .eq('scheduled_date', today)
        .eq('medication_name', medicationName)
        .eq('scheduled_time', scheduledTime)

      if (updateError) throw updateError
      
      if (newStatus === 'Taken') {
        const medication = medications.find((med) => med.name === medicationName)
        if (medication && medication.amount_per_time) {
          const amountPerTime = Number(medication.amount_per_time) || 0
          
          const { error: medUpdateError } = await supabase
            .from('medications')
            .update({
              dose_amount_left: Math.max(0, (Number(medication.dose_amount_left) || 0) - amountPerTime),
            })
            .eq('id', medication.id)
            .eq('user_id', user.id)
          
          if (medUpdateError) throw medUpdateError
          
          // Update local medications state
          setMedications((prev) =>
            prev.map((med) =>
              med.id === medication.id
                ? {
                    ...med,
                    dose_amount_left: Math.max(0, (Number(med.dose_amount_left) || 0) - amountPerTime),
                  }
                : med,
            ),
          )
        }
      }
      
      setDoseLogs((prev) =>
        prev.map((log) =>
          log.medication_name === medicationName &&
          log.scheduled_time === scheduledTime &&
          log.scheduled_date === today
            ? { ...log, status: newStatus }
            : log
        )
      )
    } catch (err) {
      console.error('Failed to update dose status:', err)
    } finally {
      setUpdatingDoseId(null)
    }
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) return

      setLoading(true)
      setError('')

      const [profileRes, medsRes] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', user.id).single(),
        supabase
          .from('medications')
          .select('id,name,form,dosage_amount,dosage_unit,frequency,frequency_details,dose_amount_left,start_date,end_date,prescribed_by,notes,is_active,stock_unit,amount_per_time,consumption_unit')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ])

      if (profileRes.data?.full_name) {
        setProfileName(profileRes.data.full_name.split(' ')[0])
      }

      if (medsRes.error) {
        setError(medsRes.error.message || 'Could not load dashboard data.')
        setLoading(false)
        return
      }

      const meds = medsRes.data || []
      setMedications(meds)

      const activeMeds = meds.filter((medication) => medication.is_active)
      if (!activeMeds.length) {
        setSchedules([])
        setLoading(false)
        return
      }

      const medicationIds = activeMeds.map((medication) => medication.id)
      const schedulesRes = await supabase
        .from('medication_schedules')
        .select('id,medication_id,time_label,time_to_take')
        .in('medication_id', medicationIds)

      if (schedulesRes.error) {
        setError(schedulesRes.error.message || 'Could not load schedule data.')
        setLoading(false)
        return
      }

      setSchedules(schedulesRes.data || [])

      // Fetch today's dose_logs
      const today = new Date().toISOString().split('T')[0]
      const doseLogsRes = await supabase
        .from('dose_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('scheduled_date', today)

      if (!doseLogsRes.error) {
        setDoseLogs(doseLogsRes.data || [])
      }

      setLoading(false)
    }

    fetchDashboardData()
  }, [user?.id])

  const { todaySchedule, pendingCount, elapsedCount, nextDose, lowStockMeds } = useMemo(() => {
    const now = new Date()
    const activeMeds = medications.filter((medication) => medication.is_active)
    const medicationMap = new Map(activeMeds.map((medication) => [medication.id, medication]))

    const dueToday = schedules
      .map((schedule) => ({ ...schedule, medication: medicationMap.get(schedule.medication_id) }))
      .filter((item) => item.medication && isMedicationDueToday(item.medication, now))
      .sort((a, b) => a.time_to_take.localeCompare(b.time_to_take))

    let pending = 0
    let elapsed = 0

    dueToday.forEach((item) => {
      if (item.time_to_take > now.toTimeString().slice(0, 5)) pending += 1
      else elapsed += 1
    })

    const upcoming = dueToday.find((item) => item.time_to_take > now.toTimeString().slice(0, 5)) || null
    const lowStock = activeMeds
      .filter((medication) => {
        const remaining = Number(medication.dose_amount_left) || 0
        const amountPerTime = Number(medication.amount_per_time) || 1
        
        let dosesPerDay = 1
        const details = medication.frequency_details || {}
        if (details?.dosesPerDay) dosesPerDay = details.dosesPerDay
        
        const dailyConsumption = amountPerTime * dosesPerDay
        const daysLeft = remaining / dailyConsumption
        
        return daysLeft < 5
      })
      .sort((a, b) => Number(a.dose_amount_left) - Number(b.dose_amount_left))
      .slice(0, 5)

    return {
      todaySchedule: dueToday,
      pendingCount: pending,
      elapsedCount: elapsed,
      nextDose: upcoming,
      lowStockMeds: lowStock,
    }
  }, [medications, schedules])

  const totalUniqueMedicationCount = useMemo(() => {
    const uniqueNames = new Set(
      medications
        .map((medication) => (medication.name || '').trim().toLowerCase())
        .filter(Boolean),
    )
    return uniqueNames.size
  }, [medications])

  const dateText = formatLongDate(new Date())
  const greeting = getTimeGreeting(new Date())
  const heroName = profileName || user?.email?.split('@')?.[0] || 'there'

  if (loading) {
    return (
      <div className="min-h-screen bg-surface font-body text-on-surface">
        <DashboardSidebar activeItem="dashboard" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="min-h-screen p-6 md:ml-64 md:p-8 lg:p-12">
          <div className="inline-flex items-center gap-3 text-primary">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
            <span className="text-sm font-bold">Loading dashboard...</span>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface">
      <DashboardSidebar activeItem="dashboard" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="min-h-screen p-6 md:ml-64 md:p-8 lg:p-12">
        {error && (
          <div className="mb-6 rounded-xl bg-error-container px-4 py-3 text-sm font-semibold text-on-error-container">
            {error}
          </div>
        )}

        <header className="mb-10 flex flex-col gap-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-headline text-4xl font-extrabold tracking-tight text-primary">{greeting}, {heroName}</h2>
              <p className="mt-1 font-medium text-on-surface-variant">Today is {dateText}. You&apos;re doing great!</p>
            </div>
            <button
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-primary shadow-sm transition hover:bg-slate-100 md:hidden"
              onClick={() => setIsSidebarOpen(true)}
              type="button"
              aria-label="Open sidebar"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>

          {lowStockMeds.length > 0 && (
            <div className="flex items-center justify-between rounded-xl border-l-8 border-tertiary bg-tertiary-fixed p-4 text-on-tertiary-fixed">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined">warning</span>
                <p className="font-semibold">
                  Low Stock Alert: <span className="font-bold">{lowStockMeds[0].name}</span> ({lowStockMeds[0].dose_amount_left}{' '}
                  {lowStockMeds[0].stock_unit || 'units'} left).
                </p>
              </div>
              <span className="rounded-lg bg-on-tertiary-fixed px-4 py-2 text-sm font-bold text-white shadow-sm">Refill Soon</span>
            </div>
          )}
        </header>

        <section className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="flex flex-col gap-2 rounded-xl bg-surface-container-lowest p-6 shadow-2xl shadow-blue-900/5">
            <div className="flex items-start justify-between">
              <span className="text-sm font-bold text-on-surface-variant">Total Medications</span>
              <span className="material-symbols-outlined text-primary-container">pill</span>
            </div>
            <p className="text-4xl font-black text-primary">{totalUniqueMedicationCount}</p>
            <p className="text-xs font-semibold text-on-surface-variant">All added medicines</p>
          </div>

          <div className="flex flex-col gap-2 rounded-xl bg-surface-container-lowest p-6 shadow-2xl shadow-blue-900/5">
            <div className="flex items-start justify-between">
              <span className="text-sm font-bold text-on-surface-variant">Scheduled Today</span>
              <span className="material-symbols-outlined text-secondary">event</span>
            </div>
            <p className="text-4xl font-black text-primary">{todaySchedule.length}</p>
            <div className="mt-2 h-1.5 w-full rounded-full bg-surface-container">
              <div className="h-1.5 rounded-full bg-secondary" style={{ width: `${todaySchedule.length > 0 ? (elapsedCount / todaySchedule.length) * 100 : 0}%` }} />
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-xl bg-surface-container-lowest p-6 shadow-2xl shadow-blue-900/5">
            <div className="flex items-start justify-between">
              <span className="text-sm font-bold text-on-surface-variant">Doses Elapsed</span>
              <span className="material-symbols-outlined text-error">history</span>
            </div>
            <p className="text-4xl font-black text-primary">{elapsedCount}</p>
            <div className="flex items-center gap-1 text-xs font-bold text-secondary">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              Based on today&apos;s schedule
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-xl bg-surface-container-lowest p-6 shadow-2xl shadow-blue-900/5">
            <div className="flex items-start justify-between">
              <span className="text-sm font-bold text-on-surface-variant">Doses Pending</span>
              <span className="material-symbols-outlined text-primary-container">schedule</span>
            </div>
            <p className="text-4xl font-black text-primary">{pendingCount}</p>
            <p className="text-xs font-medium text-on-surface-variant">
              {nextDose ? `Next dose at ${formatShortTime(nextDose.time_to_take)}` : 'No pending dose for today'}
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <section className="lg:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-headline text-2xl font-bold tracking-tight text-primary">Today&apos;s Schedule</h3>
            </div>

            {todaySchedule.length === 0 ? (
              <div className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-6 text-sm font-semibold text-on-surface-variant">
                No doses scheduled for today.
              </div>
            ) : (
              <div className="relative space-y-6">
                <div className="absolute bottom-4 left-6 top-4 w-px bg-outline-variant opacity-30"></div>

                {todaySchedule.slice(0, 5).map((item) => {
                  const isPending = item.time_to_take > new Date().toTimeString().slice(0, 5)
                  const medication = item.medication
                  const today = new Date().toISOString().split('T')[0]
                  const doseStatus = doseLogs.find(
                    (log) =>
                      log.medication_name === medication.name &&
                      log.scheduled_time === item.time_to_take &&
                      log.scheduled_date === today
                  )?.status
                  const isActioned = doseStatus && doseStatus !== 'Pending'
                  
                  return (
                    <div className="relative flex items-start gap-6" key={item.id}>
                      <div
                        className={`z-10 flex h-12 w-12 items-center justify-center rounded-full border-4 border-surface shadow-sm ${
                          isActioned ? 'bg-secondary-container' : 'bg-primary-container'
                        }`}
                      >
                        <span className={`material-symbols-outlined ${isActioned ? 'font-bold text-on-secondary-container' : 'text-white'}`}>
                          {isActioned ? 'check' : 'medical_services'}
                        </span>
                      </div>
                      <div
                        className={`flex flex-1 flex-col justify-between rounded-xl p-5 ${
                          isPending
                            ? 'border-2 border-primary/5 bg-surface-container-lowest shadow-xl shadow-blue-900/5'
                            : isActioned
                            ? 'bg-secondary-container/20 border border-secondary/30'
                            : 'bg-surface-container-low/50 opacity-90'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-bold text-primary">
                              {medication.name}
                              {getFormType(medication.form) !== 'other' && (
                                <>
                                  {' '}
                                  {medication.dosage_amount}
                                  {medication.dosage_unit}
                                </>
                              )}
                            </h4>
                            <p className="text-sm text-on-surface-variant">
                              {medication.form}
                              {medication.amount_per_time && (
                                <>
                                  {' '}-{' '}
                                  {medication.amount_per_time} {medication.consumption_unit}
                                </>
                              )}
                              {' '}- {item.time_label}
                            </p>
                            <p className={`mt-1 text-xs font-bold ${isPending ? 'text-primary' : isActioned ? 'text-secondary' : 'text-secondary'}`}>
                              {isPending ? 'Upcoming today' : isActioned ? `Status: ${doseStatus}` : 'Scheduled earlier today'}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-xl font-black text-primary">{formatShortTime(item.time_to_take)}</span>
                          </div>
                        </div>

                        {!isPending && (() => {
                          const today = new Date().toISOString().split('T')[0]
                          const doseStatus = doseLogs.find(
                            (log) =>
                              log.medication_name === medication.name &&
                              log.scheduled_time === item.time_to_take &&
                              log.scheduled_date === today
                          )?.status
                          return doseStatus === 'Pending'
                        })() && (
                          <div className="mt-3 flex gap-2">
                            <button
                              className="flex-1 rounded-lg bg-secondary px-3 py-2 text-xs font-bold text-white transition-all hover:bg-secondary-container hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                              onClick={() =>
                                handleUpdateDoseStatus(medication.name, item.time_to_take, 'Taken')
                              }
                              disabled={updatingDoseId === `${medication.name}|${item.time_to_take}`}
                              type="button"
                            >
                              {updatingDoseId === `${medication.name}|${item.time_to_take}` ? (
                                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                              ) : (
                                'Taken'
                              )}
                            </button>
                            <button
                              className="flex-1 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-white transition-all hover:bg-amber-600 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                              onClick={() =>
                                handleUpdateDoseStatus(medication.name, item.time_to_take, 'Skipped')
                              }
                              disabled={updatingDoseId === `${medication.name}|${item.time_to_take}`}
                              type="button"
                            >
                              {updatingDoseId === `${medication.name}|${item.time_to_take}` ? (
                                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                              ) : (
                                'Skip'
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <section className="space-y-6">
            <div className="relative overflow-hidden rounded-2xl bg-primary p-6 text-white shadow-2xl shadow-primary/20">
              <div className="relative z-10">
                <div className="mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined">smart_toy</span>
                  <span className="text-xs font-bold uppercase tracking-widest opacity-70">AI Health Guardian</span>
                </div>
                <h4 className="mb-2 text-xl font-bold">
                  {nextDose ? `Your next dose is ${nextDose.medication.name}` : 'Your schedule is clear for now'}
                </h4>
                <p className="text-sm leading-relaxed text-primary-fixed opacity-90">
                  {nextDose
                    ? `It is scheduled at ${formatShortTime(nextDose.time_to_take)} (${nextDose.time_label}). Stay consistent for better outcomes.`
                    : 'Great adherence today. Keep your medication list updated to maintain accurate recommendations.'}
                </p>
              </div>
              <div className="absolute -bottom-4 -right-4 h-32 w-32 rounded-full bg-blue-400 opacity-10 blur-3xl"></div>
            </div>

            <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-lg shadow-blue-900/5">
              <h4 className="mb-4 font-bold text-primary">Upcoming Refills</h4>
              <div className="space-y-4">
                {(lowStockMeds.length
                  ? lowStockMeds
                  : medications
                      .filter((m) => m.is_active)
                      .sort((a, b) => Number(a.dose_amount_left) - Number(b.dose_amount_left))
                      .slice(0, 5)
                ).map((medication) => (
                  <div className="flex items-center justify-between" key={medication.id}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-tertiary-fixed">
                        <span className="material-symbols-outlined text-tertiary">medication</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-primary">{medication.name}</p>
                        <p className="text-xs font-bold text-on-surface-variant">
                          {medication.dose_amount_left} {medication.stock_unit || 'units'} left
                        </p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-primary-container">shopping_cart</span>
                  </div>
                ))}

                {!medications.length && (
                  <p className="text-xs font-semibold text-on-surface-variant">No medications added yet.</p>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default DashboardPage
