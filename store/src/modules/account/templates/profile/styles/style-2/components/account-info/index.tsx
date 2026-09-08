"use client"

import { Disclosure } from "@headlessui/react"
import { clx } from "@medusajs/ui"
import { useTranslations } from "next-intl"
import { useEffect } from "react"
import { Edit2, X, CheckCircle2, AlertCircle } from "lucide-react"

import useToggleState from "@lib/hooks/use-toggle-state"
import { useFormStatus } from "react-dom"
import { Button } from "@modules/common/components/shadcn/button"

type AccountInfoProps = {
  label: string
  currentInfo: string | React.ReactNode
  isSuccess?: boolean
  isError?: boolean
  errorMessage?: string
  clearState: () => void
  children?: React.ReactNode
  "data-testid"?: string
}

const AccountInfo = ({
  label,
  currentInfo,
  isSuccess,
  isError,
  clearState,
  errorMessage,
  children,
  "data-testid": dataTestid,
}: AccountInfoProps) => {
  const t = useTranslations("Account.Profile")
  const { state, close, toggle } = useToggleState()

  const { pending } = useFormStatus()

  const handleToggle = () => {
    clearState()
    setTimeout(() => toggle(), 100)
  }

  useEffect(() => {
    if (isSuccess) {
      close()
    }
  }, [isSuccess, close])

  return (
    <div className="w-full group" data-testid={dataTestid}>
      <div className="flex items-center justify-between mb-2 px-1">
        <label className="text-[10px] font-medium text-gray-500 dark:text-zinc-500 uppercase tracking-[0.2em] block">
          {label}
        </label>
        <button
          className={clx(
            "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest transition-all duration-300",
            {
              "text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300":
                state,
              "text-primary hover:text-primary/80 md:opacity-0 md:group-hover:opacity-100":
                !state,
            }
          )}
          onClick={handleToggle}
          type={state ? "reset" : "button"}
          data-testid="edit-button"
        >
          {state ? (
            <>
              <X size={12} className="stroke-[2.5]" />
              {t("cancel")}
            </>
          ) : (
            <>
              <Edit2 size={12} className="stroke-[2.5]" />
              {t("edit")}
            </>
          )}
        </button>
      </div>

      <div
        className={clx(
          "bg-background/40 backdrop-blur-3xl px-6 py-5 rounded-[24px] border transition-all duration-500 shadow-sm",
          {
            "border-primary/30 shadow-lg shadow-primary/5 dark:shadow-primary/5 bg-background":
              state,
            "border-border group-hover:border-primary/25": !state,
          }
        )}
      >
        <div className="font-medium text-sm text-foreground tracking-tight">
          {typeof currentInfo === "string" ? (
            <span data-testid="current-info">{currentInfo}</span>
          ) : (
            currentInfo
          )}
        </div>

        {/* Success state */}
        <Disclosure>
          <Disclosure.Panel
            static
            className={clx(
              "transition-[max-height,opacity] duration-500 ease-in-out overflow-hidden",
              {
                "max-h-[1000px] opacity-100": isSuccess,
                "max-h-0 opacity-0": !isSuccess,
              }
            )}
            data-testid="success-message"
          >
            <div className="mt-4 p-4 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded-2xl text-xs font-medium border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-3">
              <CheckCircle2
                size={16}
                className="text-emerald-500 dark:text-emerald-400"
              />
              {t("updated_successfully", { label })}
            </div>
          </Disclosure.Panel>
        </Disclosure>

        {/* Error state  */}
        <Disclosure>
          <Disclosure.Panel
            static
            className={clx(
              "transition-[max-height,opacity] duration-500 ease-in-out overflow-hidden",
              {
                "max-h-[1000px] opacity-100": isError,
                "max-h-0 opacity-0": !isError,
              }
            )}
            data-testid="error-message"
          >
            <div className="mt-4 p-4 bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-2xl text-xs font-medium border border-red-100 dark:border-red-900/30 flex items-center gap-3">
              <AlertCircle
                size={16}
                className="text-red-500 dark:text-red-400"
              />
              {errorMessage || t("error_occurred")}
            </div>
          </Disclosure.Panel>
        </Disclosure>

        <Disclosure>
          <Disclosure.Panel
            static
            className={clx(
              "transition-[max-height,opacity,margin] duration-500 ease-in-out",
              {
                "max-h-[2000px] opacity-100 mt-6 pt-6 border-t border-border overflow-visible":
                  state,
                "max-h-0 opacity-0 mt-0 pt-0 border-t-0 pointer-events-none overflow-hidden":
                  !state,
              }
            )}
          >
            <div className="flex flex-col gap-y-6">
              <div>{children}</div>
              <div className="flex items-center justify-end">
                <Button
                  isLoading={pending}
                  className="w-full md:w-auto md:min-w-[160px] rounded-xl h-11 text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-primary/10 bg-primary hover:bg-primary/95 text-primary-foreground transition-all active:scale-95 border-0"
                  type="submit"
                  data-testid="save-button"
                >
                  {t("save_changes")}
                </Button>
              </div>
            </div>
          </Disclosure.Panel>
        </Disclosure>
      </div>
    </div>
  )
}

export default AccountInfo
