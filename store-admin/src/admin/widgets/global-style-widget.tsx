import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useEffect } from "react"

/**
 * بررسی اینکه آیا کانتکست جاری مربوط به ایران/زبان فارسی است یا خیر.
 * این قابلیت فقط و فقط در صورتی فعال می‌شود که:
 * ۱. در localStorage به صورت صریح فعال شده باشد (medusa_force_jalali=true)
 * ۲. منطقه زمانی (Timezone) روی Asia/Tehran یا Iran باشد
 * ۳. زبان پنل ادمین روی فارسی (fa یا fa-IR) باشد
 * ۴. جهت صفحه در پنل مدوسا راست‌به‌چپ (dir="rtl") شده باشد
 * ۵. زبان مرورگر فارسی باشد
 */
export function isIranContext(): boolean {
  if (typeof window === "undefined") return false

  const manualOverride = localStorage.getItem("medusa_force_jalali")
  if (manualOverride === "true") return true
  if (manualOverride === "false") return false

  // ۱. بررسی منطقه زمانی (Timezone)
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (tz === "Asia/Tehran" || tz === "Iran") {
      return true
    }
  } catch {}

  // ۲. بررسی زبان ذخیره‌شده پنل در کوکی یا localStorage (توسط Medusa i18n)
  const storedLng =
    localStorage.getItem("lng") ||
    document.documentElement.lang ||
    ""
  if (
    storedLng.toLowerCase().startsWith("fa") ||
    storedLng.toLowerCase().includes("ir")
  ) {
    return true
  }

  // ۳. بررسی جهت صفحه (مدوسا با انتخاب زبان فارسی dir="rtl" اعمال می‌کند)
  if (document.documentElement.getAttribute("dir") === "rtl") {
    return true
  }

  // ۴. بررسی زبان محلی مرورگر
  if (
    navigator.language &&
    (navigator.language.startsWith("fa") ||
      navigator.language.toLowerCase().includes("ir"))
  ) {
    return true
  }

  return false
}

// نگاشت تمام ماه‌های میلادی (مخفف و کامل، با کشیده/تطویل و بدون آن) که توسط date-fns یا مرورگر رندر می‌شوند
const PERSIAN_MONTHS_MAP: Record<string, number> = {
  // ژانویه
  "ژانـ": 0,
  "ژان": 0,
  "ژانویه": 0,
  "جنوری": 0,

  // فوریه
  "فور": 1,
  "فوریه": 1,
  "فبروری": 1,

  // مارس
  "مارس": 2,
  "مارچ": 2,

  // آوریل / آپریل
  "آپر": 3,
  "آپریل": 3,
  "آوریل": 3,
  "اپریل": 3,
  "ایپریل": 3,

  // مه / می
  "می": 4,
  "مه": 4,

  // ژوئن / جون
  "جون": 5,
  "ژوئن": 5,

  // ژوئیه / جولای
  "جولـ": 6,
  "جول": 6,
  "جولای": 6,
  "ژوئیه": 6,

  // اوت / آگوست
  "آگو": 7,
  "آگوست": 7,
  "اوت": 7,
  "اگست": 7,

  // سپتامبر
  "سپتـ": 8,
  "سپت": 8,
  "سپتامبر": 8,
  "سپتمبر": 8,

  // اکتبر (دقیقاً شامل "اکتـ" که در date-fns رندر می‌شود)
  "اکتـ": 9,
  "اکت": 9,
  "اکتبر": 9,
  "اکتوبر": 9,

  // نوامبر
  "نوامـ": 10,
  "نوام": 10,
  "نوامبر": 10,
  "نومبر": 10,

  // دسامبر
  "دسامـ": 11,
  "دسام": 11,
  "دسامبر": 11,
  "دسمبر": 11,
}

const KNOWN_PERSIAN_MONTH_NAMES = Object.keys(PERSIAN_MONTHS_MAP)

// الگوی تشخیص تاریخ میلادی با حروف انگلیسی: مانند "Oct 26, 2026, 11:50 PM" یا "26 Oct 2026"
const ENGLISH_DATE_REGEX =
  /\b(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4}(?:[،,\s]+[۰-۹\d]{1,2}:[۰-۹\d]{2}(?::[۰-۹\d]{2})?(?:\s*[AP]M)?)?|\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?),?\s+\d{4}(?:[،,\s]+[۰-۹\d]{1,2}:[۰-۹\d]{2}(?::[۰-۹\d]{2})?(?:\s*[AP]M)?)?)\b/gi

