'use client'

import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { LandingPage } from '@/components/landing-page'

export default function Home() {
  const { userId } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (userId) {
      router.replace('/dashboard')
    }
  }, [userId, router])

  if (userId) {
    return null
  }

  return <LandingPage />
}
