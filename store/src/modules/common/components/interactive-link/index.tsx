import { ArrowUpRightMini } from "@medusajs/icons"
import LocalizedClientLink from "../localized-client-link"

type InteractiveLinkProps = {
  href: string
  children?: React.ReactNode
  onClick?: () => void
}

const InteractiveLink = ({
  href,
  children,
  onClick,
  ...props
}: InteractiveLinkProps) => {
  return (
    <LocalizedClientLink
      className="flex gap-x-1 items-center group text-primary hover:text-primary/90 transition-colors duration-200"
      href={href}
      onClick={onClick}
      {...props}
    >
      <span className="text-sm font-semibold">{children}</span>
      <ArrowUpRightMini className="group-hover:rotate-45 ease-in-out duration-150 w-4 h-4" />
    </LocalizedClientLink>
  )
}

export default InteractiveLink
