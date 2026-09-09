import React from "react"
import { Box, Typography, Button, Divider, Flex, SingleSelect, SingleSelectOption, Badge, Loader } from "@strapi/design-system"
import { Play, Trash, Plus, Earth, Check, ArrowClockwise, Cloud } from "@strapi/icons"
import { useFetchClient } from "@strapi/strapi/admin"

const predefinedGroups = [
  {
    label: "Home",
    options: [
      { label: "Hero", value: "home/components/Hero" },
      { label: "Blog Posts Block", value: "home/components/BlogPostsBlock" },
      { label: "Category Collection Showcase", value: "home/components/CategoryCollectionShowcase" },
      { label: "Features Block", value: "home/components/FeaturesBlock" },
      { label: "Product Showcase", value: "home/components/ProductShowcase" },
      { label: "Product Scroll", value: "home/components/ProductScroll" }
    ]
  },
  {
    label: "Layout",
    options: [
      { label: "Header", value: "layout/components/header" },
      { label: "Footer", value: "layout/components/footer" },
      { label: "Bottom Nav Bar", value: "layout/components/bottom-nav-bar" }
    ]
  },
  {
    label: "Account",
    options: [
      { label: "Login", value: "account/templates/login" },
      { label: "Profile", value: "account/templates/profile" }
    ]
  },
  {
    label: "Cart & Checkout",
    options: [
      { label: "Cart", value: "cart/templates" },
      { label: "Checkout", value: "checkout/templates" }
    ]
  },
  {
    label: "Common",
    options: [
      { label: "Background", value: "common/components/background" },
      { label: "Block Header", value: "common/components/block-header" }
    ]
  },
  {
    label: "Pages",
    options: [
      { label: "Products", value: "products/templates" },
      { label: "Store", value: "store/templates" },
      { label: "Order", value: "order/templates" }
    ]
  }
]

type DeployStatus = {
  success: boolean
  mode: "github-actions" | "local-dev"
  status: "queued" | "in_progress" | "completed" | "idle"
  conclusion: "success" | "failure" | "cancelled" | null
  updated_at?: string
  html_url?: string
  run_number?: number
  message?: string
}

