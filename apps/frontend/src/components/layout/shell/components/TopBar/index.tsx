import useScrollEvent from '@/hooks/useScrollEvent'
import clsx from 'clsx'
import Link from 'next/link'
import { Container } from 'react-bootstrap'

import CustomizerToggler from './components/CustomizerToggler'
import FullscreenToggler from './components/FullscreenToggler'

import LanguageSelectorRounded from './components/LanguageSelectorRounded'

import MenuToggler from './components/MenuToggler'

import NotificationDropdownPeople from './components/NotificationDropdownPeople'

import SearchBoxRoundedRight from './components/SearchBoxRoundedRight'

import SimpleUserDropdown from './components/SimpleUserDropdown'
import ThemeDropdown from './components/ThemeDropdown'

const ClinoraLogo = () => (
  <svg
    width="150"
    height="36"
    viewBox="0 0 150 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'inline-block', verticalAlign: 'middle' }}
  >
    {/* Tooth Icon */}
    <path
      d="M12 8C12 6.34315 13.3431 5 15 5H17C18.6569 5 20 6.34315 20 8V10C20 10 18 12 18 16C18 20 20 22 20 22V30C20 31.1046 19.1046 32 18 32H15C13.8954 32 13 31.1046 13 30V22C13 22 11 20 11 16C11 12 13 10 13 10V8C13 6.34315 14.3431 5 16 5H18"
      fill="#4a81d4"
      stroke="#4a81d4"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Text */}
    <text
      x="28"
      y="25"
      fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
      fontSize="23"
      fontWeight="600"
      letterSpacing="0.3"
      fill="currentColor"
      style={{ fill: 'currentColor' }}
    >
      Clinora
    </text>
  </svg>
)

interface TopBarProps {
  isLoggingOut: boolean
  onLogout: () => Promise<void>
}

const TopBar = ({ isLoggingOut, onLogout }: TopBarProps) => {
  const { scrollY } = useScrollEvent()
  return (
    <header className={clsx('app-topbar', { 'topbar-active': scrollY > 50 })}>
      <Container fluid className="topbar-menu">
        <div className="d-flex align-items-center gap-2">
          <div className="logo-topbar">
            <Link href="/" className="logo-light">
              <span className="logo-lg">
                <ClinoraLogo />
              </span>
            </Link>
            <Link href="/" className="logo-dark">
              <span className="logo-lg">
                <ClinoraLogo />
              </span>
            </Link>
          </div>

          <MenuToggler />
        </div>
        <div className="d-flex align-items-center gap-2">
          <SearchBoxRoundedRight />

          <ThemeDropdown />

          <NotificationDropdownPeople />

          <FullscreenToggler />

          <CustomizerToggler />

          <LanguageSelectorRounded />

          <SimpleUserDropdown
            isLoggingOut={isLoggingOut}
            onLogout={onLogout}
          />
        </div>
      </Container>
    </header>
  )
}

export default TopBar
