import {
    Container,
    Heading,
    Text,
    Label,
    Textarea,
    Button,
    StatusBadge,
    Toaster,
    toast,
} from "@medusajs/ui"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { sdk } from "../../../lib/sdk"
import { ArrowLeftMini } from "@medusajs/icons"

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
}

const QuestionDetailPage = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [answerText, setAnswerText] = useState("")

    const { data, isLoading } = useQuery<{ question: Question }>({
        queryKey: ["question", id],
        queryFn: () => sdk.client.fetch(`/admin/questions/${id}`),
    })

    useEffect(() => {
        if (data?.question?.answer_text) {
            setAnswerText(data.question.answer_text)
        }
    }, [data])

    const answerMutation = useMutation({
        mutationFn: () =>
            sdk.client.fetch(`/admin/questions/${id}`, {
                method: "POST",
                body: {
                    answer_text: answerText,
                },
            }),
        onSuccess: () => {
            toast.success("Answer submitted successfully")
            queryClient.invalidateQueries({ queryKey: ["question", id] })
            queryClient.invalidateQueries({ queryKey: ["questions"] })
        },
        onError: () => {
            toast.error("Failed to submit answer")
        },
    })

    if (isLoading) {
        return (
            <Container>
                <Text>Loading...</Text>
            </Container>
        )
    }

    const question = data?.question

    if (!question) {
        return (
            <Container>
                <Text>Question not found</Text>
            </Container>
        )
    }

    const statusColor = question.status === "approved" ? "green" : question.status === "rejected" ? "red" : "grey"

    return (
        <div className="flex flex-col gap-4">
            <Container>
                <div className="flex flex-col gap-4">
                    <button
                        onClick={() => navigate("/questions")}
                        className="flex items-center gap-1 text-sm text-ui-fg-muted hover:text-ui-fg-base w-fit"
                    >
                        <ArrowLeftMini />
                        Back to Questions
                    </button>

                    <div className="flex items-center justify-between">
                        <Heading>Question Detail</Heading>
                        <StatusBadge color={statusColor}>
                            {question.status.charAt(0).toUpperCase() + question.status.slice(1)}
                        </StatusBadge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 p-4 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
                        <div>
                            <Label className="text-xs text-ui-fg-muted">Name</Label>
                            <Text className="font-medium text-ui-fg-base">{question.name}</Text>
                        </div>
                        <div>
                            <Label className="text-xs text-ui-fg-muted">Email</Label>
                            <Text className="font-medium text-ui-fg-base">{question.email}</Text>
                        </div>
                        <div>
                            <Label className="text-xs text-ui-fg-muted">Date</Label>
                            <Text className="font-medium text-ui-fg-base">
                                {new Date(question.created_at).toLocaleDateString()}
                            </Text>
                        </div>
                        <div>
                            <Label className="text-xs text-ui-fg-muted">Product ID</Label>
                            <Text className="font-medium text-ui-fg-base">{question.product_id}</Text>
                        </div>
                    </div>

                    <div className="p-4 border border-ui-border-base rounded-lg">
                        <Label className="text-xs text-ui-fg-muted mb-1">Question</Label>
                        <Text className="text-base text-ui-fg-base">{question.question_text}</Text>
                    </div>
                </div>
            </Container>

            <Container>
                <div className="flex flex-col gap-4">
                    <Heading level="h2">Answer</Heading>

                    <Textarea
                        placeholder="Type your answer here..."
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        className="min-h-[150px]"
                    />

                    <div className="flex justify-end">
                        <Button
                            onClick={() => answerMutation.mutate()}
                            disabled={!answerText.trim() || answerMutation.isPending}
                            isLoading={answerMutation.isPending}
                        >
                            {question.answer_text ? "Update Answer" : "Submit Answer"}
                        </Button>
                    </div>
                </div>
            </Container>
            <Toaster />
        </div>
    )
}

export default QuestionDetailPage
