import { useEffect } from 'react'

function AIAssistantConsentModal({ isOpen, onOptIn, onOptOut, isLoading = false }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onOptOut()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onOptOut])

  if (!isOpen) return null

  const dataUsedItems = [
    { icon: 'medication', label: 'Medicines You Take', description: 'All medications in your pharmacy' },
    { icon: 'person', label: 'Name & Date of Birth', description: 'For personalized recommendations' },
    { icon: 'wc', label: 'Gender & Physical Metrics', description: 'Weight and height for dosage calculations' },
    { icon: 'warning', label: 'Allergies', description: 'To prevent medication conflicts' },
    { icon: 'bloodtype', label: 'Blood Type', description: 'Critical for emergency information' },
    { icon: 'favorite', label: 'Organ Donor Status', description: 'Part of your complete health profile' },
  ]

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm transition-opacity duration-200"
        onClick={onOptOut}
        role="button"
        tabIndex={0}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 overflow-y-auto">
        <div
          className="w-full max-w-2xl rounded-3xl bg-surface-container-lowest shadow-2xl shadow-black/20 my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with AI Guardian branding */}
          <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-r from-primary to-primary-container p-4 text-white">
            <div className="absolute right-0 top-0 p-3 opacity-10 transition-transform duration-700 group-hover:scale-125">
              <span className="material-symbols-outlined text-6xl" style={{ fontVariationSettings: '"FILL" 1' }}>
                smart_toy
              </span>
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                  <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>
                    smart_toy
                  </span>
                </div>
                <div>
                  <h2 className="font-headline text-lg font-bold">AI Assistant Service</h2>
                  <p className="text-xs text-white/80">Empowered by Your Health Data</p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[calc(100vh-300px)] space-y-6 p-8 overflow-y-auto lg:p-10">
            {/* Introduction */}
            <div>
              <p className="text-base leading-relaxed text-on-surface-variant">
                Our AI Assistant uses your health information to help you understand your medications better. Your data is processed by Google's Gemini model. Remember, AI is a helper tool only. Always consult a doctor for medical decisions.
              </p>
            </div>

            {/* Data Usage Section */}
            <div>
              <h3 className="mb-4 flex items-center gap-2 font-headline text-lg font-bold text-primary">
                <span className="material-symbols-outlined text-secondary">info</span>
                Data That Will Be Used
              </h3>
              <div className="space-y-3">
                {dataUsedItems.map((item, index) => (
                  <div key={index} className="flex gap-4 rounded-xl bg-surface-container-low p-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white">
                      <span className="material-symbols-outlined text-primary">{item.icon}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-on-surface">{item.label}</p>
                      <p className="text-xs text-on-surface-variant">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Benefits */}
            <div className="rounded-xl border border-tertiary/20 bg-tertiary-container/10 p-4">
              <p className="mb-3 text-sm font-bold text-tertiary">What You Get:</p>
              <p className="text-xs text-on-surface-variant mb-3">
                Get assistance with information about your medications and medical details using AI. Our AI assistant is here to help you understand your health better.
              </p>
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-xs font-semibold text-red-700 mb-2">⚠️ Important Disclaimer:</p>
                <p className="text-xs text-red-600">
                  Do not rely solely on AI responses. Always consult a qualified doctor or healthcare professional before making any medical decisions. AI is a helper tool only and should not replace professional medical advice.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-4 border-t border-outline-variant/20 bg-surface-container-low/50 px-8 py-6 lg:px-10">
            <button
              className="flex-1 rounded-xl border border-outline-variant px-6 py-4 font-headline text-sm font-bold text-on-surface transition-all hover:bg-surface-container-high disabled:opacity-60"
              onClick={onOptOut}
              disabled={isLoading}
              type="button"
            >
              Not Now
            </button>
            <button
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-container px-6 py-4 font-headline text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={onOptIn}
              disabled={isLoading}
              type="button"
            >
              {isLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Enabling...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: '"FILL" 1' }}>
                    check_circle
                  </span>
                  Enable AI Assistant
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default AIAssistantConsentModal
