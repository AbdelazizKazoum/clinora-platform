'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSessionStorage } from 'usehooks-ts'
export const useAuth = () => {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [token, setToken, removeToken] = useSessionStorage<string | null>('token', null)

  useEffect(() => {
    setIsAuthReady(true)
  }, [])

  const dummyUser = {
    email: 'admin@example.com',
    password: 'password',
    token: 'auth-token',
  }

  const login = (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)

      if (email === dummyUser.email && password === dummyUser.password) {
        setToken(dummyUser.token)
        router.replace('/')
      } else {
        throw new Error('Invalid email or password')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in')
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    removeToken()
    router.replace('/auth/sign-in')
  }

  const isAuthenticated = token

  return {
    login,
    logout,
    isAuthenticated,
    isAuthReady,
    loading,
    error,
  }
}
