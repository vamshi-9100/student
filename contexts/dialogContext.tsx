"use client"
import { createContext, useContext, useState, type ReactNode } from "react"

type DialogType = "delete" | "cancel" | null

interface DialogContextProps {
  openDialog: (type: DialogType, title: string, message: string, onConfirm?: () => void) => void
  closeDialog: () => void
}

const DialogContext = createContext<DialogContextProps | undefined>(undefined)

export function DialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [dialogType, setDialogType] = useState<DialogType>(null)
  const [dialogTitle, setDialogTitle] = useState("")
  const [dialogMessage, setDialogMessage] = useState("")
  const [onConfirm, setOnConfirm] = useState<(() => void) | undefined>()

  const openDialog = (type: DialogType, title: string, message: string, confirmHandler?: () => void) => {
    setDialogType(type)
    setDialogTitle(title)
    setDialogMessage(message)
    setOnConfirm(() => confirmHandler ?? undefined)
    setIsOpen(true)
  }

  const closeDialog = () => {
    setIsOpen(false)
    setDialogType(null)
    setDialogTitle("")
    setDialogMessage("")
    setOnConfirm(undefined)
  }

  return (
    <DialogContext.Provider value={{ openDialog, closeDialog }}>
      {children}

      {/* Global Dialog Box */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity" aria-hidden="true" />

          {/* Dialog Panel */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="app-global-dialog-title"
            aria-describedby="app-global-dialog-description"
            className="relative z-50 mx-auto w-full max-w-md sm:max-w-lg rounded-xl border border-border bg-card text-card-foreground shadow-lg max-h-[85vh] overflow-y-auto"
          >
            <div className="p-6">
              <h2 id="app-global-dialog-title" className="text-base font-semibold leading-6 text-foreground">
                {dialogTitle}
              </h2>
              <p id="app-global-dialog-description" className="mt-2 text-sm text-muted-foreground">
                {dialogMessage}
              </p>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                  onClick={closeDialog}
                >
                  Cancel
                </button>

                {dialogType === "delete" && (
                  <button
                    type="button"
                    className="inline-flex h-9 items-center justify-center rounded-md bg-destructive px-4 text-sm font-medium text-destructive-foreground shadow hover:bg-destructive/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => {
                      onConfirm?.()
                      closeDialog()
                    }}
                  >
                    Delete
                  </button>
                )}

                {dialogType === "cancel" && (
                  <button
                    type="button"
                    className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => {
                      onConfirm?.()
                      closeDialog()
                    }}
                  >
                    Confirm
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  )
}

export function useDialog() {
  const context = useContext(DialogContext)
  if (!context) {
    throw new Error("useDialog must be used within DialogProvider")
  }
  return context
}
