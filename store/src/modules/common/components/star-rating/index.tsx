import { Star, StarHalf } from "lucide-react"

interface StarRatingProps {
  rating: number
  size?: number // used to scale icon if passed directly, or default uses classes
  className?: string // container class
  iconClassName?: string // custom icon classes (e.g. for width/height)
}

export default function StarRating({
  rating,
  size,
  className = "flex gap-1",
  iconClassName = "w-4 h-4",
}: StarRatingProps) {
  return (
    <div className={className} dir="ltr">
      {Array.from({ length: 5 }).map((_, i) => {
        if (rating >= i + 1) {
          return (
            <Star
              key={i}
              size={size}
              className={`${iconClassName} fill-orange-400 text-orange-400`}
            />
          )
        } else if (rating > i) {
          return (
            <StarHalf
              key={i}
              size={size}
              className={`${iconClassName} fill-orange-400 text-orange-400`}
            />
          )
        } else {
          return (
            <Star
              key={i}
              size={size}
              className={`${iconClassName} fill-gray-200 text-gray-200`}
            />
          )
        }
      })}
    </div>
  )
}
