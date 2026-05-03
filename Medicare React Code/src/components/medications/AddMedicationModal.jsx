import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../supabase/supabaseClient'

const FORM_OPTIONS = {
  highLevel: ['Solid', 'Semi-solid', 'Liquid', 'Spray', 'Injection', 'Inhalation'],
  byCategory: {
    Solid: ['Tablet', 'Capsule', 'Chewable tablet', 'Powder sachet', 'Lozenge'],
    'Semi-solid': ['Cream', 'Gel', 'Ointment', 'Lotion', 'Paste'],
    Liquid: ['Syrup', 'Suspension', 'Drops', 'Solution', 'Elixir'],
    Spray: ['Nasal spray', 'Oral spray', 'Throat spray', 'Ear spray', 'Dermal spray'],
    Injection: ['Subcutaneous', 'Intramuscular', 'Intravenous', 'Auto-injector', 'Prefilled syringe'],
    Inhalation: ['MDI inhaler', 'Dry powder inhaler', 'Nebulizer', 'Rotacap', 'Autohaler'],
  },
}

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
const TOPICAL_FORMS = ['Semi-solid', 'Cream', 'Gel', 'Ointment', 'Lotion', 'Paste']
const LIQUID_FORMS = ['Liquid', 'Syrup', 'Suspension', 'Drops', 'Solution', 'Elixir', 'Oral Solution']
const DOSE_BASED_FORMS = [
  'Spray',
  'Injection',
  'Inhalation',
  'Nasal spray',
  'Oral spray',
  'Throat spray',
  'Ear spray',
  'Dermal spray',
  'Subcutaneous',
  'Intramuscular',
  'Intravenous',
  'Auto-injector',
  'Prefilled syringe',
  'MDI inhaler',
  'Dry powder inhaler',
  'Nebulizer',
  'Rotacap',
  'Autohaler',
  'Inhaler',
  'Nebulizer Respule',
]

const DOSAGE_UNITS = {
  solid: ['mcg', 'mg', 'g'],
  liquid: ['ml'],
  topical: ['%', 'mg'],
  doseBased: ['puffs', 'units', 'doses'],
}

const FREQ_OPTIONS = [
  { value: 'daily', label: 'Every day', hint: 'once, twice, 3× …' },
  { value: 'weekly', label: 'Specific days of week', hint: 'Mon/Wed/Fri …' },
  { value: 'interval', label: 'Every N days', hint: 'every 3 days …' },
  { value: 'monthly', label: 'Monthly', hint: 'on the 1st, 6× a month …' },
]

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_DATES = ['1st', '5th', '10th', '15th', '20th', '25th']

const DEFAULT_TIMES = {
  1: ['08:00'],
  2: ['08:00', '20:00'],
  3: ['08:00', '14:00', '21:00'],
  4: ['07:00', '12:00', '17:00', '21:00'],
  5: ['07:00', '10:00', '13:00', '17:00', '21:00'],
  6: ['07:00', '09:00', '12:00', '15:00', '18:00', '21:00'],
}

const TIME_LABELS_DOSE = {
  1: ['Morning'],
  2: ['Morning', 'Evening'],
  3: ['Morning', 'Afternoon', 'Night'],
  4: ['Morning', 'Noon', 'Evening', 'Night'],
  5: ['Morning', 'Mid-morning', 'Noon', 'Afternoon', 'Night'],
  6: ['Morning', 'Mid-morning', 'Noon', 'Afternoon', 'Evening', 'Night'],
}

const subTime = (t) => {
  const [h, m] = t.split(':').map(Number)
  const total = h * 60 + m - 5
  const rh = Math.floor(((total % 1440) + 1440) % 1440 / 60)
  const rm = ((total % 1440) + 1440) % 1440 % 60
  return `${String(rh).padStart(2, '0')}:${String(rm).padStart(2, '0')}`
}

