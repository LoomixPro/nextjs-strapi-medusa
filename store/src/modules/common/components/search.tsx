"use client"

import { searchClient } from "@lib/config"
import type { BaseHit, Hit } from "instantsearch.js"
import { ArrowDown, ArrowUp, CornerDownLeft, SearchIcon } from "lucide-react"
import type React from "react"
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { createPortal } from "react-dom"
import {
  Configure,
  Highlight,
  InstantSearch,
  useHits,
  useInstantSearch,
  useSearchBox,
} from "react-instantsearch"
import { Button } from "@modules/common/components/shadcn/button"
import { cn } from "@lib/utils"
import { useKeyboardNavigation } from "@/hooks/use-keyboard-navigation"
import { useTranslations } from "next-intl"

/**
 * Search Configuration Interface.
 * Note on Architecture: We are using a Meilisearch backend, but leveraging the UI
 * components from Algolia's `react-instantsearch` library. The `@meilisearch/instant-meilisearch`
 * adapter (configured in `lib/config.ts`) bridges the two, allowing us to use Algolia's
 * UI tools with our Meilisearch data.
 */
export interface SearchConfig {
  /** Index Name (required) */
  indexName: string
  /** Placeholder text for search input (optional, defaults to "What are you looking for?") */
  placeholder?: string
  /** Number of hits per page (optional, defaults to 8) */
  hitsPerPage?: number
  /** Custom search button text (optional) */
  buttonText?: string
  /** Custom search button props (optional) */
  buttonProps?: React.ComponentProps<typeof SearchButton>
  /** Map which hit attributes to render (supports dotted paths) */
  attributes: HitsAttributesMapping
  /** Additional Algolia search parameters (optional) - e.g., analytics, filters, distinct, etc. */
  searchParameters?: Record<string, unknown>
  /** Enable Algolia Insights (optional, defaults to true) */
  insights?: boolean
  /** Display as a simple icon button without text or shortcut (optional) */
  iconOnly?: boolean
  /** Open hit URLs in a new tab (optional, defaults to true) */
  openResultsInNewTab?: boolean

  /** Transform items before rendering (optional) - useful for proxying images or modifying hit data */
  transformItems?: (items: Hit<BaseHit>[]) => Hit<BaseHit>[]
}

// =========================================================================
// Attribute Mapping
// =========================================================================

type HitsAttributesMapping = {
  primaryText: string
  secondaryText?: string
  tertiaryText?: string
  url?: string
  image?: string
}

function toAttributePath(attribute?: string): string | string[] | undefined {
  if (!attribute) return undefined
  return attribute.includes(".") ? attribute.split(".") : attribute
}

function getByPath<T = unknown>(obj: unknown, path?: string): T | undefined {
  if (!obj || !path) return undefined
  const parts = path.split(".")
  let current: unknown = obj
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current as T | undefined
}

// ============================================================================
// Internal Components
// ============================================================================

interface SearchButtonProps extends React.ComponentProps<typeof Button> {}

export const SearchButton: React.FC<
  SearchButtonProps & { iconOnly?: boolean }
