import logoBlack from '@/assets/images/logo-black.png'
import logoSm from '@/assets/images/logo-sm.png'
import logo from '@/assets/images/logo.png'
import useScrollEvent from '@/hooks/useScrollEvent'
import clsx from 'clsx'
import Link from 'next/link'
import { Container } from 'react-bootstrap'
import AppsDropdownGrid from './components/AppsDropdownGrid'
import CustomizerToggler from './components/CustomizerToggler'
import FullscreenToggler from './components/FullscreenToggler'
import LanguageSelectorRounded from './components/LanguageSelectorRounded'
import LootBox from './components/LootBox'
import MegamenuPages from './components/MegamenuPages'
import MenuToggler from './components/MenuToggler'
import MonochromeToggler from './components/MonochromeToggler'
import NotificationDropdownPeople from './components/NotificationDropdownPeople'
import SearchBoxRoundedRight from './components/SearchBoxRoundedRight'
import SimpleUserDropdown from './components/SimpleUserDropdown'
import ThemeDropdown from './components/ThemeDropdown'
const TopBar = () => {
  const { scrollY } = useScrollEvent()
  return (
    <header
      className={clsx('app-topbar', {
        'topbar-active': scrollY > 50,
      })}
    >
      <Container fluid className="topbar-menu">
        <div className="d-flex align-items-center gap-2">
          <div className="logo-topbar">
            <Link href="/" className="logo-light">
              <span className="logo-lg">
                <img src={logo.src} alt="logo" />
              </span>
              <span className="logo-sm">
                <img src={logoSm.src} alt="small logo" />
              </span>
            </Link>
            <Link href="/" className="logo-dark">
              <span className="logo-lg">
                <img src={logoBlack.src} alt="dark logo" />
              </span>
              <span className="logo-sm">
                <img src={logoSm.src} alt="small logo" />
              </span>
            </Link>
          </div>

          <MenuToggler />

          <LootBox />

          <MegamenuPages />
        </div>
        <div className="d-flex align-items-center gap-2">
          <SearchBoxRoundedRight />

          <ThemeDropdown />

          <AppsDropdownGrid />

          <NotificationDropdownPeople />

          <FullscreenToggler />

          <MonochromeToggler />

          <CustomizerToggler />

          <LanguageSelectorRounded />

          <SimpleUserDropdown />
        </div>
      </Container>
    </header>
  )
}
export default TopBar