// ۱. الگوی روز ماه سال فارسی: مانند "26 اکتـ 2026 11:50 ب.ظ." یا "26 اکتبر 2026"
const PERSIAN_DAY_FIRST_REGEX =
  /([۰-۹\d]{1,2})(?:م|ام)?\s+([^\s,،]+)\s+([۰-۹\d]{4})(?:[،,\s]+([۰-۹\d]{1,2}:[۰-۹\d]{2}(?::[۰-۹\d]{2})?)(?:\s*(ب\.ظ\.?|ق\.ظ\.?|بعدازظهر|قبل‌ازظهر|صبح|عصر|شب))?)?/g

// ۲. الگوی ماه روز سال فارسی: مانند "اکتـ 26 2026 11:50 ب.ظ."
const PERSIAN_MONTH_FIRST_REGEX =
  /([^\s,،]+)\s+([۰-۹\d]{1,2})(?:م|ام)?,?\s+([۰-۹\d]{4})(?:[،,\s]+([۰-۹\d]{1,2}:[۰-۹\d]{2}(?::[۰-۹\d]{2})?)(?:\s*(ب\.ظ\.?|ق\.ظ\.?|بعدازظهر|قبل‌ازظهر|صبح|عصر|شب))?)?/g

const persianDateFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  year: "numeric",
  month: "long",
  day: "numeric",
})

const persianDateTimeFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
})

function toEnglishDigits(str: string): string {
  return str.replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
}

function parseTimeAndPeriod(
  timeStr?: string,
  periodStr?: string
): { hours: number; minutes: number } {
  if (!timeStr) return { hours: 0, minutes: 0 }
  const cleanTime = toEnglishDigits(timeStr)
  const parts = cleanTime.split(":")
  let hours = parseInt(parts[0], 10) || 0
  const minutes = parseInt(parts[1], 10) || 0

  if (periodStr) {
    const isPM =
      periodStr.includes("ب") ||
      periodStr.includes("بعد") ||
      periodStr.includes("عصر") ||
      periodStr.includes("شب")
    const isAM =
      periodStr.includes("ق") ||
      periodStr.includes("قبل") ||
      periodStr.includes("صبح")

    if (isPM && hours < 12) {
      hours += 12
    } else if (isAM && hours === 12) {
      hours = 0
    }
  }

  return { hours, minutes }
}

function convertDatesToJalali(text: string): string {
  if (!text) return text

  // ۱. تبدیل تاریخ‌های میلادی با حروف فارسی (حالت روز اول: "26 اکتـ 2026 11:50 ب.ظ.")
  let result = text.replace(
    PERSIAN_DAY_FIRST_REGEX,
    (match, dayStr, rawMonth, yearStr, timeStr, periodStr) => {
      const normalizedMonth = rawMonth.trim()
      const monthIndex =
        PERSIAN_MONTHS_MAP[normalizedMonth] ??
        PERSIAN_MONTHS_MAP[normalizedMonth.replace(/\u0640/g, "")]
      if (monthIndex === undefined) return match

      const day = parseInt(toEnglishDigits(dayStr), 10)
      const year = parseInt(toEnglishDigits(yearStr), 10)
      if (isNaN(day) || isNaN(year)) return match

      const { hours, minutes } = parseTimeAndPeriod(timeStr, periodStr)
      const dateObj = new Date(year, monthIndex, day, hours, minutes)
      if (isNaN(dateObj.getTime())) return match

      return timeStr
        ? persianDateTimeFormatter.format(dateObj)
        : persianDateFormatter.format(dateObj)
    }
  )

  // ۲. تبدیل تاریخ‌های میلادی با حروف فارسی (حالت ماه اول: "اکتـ 26 2026 11:50 ب.ظ.")
  result = result.replace(
    PERSIAN_MONTH_FIRST_REGEX,
    (match, rawMonth, dayStr, yearStr, timeStr, periodStr) => {
      const normalizedMonth = rawMonth.trim()
      const monthIndex =
        PERSIAN_MONTHS_MAP[normalizedMonth] ??
        PERSIAN_MONTHS_MAP[normalizedMonth.replace(/\u0640/g, "")]
      if (monthIndex === undefined) return match

      const day = parseInt(toEnglishDigits(dayStr), 10)
      const year = parseInt(toEnglishDigits(yearStr), 10)
      if (isNaN(day) || isNaN(year)) return match

      const { hours, minutes } = parseTimeAndPeriod(timeStr, periodStr)
      const dateObj = new Date(year, monthIndex, day, hours, minutes)
      if (isNaN(dateObj.getTime())) return match

      return timeStr
        ? persianDateTimeFormatter.format(dateObj)
        : persianDateFormatter.format(dateObj)
    }
  )

  // ۳. تبدیل تاریخ‌های میلادی انگلیسی: "26 Oct 2026, 11:50 PM"
  result = result.replace(ENGLISH_DATE_REGEX, (match) => {
    const parsed = new Date(match)
    if (isNaN(parsed.getTime())) return match

    const hasTime = /\d{1,2}:\d{2}/.test(match)
    return hasTime
      ? persianDateTimeFormatter.format(parsed)
      : persianDateFormatter.format(parsed)
  })

  return result
}

