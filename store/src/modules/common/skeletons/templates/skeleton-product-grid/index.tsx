import repeat from "@lib/util/repeat"
import SkeletonProductPreview from "@/modules/common/skeletons/components/skeleton-product-preview"

const SkeletonProductGrid = ({
  numberOfProducts = 12,
}: {
  numberOfProducts?: number
}) => {
  return (
    <ul
      className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6"
      data-testid="products-list-loader"
    >
      {repeat(numberOfProducts).map((index) => (
        <li key={index}>
          <SkeletonProductPreview />
        </li>
      ))}
    </ul>
  )
}

export default SkeletonProductGrid
