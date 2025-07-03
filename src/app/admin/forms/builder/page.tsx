'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function FormBuilderRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/admin/forms/builder/new')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>
  )
} 