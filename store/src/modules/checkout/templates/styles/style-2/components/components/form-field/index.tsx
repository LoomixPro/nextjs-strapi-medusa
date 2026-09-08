"use client"

import React, {
  InputHTMLAttributes,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react"

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  fullWidth?: boolean
}

const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      label,
      placeholder,
      type = "text",
      fullWidth = false,
      required,
      ...props
    },
    ref
  ) => {
    const inputRef = useRef<HTMLInputElement>(null)

    useImperativeHandle(ref, () => inputRef.current!)

    return (
      <div className={`${fullWidth ? "md:col-span-2" : ""} space-y-1`}>
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          {label}
          {required && "*"}
        </label>
        <input
          ref={inputRef}
          type={type}
          className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent focus:outline-none transition-all placeholder:text-muted-foreground text-foreground dark:bg-zinc-800 dark:border-zinc-700"
          placeholder={placeholder}
          required={required}
          {...props}
        />
      </div>
    )
  }
)

FormField.displayName = "FormField"

export default FormField
