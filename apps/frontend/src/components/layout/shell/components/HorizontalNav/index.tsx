import type { MenuItemType } from '@/types'
import AppMenu from './components/AppMenu'

const HorizontalNav = ({ menuItems }: { menuItems: MenuItemType[] }) => {
  return (
    <header className="topnav">
      <nav className="navbar navbar-expand-lg">
        <nav className="container-fluid">
          <div className="collapse navbar-collapse" id="topnav-menu">
            <AppMenu menuItems={menuItems} />
          </div>
        </nav>
      </nav>
    </header>
  )
}

export default HorizontalNav
