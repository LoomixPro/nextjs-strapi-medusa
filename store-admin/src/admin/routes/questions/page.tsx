import { defineRouteConfig } from "@medusajs/admin-sdk"
import { QuestionMark } from "@medusajs/icons"
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

type Question = {
    id: string
    name: string
    email: string
    question_text: string
    answer_text?: string | null
    product_id: string
    status: "pending" | "approved" | "rejected"
    created_at: Date
    updated_at: Date
    product?: HttpTypes.AdminProduct
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


const columnHelper = createDataTableColumnHelper<Question>()

const useQuestionsColumns = (t: any) => useMemo(() => [
    columnHelper.select(),
    columnHelper.accessor("id", {
        header: t("questions.columns.id", "ID"),
        cell: ({ row }) => {
            return (
                <Link
                    to={`/questions/${row.original.id}`}
                    className="text-blue-600 hover:text-blue-800 underline"
                >
                    {row.original.id.slice(0, 12)}...
                </Link>
            )
        },
    }),
    columnHelper.accessor("name", {
        header: t("questions.columns.name", "Name"),
    }),
    columnHelper.accessor("email", {
        header: t("questions.columns.email", "Email"),
    }),
    columnHelper.accessor("question_text", {
        header: t("questions.columns.question", "Question"),
        cell: ({ row }) => {
            return <TextModal text={row.original.question_text} title={t("questions.questionText", "Question Text")} closeText={t("common.close", "Close")} />
        },
    }),
    columnHelper.accessor("answer_text", {
        header: t("questions.columns.answer", "Answer"),
        cell: ({ row }) => {
            return <TextModal text={row.original.answer_text || ""} title={t("questions.answerText", "Answer Text")} closeText={t("common.close", "Close")} />
        },
    }),
    columnHelper.accessor("status", {
        header: t("questions.columns.status", "Status"),
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
        header: t("questions.columns.product", "Product"),
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
            label: t("questions.commands.approve", "Approve"),
            shortcut: "A",
            action: async (selection) => {
                const ids = Object.keys(selection)

                sdk.client.fetch("/admin/questions/status", {
                    method: "POST",
                    body: {
                        ids,
                        status: "approved",
                    },
                }).then(() => {
                    toast.success(t("questions.toast.approveSuccess", "Questions approved"))
                    clearSelection()
                    refetch()
                }).catch(() => {
                    toast.error(t("questions.toast.approveError", "Failed to approve questions"))
                })
            },
        }),
        commandHelper.command({
            label: t("questions.commands.reject", "Reject"),
            shortcut: "R",
            action: async (selection) => {
                const ids = Object.keys(selection)

                sdk.client.fetch("/admin/questions/status", {
                    method: "POST",
                    body: {
                        ids,
                        status: "rejected",
                    },
                }).then(() => {
                    toast.success(t("questions.toast.rejectSuccess", "Questions rejected"))
                    clearSelection()
                    refetch()
                }).catch(() => {
                    toast.error(t("questions.toast.rejectError", "Failed to reject questions"))
                })
            },
        }),
        commandHelper.command({
            label: t("questions.commands.delete", "Delete"),
            shortcut: "D",
            action: async (selection) => {
                const ids = Object.keys(selection)

                if (!window.confirm(t("questions.commands.deleteConfirm", "Are you sure you want to delete {{count}} question(s)? This cannot be undone.", { count: ids.length }))) {
                    return
                }

                sdk.client.fetch("/admin/questions/delete", {
                    method: "POST",
                    body: { ids },
                }).then(() => {
                    toast.success(t("questions.toast.deleteSuccess", "Questions deleted"))
                    clearSelection()
                    refetch()
                }).catch(() => {
                    toast.error(t("questions.toast.deleteError", "Failed to delete questions"))
                })
            },
        }),
    ], [t, refetch, clearSelection])
}

const limit = 15

const QuestionsPage = () => {
    const { t } = useTranslation()
    const columns = useQuestionsColumns(t)
    const [pagination, setPagination] = useState<DataTablePaginationState>({
        pageSize: limit,
        pageIndex: 0,
    })
    const [rowSelection, setRowSelection] = useState<DataTableRowSelectionState>({})

    const offset = useMemo(() => {
        return pagination.pageIndex * limit
    }, [pagination])

    const { data, isLoading, refetch } = useQuery<{
        questions: Question[]
        count: number
        limit: number
        offset: number
    }>({
        queryKey: ["questions", offset, limit],
        queryFn: () => sdk.client.fetch("/admin/questions", {
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
        data: data?.questions || [],
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
                        {t("questions.title", "Questions")}
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
    label: "customRoutes.questions",
    icon: QuestionMark,
})

export default QuestionsPage
