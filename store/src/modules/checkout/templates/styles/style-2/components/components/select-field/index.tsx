"use client"

import {
  SelectHTMLAttributes,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react"

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  fullWidth?: boolean
  children: React.ReactNode
}

const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, fullWidth = false, required, children, ...props }, ref) => {
    const selectRef = useRef<HTMLSelectElement>(null)

    useImperativeHandle(ref, () => selectRef.current!)

    return (
      <div className={`${fullWidth ? "md:col-span-2" : ""} space-y-1`}>
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          {label}
          {required && "*"}
        </label>
        <div className="relative">
          <select
            ref={selectRef}
            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent focus:outline-none transition-all placeholder:text-muted-foreground text-foreground appearance-none dark:bg-zinc-800 dark:border-zinc-700"
            required={required}
            {...props}
          >
            {children}
          </select>
          <div className="pointer-events-none absolute inset-y-0 ltr:right-0 rtl:left-0 flex items-center px-4 text-muted-foreground">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>
    )
  }
)

SelectField.displayName = "SelectField"

export default SelectField
