import { STYLES } from "./registry"

export default async function ProductShowcase(props: ProductShowcaseProps) {
  const { style = "style-1" } = props
  const formattedStyle = style
    ? style
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "")
    : "style-1"

  const DynamicComponent = STYLES[formattedStyle] || STYLES["style-1"]

  if (!DynamicComponent) return null

  return <DynamicComponent {...props} />
}
