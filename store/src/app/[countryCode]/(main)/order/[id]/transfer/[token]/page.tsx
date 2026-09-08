import { Heading, Text } from "@medusajs/ui"
import TransferActions from "@modules/order/components/transfer-actions"
import TransferImage from "@modules/order/components/transfer-image"
import InstantPageBoundary from "@modules/common/components/instant-page-boundary"
import SkeletonTransferPage from "@/modules/common/skeletons/templates/skeleton-transfer-page"

export default function TransferPage(props: {
  params: Promise<{ id: string; token: string }>
}) {
  return (
    <InstantPageBoundary fallback={<SkeletonTransferPage />}>
      <TransferContent params={props.params} />
    </InstantPageBoundary>
  )
}

async function TransferContent(props: {
  params: Promise<{ id: string; token: string }>
}) {
  const params = await props.params
  const { id, token } = params

  return (
    <div className="flex flex-col gap-y-4 items-start w-2/5 mx-auto mt-10 mb-20">
      <TransferImage />
      <div className="flex flex-col gap-y-6">
        <Heading level="h1" className="text-xl text-zinc-900">
          Transfer request for order {id}
        </Heading>
        <Text className="text-zinc-600">
          You&#39;ve received a request to transfer ownership of your order (
          {id}). If you agree to this request, you can approve the transfer by
          clicking the button below.
        </Text>
        <div className="w-full h-px bg-zinc-200" />
        <Text className="text-zinc-600">
          If you accept, the new owner will take over all responsibilities and
          permissions associated with this order.
        </Text>
        <Text className="text-zinc-600">
          If you do not recognize this request or wish to retain ownership, no
          further action is required.
        </Text>
        <div className="w-full h-px bg-zinc-200" />
        <TransferActions id={id} token={token} />
      </div>
    </div>
  )
}