> = ({ className, iconOnly, ...buttonProps }) => {
  const [modifierLabel, setModifierLabel] = useState("⌘")
  const [isModifierPressed, setIsModifierPressed] = useState(false)
  const [isKPressed, setIsKPressed] = useState(false)

  useEffect(() => {
    if (typeof navigator === "undefined") return
    const isMac = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform)
    setModifierLabel(isMac ? "⌘" : "Ctrl")
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey) {
        setIsModifierPressed(true)
      }
      if (event.key && event.key.toLowerCase() === "k") {
        setIsKPressed(true)
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!event.metaKey && !event.ctrlKey) {
        setIsModifierPressed(false)
      }
      if (event.key && event.key.toLowerCase() === "k") {
        setIsKPressed(false)
      }
    }

    const resetKeys = () => {
      setIsModifierPressed(false)
      setIsKPressed(false)
    }

    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("keyup", handleKeyUp)
    window.addEventListener("blur", resetKeys)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("keyup", handleKeyUp)
      window.removeEventListener("blur", resetKeys)
    }
  }, [])

  const t = useTranslations("SearchModal")

  if (iconOnly) {
    return (
      <Button
        type="button"
        variant="ghost"
        className={cn(
          "h-9 w-9 rounded-full p-0 flex items-center justify-center border-none shadow-none text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors",
          className
        )}
        aria-label="Open search"
        {...buttonProps}
      >
        <SearchIcon size={20} color="currentColor" />
      </Button>
    )
  }

  const baseClassName =
    "md:min-w-[200px] justify-between hover:shadow-md transition-transform duration-400 translate-y-0 py-3 h-auto cursor-pointer hover:bg-transparent hover:translate-y-[-2px] border shadow-none"

  return (
    <Button
      type="button"
      variant="outline"
      className={cn(baseClassName, className)}
      aria-label="Open search"
      {...buttonProps}
    >
      <span className="flex items-center gap-2 text-muted-foreground opacity-80">
        <SearchIcon size={24} color="currentColor" />
        <span className="hidden sm:inline">{t("search_label")}</span>
      </span>
      <div className="hidden md:flex gap-0.5" dir="ltr">
        <kbd
          className={`h-5 min-w-5 rounded grid place-items-center bg-muted text-xs text-muted-foreground transition-all duration-200 ${
            isModifierPressed
              ? "inset-shadow-sm inset-shadow-foreground/30"
              : "shadow-none"
          }`}
        >
          {modifierLabel}
        </kbd>
        <kbd
          className={`h-5 min-w-5 rounded grid place-items-center bg-muted text-xs text-muted-foreground transition-all duration-200 ${
            isKPressed
              ? "inset-shadow-sm inset-shadow-foreground/30"
              : "shadow-none"
          }`}
        >
          K
        </kbd>
      </div>
    </Button>
  )
}

// Logo Component
// NOTE: Kept the name `AlgoliaLogo` for legacy reasons, but it renders "Meilisearch".
// This reflects the fact that we use Algolia's UI components with Meilisearch backend.
const AlgoliaLogo = ({ size = 150 }: { size?: number | string }) => (
  <span style={{ maxWidth: size }} className="font-bold text-pink-500">
    Meilisearch
  </span>
)

// Modal Component
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center md:pt-[10vh] dark:bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-background md:rounded-xl shadow-2xl w-full md:w-[90%] max-w-full md:max-w-[720px] h-full md:h-auto md:max-h-[80vh] overflow-hidden animate-in fade-in-0 zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  )
}

// HitsList Component
interface HitsListProps {
  hits: Hit<BaseHit>[]
  query: string
  selectedIndex: number
  attributes: HitsAttributesMapping
  onHoverIndex?: (index: number) => void
  hoverEnabled?: boolean
  sendEvent?: (eventType: "click", hit: Hit<BaseHit>, eventName: string) => void
  openResultsInNewTab?: boolean
}

const HitsList = memo(function HitsList({
  hits,
  selectedIndex,
  attributes,
  onHoverIndex,
  hoverEnabled,
  sendEvent,
  openResultsInNewTab = false,
}: HitsListProps) {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({})
  const mapping = useMemo(
    () => ({
      primaryText: attributes.primaryText,
      secondaryText: attributes.secondaryText,
      tertiaryText: attributes.tertiaryText,
      url: attributes.url,
      image: attributes.image,
    }),
    [attributes]
  )

  if (!attributes || !mapping.primaryText) {
    throw new Error("At least a primaryText is required to display results")
  }

  return (
    <>
      {hits.map((hit: any, idx: number) => {
        const isSel = selectedIndex === idx
        const imageUrl = getByPath<string>(hit, mapping.image)
        const url = getByPath<string>(hit, mapping.url)
        const hasImage = Boolean(imageUrl)
        const isImageFailed = failedImages[hit.objectID] || !hasImage
        const primaryVal = getByPath<string>(hit, mapping.primaryText)
        return (
          <a
            key={hit.objectID}
            href={url ?? "#"}
            target={openResultsInNewTab && url ? "_blank" : undefined}
            rel={openResultsInNewTab && url ? "noopener noreferrer" : undefined}
            className="flex flex-row items-center gap-4 cursor-pointer text-decoration-none text-foreground bg-background rounded-sm p-4 aria-selected:bg-blue-50 dark:aria-selected:bg-slate-900 animate-in fade-in-0 zoom-in-95"
            role="option"
            aria-selected={isSel}
            onClick={() => {
              sendEvent?.("click", hit, "Hit Clicked")
            }}
            onMouseEnter={() => {
              if (!hoverEnabled) return
              onHoverIndex?.(idx)
            }}
            onMouseMove={() => {
              if (!hoverEnabled) return
              onHoverIndex?.(idx)
            }}
          >
            {hasImage ? (
              <div className="w-[100px] h-[100px] self-start flex-[0_0_100px] items-center justify-center overflow-hidden rounded-sm bg-muted relative">
                {!isImageFailed ? (
                  <Image
                    src={imageUrl as string}
                    alt={primaryVal || ""}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-contain rounded-sm"
                    onError={() =>
                      setFailedImages((prev) => ({
                        ...prev,
                        [hit.objectID]: true,
                      }))
                    }
                  />
                ) : (
                  <div
                    className="flex items-center justify-center w-full h-full text-muted-foreground"
                    aria-hidden="true"
                  >
                    <SearchIcon />
                  </div>
                )}
              </div>
            ) : null}
            <div>
              <p className="font-medium [&_mark]:bg-transparent [&_mark]:text-secondary-foreground [&_mark]:underline [&_mark]:underline-offset-4">
                <Highlight
                  attribute={toAttributePath(mapping.primaryText) as any}
                  hit={hit}
                />
              </p>
              {mapping.secondaryText ? (
                <p className="text-sm mt-2 text-muted-foreground">
                  {getByPath<string | number>(hit, mapping.secondaryText)}
                </p>
              ) : null}
              {mapping.tertiaryText ? (
                <p className="text-sm text-muted-foreground mt-2">
                  {getByPath<string | number>(hit, mapping.tertiaryText)}
                </p>
              ) : null}
            </div>
          </a>
        )
      })}
    </>
  )
})

