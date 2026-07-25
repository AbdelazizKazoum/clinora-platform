import { Icon as IconifyIcon } from '@iconify/react'
import clsx from 'clsx'
const Rating = ({ rating, className }) => {
  const fullStars = Math.floor(rating)
  const halfStar = rating % 1 !== 0
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0)
  return (
    <span className={clsx('text-warning', className)}>
      {[...Array(fullStars)].map((_, i) => (
        <IconifyIcon icon="tabler:star-filled" key={`full-${i}`} />
      ))}
      {halfStar && <IconifyIcon icon="tabler:star-half-filled" />}
      {[...Array(emptyStars)].map((_, i) => (
        <IconifyIcon icon="tabler:star" key={`empty-${i}`} />
      ))}
    </span>
  )
}
export default Rating
