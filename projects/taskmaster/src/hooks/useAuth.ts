import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function useAuth() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('tm_token')
    if (!token) router.push('/login')
  }, [router])

  function logout() {
    localStorage.removeItem('tm_token')
    router.push('/login')
  }

  return { logout }
}
