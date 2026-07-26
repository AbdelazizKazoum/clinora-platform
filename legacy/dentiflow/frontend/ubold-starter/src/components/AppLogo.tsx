import Link from 'next/link'

import logoBlack from '@/assets/images/logo-black.png'
import logoSm from '@/assets/images/logo-sm.png'
import logo from '@/assets/images/logo.png'

const AppLogo = () => {
  return (
    <Link href="/" className="logo">
      <span className="logo logo-light">
        <span className="logo-lg">
          <img src={logo.src} alt="logo" />
        </span>
        <span className="logo-sm">
          <img src={logoSm.src} alt="small logo" />
        </span>
      </span>
      <span className="logo logo-dark">
        <span className="logo-lg">
          <img src={logoBlack.src} alt="dark logo" />
        </span>
        <span className="logo-sm">
          <img src={logoSm.src} alt="small logo" />
        </span>
      </span>
    </Link>
  )
}

export default AppLogo
