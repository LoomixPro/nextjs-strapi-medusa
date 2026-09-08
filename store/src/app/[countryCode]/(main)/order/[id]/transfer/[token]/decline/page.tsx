import { declineTransferRequest } from "@lib/data/orders"
import { Heading, Text } from "@medusajs/ui"
import TransferImage from "@modules/order/components/transfer-image"
import InstantPageBoundary from "@modules/common/components/instant-page-boundary"
import SkeletonTransferPage from "@/modules/common/skeletons/templates/skeleton-transfer-page"

export default function TransferDeclinePage(props: {
  params: Promise<{ id: string; token: string }>
}) {
  return (
    <InstantPageBoundary fallback={<SkeletonTransferPage />}>
      <TransferDeclineContent params={props.params} />
    </InstantPageBoundary>
  )
}

async function TransferDeclineContent(props: {
  params: Promise<{ id: string; token: string }>
}) {
  const params = await props.params
  const { id, token } = params

  const { success, error } = await declineTransferRequest(id, token)

  return (
    <div className="flex flex-col gap-y-4 items-start w-2/5 mx-auto mt-10 mb-20">
      <TransferImage />
      <div className="flex flex-col gap-y-6">
        {success && (
          <>
            <Heading level="h1" className="text-xl text-zinc-900">
              Order transfer declined!
            </Heading>
            <Text className="text-zinc-600">
              Transfer of order {id} has been successfully declined.
            </Text>
          </>
        )}
        {!success && (
          <>
            <Text className="text-zinc-600">
              There was an error declining the transfer. Please try again.
            </Text>
            {error && (
              <Text className="text-red-500">Error message: {error}</Text>
            )}
          </>
        )}
      </div>
    </div>
  )
}
