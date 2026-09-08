import { useTranslations } from "next-intl"

interface BlockErrorProps {
  error?: any
  formattedStyle?: string
  blockName?: string
}

export default function BlockError({
  error,
  formattedStyle,
  blockName,
}: BlockErrorProps) {
  const t = useTranslations("Errors")
  const safeFormattedStyle = formattedStyle || t("unknown_style")
  const safeBlockName = blockName || t("component")

  if (
    process.env.NODE_ENV !== "development" &&
    process.env.NEXT_PUBLIC_SHOW_CMS_ERRORS !== "true"
  ) {
    return null
  }

  return (
    <div
      className="bg-red-50 border border-red-300 p-8 rounded-2xl my-8 mx-auto max-w-5xl text-right shadow-sm"
      dir="auto"
    >
      <div className="flex items-center gap-3 mb-4 border-b border-red-200 pb-4">
        <span className="text-3xl" role="img" aria-label="warning">
          ⚠️
        </span>
        <h3 className="text-red-900 font-bold text-xl">
          {t("load_error", { blockName: safeBlockName })}
          <span className="font-mono text-red-600 bg-red-100 px-2 py-1 rounded">
            {safeFormattedStyle}
          </span>
        </h3>
      </div>
      <p className="text-red-800 text-sm mb-4 leading-relaxed">
        <span dangerouslySetInnerHTML={{ __html: t("preview_only") }} />
        <br />
        {t("common_reasons")}
      </p>
      <ul className="list-disc list-inside text-red-700 text-sm mb-6 space-y-1">
        <span dangerouslySetInnerHTML={{ __html: t("reason_sync") }} />
        <span dangerouslySetInnerHTML={{ __html: t("reason_syntax") }} />
        <span dangerouslySetInnerHTML={{ __html: t("reason_missing_dep") }} />
      </ul>
      {error && (
        <div
          className="bg-white p-4 rounded-xl text-left text-xs text-red-900 overflow-x-auto border border-red-100 shadow-inner font-mono"
          dir="ltr"
        >
          {error.stack || error.message || String(error)}
        </div>
      )}
    </div>
  )
}
