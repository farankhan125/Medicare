import { useMemo, useState, useEffect } from 'react'
import DashboardSidebar from '../components/layout/DashboardSidebar'
import DeleteConfirmationModal from '../components/DeleteConfirmationModal'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabase/supabaseClient'

const PAGE_SIZE = 10

const formatDateLabel = (value) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatTimeLabel = (value) => {
  if (!value) return '--'
  if (typeof value === 'string' && /^\d{2}:\d{2}/.test(value)) {
    const [hour, minute] = value.split(':')
    const date = new Date()
    date.setHours(Number(hour), Number(minute), 0, 0)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const normalizeStatus = (statusValue) => {
  const normalized = (statusValue || '').toString().toLowerCase().trim()
  if (!normalized) return 'pending'
  if (normalized.includes('take')) return 'taken'
  if (normalized.includes('skip')) return 'skipped'
  if (normalized.includes('miss')) return 'missed'
  if (normalized.includes('pend')) return 'pending'
  return normalized
}

const statusStyles = {
  taken: {
    wrapper: 'bg-secondary-container text-on-secondary-fixed-variant',
    dot: 'bg-secondary',
    label: 'Taken',
    iconWrap: 'bg-secondary/10 text-secondary',
    icon: 'pill',
  },
  skipped: {
    wrapper: 'bg-amber-100 text-amber-800',
    dot: 'bg-amber-500',
    label: 'Skipped',
    iconWrap: 'bg-tertiary-fixed/20 text-tertiary-container',
    icon: 'medication_liquid',
  },
  missed: {
    wrapper: 'bg-error-container text-on-error-container',
    dot: 'bg-error',
    label: 'Missed',
    iconWrap: 'bg-error-container/20 text-error',
    icon: 'vaccines',
  },
  pending: {
    wrapper: 'bg-surface-container-high text-on-surface-variant',
    dot: 'bg-outline',
    label: 'Pending',
    iconWrap: 'bg-surface-container-high text-on-surface-variant',
    icon: 'schedule',
  },
}

const pickDateField = (row) =>
  row.scheduled_at ||
  row.scheduled_date ||
  row.date ||
  row.dose_date ||
  row.taken_at ||
  row.created_at ||
  null

const pickTimeField = (row) =>
  row.scheduled_time ||
  row.time_to_take ||
  row.time ||
  row.taken_at ||
  row.created_at ||
  null

function DoseHistoryPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [doseLogs, setDoseLogs] = useState([])
  const [medicationsMap, setMedicationsMap] = useState({})
  const [deletingId, setDeletingId] = useState(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [doseLogToDelete, setDoseLogToDelete] = useState(null)

  useEffect(() => {
    const fetchDoseHistory = async () => {
      if (!user?.id) return

      setLoading(true)
      setError('')

      const [logsRes, medsRes] = await Promise.all([
        supabase
          .from('dose_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('medications')
          .select('id,name,form,dosage_amount,dosage_unit')
          .eq('user_id', user.id),
      ])

      if (logsRes.error) {
        setError(logsRes.error.message || 'Could not load dose history.')
        setLoading(false)
        return
      }

      if (medsRes.error) {
        setError(medsRes.error.message || 'Could not load medication details.')
        setLoading(false)
        return
      }

      const medMap = (medsRes.data || []).reduce((acc, medication) => {
        acc[medication.id] = medication
        return acc
      }, {})

      setMedicationsMap(medMap)
      setDoseLogs(logsRes.data || [])
      setLoading(false)
    }

    fetchDoseHistory()
  }, [user?.id])

  const enrichedRows = useMemo(
    () =>
      doseLogs.map((row) => {
        const status = normalizeStatus(row.status)
        const medication = medicationsMap[row.medication_id] || null
        
        // Use stored medication details from dose_logs snapshot
        // Fall back to live data if available, otherwise use stored snapshot
        const medicationName = medication?.name || row.medication_name || 'Unknown Medication'
        const medicationSubtext = medication
          ? (medication.dosage_amount && medication.dosage_unit)
            ? `${medication.dosage_amount}${medication.dosage_unit} ${medication.form}`
            : medication.form
          : (row.dosage_amount && row.dosage_unit)
            ? `${row.dosage_amount}${row.dosage_unit} ${row.medication_form}`
            : row.medication_form || 'Form unavailable'
        
        return {
          ...row,
          normalizedStatus: status,
          medicationName,
          medicationSubtext,
          scheduledDateValue: pickDateField(row),
          scheduledTimeValue: pickTimeField(row),
        }
      }),
    [doseLogs, medicationsMap],
  )

  const filteredRows = useMemo(() => {
    const now = new Date()
    const weekAgo = new Date()
    weekAgo.setDate(now.getDate() - 7)
    const monthAgo = new Date()
    monthAgo.setDate(now.getDate() - 30)

    return enrichedRows
      .filter((row) => row.medicationName.toLowerCase().includes(searchTerm.trim().toLowerCase()))
      .filter((row) => {
        const rowDate = new Date(row.scheduledDateValue || row.created_at || row.taken_at || row.updated_at || now)
        if (activeFilter === 'week') return rowDate >= weekAgo
        if (activeFilter === 'month') return rowDate >= monthAgo
        if (activeFilter === 'missed') return row.normalizedStatus === 'missed'
        if (activeFilter === 'taken') return row.normalizedStatus === 'taken'
        return true
      })
  }, [activeFilter, enrichedRows, searchTerm])

  const stats = useMemo(() => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const validForAdherence = enrichedRows.filter((row) => row.normalizedStatus !== 'pending')
    const takenCount = validForAdherence.filter((row) => row.normalizedStatus === 'taken').length
    const adherenceRate = validForAdherence.length ? Math.round((takenCount / validForAdherence.length) * 100) : 0

    // Get taken doses from last 30 days using scheduled_date from dose_logs
    const last30Taken = enrichedRows.filter((row) => {
      if (!row.scheduled_date) return false
      const rowDate = new Date(row.scheduled_date)
      return rowDate >= thirtyDaysAgo && row.normalizedStatus === 'taken'
    }).length

    const recentSeven = new Date()
    recentSeven.setDate(recentSeven.getDate() - 7)
    const previousSevenStart = new Date()
    previousSevenStart.setDate(previousSevenStart.getDate() - 14)

    const calcWindowAdherence = (from, to) => {
      const windowRows = enrichedRows.filter((row) => {
        if (!row.scheduled_date) return false
        const rowDate = new Date(row.scheduled_date)
        return rowDate >= from && rowDate < to && row.normalizedStatus !== 'pending'
      })
      if (!windowRows.length) return 0
      const taken = windowRows.filter((row) => row.normalizedStatus === 'taken').length
      return (taken / windowRows.length) * 100
    }

    const currentWindow = calcWindowAdherence(recentSeven, new Date())
    const previousWindow = calcWindowAdherence(previousSevenStart, recentSeven)
    const trendDelta = currentWindow - previousWindow

    return {
      adherenceRate,
      last30Taken,
      trendDelta,
      trendText: trendDelta >= 0 ? 'Improving Stability' : 'Needs Attention',
      trendSubText:
        trendDelta >= 0
          ? 'Recent adherence trend is moving upward.'
          : 'Recent adherence trend is lower than prior week.',
    }
  }, [enrichedRows])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedRows = useMemo(
    () => filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filteredRows, safePage],
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, activeFilter])

  const openDeleteModal = (logId, medicationName) => {
    setDoseLogToDelete({ id: logId, medicationName })
    setIsDeleteModalOpen(true)
  }

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setDoseLogToDelete(null)
  }

  const handleConfirmDeleteDoseLog = async () => {
    if (!doseLogToDelete) return

    const { id: logId } = doseLogToDelete
    setDeletingId(logId)

    const { error: deleteError } = await supabase
      .from('dose_logs')
      .delete()
      .eq('id', logId)
      .eq('user_id', user.id)

    setDeletingId(null)
    closeDeleteModal()

    if (deleteError) {
      setError(deleteError.message || 'Could not delete dose record.')
      return
    }

    // Refresh dose history
    setDoseLogs(doseLogs.filter(log => log.id !== logId))
  }

  const handleDeleteDoseLog = (logId, medicationName) => {
    openDeleteModal(logId, medicationName)
  }

  return (
    <div className="flex min-h-screen bg-surface font-body text-on-surface">
      <DashboardSidebar activeItem="dose-history" />

      <main className="ml-64 min-h-screen flex-1 bg-surface p-8 lg:p-12">
        <header className="mb-10">
          <div className="max-w-2xl">
            <h2 className="mb-2 font-headline text-4xl font-extrabold tracking-tight text-primary">Dose History</h2>
            <p className="leading-relaxed text-on-surface-variant">
              A detailed retrospective of your medication adherence and health milestones.
            </p>
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-xl bg-error-container px-4 py-3 text-sm font-semibold text-on-error-container">{error}</div>
        )}

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="glass-card rounded-xl border border-white/40 p-6 shadow-2xl shadow-blue-900/5">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Adherence Rate</p>
            <div className="flex items-end gap-2">
              <h3 className="font-headline text-3xl font-black text-primary">{stats.adherenceRate}%</h3>
              <span className={`mb-1 flex items-center text-xs font-bold ${stats.trendDelta >= 0 ? 'text-secondary' : 'text-error'}`}>
                <span className="material-symbols-outlined text-[14px]">{stats.trendDelta >= 0 ? 'arrow_upward' : 'arrow_downward'}</span>
                {Math.abs(stats.trendDelta).toFixed(1)}%
              </span>
            </div>
            <div className="mt-4 h-1.5 w-full rounded-full bg-surface-container-high">
              <div className="h-full rounded-full bg-secondary" style={{ width: `${Math.min(100, stats.adherenceRate)}%` }}></div>
            </div>
          </div>

          <div className="glass-card rounded-xl border border-white/40 p-6 shadow-2xl shadow-blue-900/5">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Taken Doses</p>
            <h3 className="font-headline text-3xl font-black text-primary">{stats.last30Taken}</h3>
            <p className="mt-2 text-xs font-medium text-on-surface-variant">Last 30 days</p>
          </div>

          <div className="glass-card relative col-span-1 flex justify-between overflow-hidden rounded-xl border border-white/40 p-6 shadow-2xl shadow-blue-900/5 md:col-span-2">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Health Trend</p>
              <h3 className="font-headline text-lg font-bold leading-tight text-primary">{stats.trendText}</h3>
              <p className="mt-1 text-sm text-on-surface-variant">{stats.trendSubText}</p>
            </div>
            <div className="flex h-16 w-32 items-end gap-1">
              <div className="h-[40%] w-3 rounded-t-sm bg-secondary/20"></div>
              <div className="h-[60%] w-3 rounded-t-sm bg-secondary/40"></div>
              <div className="h-[55%] w-3 rounded-t-sm bg-secondary/60"></div>
              <div className="h-[85%] w-3 rounded-t-sm bg-secondary/80"></div>
              <div className="h-[95%] w-3 rounded-t-sm bg-secondary"></div>
            </div>
          </div>
        </div>

        <section className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-[300px] flex-1 items-center gap-3">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">
                search
              </span>
              <input
                className="w-full rounded-xl border-none bg-surface-container-high/50 py-3 pl-11 pr-4 text-sm placeholder:text-on-surface-variant/60 focus:ring-2 focus:ring-primary/20"
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search medication..."
                type="text"
                value={searchTerm}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            <button
              className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold ${
                activeFilter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-container-high'
              }`}
              onClick={() => setActiveFilter('all')}
              type="button"
            >
              All Doses
            </button>
            <button
              className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold ${
                activeFilter === 'week'
                  ? 'bg-primary text-white'
                  : 'bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-container-high'
              }`}
              onClick={() => setActiveFilter('week')}
              type="button"
            >
              This Week
            </button>
            <button
              className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold ${
                activeFilter === 'month'
                  ? 'bg-primary text-white'
                  : 'bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-container-high'
              }`}
              onClick={() => setActiveFilter('month')}
              type="button"
            >
              Last 30 Days
            </button>
            <button
              className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold ${
                activeFilter === 'taken'
                  ? 'bg-primary text-white'
                  : 'bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-container-high'
              }`}
              onClick={() => setActiveFilter('taken')}
              type="button"
            >
              Taken
            </button>
            <button
              className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold ${
                activeFilter === 'missed'
                  ? 'bg-primary text-white'
                  : 'bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-container-high'
              }`}
              onClick={() => setActiveFilter('missed')}
              type="button"
            >
              Missed
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-lowest shadow-2xl shadow-blue-900/5">
          <table className="w-full border-collapse text-left table-fixed">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="px-8 py-5 font-headline text-xs font-black uppercase tracking-widest text-primary w-[35%]">Medication Name</th>
                <th className="px-8 py-5 font-headline text-xs font-black uppercase tracking-widest text-primary w-[20%]">Scheduled Date</th>
                <th className="px-8 py-5 font-headline text-xs font-black uppercase tracking-widest text-primary w-[20%]">Scheduled Time</th>
                <th className="px-8 py-5 font-headline text-xs font-black uppercase tracking-widest text-primary w-[15%]">Status</th>
                <th className="px-8 py-5 text-right font-headline text-xs font-black uppercase tracking-widest text-primary w-[10%]">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-outline-variant/10">
              {!loading && paginatedRows.length === 0 && (
                <tr>
                  <td className="px-8 py-10 text-center text-sm font-semibold text-on-surface-variant" colSpan={5}>
                    No dose history found for this filter.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td className="px-8 py-10 text-center text-sm font-semibold text-primary" colSpan={5}>
                    Loading dose history...
                  </td>
                </tr>
              )}

              {!loading &&
                paginatedRows.map((row) => {
                  const status = statusStyles[row.normalizedStatus] || statusStyles.pending
                  return (
                    <tr className="transition-colors hover:bg-surface-container-low/30" key={row.id}>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${status.iconWrap}`}>
                            <span className="material-symbols-outlined">{status.icon}</span>
                          </div>
                          <div>
                            <p className="font-bold text-primary">{row.medicationName}</p>
                            <p className="text-xs font-medium text-on-surface-variant">{row.medicationSubtext}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm font-medium text-on-surface-variant">{formatDateLabel(row.scheduledDateValue)}</td>
                      <td className="px-8 py-6 text-sm font-medium text-on-surface-variant">{formatTimeLabel(row.scheduledTimeValue)}</td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${status.wrapper}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`}></span>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button
                          className="text-on-surface-variant transition-colors hover:text-error disabled:cursor-not-allowed disabled:opacity-50"
                          onClick={() => handleDeleteDoseLog(row.id, row.medicationName)}
                          disabled={deletingId === row.id}
                          title="Delete dose record"
                          type="button"
                        >
                          <span className="material-symbols-outlined">
                            {deletingId === row.id ? 'hourglass_top' : 'delete'}
                          </span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>

          <div className="flex items-center justify-between bg-surface-container-low/30 px-8 py-6">
            <p className="text-sm font-medium text-on-surface-variant">
              Showing{' '}
              <span className="font-bold text-primary">
                {filteredRows.length ? (safePage - 1) * PAGE_SIZE + 1 : 0}-
                {Math.min(safePage * PAGE_SIZE, filteredRows.length)}
              </span>{' '}
              of <span className="font-bold text-primary">{filteredRows.length}</span> entries
            </p>
            <div className="flex items-center gap-1">
              <button
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant/20 text-on-surface-variant transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>

              {Array.from({ length: Math.min(3, totalPages) }, (_, i) => i + 1).map((page) => (
                <button
                  className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-all ${
                    page === safePage
                      ? 'bg-primary text-white shadow-lg shadow-primary/10'
                      : 'border border-outline-variant/20 text-on-surface-variant hover:bg-white'
                  }`}
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  type="button"
                >
                  {page}
                </button>
              ))}

              <button
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant/20 text-on-surface-variant transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        </section>

        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          itemName={doseLogToDelete?.medicationName}
          itemType="Dose Record"
          onConfirm={handleConfirmDeleteDoseLog}
          onCancel={closeDeleteModal}
          isLoading={deletingId === doseLogToDelete?.id}
        />
      </main>
    </div>
  )
}

export default DoseHistoryPage