// SearchInput Component
export interface SearchInputProps {
  placeholder?: string
  className?: string
  inputRef: React.RefObject<HTMLInputElement | null>
  onClose: () => void
  onArrowDown?: () => void
  onEnter?: () => void
  onArrowUp?: () => void
}

const SearchInput = memo(function SearchInput(props: SearchInputProps) {
  const {
    placeholder,
    className,
    inputRef,
    onClose,
    onArrowDown,
    onEnter,
    onArrowUp,
  } = props
  const { status } = useInstantSearch()
  const { query, refine } = useSearchBox()

  const isSearchStalled = status === "stalled"

  function setQuery(newQuery: string) {
    refine(newQuery)
  }

  const t = useTranslations("SearchModal")
  const resolvedPlaceholder = placeholder || t("placeholder")

  return (
    <search
      className={className}
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
      }}
      onReset={(event) => {
        event.preventDefault()
        event.stopPropagation()

        setQuery("")
        if (inputRef.current) {
          inputRef.current.focus()
        }
      }}
    >
      <div
        role="button"
        tabIndex={-1}
        className="p-2 rounded-full flex items-center justify-center transition-colors text-muted-foreground peer-focus:text-[#003dff]"
        aria-label="Search"
        title="Search"
      >
        <SearchIcon color="currentColor" strokeWidth={1.5} />
      </div>
      <input
        ref={inputRef}
        className="peer w-[90%] outline-none bg-transparent border-nonetext-foreground text-xl font-light peer [::-webkit-search-decoration]:appearance-none [::-webkit-search-cancel-button]:appearance-none [::-webkit-search-results-button]:appearance-none[::-webkit-search-results-decoration]:appearance-none"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        placeholder={resolvedPlaceholder}
        spellCheck={false}
        inputMode="search"
        id="algolia-search-input"
        name="algolia-search-input"
        maxLength={512}
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.currentTarget.value)
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault()
            onArrowDown?.()
            return
          }
          if (e.key === "ArrowUp") {
            e.preventDefault()
            onArrowUp?.()
            return
          }
          if (e.key === "Enter") {
            e.preventDefault()
            onEnter?.()
          }
        }}
        // biome-ignore lint/a11y/noAutofocus: expected
        autoFocus
      />
      <div className="flex items-center gap-2 ml-auto">
        <Button
          type="reset"
          variant="ghost"
          className="px-2 text-muted-foreground"
          hidden={!query || query.length === 0 || isSearchStalled}
          onClick={() => {
            setQuery("")
            if (inputRef.current) {
              inputRef.current.focus()
            }
          }}
        >
          {t("clear")}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="px-2 text-muted-foreground"
          onClick={onClose}
        >
          {t("close")}
        </Button>
      </div>
    </search>
  )
})

