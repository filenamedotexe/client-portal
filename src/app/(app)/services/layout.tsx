'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePermissions } from '@/lib/roles'

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const permissions = usePermissions()
  const router = useRouter()

  useEffect(() => {
    // Redirect admins/managers to admin services page
    if (permissions.canAssignServices && !permissions.canSubmitRequests) {
      router.push('/admin/services')
    }
  }, [permissions, router])

  return <>{children}</>
}