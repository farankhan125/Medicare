import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase/supabaseClient'

function RegistrationPage() {
  const navigate = useNavigate()

  const [step, setStep]     = useState(1)
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    fullName:        '',
    email:           '',
    password:        '',
    confirmPassword: '',
    dateOfBirth:     '',
    gender:          '',
  })
  const [otpCode,      setOtpCode]      = useState('')
  const [otpSent,      setOtpSent]      = useState(false)
  const [otpVerifying, setOtpVerifying] = useState(false)
  const [otpMessage,   setOtpMessage]   = useState('')
  const [verifiedUserId, setVerifiedUserId] = useState(null) 

  const [conditions,      setConditions]      = useState([])   
  const [conditionInput,  setConditionInput]  = useState('')   
  const [showCondInput,   setShowCondInput]   = useState(false)
  const [medicalInfo, setMedicalInfo] = useState({
    allergies:   '',
    bloodType:   '',
    organDonor:  false,
    weightKg:    '',
    heightCm:    '',
  })

  const [emergencyContact, setEmergencyContact] = useState({
    name:     '',
    number:   '',
    relation: '',
  })

  const progressWidth = step === 1 ? '0%' : step === 2 ? '50%' : '100%'

  const getUserTimezone = () => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone
    } catch (e) {
      return 'Asia/Karachi' 
    }
  }

  useEffect(() => {
    const savedOtpEmail = sessionStorage.getItem('otp_email')
    if (!savedOtpEmail) return
    setFormData((prev) => ({ ...prev, email: prev.email || savedOtpEmail }))
  }, [])

  const prevStep = () => {
    setError('')
    setStep((prev) => Math.max(prev - 1, 1))
  }

  // -- Handlers --
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleMedicalChange = (e) => {
    setMedicalInfo((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleEmergencyChange = (e) => {
    setEmergencyContact((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  // Add a condition tag
  const handleAddCondition = () => {
    const trimmed = conditionInput.trim()
    if (!trimmed) return
    setConditions((prev) => [...prev, trimmed])
    setConditionInput('')
    setShowCondInput(false)
  }

  // Remove a condition tag
  const handleRemoveCondition = (index) => {
    setConditions((prev) => prev.filter((_, i) => i !== index))
  }

  // -- Validation --
  const validateStepOne = () => {
    if (!formData.fullName.trim())      return setError('Please enter your full name.'),          false
    if (!formData.email.trim())         return setError('Please enter your email address.'),       false
    if (!formData.dateOfBirth)          return setError('Please enter your date of birth.'),       false
    if (!formData.gender)               return setError('Please select your gender.'),             false
    if (formData.password.length < 8)   return setError('Password must be at least 8 characters.'), false
    if (formData.password !== formData.confirmPassword)
                                        return setError('Passwords do not match.'),                false
    const dob = new Date(formData.dateOfBirth)
    const age = new Date().getFullYear() - dob.getFullYear()
    if (age < 12)                       return setError('You must be at least 12 years old.'),     false
    return true
  }

  const validateStepTwo = () => {
    if (!medicalInfo.bloodType)  return setError('Please select your blood type.'),          false
    if (!medicalInfo.weightKg)   return setError('Please enter your weight.'),               false
    if (!medicalInfo.heightCm)   return setError('Please enter your height.'),               false
    return true
  }

  const validateStepThree = () => {
    if (!emergencyContact.name.trim())     return setError('Please enter emergency contact name.'),   false
    if (!emergencyContact.number.trim())   return setError('Please enter emergency contact number.'), false
    if (!emergencyContact.relation)        return setError('Please select your relation.'),           false
    return true
  }

  // -- Step 1: Send OTP --
  const handleSendOtp = async () => {
    setError('')
    setOtpMessage('')
    if (!validateStepOne()) return

    setLoading(true)

    const { error: signUpError } = await supabase.auth.signUp({
      email:    formData.email,
      password: formData.password,
      options: {
        data: { full_name: formData.fullName },
      },
    })

    setLoading(false)

    if (signUpError) {
      if (signUpError.message?.toLowerCase().includes('already registered')) {
        const { error: resendError } = await supabase.auth.resend({
          type: 'signup',
          email: formData.email,
        })

        if (resendError) {
          setError(resendError.message || 'Could not resend OTP. Please try again.')
          return
        }

        setOtpSent(true)
        setOtpMessage(`A 6-digit OTP has been resent to ${formData.email}`)
        return
      }

      setError(signUpError.message)
      return
    }

    setOtpSent(true)
    setOtpMessage(`A 6-digit OTP has been sent to ${formData.email}`)
  }

  const handleVerifyOtp = async () => {
    setError('')
    setOtpMessage('')

    if (otpCode.trim().length !== 6) {
      return setError('Please enter the full 6 digit OTP code.')
    }

    setOtpVerifying(true)

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email: formData.email,
      token: otpCode.trim(),
      type:  'signup',
    })

    setOtpVerifying(false)

    if (verifyError) {
      return setError('Invalid or expired code. Please try again.')
    }

    const safeFullName =
      formData.fullName.trim() ||
      data?.user?.user_metadata?.full_name ||
      formData.email.split('@')[0]
    const safeEmail = formData.email.trim() || data?.user?.email || ''

    setVerifiedUserId(data.user.id)

    const { error: stepOneProfileError } = await supabase
      .from('profiles')
      .upsert(
        {
          id:            data.user.id,
          email:         safeEmail,
          full_name:     safeFullName,
          date_of_birth: formData.dateOfBirth,
          gender:        formData.gender,
          timezone:      getUserTimezone(),
        },
        { onConflict: 'id' },
      )

    if (stepOneProfileError) {
      return setError(stepOneProfileError.message || 'Could not save your basic profile info.')
    }

    setOtpMessage('')
    setError('')
    setStep(2)
  }

  const handleStepTwoNext = () => {
    if (!validateStepTwo()) return
    setError('')
    setStep(3)
  }

  const handleFinish = async () => {
    if (!validateStepThree()) return

    setLoading(true)

    const { data: userData, error: getUserError } = await supabase.auth.getUser()
    const userId = userData?.user?.id || verifiedUserId
    const safeFullName =
      formData.fullName.trim() ||
      userData?.user?.user_metadata?.full_name ||
      userData?.user?.email?.split('@')?.[0] ||
      'MediCare User'
    const safeEmail =
      formData.email.trim() ||
      userData?.user?.email ||
      sessionStorage.getItem('otp_email') ||
      ''

    if (getUserError || !userId) {
      setLoading(false)
      return setError('Session error. Please register again.')
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .upsert(
        {
          id:                         userId,
          email:                      safeEmail,
          full_name:                  safeFullName,
          date_of_birth:              formData.dateOfBirth,
          gender:                     formData.gender,
          known_conditions:           conditions.join(', '),
          allergies:                  medicalInfo.allergies,
          blood_type:                 medicalInfo.bloodType,
          organ_donor:                medicalInfo.organDonor,
          weight_kg:                  parseFloat(medicalInfo.weightKg),
          height_cm:                  parseFloat(medicalInfo.heightCm),
          emergency_contact_name:     emergencyContact.name,
          emergency_contact_number:   emergencyContact.number,
          emergency_contact_relation: emergencyContact.relation,
          profile_completed:          true,
          timezone:                   getUserTimezone(),
        },
        { onConflict: 'id' },
      )

    setLoading(false)

    if (updateError) {
      return setError(updateError.message || 'Something went wrong saving your profile. Please try again.')
    }

    navigate('/dashboard')
  }

  // -- Render --
  return (
    <div className="bg-surface text-on-surface flex min-h-screen font-body">
      <main className="relative flex flex-1 justify-center bg-surface pt-20 pb-6 px-6 sm:pt-24 sm:pb-8 sm:px-8 lg:pt-28 lg:pb-12 lg:px-12">
        <Link className="absolute left-4 top-4 flex items-center gap-2 text-primary sm:left-8 sm:top-8 lg:left-12 lg:top-10" to="/">
          <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: '"FILL" 1' }}>
            guardian
          </span>
          <div>
            <p className="font-headline text-2xl font-black tracking-tighter">MediCare</p>
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Empathetic Guardian</p>
          </div>
        </Link>

        <div className="w-full max-w-4xl">
          <header className="mb-12 text-center">
            <div className="mb-4 flex flex-col items-center justify-center gap-3 md:flex-row md:gap-4 md:items-center">
              <span className="rounded-full bg-secondary-container px-3 py-1 text-xs font-bold text-on-secondary-container">
                Step {step} of 3
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl lg:text-4xl">
                {step === 1 ? 'Personal Info Setup' : step === 2 ? 'Medical Info Setup' : 'Emergency Info Setup'}
              </h1>
            </div>
            <p className="mx-auto max-w-xl leading-relaxed text-on-surface-variant">
              {step === 1
                ? "Let's start with your core profile details so we can personalize your MediCare experience from day one."
                : step === 2
                  ? 'This information helps our AI Guardian provide precise, life-saving recommendations.'
                  : 'Add trusted emergency contact details so help can be reached quickly when needed.'}
            </p>
            {error && (
              <p className="mx-auto mt-4 max-w-xl rounded-lg bg-error-container px-4 py-2 text-sm font-semibold text-on-error-container">
                {error}
              </p>
            )}
          </header>

          {/* Step Indicators */}
          <div className="relative mb-16">
            <div aria-hidden="true" className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-surface-container-high"></div>
            </div>
            <div className="relative flex justify-between">
              {[1, 2, 3].map((s) => (
                <div key={s} className="group flex flex-col items-center">
                  <div
                    className={`z-10 flex items-center justify-center rounded-full font-bold ${
                      step > s
                        ? 'h-10 w-10 bg-primary text-white shadow-xl shadow-primary/20'
                        : step === s
                          ? 'ring-4 ring-white h-12 w-12 bg-gradient-to-br from-primary to-primary-container text-white shadow-2xl shadow-primary/30'
                          : 'h-10 w-10 border-2 border-white bg-surface-container-highest text-outline'
                    }`}
                  >
                    {step > s ? <span className="material-symbols-outlined text-xl">check</span> : s}
                  </div>
                  <span className={`mt-3 text-xs font-bold ${step >= s ? 'text-primary' : 'text-outline'}`}>
                    {s === 1 ? 'Personal Info' : s === 2 ? 'Medical Info' : 'Emergency'}
                  </span>
                </div>
              ))}
            </div>
            <div
              className="absolute left-0 top-5 h-1 bg-gradient-to-r from-primary to-primary-container transition-all duration-500"
              style={{ width: progressWidth }}
            />
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-white/40 bg-surface-container-lowest p-8 shadow-2xl shadow-primary/5 backdrop-blur-sm lg:p-12">
            <div className="absolute -mr-20 -mt-20 right-0 top-0 h-64 w-64 rounded-full bg-secondary-container/10 blur-3xl" />
            <div className="relative z-10 grid grid-cols-1 gap-12 md:grid-cols-12">
              <div className="md:col-span-8">
                <h2 className="mb-8 flex items-center gap-3 text-2xl font-bold text-primary">
                  <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {step === 1 ? 'badge' : step === 2 ? 'clinical_notes' : 'emergency'}
                  </span>
                  {step === 1 ? 'Personal Information' : step === 2 ? 'Medical History & Conditions' : 'Emergency Contacts'}
                </h2>

                {/* -- STEP 1 -- */}
                {step === 1 && (
                  <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className="mb-3 block text-sm font-bold text-primary">Full Name</label>
                        <input
                          className="w-full rounded-xl border-none bg-surface-container-high px-4 py-4 font-medium text-on-surface transition-all focus:ring-2 focus:ring-primary-container"
                          name="fullName"
                          onChange={handleChange}
                          placeholder="John Doe"
                          type="text"
                          value={formData.fullName}
                        />
                      </div>

                      <div>
                        <label className="mb-3 block text-sm font-bold text-primary">Email</label>
                        <input
                          className="w-full rounded-xl border-none bg-surface-container-high px-4 py-4 font-medium text-on-surface transition-all focus:ring-2 focus:ring-primary-container"
                          name="email"
                          onChange={handleChange}
                          placeholder="john@example.com"
                          type="email"
                          value={formData.email}
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div>
                          <label className="mb-3 block text-sm font-bold text-primary">Password</label>
                          <input
                            className="w-full rounded-xl border-none bg-surface-container-high px-4 py-4 font-medium text-on-surface transition-all focus:ring-2 focus:ring-primary-container"
                            name="password"
                            onChange={handleChange}
                            placeholder="Minimum 8 characters"
                            type="password"
                            value={formData.password}
                          />
                        </div>
                        <div>
                          <label className="mb-3 block text-sm font-bold text-primary">Confirm Password</label>
                          <input
                            className="w-full rounded-xl border-none bg-surface-container-high px-4 py-4 font-medium text-on-surface transition-all focus:ring-2 focus:ring-primary-container"
                            name="confirmPassword"
                            onChange={handleChange}
                            placeholder="Re-enter password"
                            type="password"
                            value={formData.confirmPassword}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div>
                          <label className="mb-3 block text-sm font-bold text-primary">Date of Birth</label>
                          <input
                            className="w-full rounded-xl border-none bg-surface-container-high px-4 py-4 font-medium text-on-surface transition-all focus:ring-2 focus:ring-primary-container"
                            name="dateOfBirth"
                            onChange={handleChange}
                            type="date"
                            value={formData.dateOfBirth}
                          />
                        </div>
                        <div>
                          <label className="mb-3 block text-sm font-bold text-primary">Gender</label>
                          <select
                            className="w-full appearance-none rounded-xl border-none bg-surface-container-high px-4 py-4 font-medium text-on-surface focus:ring-2 focus:ring-primary-container"
                            name="gender"
                            onChange={handleChange}
                            value={formData.gender}
                          >
                            <option value="">Select gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                            <option value="Prefer not to say">Prefer not to say</option>
                          </select>
                        </div>
                      </div>

                      {/* OTP input — shown after OTP is sent */}
                      {otpSent && (
                        <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-4">
                          <label className="mb-2 block text-sm font-bold text-primary">Enter OTP Code</label>
                          <input
                            className="w-full rounded-xl border-none bg-surface-container-high px-4 py-4 font-medium tracking-[0.3em] text-on-surface transition-all focus:ring-2 focus:ring-primary-container"
                            inputMode="numeric"
                            maxLength={6}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="Enter 6 digit code"
                            type="text"
                            value={otpCode}
                          />
                          {otpMessage && (
                            <p className="mt-2 text-xs font-semibold text-secondary">{otpMessage}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </form>
                )}

                {/* -- STEP 2 -- */}
                {step === 2 && (
                  <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
                    <div className="grid grid-cols-1 gap-6">

                      {/* Known Conditions — tag based */}
                      <div>
                        <label className="mb-3 block text-sm font-bold text-primary">Known Conditions</label>
                        <div className="flex flex-wrap gap-2">
                          {conditions.map((cond, i) => (
                            <button
                              key={i}
                              className="flex items-center gap-2 rounded-xl border border-secondary/10 bg-secondary-container px-4 py-2 text-sm font-bold text-on-secondary-container transition-all hover:opacity-90 active:scale-[0.98]"
                              onClick={() => handleRemoveCondition(i)}
                              type="button"
                            >
                              {cond} <span className="material-symbols-outlined text-xs">close</span>
                            </button>
                          ))}

                          {showCondInput ? (
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                              <input
                                autoFocus
                                className="rounded-xl border-none bg-surface-container-high px-3 py-2 text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary-container"
                                onChange={(e) => setConditionInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddCondition()}
                                placeholder="e.g. Diabetes"
                                type="text"
                                value={conditionInput}
                              />
                              <button
                                className="rounded-xl bg-primary px-3 py-2 text-sm font-bold text-white"
                                onClick={handleAddCondition}
                                type="button"
                              >
                                Add
                              </button>
                              <button
                                className="rounded-xl bg-surface-container-high px-3 py-2 text-sm font-bold text-outline"
                                onClick={() => { setShowCondInput(false); setConditionInput('') }}
                                type="button"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              className="rounded-xl bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-low active:scale-[0.98]"
                              onClick={() => setShowCondInput(true)}
                              type="button"
                            >
                              + Add Condition
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Allergies */}
                      <div>
                        <label className="mb-3 block text-sm font-bold text-primary">Severe Allergies</label>
                        <div className="group relative">
                          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline transition-colors group-focus-within:text-primary">
                            warning
                          </span>
                          <input
                            className="w-full rounded-xl border-none bg-surface-container-high py-4 pl-12 pr-4 font-medium text-on-surface transition-all focus:ring-2 focus:ring-primary-container"
                            name="allergies"
                            onChange={handleMedicalChange}
                            placeholder="e.g. Penicillin, Peanuts"
                            type="text"
                            value={medicalInfo.allergies}
                          />
                        </div>
                        <p className="mt-2 text-[11px] italic text-on-surface-variant/70">
                          Critical for emergency medication screening.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {/* Blood Type */}
                        <div>
                          <label className="mb-3 block text-sm font-bold text-primary">Blood Type</label>
                          <select
                            className="w-full appearance-none rounded-xl border-none bg-surface-container-high px-4 py-4 font-medium text-on-surface focus:ring-2 focus:ring-primary-container"
                            name="bloodType"
                            onChange={handleMedicalChange}
                            value={medicalInfo.bloodType}
                          >
                            <option value="">Select blood type</option>
                            <option value="A+">A Positive (A+)</option>
                            <option value="A-">A Negative (A-)</option>
                            <option value="B+">B Positive (B+)</option>
                            <option value="B-">B Negative (B-)</option>
                            <option value="O+">O Positive (O+)</option>
                            <option value="O-">O Negative (O-)</option>
                            <option value="AB+">AB Positive (AB+)</option>
                            <option value="AB-">AB Negative (AB-)</option>
                            <option value="Unknown">Unknown</option>
                          </select>
                        </div>

                        {/* Organ Donor — Yes/No toggle */}
                        <div>
                          <label className="mb-3 block text-sm font-bold text-primary">Organ Donor</label>
                          <div className="flex rounded-xl bg-surface-container-high p-1">
                            <button
                              className={`flex-1 rounded-lg py-3 font-bold transition-all active:scale-[0.98] ${
                                medicalInfo.organDonor
                                  ? 'bg-white text-primary shadow-sm'
                                  : 'text-outline hover:bg-surface-container-low'
                              }`}
                              onClick={() => setMedicalInfo((prev) => ({ ...prev, organDonor: true }))}
                              type="button"
                            >
                              Yes
                            </button>
                            <button
                              className={`flex-1 rounded-lg py-3 font-bold transition-all active:scale-[0.98] ${
                                !medicalInfo.organDonor
                                  ? 'bg-white text-primary shadow-sm'
                                  : 'text-outline hover:bg-surface-container-low'
                              }`}
                              onClick={() => setMedicalInfo((prev) => ({ ...prev, organDonor: false }))}
                              type="button"
                            >
                              No
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Weight and Height */}
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div>
                          <label className="mb-3 block text-sm font-bold text-primary">Weight (kg)</label>
                          <input
                            className="w-full rounded-xl border-none bg-surface-container-high px-4 py-4 font-medium text-on-surface transition-all focus:ring-2 focus:ring-primary-container"
                            min="1"
                            max="300"
                            name="weightKg"
                            onChange={handleMedicalChange}
                            placeholder="e.g. 72"
                            type="number"
                            value={medicalInfo.weightKg}
                          />
                        </div>
                        <div>
                          <label className="mb-3 block text-sm font-bold text-primary">Height (cm)</label>
                          <input
                            className="w-full rounded-xl border-none bg-surface-container-high px-4 py-4 font-medium text-on-surface transition-all focus:ring-2 focus:ring-primary-container"
                            min="1"
                            max="300"
                            name="heightCm"
                            onChange={handleMedicalChange}
                            placeholder="e.g. 175"
                            type="number"
                            value={medicalInfo.heightCm}
                          />
                        </div>
                      </div>
                    </div>
                  </form>
                )}

                {/* -- STEP 3 -- */}
                {step === 3 && (
                  <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className="mb-3 block text-sm font-bold text-primary">Emergency Contact Name</label>
                        <input
                          className="w-full rounded-xl border-none bg-surface-container-high px-4 py-4 font-medium text-on-surface transition-all focus:ring-2 focus:ring-primary-container"
                          name="name"
                          onChange={handleEmergencyChange}
                          placeholder="Enter full name"
                          type="text"
                          value={emergencyContact.name}
                        />
                      </div>

                      <div>
                        <label className="mb-3 block text-sm font-bold text-primary">Emergency Contact Phone Number</label>
                        <input
                          className="w-full rounded-xl border-none bg-surface-container-high px-4 py-4 font-medium text-on-surface transition-all focus:ring-2 focus:ring-primary-container"
                          name="number"
                          onChange={handleEmergencyChange}
                          placeholder="+1 (555) 000-0000"
                          type="tel"
                          value={emergencyContact.number}
                        />
                      </div>

                      <div>
                        <label className="mb-3 block text-sm font-bold text-primary">Relation With Contact</label>
                        <select
                          className="w-full appearance-none rounded-xl border-none bg-surface-container-high px-4 py-4 font-medium text-on-surface focus:ring-2 focus:ring-primary-container"
                          name="relation"
                          onChange={handleEmergencyChange}
                          value={emergencyContact.relation}
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
                      </div>
                    </div>
                  </form>
                )}
              </div>

              {/* -- Sidebar -- */}
              <div className="md:col-span-4">
                <div className="md:sticky md:top-12 space-y-6">
                  <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-container to-primary p-6 text-white shadow-2xl shadow-primary/20">
                    <div className="absolute right-0 top-0 p-4 opacity-10 transition-transform duration-700 group-hover:scale-125">
                      <span className="material-symbols-outlined text-8xl">smart_toy</span>
                    </div>
                    <div className="relative z-10">
                      <div className="mb-4 flex items-center gap-2">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-secondary-fixed" />
                        <span className="text-xs font-bold uppercase tracking-widest text-primary-fixed-dim">AI Guardian Tip</span>
                      </div>
                      <p className="text-sm leading-relaxed text-blue-100">
                        {step === 1
                          ? 'Complete your basic identity details accurately so your care experience is personalized and secure from the start.'
                          : step === 2
                            ? 'Entering accurate blood type and allergy data allows our AI to verify medication safety in real-time.'
                            : 'Emergency contact details improve response speed during critical situations and can help save lives.'}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
                    <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-outline">Profile Strength</h4>
                    <div className="mb-2 flex items-end gap-3">
                      <span className="text-3xl font-black text-primary">
                        {step === 1 ? '33%' : step === 2 ? '68%' : '99%'}
                      </span>
                      <span className="mb-1 flex items-center text-xs font-bold text-secondary">
                        <span className="material-symbols-outlined text-sm">trending_up</span>
                        {step === 3 ? 'Great' : 'Good'}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
                      <div
                        className={`h-full rounded-full bg-secondary transition-all duration-500 ${
                          step === 1 ? 'w-[33%]' : step === 2 ? 'w-[68%]' : 'w-full'
                        }`}
                      />
                    </div>
                    <p className="mt-4 text-[10px] font-medium leading-tight text-on-surface-variant">
                      {step === 3
                        ? 'Your profile is almost complete. Review and confirm to finish setup securely.'
                        : 'Continue to the next step to improve profile completeness.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-4 border-t border-outline-variant/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
              {step === 1 ? (
                <Link
                  className="group inline-flex w-full justify-center items-center gap-2 rounded-xl bg-surface-container-high px-8 py-4 font-bold text-primary transition-all hover:bg-surface-container-low active:scale-[0.98] sm:w-auto"
                  to="/get-started"
                >
                  <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">arrow_back</span>
                  Back
                </Link>
              ) : (
                <button
                  className="group inline-flex w-full justify-center items-center gap-2 rounded-xl bg-surface-container-high px-8 py-4 font-bold text-primary transition-all hover:bg-surface-container-low active:scale-[0.98] sm:w-auto"
                  onClick={prevStep}
                  type="button"
                >
                  <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">arrow_back</span>
                  Back
                </button>
              )}

              {/* Forward button */}
              {step === 1 && (
                <button
                  className="group inline-flex w-full justify-center items-center gap-3 rounded-xl bg-gradient-to-r from-primary to-primary-container px-10 py-4 font-bold text-white shadow-xl shadow-primary/20 transition-all hover:opacity-90 active:scale-[0.98] sm:w-auto"
                  disabled={loading || otpVerifying}
                  onClick={otpSent ? handleVerifyOtp : handleSendOtp}
                  type="button"
                >
                  {loading
                    ? 'Sending OTP...'
                    : otpVerifying
                      ? 'Verifying...'
                      : otpSent
                        ? 'Verify & Continue'
                        : 'Send OTP'}
                  <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
                </button>
              )}

              {step === 2 && (
                <button
                  className="group inline-flex w-full justify-center items-center gap-3 rounded-xl bg-gradient-to-r from-primary to-primary-container px-10 py-4 font-bold text-white shadow-xl shadow-primary/20 transition-all hover:opacity-90 active:scale-[0.98] sm:w-auto"
                  onClick={handleStepTwoNext}
                  type="button"
                >
                  Next Step
                  <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
                </button>
              )}

              {step === 3 && (
                <button
                  className="group inline-flex w-full justify-center items-center gap-3 rounded-xl bg-gradient-to-r from-primary to-primary-container px-10 py-4 font-bold text-white shadow-xl shadow-primary/20 transition-all hover:opacity-90 active:scale-[0.98] sm:w-auto"
                  disabled={loading}
                  onClick={handleFinish}
                  type="button"
                >
                  {loading ? 'Saving...' : 'Finish Setup'}
                  <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">check_circle</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default RegistrationPage