const StorefrontPage = () => {
  const { get, post } = useFetchClient()
  
  const [history, setHistory] = React.useState<any[]>([])
  const [deployStatus, setDeployStatus] = React.useState<DeployStatus | null>(null)
  const [statusLoading, setStatusLoading] = React.useState(false)
  const [translationLoading, setTranslationLoading] = React.useState(false)
  const previousStatusRef = React.useRef<string | null>(null)

  const fetchHistory = async () => {
    try {
      const { data } = await get("/api/storefront/sync-history")
      if (data.success && data.history) {
        setHistory(data.history)
      }
    } catch (e) {
      console.error("Failed to fetch history", e)
    }
  }

  const fetchStatus = async () => {
    try {
      setStatusLoading(true)
      const { data } = await get("/api/storefront/status")
      if (data.success) {
        setDeployStatus(data)

        // Check if build just transitioned from in_progress to success
        if (
          previousStatusRef.current === "in_progress" &&
          data.status === "completed" &&
          data.conclusion === "success"
        ) {
          alert("🎉 Storefront build completed successfully! The new styles are now live on your server.")
        }
        previousStatusRef.current = data.status
      }
    } catch (e) {
      console.error("Failed to fetch deploy status", e)
    } finally {
      setStatusLoading(false)
    }
  }

  React.useEffect(() => {
    fetchHistory()
    fetchStatus()

    // Auto-poll status: every 4s if building, every 30s when idle
    const isBuilding = deployStatus?.status === "in_progress" || deployStatus?.status === "queued"
    const interval = setInterval(() => {
      fetchStatus()
    }, isBuilding ? 4000 : 30000)

    return () => clearInterval(interval)
  }, [deployStatus?.status])
  
  const [componentPath, setComponentPath] = React.useState(predefinedGroups[0].options[0].value)
  const [style, setStyle] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [buildLoading, setBuildLoading] = React.useState(false)
  const [buildStep, setBuildStep] = React.useState<string | null>(null)
  const [undoLoading, setUndoLoading] = React.useState(false)

  const getQueueItemForStyle = (s: string) => {
    return history.find(
      (item) =>
        item.componentPath === `${componentPath}/styles/${s}` ||
        item.componentPath === `${componentPath}/${s}`
    )
  }

  const [stylesData, setStylesData] = React.useState<{
    installedStyles: string[]
    registryStyles: string[]
    availableToDownload: string[]
    stylePreviews?: Record<string, string>
    source: string
    cached?: boolean
    error?: string
    storefrontSource?: string
  } | null>(null)
  const [stylesLoading, setStylesLoading] = React.useState(false)
  const [previewError, setPreviewError] = React.useState<Record<string, boolean>>({})

  const fetchStyles = React.useCallback(
    async (targetPath: string, forceRefresh = false) => {
      if (!targetPath) return
      setStylesLoading(true)
      try {
        const { data } = await get(
          `/api/storefront/component-styles?componentPath=${encodeURIComponent(targetPath)}${
            forceRefresh ? "&refresh=true" : ""
          }`
        )
        if (data && data.success) {
          setStylesData(data)
          // Default to first installed or available style if current style is empty or not in this component
          setStyle((current) => {
            const all = [...(data.installedStyles || []), ...(data.availableToDownload || [])]
            if (!current || !all.includes(current)) {
              return data.installedStyles?.[0] || data.availableToDownload?.[0] || ""
            }
            return current
          })
        }
      } catch (err: any) {
        console.error("Failed to fetch component styles:", err)
      } finally {
        setStylesLoading(false)
      }
    },
    [get]
  )

  React.useEffect(() => {
    if (componentPath) {
      fetchStyles(componentPath)
    }
  }, [componentPath, fetchStyles])

  const handleBuild = async () => {
    const confirmBuild = window.confirm(
      "Are you sure you want to update the storefront? This will automatically sync your latest Strapi settings preset and trigger a production build on GitHub Actions."
    )
    if (!confirmBuild) return

    setBuildLoading(true)
    setBuildStep("1/2 Syncing Settings...")
    try {
      // Step 1: Automatically sync storefront settings preset
      const settingsRes = await post("/api/storefront/sync-settings", {})
      if (!settingsRes.data?.success) {
        throw new Error(settingsRes.data?.message || "Failed to sync storefront settings preset")
      }

      // Step 2: Trigger storefront build
      setBuildStep("2/2 Triggering Build...")
      const { data } = await post("/api/storefront/build", {})
      if (data.success) {
        fetchHistory()
        fetchStatus()
        if (data.workflowUrl) {
          alert(`🎉 Settings Synced & Build Triggered!\n\nLatest settings preset was synced and GitHub Actions is building your storefront.\n\nWorkflow: ${data.workflowUrl}`)
        } else {
          alert(`🎉 Settings Synced & Storefront Updated!\n\n${settingsRes.data?.message || ""}\n${data.message || ""}`)
        }
      } else {
        alert("Failed to trigger build: " + (data.message || "Unknown error"))
      }
    } catch (e: any) {
      alert("Error updating storefront: " + (e.response?.data?.error?.message || e.message))
    } finally {
      setBuildLoading(false)
      setBuildStep(null)
    }
  }

  const handleSyncTranslations = async () => {
    setTranslationLoading(true)
    try {
      const { data } = await post("/api/storefront/sync-translations", {})
      if (data.success) {
        alert(`🎉 Translations Synced!\n\n${data.message}\n\n${data.output || ""}`)
      } else {
        alert("Error: " + (data.message || "Failed to sync translations"))
      }
    } catch (e: any) {
      alert("Error syncing translations: " + (e.response?.data?.error?.message || e.message))
    } finally {
      setTranslationLoading(false)
    }
  }


  const handleSync = async (action: "add" | "remove" = "add", targetStyle?: string) => {
    const selectedStyle = targetStyle || style
    if (!componentPath) {
      alert("Component path is required.")
      return
    }

    if (!selectedStyle) {
      alert("Style name is required. Please select a style first.")
      return
    }

    const actionText = action === "remove" ? "queue removal of" : "queue installation of"
    const confirmSync = window.confirm(
      `Do you want to ${actionText} '${selectedStyle}' for '${componentPath}'? It will be added to the Pending Updates queue.`
    )
    if (!confirmSync) return

    setIsLoading(true)
    try {
      const { data } = await post("/api/storefront/sync-component", {
        componentName: componentPath,
        style: selectedStyle,
        action: action,
        autoDeploy: false,
        syncAllStyles: false,
      })

      if (data.success) {
        fetchHistory()
        fetchStatus()
        fetchStyles(componentPath)
      } else {
        alert("Error: " + (data.message || "Unknown error during sync."))
      }
    } catch (e: any) {
      alert("Error triggering sync: " + (e.response?.data?.error?.message || e.message))
    } finally {
      setIsLoading(false)
    }
  }

  const handleUndo = async (id: string) => {
    try {
      const { data } = await post("/api/storefront/sync-undo", { id })
      if (data.success) {
        fetchHistory()
      } else {
        alert("Undo failed: " + data.message)
      }
    } catch (e: any) {
      alert("Error undoing action: " + (e.response?.data?.error?.message || e.message))
    }
  }

  const isBuilding = deployStatus?.status === "in_progress" || deployStatus?.status === "queued"
  const isSuccess = deployStatus?.conclusion === "success" && !isBuilding
  const isFailure = deployStatus?.conclusion === "failure" && !isBuilding

  return (
    <Box padding={8} background="neutral100" minHeight="100vh">
      <Box paddingBottom={6}>
        <Typography variant="alpha" fontWeight="bold">Storefront Management</Typography>
        <Box paddingTop={2}>
          <Typography variant="epsilon" textColor="neutral600">
            Manage your Next.js storefront directly from Strapi. You can synchronize component styles, sync translation files, or trigger a full production build.
          </Typography>
        </Box>
      </Box>

      <Flex direction="column" alignItems="stretch" gap={6}>
        {/* Live Build & Deployment Status Widget */}
        <Box
          padding={5}
          background={isBuilding ? "warning100" : isSuccess ? "success100" : isFailure ? "danger100" : "neutral0"}
          shadow="filterShadow"
          hasRadius
          borderColor={isBuilding ? "warning200" : isSuccess ? "success200" : isFailure ? "danger200" : "neutral200"}
        >
          <Flex justifyContent="space-between" alignItems="center" wrap="wrap" gap={3}>
            <Flex gap={3} alignItems="center">
              <Box
                width="14px"
                height="14px"
                borderRadius="50%"
                background={isBuilding ? "warning600" : isSuccess ? "success600" : isFailure ? "danger600" : "neutral400"}
              />
              <Box>
                <Typography variant="delta" fontWeight="bold">
                  {isBuilding
                    ? `Building & Deploying Storefront... ${deployStatus?.run_number ? `(Run #${deployStatus.run_number})` : ""}`
                    : isSuccess
                    ? `Storefront is Live & Up-to-Date ${deployStatus?.run_number ? `(Run #${deployStatus.run_number})` : ""}`
                    : isFailure
                    ? `Deployment Failed ${deployStatus?.run_number ? `(Run #${deployStatus.run_number})` : ""}`
                    : "Storefront Status: Idle"}
                </Typography>
                <Typography variant="pi" textColor="neutral600" display="block" paddingTop={1}>
                  {isBuilding
                    ? "GitHub Actions is pulling components and translations, building Next.js, and deploying to VPS."
                    : deployStatus?.updated_at
                    ? `Last deploy completed: ${new Date(deployStatus.updated_at).toLocaleString()}`
                    : "Ready for component and translation synchronization."}
                </Typography>
              </Box>
            </Flex>

            <Flex gap={2}>
              {deployStatus?.html_url && (
                <Button
                  variant="tertiary"
                  size="S"
                  onClick={() => window.open(deployStatus.html_url, "_blank")}
                >
                  View GitHub Actions Log
                </Button>
              )}
              <Button
                variant="ghost"
                size="S"
                loading={statusLoading}
                onClick={fetchStatus}
              >
                Refresh Status
              </Button>
            </Flex>
          </Flex>
        </Box>


        {/* Translation Sync Section */}
        <Box padding={6} background="neutral0" shadow="filterShadow" hasRadius>
          <Typography variant="beta" paddingBottom={2}>Translations & Locales</Typography>
          <Typography variant="epsilon" textColor="neutral600" paddingBottom={4} display="block">
            Synchronize translation JSON files uploaded in <strong>Storefront Settings → Translations</strong> into the storefront code and automatically regenerate the dynamic message loader registry.
          </Typography>
          
          <Button 
            variant="secondary" 
            startIcon={<Earth />} 
            onClick={handleSyncTranslations} 
            loading={translationLoading}
          >
            Sync Translations from Strapi
          </Button>
        </Box>

        {/* Component Sync Form */}
        <Box padding={6} background="neutral0" shadow="filterShadow" hasRadius>
          <Typography variant="beta" paddingBottom={4}>Loomix Blocks Sync</Typography>
          <Typography variant="epsilon" textColor="neutral600" paddingBottom={4} display="block">
            Download or remove Loomix Block styles from the registry into your storefront source code.
          </Typography>
          
          <Flex direction="column" alignItems="stretch" gap={4} width="100%" maxWidth="500px">
            <Box>
              <Typography variant="pi" fontWeight="bold" paddingBottom={1} display="block">Component</Typography>
              <SingleSelect
                value={componentPath}
                onChange={(val) => setComponentPath(val as string)}
                placeholder="Select a component..."
              >
                {predefinedGroups.flatMap(group => (
                  group.options.map(opt => (
                    <SingleSelectOption key={opt.value} value={opt.value}>
                      {group.label.split(' ')[0]} - {opt.label}
                    </SingleSelectOption>
                  ))
                ))}
              </SingleSelect>
            </Box>

            {/* Interactive Style Discovery Widget */}
            <Box
              padding={4}
              background="neutral100"
              hasRadius
              borderStyle="solid"
              borderWidth="1px"
              borderColor="neutral200"
            >
              <Flex justifyContent="space-between" alignItems="center" paddingBottom={3} wrap="wrap" gap={2}>
                <Flex gap={2} alignItems="center">
                  <Typography variant="pi" fontWeight="bold">
                    Styles Inspector
                  </Typography>
                  {stylesData?.source && (
                    <Badge size="S" active={stylesData.source.startsWith("github")}>
                      {stylesData.source === "github-tree"
                        ? "GitHub Registry (Live)"
                        : stylesData.source === "memory-cache"
                        ? "GitHub Registry (Cached)"
                        : "Local Registry Fallback"}
                    </Badge>
                  )}
                </Flex>
                <Button
                  variant="ghost"
                  size="S"
                  startIcon={<ArrowClockwise />}
                  loading={stylesLoading}
                  onClick={() => fetchStyles(componentPath, true)}
                >
                  Refresh from GitHub
                </Button>
              </Flex>

              {stylesLoading ? (
                <Flex justifyContent="center" alignItems="center" padding={4} gap={2}>
                  <Loader small />
                  <Typography variant="pi" textColor="neutral600">
                    Inspecting styles from GitHub registry & storefront...
                  </Typography>
                </Flex>
              ) : (
                <Flex direction="column" alignItems="stretch" gap={3}>
                  {/* 1. Installed in Project */}
                  <Box>
                    <Flex gap={2} alignItems="center" paddingBottom={1}>
                      <Typography variant="pi" fontWeight="semiBold" textColor="neutral700">
                        🟢 Installed in Storefront ({stylesData?.installedStyles?.length || 0}):
                      </Typography>
                      {stylesData?.storefrontSource === "docker-internal" && (
                        <Typography variant="sigma" textColor="neutral500">
                          (Live Docker Container)
                        </Typography>
                      )}
                    </Flex>
                    {stylesData?.installedStyles && stylesData.installedStyles.length > 0 ? (
                      <Flex wrap="wrap" gap={2} paddingTop={1}>
                        {stylesData.installedStyles.map((s) => {
                          const isSelected = style === s
                          const qItem = getQueueItemForStyle(s)
                          const isQueuedForRemoval = qItem && qItem.action === "remove"

                          return (
                            <Button
                              key={s}
                              size="S"
                              variant={
                                isQueuedForRemoval
                                  ? "danger-light"
                                  : isSelected
                                  ? "success"
                                  : "success-light"
                              }
                              startIcon={isQueuedForRemoval ? <Trash /> : <Check />}
                              onClick={() => setStyle(s)}
                              title={
                                isQueuedForRemoval
                                  ? "Queued for removal in pending updates"
                                  : "Click to select this installed style"
                              }
                            >
                              {s} {isQueuedForRemoval ? "(Queued: Remove)" : ""}
                            </Button>
                          )
                        })}
                      </Flex>
                    ) : (
                      <Typography variant="pi" textColor="neutral500" style={{ fontStyle: "italic" }}>
                        No styles installed in storefront for this component yet.
                      </Typography>
                    )}
                  </Box>

                  {/* 2. Available in Loomix Registry */}
                  <Box paddingTop={2}>
                    <Typography variant="pi" fontWeight="semiBold" textColor="neutral700" paddingBottom={1} display="block">
                      🔵 Available in Loomix Registry ({stylesData?.availableToDownload?.length || 0}):
                    </Typography>
                    {stylesData?.availableToDownload && stylesData.availableToDownload.length > 0 ? (
                      <Flex wrap="wrap" gap={2} paddingTop={1}>
                        {stylesData.availableToDownload.map((s) => {
                          const isSelected = style === s
                          const qItem = getQueueItemForStyle(s)
                          const isQueuedForAdd = qItem && qItem.action === "add"

                          return (
                            <Button
                              key={s}
                              size="S"
                              variant={
                                isQueuedForAdd
                                  ? "success"
                                  : isSelected
                                  ? "default"
                                  : "tertiary"
                              }
                              startIcon={isQueuedForAdd ? <Check /> : <Cloud />}
                              onClick={() => setStyle(s)}
                              title={
                                isQueuedForAdd
                                  ? "Queued for addition in pending updates"
                                  : "Click to select this available style"
                              }
                            >
                              {s} {isQueuedForAdd ? "(Queued: Add)" : "(Download)"}
                            </Button>
                          )
                        })}
                      </Flex>
                    ) : stylesData?.registryStyles && stylesData.registryStyles.length > 0 ? (
                      <Typography variant="pi" textColor="success700" paddingTop={1} display="block">
                        ✓ All styles available in Loomix Registry are already installed in your project!
                      </Typography>
                    ) : (
                      <Typography variant="pi" textColor="neutral500" style={{ fontStyle: "italic" }}>
                        No styles found in registry for this component.
                      </Typography>
                    )}
                  </Box>

                  {/* 3. Style Live Preview & Action Card */}
                  {style && (
                    <Box
                      padding={4}
                      background="neutral0"
                      hasRadius
                      borderColor="neutral200"
                      shadow="tableShadow"
                    >
                      <Flex justifyContent="space-between" alignItems="center" paddingBottom={3} wrap="wrap" gap={2}>
                        <Flex gap={2} alignItems="center">
                          <Typography variant="pi" fontWeight="bold" textColor="neutral800">
                            Preview: {style}
                          </Typography>
                          {(() => {
                            const qItem = getQueueItemForStyle(style)
                            if (qItem) {
                              return (
                                <Badge
                                  backgroundColor={qItem.action === "remove" ? "danger100" : "primary100"}
                                  textColor={qItem.action === "remove" ? "danger700" : "primary700"}
                                >
                                  ⏳ Queued for {qItem.action === "remove" ? "Removal" : "Installation"}
                                </Badge>
                              )
                            }
                            if (stylesData?.installedStyles?.includes(style)) {
                              return (
                                <Badge backgroundColor="success100" textColor="success700">
                                  🟢 Installed in Storefront
                                </Badge>
                              )
                            }
                            return (
                              <Badge backgroundColor="neutral150" textColor="neutral700">
                                🔵 Available in Loomix Registry
                              </Badge>
                            )
                          })()}
                        </Flex>

                        {/* Action buttons right in the preview header */}
                        <Flex gap={2} alignItems="center">
                          {(() => {
                            const qItem = getQueueItemForStyle(style)
                            if (qItem) {
                              return (
                                <Button
                                  size="S"
                                  variant="tertiary"
                                  startIcon={<ArrowClockwise />}
                                  onClick={() => handleUndo(qItem.id)}
                                  loading={undoLoading}
                                  title="Cancel this pending change"
                                >
                                  Undo from Queue
                                </Button>
                              )
                            }
                            if (stylesData?.installedStyles?.includes(style)) {
                              return (
                                <Button
                                  size="S"
                                  variant="danger-light"
                                  startIcon={<Trash />}
                                  onClick={() => handleSync("remove", style)}
                                  loading={isLoading}
                                  title={`Queue removal of ${style}`}
                                >
                                  Remove {style} (Queue)
                                </Button>
                              )
                            }
                            if (stylesData?.availableToDownload?.includes(style)) {
                              return (
                                <Button
                                  size="S"
                                  variant="default"
                                  startIcon={<Plus />}
                                  onClick={() => handleSync("add", style)}
                                  loading={isLoading}
                                  title={`Queue installation of ${style}`}
                                >
                                  + Add {style} (Queue)
                                </Button>
                              )
                            }
                            return null
                          })()}
                        </Flex>
                      </Flex>

                      {/* Image container */}
                      <Box
                        background="neutral100"
                        hasRadius
                        padding={3}
                        style={{
                          textAlign: "center",
                          minHeight: "180px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                        }}
                      >
                        {previewError[`${componentPath}/${style}`] ? (
                          <Flex direction="column" alignItems="center" gap={1} padding={4}>
                            <Typography variant="pi" textColor="neutral500">
                              Preview image not available for {style}
                            </Typography>
                            <Typography variant="sigma" textColor="neutral400">
                              (Will appear when preview.webp is added to this style folder)
                            </Typography>
                          </Flex>
                        ) : (
                          <img
                            key={`${componentPath}/${style}`}
                            src={
                              stylesData?.stylePreviews?.[style] ||
                              `/api/storefront/style-preview?component=${encodeURIComponent(
                                componentPath
                              )}&style=${encodeURIComponent(style)}`
                            }
                            alt={`${componentPath} ${style} preview`}
                            style={{
                              maxWidth: "100%",
                              maxHeight: "300px",
                              objectFit: "contain",
                              borderRadius: "6px",
                              display: "block",
                              margin: "0 auto",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                            }}
                            onError={() => {
                              setPreviewError((prev) => ({
                                ...prev,
                                [`${componentPath}/${style}`]: true,
                              }))
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  )}

                  {/* Error notification if any */}
                  {stylesData?.error && (
                    <Box paddingTop={1}>
                      <Typography variant="pi" textColor="warning700">
                        ℹ️ Note: {stylesData.error}
                      </Typography>
                    </Box>
                  )}
                </Flex>
              )}
            </Box>
          </Flex>
        </Box>

        {/* Pending Updates & Production Build */}
        <Box padding={6} background="neutral0" shadow="filterShadow" hasRadius>
          <Box paddingBottom={4}>
            <Typography variant="beta">Pending Updates</Typography>
          </Box>
          
          {history.length === 0 ? (
            <Typography variant="epsilon" textColor="neutral600">
              No pending component changes since last build.
            </Typography>
          ) : (
            <Flex direction="column" alignItems="stretch" gap={3}>
              {history.map(item => (
                <Flex key={item.id} justifyContent="space-between" background="neutral100" padding={3} hasRadius>
                  <Box>
                    <Typography variant="pi" fontWeight="bold" textColor={item.action === "add" ? "success600" : "danger600"}>
                      {item.action.toUpperCase()}
                    </Typography>
                    <Typography variant="pi" paddingLeft={2}>
                      {item.componentPath}
                    </Typography>
                  </Box>
                  <Button variant="tertiary" size="S" onClick={() => handleUndo(item.id)} loading={undoLoading}>
                    Undo
                  </Button>
                </Flex>
              ))}
            </Flex>
          )}

          <Box paddingTop={6} paddingBottom={4}>
            <Divider />
          </Box>

          <Typography variant="beta" paddingBottom={4}>Production Build</Typography>
          <Typography variant="epsilon" textColor="neutral600" paddingBottom={4} display="block">
            Automatically synchronizes the latest settings preset from Strapi and triggers a full production rebuild on GitHub Actions.
          </Typography>
          <Button variant="secondary" startIcon={<Play />} onClick={handleBuild} loading={buildLoading || isBuilding}>
            {isBuilding
              ? "Build in Progress..."
              : buildStep
              ? buildStep
              : `Update Storefront ${history.length > 0 ? `(${history.length} changes)` : ""}`}
          </Button>
        </Box>
      </Flex>
    </Box>
  )
}

export default StorefrontPage
