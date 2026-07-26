import Link from 'next/link'

import logoBlack from '@/assets/images/logo-black.png'
import logo from '@/assets/images/logo.png'

const AuthLogo = () => {
  return (
    <>
      <Link href="/" className="logo-dark">
        <img src={logoBlack.src} alt="dark logo" />
      </Link>
      <Link href="/" className="logo-light">
        <img src={logo.src} alt="logo" />
      </Link>
    </>
  )
}

export default AuthLogo