// ============================================================================
// Main Search Components
// ============================================================================

interface SearchBoxProps {
  query?: string
  className?: string
  placeholder?: string
  inputRef: React.RefObject<HTMLInputElement | null>
  refine: (query: string) => void
  onClose?: () => void
  onArrowDown?: () => void
  onArrowUp?: () => void
  onEnter?: () => void
}

const SearchBox = memo(function SearchBox(props: SearchBoxProps) {
  return (
    <SearchInput
      className={props.className}
      placeholder={props.placeholder}
      inputRef={props.inputRef}
      onClose={props.onClose || (() => {})}
      onEnter={props.onEnter}
      onArrowDown={props.onArrowDown}
      onArrowUp={props.onArrowUp}
    />
  )
})

interface NoResultsProps {
  query: string
  onClear: () => void
}

const NoResults = memo(function NoResults({ query, onClear }: NoResultsProps) {
  const t = useTranslations("SearchModal")
  return (
    <div className="flex flex-col items-center justify-center gap-2 bg-muted p-4 h-[91vh] md:h-[50vh] text-foreground">
      <div className="flex items-center p-2 justify-center w-10 h-10 rounded-full border-muted-foreground border">
        <SearchIcon />
      </div>
      <p className="text-lg font-medium">{t("no_results_title", { query })}</p>
      <p className="text-sm text-muted-foreground">{t("no_results_desc")}</p>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onClear}>
          {t("clear")}
        </Button>
      </div>
    </div>
  )
})

interface ResultsPanelProps {
  inputRef: React.RefObject<HTMLInputElement | null>
  query: string
  selectedIndex: number
  refine: (query: string) => void
  config: SearchConfig
  onHoverIndex?: (index: number) => void
  scrollOnSelectionChange?: boolean
  sendEvent?: (eventType: "click", hit: Hit<BaseHit>, eventName: string) => void
}

const ResultsPanel = memo(function ResultsPanel({
  query,
  selectedIndex,
  config,
  onHoverIndex,
  scrollOnSelectionChange = true,
  sendEvent,
}: ResultsPanelProps) {
  const { items } = useHits(
    config.transformItems ? { transformItems: config.transformItems } : {}
  )
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoverEnabled, setHoverEnabled] = useState(false)

  // biome-ignore lint/correctness/useExhaustiveDependencies: expected
  useEffect(() => {
    if (!scrollOnSelectionChange) return
    const container = containerRef.current
    if (!container) return
    const selectedEl = container.querySelector(
      '[aria-selected="true"]'
    ) as HTMLElement | null
    if (!selectedEl) return

    const padding = 8
    const cRect = container.getBoundingClientRect()
    const iRect = selectedEl.getBoundingClientRect()

    if (iRect.top < cRect.top + padding) {
      container.scrollTop -= cRect.top + padding - iRect.top
    } else if (iRect.bottom > cRect.bottom - padding) {
      container.scrollTop += iRect.bottom - (cRect.bottom - padding)
    }
  }, [selectedIndex, items.length, scrollOnSelectionChange])

  // Enable hover selection only after the user moves the pointer inside the list
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    setHoverEnabled(false)
    const enable = () => setHoverEnabled(true)
    container.addEventListener("pointermove", enable, { once: true } as any)
    return () => {
      container.removeEventListener("pointermove", enable as any)
    }
  }, [])

  return (
    <>
      <div
        ref={containerRef}
        className="flex flex-col h-[91vh] md:h-[50vh] bg-muted gap-4 p-2 overflow-y-auto"
        role="listbox"
      >
        <HitsList
          hits={items}
          query={query}
          selectedIndex={selectedIndex}
          attributes={config.attributes}
          onHoverIndex={onHoverIndex}
          hoverEnabled={hoverEnabled}
          sendEvent={sendEvent}
          openResultsInNewTab={config.openResultsInNewTab}
        />
      </div>
    </>
  )
})

interface SearchModalProps {
  onClose?: () => void
  config: SearchConfig
}

/**
 * SearchModal Component.
 * This component handles the internal state and rendering of the search input and results.
 * It expects to be wrapped inside an <InstantSearch> provider so it can access
 * hooks like `useSearchBox` and `useHits`.
 */
