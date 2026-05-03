import { useEffect } from 'react'

function DeleteConfirmationModal({ isOpen, itemName, itemType = 'item', onConfirm, onCancel, isLoading = false }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel()
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
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm transition-opacity duration-200"
        onClick={onCancel}
        role="button"
        tabIndex={0}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <div
          className="w-full max-w-sm rounded-2xl bg-surface-container-high shadow-2xl shadow-black/20"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-outline-variant/20 px-6 py-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error-container">
                <span className="material-symbols-outlined text-error">warning</span>
              </div>
              <div>
                <h2 className="font-headline text-xl font-bold text-on-surface">Delete {itemType}?</h2>
                <p className="mt-1 text-sm text-on-surface-variant">This action cannot be undone.</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <p className="text-sm text-on-surface-variant">
              Are you sure you want to delete <span className="font-semibold text-on-surface">{itemName}</span>? This will remove it permanently from your records.
            </p>
          </div>

          {/* Footer */}
          <div className="flex gap-3 border-t border-outline-variant/20 px-6 py-4">
            <button
              className="flex-1 rounded-lg border border-outline-variant px-4 py-3 text-sm font-bold text-on-surface transition-all hover:bg-surface-container-low disabled:opacity-60"
              onClick={onCancel}
              disabled={isLoading}
              type="button"
            >
              Cancel
            </button>
            <button
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-error px-4 py-3 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={onConfirm}
              disabled={isLoading}
              type="button"
            >
              {isLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Deleting...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">delete</span>
                  Delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default DeleteConfirmationModal
