import { useAuth } from '../src/hooks/useAuth'
import { act } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'

const replace = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}))

const AuthState = () => {
  const { isAuthenticated, isAuthReady } = useAuth()

  if (!isAuthReady) return <span>pending</span>

  return <span>{isAuthenticated ? 'authenticated' : 'anonymous'}</span>
}

describe('authentication hydration', () => {
  it('uses the same initial state on the server and client', async () => {
    window.sessionStorage.setItem('token', JSON.stringify('auth-token'))

    const container = document.createElement('div')
    container.innerHTML = renderToString(<AuthState />)
    const recoverableErrors = []

    let root
    await act(async () => {
      root = hydrateRoot(container, <AuthState />, {
        onRecoverableError: (error) => recoverableErrors.push(error),
      })
    })

    expect(recoverableErrors).toEqual([])
    expect(container.textContent).toBe('authenticated')

    await act(async () => root.unmount())
    window.sessionStorage.clear()
  })
})