export function SearchModal({ onClose, config }: SearchModalProps) {
  const t = useTranslations("SearchModal")
  const { query, refine } = useSearchBox()
  const inputRef = useRef<HTMLInputElement | null>(null)

  const results = useInstantSearch()
  const { items, sendEvent } = useHits(
    config.transformItems ? { transformItems: config.transformItems } : {}
  )

  const noResults = results.results?.nbHits === 0
  const {
    selectedIndex,
    moveDown,
    moveUp,
    activateSelection,
    hoverIndex,
    selectionOrigin,
  } = useKeyboardNavigation(items, query, config.openResultsInNewTab ?? false)

  const handleActivateSelection = useCallback((): boolean => {
    // Send click event for keyboard navigation before activating
    if (selectedIndex >= 0 && selectedIndex < items.length) {
      const hit = items[selectedIndex]
      if (hit) {
        sendEvent?.("click", hit, "Hit Clicked")
      }
    }

    if (activateSelection()) {
      return true
    }
    return false
  }, [activateSelection, selectedIndex, items, sendEvent])

  const showResultsPanel = !noResults && !!query

  return (
    <>
      <Configure
        hitsPerPage={config.hitsPerPage || 8}
        {...config.searchParameters}
      />
      <div className="flex flex-col">
        <SearchBox
          query={query}
          placeholder={config.placeholder || t("placeholder")}
          className="flex flex-row items-center bg-background border-b border-muted rounded-t-sm p-2 placeholder:text-muted-foreground"
          refine={refine}
          onClose={onClose}
          onArrowDown={moveDown}
          onArrowUp={moveUp}
          inputRef={inputRef}
          onEnter={handleActivateSelection}
        />
        {showResultsPanel && (
          <ResultsPanel
            inputRef={inputRef}
            query={query}
            selectedIndex={selectedIndex}
            refine={refine}
            config={config}
            onHoverIndex={hoverIndex}
            scrollOnSelectionChange={selectionOrigin !== "pointer"}
            sendEvent={sendEvent}
          />
        )}
        {noResults && query && (
          <NoResults
            query={query}
            onClear={() => {
              refine("")
              if (inputRef.current) {
                inputRef.current.focus()
              }
            }}
          />
        )}
      </div>
      <Footer />
    </>
  )
}

const Footer = memo(function Footer() {
  const t = useTranslations("SearchModal")
  const poweredByHref = "https://meilisearch.com"
  return (
    <div className="flex items-center justify-between bg-background rounded-b-sm p-4">
      <div className="inline-flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <kbd className="bg-muted rounded-sm h-6 flex items-center justify-center p-1 text-muted-foreground">
            <CornerDownLeft size={20} color="currentColor" />
          </kbd>
          <span className="text-muted-foreground">{t("open")}</span>
        </div>

        <div className="flex items-center gap-2">
          <kbd className="bg-muted rounded-sm h-6 flex items-center justify-center p-1 text-muted-foreground">
            <ArrowUp size={20} color="currentColor" />
          </kbd>
          <kbd className="bg-muted rounded-sm h-6 flex items-center justify-center p-1 text-muted-foreground">
            <ArrowDown size={20} color="currentColor" />
          </kbd>
          <span className="text-muted-foreground">{t("navigate")}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <a
          className="flex items-center gap-2 text-muted-foreground text-sm no-underline transition-colors hover:text-primary"
          href={poweredByHref}
          target="_blank"
          rel="noopener sitesearch"
        >
          <span className="md:block hidden">{t("powered_by")}</span>
          <AlgoliaLogo />
        </a>
      </div>
    </div>
  )
})

/**
 * SearchExperience (Main Export)
 *
 * This is the entry point for the search functionality. It renders the search trigger button,
 * handles the keyboard shortcut (Cmd/Ctrl + K) to open the modal, and provides the
 * <InstantSearch> context to all child components using the global Meilisearch client.
 */
export default function SearchExperience(config: SearchConfig) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => setIsModalOpen(false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault()
        setIsModalOpen(true)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  const buttonProps = {
    ...config.buttonProps,
    onClick: openModal,
  }

  return (
    <>
      <SearchButton iconOnly={config.iconOnly} {...buttonProps}>
        {config.buttonText}
      </SearchButton>
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <InstantSearch
          searchClient={searchClient}
          indexName={config.indexName}
          future={{ preserveSharedStateOnUnmount: true }}
          insights={config.insights ?? true}
        >
          <SearchModal onClose={closeModal} config={config} />
        </InstantSearch>
      </Modal>
    </>
  )
}
