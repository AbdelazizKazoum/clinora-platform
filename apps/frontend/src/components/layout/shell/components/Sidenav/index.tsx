import AppLogo from '@/components/AppLogo'
import { SimpleBar } from '@/components/wrappers/SimpleBar'
import type { MenuItemType } from '@/types'
import AppMenu from './components/AppMenu'
import OffcanvasToggle from './components/OffcanvasToggle'
import OnHoverToggle from './components/OnHoverToggle'

import UserProfileSettings from './components/UserProfileSettings'

const Sidenav = ({ menuItems }: { menuItems: MenuItemType[] }) => {
  return (
    <div className="sidenav-menu" id="sidenav">
      <AppLogo />

      <OnHoverToggle />

      <OffcanvasToggle />

      <SimpleBar className="scrollbar">
        <UserProfileSettings />

        <div id="sidenav-menu">
          <AppMenu menuItems={menuItems} />
        </div>
      </SimpleBar>
    </div>
  )
}

export default Sidenav
