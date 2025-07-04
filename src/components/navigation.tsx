'use client'

import { useAuth, UserButton, useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

import { useUserRole, getUserDisplayName, usePermissions } from '@/lib/roles'
import { Menu } from 'lucide-react'

export default function Navigation() {
  const { isSignedIn } = useAuth()
  const { user } = useUser()
  const userRole = useUserRole()
  const permissions = usePermissions()

  if (!isSignedIn) {
    // This part should ideally not be reached if the layout is protected
    return null;
  }

  const navigationItems = [
    { href: '/dashboard', label: 'Dashboard', show: true },
    { href: '/services', label: 'Services', show: userRole === 'client' }, // Only show for clients
    { href: '/settings', label: 'Settings', show: userRole === 'client' }, // Only show for clients
    { href: '/admin/services', label: 'Service Management', show: permissions.canAssignServices }, // Show for admin/manager
    { href: '/admin/clients', label: 'Clients', show: permissions.canViewAdminPanel || permissions.canManageForms },
    { href: '/admin/forms', label: 'Forms', show: permissions.canManageForms },
    { href: '/admin', label: 'Admin Panel', show: permissions.canViewAdminPanel },
  ].filter(item => item.show)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/dashboard" className="flex items-center">
            <span className="text-xl font-bold text-gray-900">Client Portal</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                {userRole ? getUserDisplayName(userRole) : 'User'}
              </Badge>
              <span className="text-sm text-gray-600">
                {user?.firstName} {user?.lastName}
              </span>
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full max-w-xs sm:max-w-sm">
                <div className="flex flex-col h-full">
                  <div className="flex-grow">
                    <div className="px-2 pt-2 pb-3 space-y-1">
                      {navigationItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="text-gray-600 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex items-center space-x-4 px-3">
                      <UserButton afterSignOutUrl="/" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-800">
                          {user?.firstName} {user?.lastName}
                        </span>
                        <Badge variant="secondary" className="mt-1">
                          {userRole ? getUserDisplayName(userRole) : 'User'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
} 