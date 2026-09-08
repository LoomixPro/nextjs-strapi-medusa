"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

export default function ToastProvider({ ...props }: ToasterProps) {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-center"
      dir="rtl"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-gray-950 group-[.toaster]:border-gray-200 group-[.toaster]:shadow-lg rounded-lg border p-4 shadow-sm font-sans flex items-center justify-center text-center gap-4 text-sm w-full",
          description: "group-[.toast]:text-gray-500 text-xs",
          actionButton:
            "group-[.toast]:bg-gray-900 group-[.toast]:text-gray-50 font-medium px-3 py-1.5 rounded-md",
          cancelButton:
            "group-[.toast]:bg-gray-100 group-[.toast]:text-gray-500 font-medium px-3 py-1.5 rounded-md",
          success:
            "group-[.toast]:text-green-600 group-[.toast]:border-green-200 group-[.toast]:bg-green-50",
          error:
            "group-[.toast]:text-red-600 group-[.toast]:border-red-200 group-[.toast]:bg-red-50",
          info: "group-[.toast]:text-blue-600 group-[.toast]:border-blue-200 group-[.toast]:bg-blue-50",
        },
      }}
      {...props}
    />
  )
}
