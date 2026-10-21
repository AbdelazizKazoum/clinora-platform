import Link from 'next/link'

const AppLogo = () => {
  return (
    <Link href="/" className="logo">
      <span className="logo logo-light">
        <span className="logo-lg">
          <ClinoraLogo />
        </span>
      </span>
      <span className="logo logo-dark">
        <span className="logo-lg">
          <ClinoraLogo />
        </span>
      </span>
    </Link>
  )
}

const ClinoraLogo = () => (
  <svg
    width="150"
    height="36"
    viewBox="0 0 150 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'inline-block' }}
  >
    <path
      d="M12 8C12 6.34315 13.3431 5 15 5H17C18.6569 5 20 6.34315 20 8V10C20 10 18 12 18 16C18 20 20 22 20 22V30C20 31.1046 19.1046 32 18 32H15C13.8954 32 13 31.1046 13 30V22C13 22 11 20 11 16C11 12 13 10 13 10V8C13 6.34315 14.3431 5 16 5H18"
      fill="#4a81d4"
      stroke="#4a81d4"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <text
      x="28"
      y="25"
      fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
      fontSize="23"
      fontWeight="600"
      letterSpacing="0.3"
      fill="currentColor"
    >
      Clinora
    </text>
  </svg>
)

export default AppLogo
