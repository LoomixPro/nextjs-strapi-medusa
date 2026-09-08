import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChatBubbleLeftRight } from "@medusajs/icons"
import {
    Container,
    Heading,
    StatusBadge,
    Toaster,
    DataTable,
    useDataTable,
    createDataTableColumnHelper,
    DataTablePaginationState,
    createDataTableCommandHelper,
    DataTableRowSelectionState,
    toast
} from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useState, useMemo } from "react"
import { HttpTypes } from "@medusajs/types"
import { sdk } from "../../lib/sdk"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"

type Review = {
    id: string
    title?: string
    content: string
    rating: number
    product_id: string
    customer_id?: string
    status: "pending" | "approved" | "rejected"
    created_at: Date
    updated_at: Date
    product?: HttpTypes.AdminProduct
    customer?: HttpTypes.AdminCustomer
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
                className="cursor-pointer text-blue-600 dark:text-blue-400 hover:underline"
                onClick={() => setIsOpen(true)}
            >
                {truncated}
            </span>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={() => setIsOpen(false)}>
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



const columnHelper = createDataTableColumnHelper<Review>()

const useReviewsColumns = (t: any) => useMemo(() => [
    columnHelper.select(),
    columnHelper.accessor("id", {
        header: t("reviews.columns.id", "ID"),
    }),
    columnHelper.accessor("title", {
        header: t("reviews.columns.title", "Title"),
        cell: ({ row }) => {
            return <TextModal text={row.original.title || ""} title={t("reviews.reviewTitle", "Review Title")} closeText={t("common.close", "Close")} />
        },
    }),
    columnHelper.accessor("rating", {
        header: t("reviews.columns.rating", "Rating"),
    }),
    columnHelper.accessor("content", {
        header: t("reviews.columns.content", "Content"),
        cell: ({ row }) => {
            return <TextModal text={row.original.content} title={t("reviews.reviewContent", "Review Content")} closeText={t("common.close", "Close")} />
        },
    }),
    columnHelper.accessor("status", {
        header: t("reviews.columns.status", "Status"),
        cell: ({ row }) => {
            const color = row.original.status === "approved" ?
                "green" : row.original.status === "rejected"
                    ? "red" : "grey"
            return (
                <StatusBadge color={color}>
                    {row.original.status.charAt(0).toUpperCase() + row.original.status.slice(1)}
                </StatusBadge>
            )
        },
    }),
    columnHelper.accessor("product", {
        header: t("reviews.columns.product", "Product"),
        cell: ({ row }) => {
            return (
                <Link
                    to={`/products/${row.original.product_id}`}
                >
                    {row.original.product?.title}
                </Link>
            )
        },
    }),
], [t])


const commandHelper = createDataTableCommandHelper()

const useCommands = (t: any, refetch: () => void, clearSelection: () => void) => {
    return useMemo(() => [
        commandHelper.command({
            label: t("reviews.commands.approve", "Approve"),
            shortcut: "A",
            action: async (selection) => {
                const reviewsToApproveIds = Object.keys(selection)

                sdk.client.fetch("/admin/reviews/status", {
                    method: "POST",
                    body: {
                        ids: reviewsToApproveIds,
                        status: "approved",
                    },
                }).then(() => {
                    toast.success(t("reviews.toast.approveSuccess", "Reviews approved"))
                    clearSelection()
                    refetch()
                }).catch(() => {
                    toast.error(t("reviews.toast.approveError", "Failed to approve reviews"))
                })
            },
        }),
        commandHelper.command({
            label: t("reviews.commands.reject", "Reject"),
            shortcut: "R",
            action: async (selection) => {
                const reviewsToRejectIds = Object.keys(selection)

                sdk.client.fetch("/admin/reviews/status", {
                    method: "POST",
                    body: {
                        ids: reviewsToRejectIds,
                        status: "rejected",
                    },
                }).then(() => {
                    toast.success(t("reviews.toast.rejectSuccess", "Reviews rejected"))
                    clearSelection()
                    refetch()
                }).catch(() => {
                    toast.error(t("reviews.toast.rejectError", "Failed to reject reviews"))
                })
            },
        }),
        commandHelper.command({
            label: t("reviews.commands.delete", "Delete"),
            shortcut: "D",
            action: async (selection) => {
                const ids = Object.keys(selection)

                if (!window.confirm(t("reviews.commands.deleteConfirm", "Are you sure you want to delete {{count}} review(s)? This cannot be undone.", { count: ids.length }))) {
                    return
                }

                sdk.client.fetch("/admin/reviews/delete", {
                    method: "POST",
                    body: { ids },
                }).then(() => {
                    toast.success(t("reviews.toast.deleteSuccess", "Reviews deleted"))
                    clearSelection()
                    refetch()
                }).catch(() => {
                    toast.error(t("reviews.toast.deleteError", "Failed to delete reviews"))
                })
            },
        }),
    ], [t, refetch, clearSelection])
}

const limit = 15

const ReviewsPage = () => {
    const { t } = useTranslation()
    const columns = useReviewsColumns(t)
    const [pagination, setPagination] = useState<DataTablePaginationState>({
        pageSize: limit,
        pageIndex: 0,
    })
    const [rowSelection, setRowSelection] = useState<DataTableRowSelectionState>({})

    const offset = useMemo(() => {
        return pagination.pageIndex * limit
    }, [pagination])

    const { data, isLoading, refetch } = useQuery<{
        reviews: Review[]
        count: number
        limit: number
        offset: number
    }>({
        queryKey: ["reviews", offset, limit],
        queryFn: () => sdk.client.fetch("/admin/reviews", {
            query: {
                offset: pagination.pageIndex * pagination.pageSize,
                limit: pagination.pageSize,
                order: "-created_at",
            },
        }),
    })

    const commands = useCommands(t, refetch, () => setRowSelection({}))

    const table = useDataTable({
        columns,
        data: data?.reviews || [],
        rowCount: data?.count || 0,
        isLoading,
        pagination: {
            state: pagination,
            onPaginationChange: setPagination,
        },
        commands,
        rowSelection: {
            state: rowSelection,
            onRowSelectionChange: setRowSelection,
        },
        getRowId: (row) => row.id,
    })

    return (
        <Container>
            <DataTable instance={table}>
                <DataTable.Toolbar className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
                    <Heading>
                        {t("reviews.title", "Reviews")}
                    </Heading>
                </DataTable.Toolbar>
                <DataTable.Table />
                <DataTable.Pagination />
                <DataTable.CommandBar selectedLabel={(count) => t("common.selected", "{{count}} selected", { count })} />
            </DataTable>
            <Toaster />
        </Container>
    )
}

export const config = defineRouteConfig({
    translationNs: "translation",
    label: "customRoutes.reviews",
    icon: ChatBubbleLeftRight,
})

export default ReviewsPage
