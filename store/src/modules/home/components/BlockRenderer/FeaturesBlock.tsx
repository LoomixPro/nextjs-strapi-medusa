import { FeaturesBlock as FeaturesBlockType } from "@lib/data/homepage"
import FeaturesBlockUI from "@modules/home/components/FeaturesBlock"

interface FeaturesBlockProps {
  block: FeaturesBlockType
}

export default function FeaturesBlock({ block }: FeaturesBlockProps) {
  return <FeaturesBlockUI block={block} />
}