const fmt = (t) => {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

const getStockUnit = (form) => {
  if (SOLID_FORMS.includes(form)) return 'pieces'
  if (TOPICAL_FORMS.includes(form)) return 'applications'
  if (form === 'Drops') return 'drops'
  if (form === 'Syrup' || form === 'Suspension' || form === 'Solution' || form === 'Elixir') return 'spoon'
  if (LIQUID_FORMS.includes(form)) return 'ml'
  if (FORM_OPTIONS.byCategory.Spray.includes(form)) return 'sprays'
  if (FORM_OPTIONS.byCategory.Injection.includes(form)) return 'injections'
  if (FORM_OPTIONS.byCategory.Inhalation.includes(form)) return 'doses'
  return 'units'
}

const getFormType = (form) => {
  if (SOLID_FORMS.includes(form)) return 'solid'
  if (LIQUID_FORMS.includes(form)) return 'liquid'
  if (TOPICAL_FORMS.includes(form)) return 'topical'
  if (DOSE_BASED_FORMS.includes(form)) return 'doseBased'
  return null
}

const getFormCategory = (form) => {
  const normalized = (form || '').trim()
  if (FORM_OPTIONS.highLevel.includes(normalized)) return normalized
  return (
    Object.keys(FORM_OPTIONS.byCategory).find((category) =>
      FORM_OPTIONS.byCategory[category].includes(normalized),
    ) || ''
  )
}

const getConsumptionUnit = (form) => {
  if (SOLID_FORMS.includes(form)) return 'pieces'
  if (TOPICAL_FORMS.includes(form)) return 'applications'
  if (form === 'Drops') return 'drops'
  if (form === 'Syrup' || form === 'Suspension' || form === 'Solution' || form === 'Elixir') return 'spoon'
  if (LIQUID_FORMS.includes(form)) return 'ml'
  if (FORM_OPTIONS.byCategory.Spray.includes(form)) return 'sprays'
  if (FORM_OPTIONS.byCategory.Injection.includes(form)) return 'injections'
  if (FORM_OPTIONS.byCategory.Inhalation.includes(form)) return 'doses'
  return 'units'
}

const createInitialFormState = () => ({
  name: '',
  form: '',
  dosageAmount: '',
  dosageUnit: '',
  liquidDoseMg: '',
  liquidPerMl: '5',
  amountPerTime: '',
  freq: 'daily',
  doses: 1,
  times: ['08:00'],
  startDate: '',
  endDate: '',
  currentStock: '',
  prescribedBy: '',
  notes: '',
})

function AddMedicationModal({ isOpen, onClose, onSaved, existingMedication = null }) {
  const { user } = useAuth()

  const [formData, setFormData] = useState(createInitialFormState)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)
  const [prefillLoading, setPrefillLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [formCategory, setFormCategory] = useState('')
  const [selectedDays, setSelectedDays] = useState([1, 3, 5])
  const [monthlyMode, setMonthlyMode] = useState('dates')
  const [selectedMonthDates, setSelectedMonthDates] = useState(['1st', '15th'])
  const [monthCount, setMonthCount] = useState(6)
  const [intervalDays, setIntervalDays] = useState(3)

  const isEditMode = Boolean(existingMedication?.id)
  const formType = useMemo(() => getFormType(formData.form), [formData.form])
  const isTopical = formType === 'topical'
  const stockUnit = useMemo(() => getStockUnit(formData.form), [formData.form])
  const dosageUnitOptions = useMemo(() => {
    if (!formType) return []
    if (formType === 'solid') return DOSAGE_UNITS.solid
    if (formType === 'liquid') return DOSAGE_UNITS.liquid
    if (formType === 'topical') return DOSAGE_UNITS.topical
    return DOSAGE_UNITS.doseBased
  }, [formType])

  useEffect(() => {
    if (!isOpen) {
      setFormData(createInitialFormState())
      setErrors({})
      setSubmitError('')
      setLoading(false)
      setPrefillLoading(false)
      setStep(1)
      setFormCategory('')
    }
  }, [isOpen])

  useEffect(() => {
    const hydrateEditData = async () => {
      if (!isOpen || !isEditMode) return

      setPrefillLoading(true)
      setSubmitError('')
      setErrors({})
      setStep(1)
      setFormCategory('')

      const baseData = {
        name: existingMedication.name || '',
        form: existingMedication.form || '',
        dosageAmount: existingMedication.dosage_amount?.toString() || '',
        dosageUnit: existingMedication.dosage_unit || '',
        liquidDoseMg: '',
        liquidPerMl: '5',
        amountPerTime: existingMedication.amount_per_time?.toString() || '',
        freq: existingMedication.frequency || 'daily',
        doses: 1,
        times: ['08:00'],
        startDate: existingMedication.start_date || '',
        endDate: existingMedication.end_date || '',
        currentStock: existingMedication.dose_amount_left?.toString() || '',
        prescribedBy: existingMedication.prescribed_by || '',
        notes: existingMedication.notes || '',
      }

      if (existingMedication.frequency_details) {
        try {
          const freqDetails = existingMedication.frequency_details
          if (freqDetails.type) baseData.freq = freqDetails.type
          if (freqDetails.selectedDays) setSelectedDays(freqDetails.selectedDays)
          if (freqDetails.intervalDays) setIntervalDays(freqDetails.intervalDays)
          if (freqDetails.monthlyMode) setMonthlyMode(freqDetails.monthlyMode)
          if (freqDetails.selectedMonthDates) setSelectedMonthDates(freqDetails.selectedMonthDates)
          if (freqDetails.monthCount) setMonthCount(freqDetails.monthCount)
          if (freqDetails.dosesPerDay) baseData.doses = freqDetails.dosesPerDay
          if (freqDetails.times) baseData.times = freqDetails.times
        } catch (e) {
        }
      }

      const { data: schedules } = await supabase
        .from('medication_schedules')
        .select('time_label,time_to_take')
        .eq('medication_id', existingMedication.id)
        .order('created_at', { ascending: true })

      if (schedules?.length) {
        baseData.times = schedules.map((schedule) => (schedule.time_to_take || '').slice(0, 5))
        baseData.doses = schedules.length
      }

      const category = getFormCategory(baseData.form)
      if (category && FORM_OPTIONS.highLevel.includes(baseData.form)) {
        baseData.form = (FORM_OPTIONS.byCategory[category] || [])[0] || baseData.form
      }
      if (getFormType(baseData.form) === 'liquid') {
        const liquidMatch = /^(\d+(?:\.\d+)?)mg\/(\d+(?:\.\d+)?)ml$/i.exec(baseData.dosageUnit || '')
        if (liquidMatch) {
          baseData.liquidDoseMg = liquidMatch[1]
          baseData.liquidPerMl = liquidMatch[2]
        } else {
          baseData.liquidDoseMg = baseData.dosageAmount || ''
          baseData.liquidPerMl = '5'
        }
      }

      setFormData(baseData)
      setFormCategory(category)
      setPrefillLoading(false)
    }

    if (!isOpen || isEditMode) {
      hydrateEditData()
      return
    }

    setFormData(createInitialFormState())
    setErrors({})
    setSubmitError('')
    setStep(1)
    setFormCategory('')
  }, [existingMedication, isEditMode, isOpen])

  useEffect(() => {
    if (!dosageUnitOptions.length) {
      setFormData((prev) => ({ ...prev, dosageUnit: '' }))
      return
    }
    if (!dosageUnitOptions.includes(formData.dosageUnit)) {
      setFormData((prev) => ({ ...prev, dosageUnit: dosageUnitOptions[0] }))
    }
  }, [dosageUnitOptions, formData.dosageUnit])

  const setField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
    setSubmitError('')
  }

  const setDoseTimeField = (index, field, value) => {
    setFormData((prev) => {
      const nextSlots = [...prev.doseTimes]
      nextSlots[index] = { ...nextSlots[index], [field]: value }
      return { ...prev, doseTimes: nextSlots }
    })

    setErrors((prev) => {
      const next = { ...prev }
      delete next[`doseTimes.${index}.label`]
      delete next[`doseTimes.${index}.time`]
      delete next.doseTimes
      return next
    })
  }

  const handleCategorySelect = (category) => {
    const nextOptions = FORM_OPTIONS.byCategory[category] || []
    setFormCategory(category)
    setField('form', nextOptions[0] || '')
  }

  const validateStep1 = () => {
    const nextErrors = {}
    if (!formData.name.trim()) nextErrors.name = 'Medicine name is required.'
    if (!formData.form) nextErrors.form = 'Form is required.'

    if (formType === 'solid') {
      const dosageAmount = Number(formData.dosageAmount)
      if (!formData.dosageAmount || Number.isNaN(dosageAmount) || dosageAmount <= 0) {
        nextErrors.dosageAmount = 'Strength must be a positive number.'
      }
      if (!formData.dosageUnit) nextErrors.dosageUnit = 'Strength unit is required.'
    }

    if (formType === 'liquid') {
      const doseMg = Number(formData.liquidDoseMg)
      const perMl = Number(formData.liquidPerMl)
      if (!formData.liquidDoseMg || Number.isNaN(doseMg) || doseMg <= 0) {
        nextErrors.liquidDoseMg = 'Strength (mg) must be a positive number.'
      }
      if (!formData.liquidPerMl || Number.isNaN(perMl) || perMl <= 0) {
        nextErrors.liquidPerMl = 'Volume (ml) must be a positive number.'
      }
    }

    const amountPerTime = Number(formData.amountPerTime)
    if (!formData.amountPerTime || Number.isNaN(amountPerTime) || amountPerTime <= 0) {
      nextErrors.amountPerTime = 'Please enter how much you consume per time.'
    }

    const currentStock = Number(formData.currentStock)
    if (!formData.currentStock || Number.isNaN(currentStock) || currentStock <= 0) {
      nextErrors.currentStock = 'Stock amount must be a positive number.'
    }

    setErrors((prev) => ({ ...prev, ...nextErrors }))
    return Object.keys(nextErrors).length === 0
  }

  const validateStep2 = () => {
    return true
  }

  const validateStep3 = () => {
    return true
  }

  const validateStep4 = () => {
    return true
  }

  const validateAllSteps = () => validateStep1() && validateStep2() && validateStep3() && validateStep4()

  const goNext = () => {
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    if (step === 3 && !validateStep3()) return
    setStep((prev) => Math.min(4, prev + 1))
  }

  const goBack = () => setStep((prev) => Math.max(1, prev - 1))

  const getFrequencyDisplay = () => {
    const baseLabel = FREQ_OPTIONS.find((f) => f.value === formData.freq)?.label || ''
    
    if (formData.freq === 'daily') {
      return baseLabel
    }
    
    if (formData.freq === 'weekly') {
      const selectedDayNames = selectedDays
        .sort((a, b) => a - b)
        .map((i) => WEEKDAYS[i])
        .join(', ')
      return `${baseLabel}: ${selectedDayNames}`
    }
    
    if (formData.freq === 'interval') {
      return `${baseLabel}: Every ${intervalDays} days`
    }
    
    if (formData.freq === 'monthly') {
      if (monthlyMode === 'dates') {
        const selectedDatesStr = selectedMonthDates
          .sort((a, b) => {
            const aNum = parseInt(a)
            const bNum = parseInt(b)
            return aNum - bNum
          })
          .join(', ')
        return `${baseLabel}: ${selectedDatesStr}`
      } else {
        return `${baseLabel}: ${monthCount} times per month`
      }
    }
    
    return baseLabel
  }

  const handleSaveClick = async () => {
    setSubmitError('')
    if (!validateAllSteps()) return

    if (!user?.id) {
      setSubmitError('User session not found. Please login again.')
      return
    }

    setLoading(true)

    try {
      let dosageAmountForSave = null
      let dosageUnitForSave = null

      if (formType === 'solid') {
        dosageAmountForSave = parseFloat(formData.dosageAmount)
        dosageUnitForSave = formData.dosageUnit
      } else if (formType === 'liquid') {
        dosageAmountForSave = parseFloat(formData.liquidDoseMg)
        dosageUnitForSave = `mg/${formData.liquidPerMl}ml`
      }

      const medicationPayload = {
        user_id: user.id,
        name: formData.name.trim(),
        form: formData.form,
        dosage_amount: dosageAmountForSave,
        dosage_unit: dosageUnitForSave,
        frequency: formData.freq,
        dose_amount_left: parseInt(formData.currentStock, 10),
        stock_unit: getStockUnit(formData.form),
        start_date: isEditMode ? existingMedication.start_date : new Date().toISOString().split('T')[0],
        end_date: isEditMode ? existingMedication.end_date : null,
        prescribed_by: formData.prescribedBy?.trim() || null,
        notes: formData.notes?.trim() || null,
        is_active: true,
        amount_per_time: parseFloat(formData.amountPerTime) || null,
        consumption_unit: getConsumptionUnit(formData.form),
        frequency_details: {
          type: formData.freq,
          selectedDays: selectedDays,
          intervalDays: parseInt(intervalDays, 10),
          monthlyMode: monthlyMode,
          selectedMonthDates: selectedMonthDates,
          monthCount: parseInt(monthCount, 10),
          dosesPerDay: formData.doses,
          times: formData.times,
        },
      }

      let medication = null
      let medicationError = null

      if (isEditMode) {
        const response = await supabase
          .from('medications')
          .update(medicationPayload)
          .eq('id', existingMedication.id)
          .eq('user_id', user.id)
          .select()
          .single()
        medication = response.data
        medicationError = response.error
      } else {
        const response = await supabase
          .from('medications')
          .insert(medicationPayload)
          .select()
          .single()
        medication = response.data
        medicationError = response.error
      }

      if (medicationError) throw medicationError

      const { error: clearSchedulesError } = await supabase
        .from('medication_schedules')
        .delete()
        .eq('medication_id', medication.id)

      if (clearSchedulesError) throw clearSchedulesError

      // Always save schedules for all medicine types (including topical)
      if (formData.times && formData.times.length > 0) {
        const schedules = formData.times.map((time, index) => ({
          medication_id: medication.id,
          time_label: TIME_LABELS_DOSE[formData.doses][index] || '',
          time_to_take: time,
        }))
        const { error: scheduleError } = await supabase.from('medication_schedules').insert(schedules)
        if (scheduleError) throw scheduleError
      }

      onSaved?.(isEditMode ? 'Medication updated successfully' : 'Medication added successfully')
      onClose?.()
    } catch (err) {
      setSubmitError(err?.message || 'Could not save medication. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`fixed inset-0 z-[80] transition-all duration-200 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      <div className={`absolute inset-0 bg-slate-950/40 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />

      <div className="absolute inset-0 flex items-center justify-center p-4 md:p-8">
        <div
          className={`max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-2xl shadow-primary/15 transition-all duration-200 ${
            isOpen ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-3 scale-[0.98] opacity-0'
          }`}
        >
          <div className="flex items-center justify-between border-b border-outline-variant/20 px-6 py-5">
            <div>
              <h3 className="font-headline text-2xl font-extrabold tracking-tight text-primary">
                {isEditMode ? 'Edit Medication' : 'Add Medication'}
              </h3>
            <p className="text-xs font-medium text-on-surface-variant">Step {step} of 4</p>
            </div>
            <button
              className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
              onClick={onClose}
              type="button"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <form className="ui-scrollbar max-h-[calc(92vh-84px)] overflow-y-auto px-6 py-6">
            {prefillLoading && (
              <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-surface-container-high px-3 py-2 text-xs font-semibold text-primary">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                Loading medication details...
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-headline text-xl font-bold text-primary">Medicine details</h4>
                  <p className="text-sm font-medium text-on-surface-variant">Name, form and strength</p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-bold text-primary">Medicine name</label>
                    <input
                      className="w-full rounded-xl border-none bg-surface-container-high px-4 py-3.5 font-medium text-on-surface focus:ring-2 focus:ring-primary/20"
                      onChange={(e) => setField('name', e.target.value)}
                      placeholder="e.g. Paracetamol, Amoxicillin"
                      type="text"
                      value={formData.name}
                    />
                    {errors.name && <p className="mt-1 text-xs font-semibold text-error">{errors.name}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-bold uppercase tracking-wide text-primary">Form</label>
                    <div className="flex flex-wrap gap-2">
                      {FORM_OPTIONS.highLevel.map((category) => (
                        <button
                          className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                            formCategory === category
                              ? 'border-primary bg-primary-fixed text-primary'
                              : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary/40'
                          }`}
                          key={category}
                          onClick={() => handleCategorySelect(category)}
                          type="button"
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>

                  {formCategory && (
                    <div className="md:col-span-2 overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-lowest">
                      {(FORM_OPTIONS.byCategory[formCategory] || []).map((option) => {
                        const isSelected = formData.form === option
                        return (
                          <button
                            className={`flex w-full items-center justify-between border-b border-outline-variant/20 px-4 py-3 text-left transition-colors last:border-b-0 ${
                              isSelected ? 'bg-primary-fixed/50' : 'hover:bg-surface-container-low/40'
                            }`}
                            key={option}
                            onClick={() => setField('form', option)}
                            type="button"
                          >
                            <span className={`text-sm font-semibold ${isSelected ? 'text-primary' : 'text-on-surface'}`}>{option}</span>
                            <span
                              className={`h-4 w-4 rounded-full border ${
                                isSelected ? 'border-primary bg-primary shadow-[inset_0_0_0_3px_white]' : 'border-outline'
                              }`}
                            />
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {formType === 'solid' && (
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-bold text-primary">Strength</label>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          className="w-full rounded-xl border-none bg-surface-container-high px-4 py-3.5 font-medium text-on-surface focus:ring-2 focus:ring-primary/20"
                          min="0"
                          onChange={(e) => setField('dosageAmount', e.target.value)}
                          placeholder="e.g. 500"
                          step="any"
                          type="number"
                          value={formData.dosageAmount}
                        />
                        <select
                          className="w-full rounded-xl border-none bg-surface-container-high px-4 py-3.5 font-medium text-on-surface focus:ring-2 focus:ring-primary/20"
                          onChange={(e) => setField('dosageUnit', e.target.value)}
                          value={formData.dosageUnit}
                        >
                          {!dosageUnitOptions.length && <option value="">Select form first</option>}
                          {dosageUnitOptions.map((unit) => (
                            <option key={unit} value={unit}>{unit}</option>
                          ))}
                        </select>
                      </div>
                      {(errors.dosageAmount || errors.dosageUnit) && (
                        <p className="mt-1 text-xs font-semibold text-error">{errors.dosageAmount || errors.dosageUnit}</p>
                      )}
                    </div>
                  )}

                  {formType === 'liquid' ? (
                    <div className="md:col-span-2 flex flex-col gap-6">
                      <div>
                        <label className="mb-2 block text-sm font-bold text-primary">Strength per dose (mg/ml)</label>
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            className="min-w-[6rem] flex-1 rounded-xl border-none bg-surface-container-high px-4 py-3.5 font-medium text-on-surface focus:ring-2 focus:ring-primary/20"
                            min="0"
                            onChange={(e) => setField('liquidDoseMg', e.target.value)}
                            placeholder="120"
                            step="any"
                            type="number"
                            value={formData.liquidDoseMg}
                          />
                          <span className="whitespace-nowrap text-sm font-bold text-primary">mg /</span>
                          <input
                            className="min-w-[4rem] rounded-xl border-none bg-surface-container-high px-4 py-3.5 font-medium text-on-surface focus:ring-2 focus:ring-primary/20"
                            min="0"
                            onChange={(e) => setField('liquidPerMl', e.target.value)}
                            placeholder="5"
                            step="any"
                            type="number"
                            value={formData.liquidPerMl}
                          />
                          <span className="whitespace-nowrap text-sm font-bold text-primary">ml</span>
                        </div>
                        {(errors.liquidDoseMg || errors.liquidPerMl) && (
                          <p className="mt-1 text-xs font-semibold text-error">{errors.liquidDoseMg || errors.liquidPerMl}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-bold text-primary">How much do you consume per time?</label>
                          <div className="grid grid-cols-[1fr_auto] gap-3">
                            <input
                              className="w-full rounded-xl border-none bg-surface-container-high px-4 py-3.5 font-medium text-on-surface focus:ring-2 focus:ring-primary/20"
                              min="0"
                              onChange={(e) => setField('amountPerTime', e.target.value)}
                              placeholder="e.g. 1"
                              step="any"
                              type="number"
                              value={formData.amountPerTime}
                            />
                            <span className="flex items-center rounded-xl border border-outline-variant/50 bg-surface-container-high px-4 text-sm font-semibold text-on-surface">
                              {getConsumptionUnit(formData.form)}
                            </span>
                          </div>
                          {errors.amountPerTime && <p className="mt-1 text-xs font-semibold text-error">{errors.amountPerTime}</p>}
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-bold text-primary">How much stock do you have?</label>
                          <div className="grid grid-cols-[1fr_auto] gap-3">
                            <input
                              className="w-full rounded-xl border-none bg-surface-container-high px-4 py-3.5 font-medium text-on-surface focus:ring-2 focus:ring-primary/20"
                              min="0"
                              onChange={(e) => setField('currentStock', e.target.value)}
                              placeholder={`e.g. 30`}
                              step="any"
                              type="number"
                              value={formData.currentStock}
                            />
                            <span className="flex items-center rounded-xl border border-outline-variant/50 bg-surface-container-high px-4 text-sm font-semibold text-on-surface">
                              {getConsumptionUnit(formData.form)}
                            </span>
                          </div>
                          {errors.currentStock && <p className="mt-1 text-xs font-semibold text-error">{errors.currentStock}</p>}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="md:col-span-2 grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-bold text-primary">How much do you consume per time?</label>
                        <div className="grid grid-cols-[1fr_auto] gap-3">
                          <input
                            className="w-full rounded-xl border-none bg-surface-container-high px-4 py-3.5 font-medium text-on-surface focus:ring-2 focus:ring-primary/20"
                            min="0"
                            onChange={(e) => setField('amountPerTime', e.target.value)}
                            placeholder="e.g. 1"
                            step="any"
                            type="number"
                            value={formData.amountPerTime}
                          />
                          <span className="flex items-center rounded-xl border border-outline-variant/50 bg-surface-container-high px-4 text-sm font-semibold text-on-surface">
                            {getConsumptionUnit(formData.form)}
                          </span>
                        </div>
                        {errors.amountPerTime && <p className="mt-1 text-xs font-semibold text-error">{errors.amountPerTime}</p>}
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-bold text-primary">How much stock do you have?</label>
                        <div className="grid grid-cols-[1fr_auto] gap-3">
                        <input
                          className="w-full rounded-xl border-none bg-surface-container-high px-4 py-3.5 font-medium text-on-surface focus:ring-2 focus:ring-primary/20"
                          min="0"
                          onChange={(e) => setField('currentStock', e.target.value)}
                          placeholder={`e.g. 30`}
                          step="any"
                          type="number"
                          value={formData.currentStock}
                        />
                        <span className="flex items-center rounded-xl border border-outline-variant/50 bg-surface-container-high px-4 text-sm font-semibold text-on-surface">
                            {getConsumptionUnit(formData.form)}
                        </span>
                        </div>
                        {errors.currentStock && <p className="mt-1 text-xs font-semibold text-error">{errors.currentStock}</p>}
                      </div>
                    </div>
                  )}

                  {errors.form && <p className="md:col-span-2 mt-1 text-xs font-semibold text-error">{errors.form}</p>}

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-bold text-primary">Prescribed by</label>
                    <input
                      className="w-full rounded-xl border-none bg-surface-container-high px-4 py-3.5 font-medium text-on-surface focus:ring-2 focus:ring-primary/20"
                      onChange={(e) => setField('prescribedBy', e.target.value)}
                      placeholder="e.g. Dr. Sarah Chen"
                      type="text"
                      value={formData.prescribedBy}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-bold text-primary">Note</label>
                    <textarea
                      className="min-h-[80px] w-full rounded-xl border-none bg-surface-container-high px-4 py-3.5 font-medium text-on-surface focus:ring-2 focus:ring-primary/20"
                      onChange={(e) => setField('notes', e.target.value)}
                      placeholder="e.g. Take with a full glass of water"
                      value={formData.notes}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-headline text-xl font-bold text-primary">Frequency</h4>
                  <p className="text-sm font-medium text-on-surface-variant">How often do you take this?</p>
                </div>

                <div className="space-y-2">
                  {FREQ_OPTIONS.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setFormData((s) => ({ ...s, freq: f.value }))}
                      className={`w-full flex items-center justify-between gap-10 rounded-lg border px-4 py-3 text-left transition-all ${
                        formData.freq === f.value
                          ? 'border-primary bg-primary-fixed/10'
                          : 'border-outline-variant/30 hover:border-outline-variant/50'
                      }`}
                      type="button"
                    >
                      <div>
                        <p className={`text-sm font-semibold ${
                          formData.freq === f.value ? 'text-primary' : 'text-on-surface'
                        }`}>
                          {f.label}
                        </p>
                        <p className="text-xs text-on-surface-variant">{f.hint}</p>
                      </div>
                      <div
                        className={`h-4 w-4 flex-shrink-0 rounded-full border-2 ${
                          formData.freq === f.value
                            ? 'border-primary bg-primary'
                            : 'border-outline-variant'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                {formData.freq === 'weekly' && (
                  <div>
                    <label className="mb-2 block text-sm font-bold text-primary">Which days?</label>
                    <div className="flex flex-wrap gap-2">
                      {WEEKDAYS.map((d, i) => (
                        <button
                          key={d}
                          onClick={() =>
                            setSelectedDays((prev) =>
                              prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
                            )
                          }
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                            selectedDays.includes(i)
                              ? 'border-primary bg-primary-fixed text-primary'
                              : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary/40'
                          }`}
                          type="button"
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {formData.freq === 'interval' && (
                  <div>
                    <label className="mb-2 block text-sm font-bold text-primary">Repeat every how many days?</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={intervalDays}
                        onChange={(e) => setIntervalDays(e.target.value)}
                        className="w-16 rounded-lg border-none bg-surface-container-high px-3 py-2 font-medium text-on-surface focus:ring-2 focus:ring-primary/20"
                      />
                      <span className="text-sm font-medium text-on-surface-variant">days</span>
                    </div>
                  </div>
                )}

                {formData.freq === 'monthly' && (
                  <div className="space-y-3">
                    <label className="mb-2 block text-sm font-bold text-primary">Monthly type</label>
                    <div className="flex gap-2">
                      {['dates', 'count'].map((m) => (
                        <button
                          key={m}
                          onClick={() => setMonthlyMode(m)}
                          className={`rounded-lg border px-4 py-2 text-xs font-semibold transition-all ${
                            monthlyMode === m
                              ? 'border-primary bg-primary-fixed text-primary'
                              : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary/40'
                          }`}
                          type="button"
                        >
                          {m === 'dates' ? 'Specific dates' : 'X times a month'}
                        </button>
                      ))}
                    </div>
                    {monthlyMode === 'dates' && (
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-primary">Which dates?</label>
                        <div className="flex flex-wrap gap-2">
                          {MONTH_DATES.map((d) => (
                            <button
                              key={d}
                              onClick={() =>
                                setSelectedMonthDates((prev) =>
                                  prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
                                )
                              }
                              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                                selectedMonthDates.includes(d)
                                  ? 'border-primary bg-primary-fixed text-primary'
                                  : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary/40'
                              }`}
                              type="button"
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {monthlyMode === 'count' && (
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-primary">How many times per month?</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min="1"
                            max="31"
                            value={monthCount}
                            onChange={(e) => setMonthCount(e.target.value)}
                            className="w-16 rounded-lg border-none bg-surface-container-high px-3 py-2 font-medium text-on-surface focus:ring-2 focus:ring-primary/20"
                          />
                          <span className="text-sm font-medium text-on-surface-variant">times</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-headline text-xl font-bold text-primary">Dose times</h4>
                  <p className="text-sm font-medium text-on-surface-variant">How many times per day?</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <button
                      key={n}
                      onClick={() => setFormData((s) => ({ ...s, doses: n, times: [...DEFAULT_TIMES[n]] }))}
                      className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-all ${
                        formData.doses === n
                          ? 'border-primary bg-primary-fixed text-primary'
                          : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary/40'
                      }`}
                      type="button"
                    >
                      {n}×
                    </button>
                  ))}
                </div>

                <div className="space-y-3 rounded-lg border border-outline-variant/20 bg-surface-container-low/50 p-4">
                  {TIME_LABELS_DOSE[formData.doses].map((lbl, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-28 text-xs font-medium text-on-surface-variant">{lbl}</span>
                      <input
                        type="time"
                        value={formData.times[i] || DEFAULT_TIMES[formData.doses][i]}
                        onChange={(e) => {
                          setFormData((s) => {
                            const times = [...s.times]
                            times[i] = e.target.value
                            return { ...s, times }
                          })
                        }}
                        className="flex-1 rounded-lg border-none bg-surface-container-high px-3 py-2 text-xs font-medium text-on-surface focus:ring-2 focus:ring-primary/20"
                      />
                      <div className="w-12 text-center rounded-full bg-warning-container px-2 py-1 text-xs font-semibold text-warning">-5 min</div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-on-surface-variant">Reminders are sent 5 min before each time.</p>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-headline text-xl font-bold text-primary">Confirm & save</h4>
                  <p className="text-sm font-medium text-on-surface-variant">Review your schedule</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-surface-container-low p-3">
                    <p className="text-xs text-on-surface-variant">Medicine</p>
                    <p className="text-sm font-semibold text-on-surface">
                      {formData.name || '—'}
                      {formType === 'solid' && formData.dosageAmount && ` ${formData.dosageAmount}${formData.dosageUnit}`}
                      {formType === 'liquid' && formData.liquidDoseMg && ` ${formData.liquidDoseMg}mg/${formData.liquidPerMl}ml`}
                    </p>
                  </div>
                  <div className="rounded-lg bg-surface-container-low p-3">
                    <p className="text-xs text-on-surface-variant">Form</p>
                    <p className="text-sm font-semibold text-on-surface">{formData.form}</p>
                  </div>
                  <div className="rounded-lg bg-surface-container-low p-3">
                    <p className="text-xs text-on-surface-variant">Frequency</p>
                    <p className="text-sm font-semibold text-on-surface">{getFrequencyDisplay()}</p>
                  </div>
                  <div className="rounded-lg bg-surface-container-low p-3">
                    <p className="text-xs text-on-surface-variant">Doses/day</p>
                    <p className="text-sm font-semibold text-on-surface">{formData.doses}×</p>
                  </div>
                  <div className="md:col-span-2 rounded-lg bg-surface-container-low p-3">
                    <p className="text-xs text-on-surface-variant">Prescribed by</p>
                    <p className="text-sm font-semibold text-on-surface">{formData.prescribedBy || '—'}</p>
                  </div>
                  <div className="md:col-span-2 rounded-lg bg-surface-container-low p-3">
                    <p className="text-xs text-on-surface-variant">Notes</p>
                    <p className="text-sm font-semibold text-on-surface">{formData.notes || '—'}</p>
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-wide text-primary">Reminder times</p>
                  <div className="space-y-2 rounded-lg border border-outline-variant/20 bg-surface-container-low/50 p-3">
                    {formData.times.map((t, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border-b border-outline-variant/20 pb-2 last:border-b-0 last:pb-0">
                        <div>
                          <p className="text-sm font-semibold text-on-surface">{fmt(t)}</p>
                          <p className="text-xs text-on-surface-variant">Reminder at {fmt(subTime(t))}</p>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-success">
                          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1" />
                          <path d="M5 8.5l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-on-surface-variant">
                    {formData.times.length} dose{formData.times.length > 1 ? 's' : ''} per day · Reminders sent 5 min before each dose
                  </p>
                </div>
              </div>
            )}

            {submitError && (
              <p className="mt-4 rounded-lg bg-error-container px-4 py-2 text-sm font-semibold text-on-error-container">
                {submitError}
              </p>
            )}

            <div className="mt-6 flex items-center justify-between border-t border-outline-variant/20 pt-5">
              <div>
                {step > 1 && (
                  <button
                    className="rounded-xl bg-surface-container-high px-5 py-3 text-sm font-bold text-primary transition-all hover:bg-surface-container-low active:scale-[0.98]"
                    onClick={goBack}
                    type="button"
                  >
                    Back
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  className="rounded-xl bg-surface-container-high px-5 py-3 text-sm font-bold text-primary transition-all hover:bg-surface-container-low active:scale-[0.98]"
                  onClick={onClose}
                  type="button"
                >
                  Cancel
                </button>

                {step < 4 ? (
                  <button
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-container px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:opacity-90 active:scale-[0.98]"
                    onClick={goNext}
                    type="button"
                  >
                    {step === 3 ? 'Preview' : 'Next'}
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                ) : (
                  <button
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-container px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={loading}
                    onClick={handleSaveClick}
                    type="button"
                  >
                    {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
                    {loading ? 'Saving...' : isEditMode ? 'Update Medication' : 'Save Medication'}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddMedicationModal
