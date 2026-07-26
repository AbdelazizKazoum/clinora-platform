import { META_DATA } from '@/config/constants'
import Link from 'next/link'

type PageBreadcrumbProps = {
  title: string
  subtitle?: string
}
const PageBreadcrumb = ({ title, subtitle }: PageBreadcrumbProps) => {
  return (
    <div className="page-title-head d-flex align-items-center">
      <div className="flex-grow-1">
        <h4 className="page-main-title m-0">{title}</h4>
      </div>
      <div className="text-end">
        <ol className="breadcrumb m-0 py-0">
          <li className="breadcrumb-item">
            <Link href="">{META_DATA.name}</Link>
          </li>
          {subtitle && (
            <li className="breadcrumb-item">
              <Link href="">{subtitle}</Link>
            </li>
          )}
          <li className="breadcrumb-item active">{title}</li>
        </ol>
      </div>
    </div>
  )
}

export default PageBreadcrumb
