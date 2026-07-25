import { Icon as IconifyIcon } from '@iconify/react'
const Icon = ({ icon, ...props }) => {
  return <IconifyIcon icon={`lucide:${icon}`} {...props} />
}
export default Icon