function hasAnyDatePattern(val: string): boolean {
  if (!val) return false
  // شرط اول: وجود یک عدد ۴ رقمی برای سال میلادی (2020 تا 2039)
  if (!/(?:20[2-3]\d|۲۰[۲-۳][۰-۹])/.test(val)) return false

  // بررسی نام ماه‌های انگلیسی
  if (
    /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(val)
  ) {
    return true
  }

  // بررسی نام ماه‌های فارسی
  for (const m of KNOWN_PERSIAN_MONTH_NAMES) {
    if (val.includes(m)) return true
  }

  return false
}

function fixPhoneNumbers() {
  const elements = document.querySelectorAll("span, p, a, td")
  elements.forEach((el) => {
    // فقط برای المان‌های متنی بدون فرزند تا چیدمان والد و گرید جدول به‌هم نریزد
    if (el.children.length === 0) {
      const text = el.textContent?.trim()
      if (
        text &&
        (text.includes("+98") ||
          text.startsWith("09") ||
          text.startsWith("0098") ||
          (text.includes("+") && /^[\+\d\s\-\(\)]+$/.test(text))) &&
        /^[\+\d\s\-\(\)]+$/.test(text)
      ) {
        if (el.getAttribute("dir") !== "ltr") {
          el.setAttribute("dir", "ltr")
          ;(el as HTMLElement).style.textAlign = "right"
          ;(el as HTMLElement).style.display = "inline-block"
          ;(el as HTMLElement).style.unicodeBidi = "plaintext"
        }
      }
    }
  })
}

function processAdminDom() {
  if (typeof document === "undefined" || !document.body) return
  if (!isIranContext()) return

  fixPhoneNumbers()

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement
      if (!parent) return NodeFilter.FILTER_REJECT

      const tag = parent.tagName
      if (
        tag === "SCRIPT" ||
        tag === "STYLE" ||
        tag === "TEXTAREA" ||
        tag === "INPUT" ||
        tag === "CODE" ||
        tag === "PRE" ||
        parent.isContentEditable
      ) {
        return NodeFilter.FILTER_REJECT
      }

      const val = node.nodeValue || ""
      return hasAnyDatePattern(val)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT
    },
  })

  const textNodes: Text[] = []
  let currentNode = walker.nextNode()
  while (currentNode) {
    textNodes.push(currentNode as Text)
    currentNode = walker.nextNode()
  }

  for (const textNode of textNodes) {
    if (textNode.nodeValue) {
      const updated = convertDatesToJalali(textNode.nodeValue)
      if (updated !== textNode.nodeValue) {
        textNode.nodeValue = updated
      }
    }
  }
}

// آبزرور سراسری اختصاصی بدون تکرار
declare global {
  interface Window {
    __MEDUSA_IRAN_LOCALIZATION_INITIALIZED__?: boolean
  }
}

function initObserver() {
  if (
    typeof window === "undefined" ||
    window.__MEDUSA_IRAN_LOCALIZATION_INITIALIZED__
  ) {
    return
  }
  window.__MEDUSA_IRAN_LOCALIZATION_INITIALIZED__ = true

  let scheduled = false
  const runBatch = () => {
    processAdminDom()
    scheduled = false
  }

  const observer = new MutationObserver(() => {
    if (!scheduled) {
      scheduled = true
      requestAnimationFrame(runBatch)
    }
  })

  const start = () => {
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true })
      processAdminDom()
    } else {
      setTimeout(start, 50)
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start)
  } else {
    start()
  }
}

initObserver()

const GlobalStyleWidget = () => {
  useEffect(() => {
    processAdminDom()
  }, [])

  return null
}

export const config = defineWidgetConfig({
  zone: [
    "order.list.before",
    "order.details.before",
    "order.details.side.before",
    "customer.list.before",
    "customer.details.before",
    "product.list.before",
    "product.details.before",
    "price_list.list.before",
    "promotion.list.before",
    "inventory_item.list.before",
    "reservation.list.before",
  ],
})

export default GlobalStyleWidget
