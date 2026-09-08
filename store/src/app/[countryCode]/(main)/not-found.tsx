import NotFoundPage from "@modules/common/components/not-found-page"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "404 - Page Not Found",
  description: "The page you are looking for does not exist.",
}

export default function NotFound() {
  return <NotFoundPage />
}
