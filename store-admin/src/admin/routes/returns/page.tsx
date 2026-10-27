import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ArrowUturnLeft } from "@medusajs/icons"
import {
    Container,
    Heading,
    StatusBadge,
    DataTable,
    useDataTable,
    createDataTableColumnHelper,
    DataTablePaginationState,
} from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { sdk } from "../../lib/sdk"
import { Link } from "react-router-dom"

type ReturnItem = {
    id: string
    quantity: number
    note?: string
    reason_id?: string
    reason?: {
        id: string
        value: string
        label: string
    }
}

type OrderReturn = {
    id: string
    display_id: number
    status: "requested" | "received" | "canceled"
    refund_amount?: number
    created_at: string
    order_id: string
    order?: {
        id: string
        display_id: number
    }
    items: ReturnItem[]
    note?: string
}

const TextModal = ({ text, title, closeText }: { text: string, title: string, closeText?: string }) => {
    const [isOpen, setIsOpen] = useState(false)
    if (!text) return <span className="text-gray-400">—</span>
    
    const truncated = text.length > 60 ? text.slice(0, 60) + "..." : text

    if (text.length <= 60) {
        return <span>{text}</span>
    }

    return (
        <>
            <span 
                className="cursor-pointer text-blue-600 dark:text-blue-400 hover:underline not-italic"
                onClick={() => setIsOpen(true)}
            >
                {truncated}
            </span>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 not-italic" onClick={() => setIsOpen(false)}>
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col border border-gray-200 dark:border-zinc-800" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">{title}</h3>
                        <div className="overflow-y-auto flex-1 mb-4">
                            <p className="text-gray-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">{text}</p>
                        </div>
                        <div className="flex justify-end">
                            <button 
                                className="px-4 py-2 bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 font-medium transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                {closeText || "Close"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

const columnHelper = createDataTableColumnHelper<OrderReturn>()

const useReturnsColumns = () => {
    const { t } = useTranslation()

    return useMemo(() => [
        columnHelper.accessor("id", {
            header: t("returns.columns.id", "Return Code / ID"),
            cell: ({ row }) => {
                const shortId = row.original.id.slice(-7).toUpperCase()
                return (
                    <div className="flex flex-col gap-0.5">
                        <span className="font-mono font-bold text-gray-950 dark:text-zinc-50">
                            #{shortId}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                            {row.original.id}
                        </span>
                    </div>
                )
            }
        }),
        columnHelper.accessor("order", {
            header: t("returns.columns.order", "Order"),
            cell: ({ row }) => {
                return (
                    <Link
                        to={`/orders/${row.original.order_id}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-bold"
                    >
                        Order #{row.original.order?.display_id ?? row.original.order_id}
                    </Link>
                )
            },
        }),
        columnHelper.accessor("status", {
            header: t("returns.columns.status", "Status"),
            cell: ({ row }) => {
                let color: "grey" | "orange" | "green" | "red" = "grey"
                if (row.original.status === "received") {
                    color = "green"
                } else if (row.original.status === "requested") {
                    color = "orange"
                } else if (row.original.status === "canceled") {
                    color = "red"
                }
                return (
                    <StatusBadge color={color}>
                        {row.original.status.charAt(0).toUpperCase() + row.original.status.slice(1)}
                    </StatusBadge>
                )
            },
        }),
        columnHelper.accessor("items", {
            header: t("returns.columns.items", "Reason & Customer Note"),
            cell: ({ row }) => {
                const items = row.original.items || []
                const returnNote = row.original.note
                
                if (items.length === 0 && !returnNote) return <span className="text-gray-400">-</span>
                
                const isIranFeaturesEnabled = 
                    process.env.ENABLE_IRAN_FEATURES === "true" ||
                    process.env.MEDUSA_ADMIN_ENABLE_IRAN_FEATURES === "true" ||
                    (typeof import.meta !== "undefined" && ((import.meta as any).env?.MEDUSA_ADMIN_ENABLE_IRAN_FEATURES === "true" || (import.meta as any).env?.ENABLE_IRAN_FEATURES === "true"))
                
                const isIbanNote = isIranFeaturesEnabled && returnNote ? /^(?:شماره شبا|الآيبان|IBAN|Sheba):\s*/i.test(returnNote) : false
                const cleanIban = isIbanNote 
                    ? returnNote!.replace(/^(?:شماره شبا|الآيبان|IBAN|Sheba):\s*/i, "").trim()
                    : ""
                const formattedIban = cleanIban.toUpperCase().startsWith("IR") ? cleanIban.toUpperCase() : `IR${cleanIban}`
                
                return (
                    <div className="flex flex-col gap-1.5 max-w-[400px]">
                        {isIbanNote && (
                            <div className="mb-2 p-2 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30 rounded-md">
                                <div className="text-[10px] font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider mb-1">
                                    {t("returns.refundAccount", "Refund Account")}
                                </div>
                                <div className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100">
                                    {formattedIban}
                                </div>
                            </div>
                        )}
                        {returnNote && !isIbanNote && (
                            <div className="mb-2 p-2 bg-gray-50 dark:bg-zinc-800/50 rounded-md text-xs">
                                <span className="font-bold">{t("returns.returnNote", "Return Note")}:</span> {returnNote}
                            </div>
                        )}
                        
                        {items.map((item) => (
                            <div key={item.id} className="text-xs border-b border-gray-100 dark:border-zinc-800 pb-1 last:border-none last:pb-0">
                                <span className="font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/30 border border-blue-100/50 dark:border-blue-900/30 px-1.5 py-0.5 rounded-md mr-1.5">
                                    {t("returns.qty", "Qty")} {item.quantity}
                                </span>
                                <span className="font-bold text-gray-800 dark:text-zinc-200">
                                    {item.reason?.label || t("returns.other", "Other")}
                                </span>
                                {item.note && (
                                    <div className="text-gray-500 dark:text-zinc-400 italic mt-0.5">
                                        "<TextModal text={item.note} title={t("returns.customerNote", "Customer Note")} closeText={t("common.close", "Close")} />"
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )
            }
        }),
        columnHelper.accessor("created_at", {
            header: t("returns.columns.createdAt", "Date Requested"),
            cell: ({ row }) => {
                return new Date(row.original.created_at).toLocaleString("fa-IR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                })
            }
        })
    ], [t])
}

const limit = 15

const ReturnsPage = () => {
    const { t } = useTranslation()
    const columns = useReturnsColumns()

    const [pagination, setPagination] = useState<DataTablePaginationState>({
        pageSize: limit,
        pageIndex: 0,
    })

    const offset = useMemo(() => {
        return pagination.pageIndex * limit
    }, [pagination])

    const { data, isLoading } = useQuery<{
        returns: OrderReturn[]
        count: number
        limit: number
        offset: number
    }>({
        queryKey: ["returns", { offset, limit }],
        queryFn: () => sdk.client.fetch("/admin/returns-sorted", {
            query: {
                offset,
                limit,
            },
        }),
    })

    const sortedReturns = useMemo(() => {
        if (!data?.returns) return []
        return [...data.returns].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }, [data])

    const table = useDataTable({
        columns,
        data: sortedReturns,
        rowCount: data?.count || 0,
        isLoading,
        pagination: {
            state: pagination,
            onPaginationChange: setPagination,
        },
        getRowId: (row) => row.id,
    })

    return (
        <Container>
            <DataTable instance={table}>
                <DataTable.Toolbar className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
                    <Heading>
                        {t("returns.title", "Customer Returns")}
                    </Heading>
                </DataTable.Toolbar>
                <DataTable.Table />
                <DataTable.Pagination />
            </DataTable>
        </Container>
    )
}

export const config = defineRouteConfig({
    label: "customRoutes.returns",
    translationNs: "translation",
    icon: ArrowUturnLeft,
})

export default ReturnsPage
