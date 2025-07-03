'use client'

import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useUserRole, getUserDisplayName, usePermissions } from '@/lib/roles'
import { Users, FileText, Shield, Briefcase, MessageSquare, ClipboardList } from 'lucide-react'
import Link from 'next/link'

export default function Dashboard() {
  const { user } = useUser()
  const userRole = useUserRole()
  const permissions = usePermissions()

  const adminCards = [
    {
      title: 'User Management',
      description: 'Manage users and their roles',
      icon: Users,
      href: '/admin/users',
      show: permissions.canManageUsers,
    },
    {
      title: 'Service Templates',
      description: 'Create and manage service templates',
      icon: ClipboardList,
      href: '/admin/service-templates',
      show: permissions.canViewAdminPanel,
    },
    {
      title: 'Form Builder',
      description: 'Create custom forms and templates',
      icon: FileText,
      href: '/admin/forms',
      show: permissions.canViewAdminPanel,
    },
  ]

  const clientCards = [
    {
      title: 'My Services',
      description: 'View your active services',
      icon: Briefcase,
      href: '/services',
      show: permissions.canViewOwnData,
    },
    {
      title: 'Submit Request',
      description: 'Submit a new service request',
      icon: MessageSquare,
      href: '/services/requests/new',
      show: permissions.canViewOwnData,
    },
  ]

  const getQuickActions = () => {
    if (userRole === 'admin') return adminCards
    if (userRole === 'manager') return clientCards
    return clientCards
  }

  const quickActions = getQuickActions().filter(card => card.show)

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here&apos;s what&apos;s happening with your account
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Shield className="h-3 w-3" />
            <span>{userRole ? getUserDisplayName(userRole) : 'User'}</span>
          </Badge>
          {userRole !== 'admin' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={async () => {
                try {
                  const response = await fetch('/api/set-admin', { method: 'POST' })
                  if (response.ok) {
                    window.location.reload()
                  } else {
                    alert('Failed to set admin role')
                  }
                } catch (error) {
                  console.error('Error setting admin role:', error)
                  alert('Error setting admin role')
                }
              }}
            >
              Make Admin
            </Button>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Services</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userRole === 'admin' ? '24' : userRole === 'manager' ? '8' : '3'}
            </div>
            <p className="text-xs text-muted-foreground">
              {userRole === 'client' ? 'Your services' : 'Total services'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Requests</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userRole === 'admin' ? '15' : userRole === 'manager' ? '8' : '2'}
            </div>
            <p className="text-xs text-muted-foreground">
              {userRole === 'client' ? 'Your open requests' : 'Open requests'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Forms</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userRole === 'admin' ? '18' : userRole === 'manager' ? '6' : '4'}
            </div>
            <p className="text-xs text-muted-foreground">
              {userRole === 'client' ? 'Pending forms' : 'Active forms'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Milestones</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userRole === 'admin' ? '42' : userRole === 'manager' ? '12' : '5'}
            </div>
            <p className="text-xs text-muted-foreground">
              {userRole === 'client' ? 'Upcoming milestones' : 'Active milestones'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Card key={action.href} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Icon className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                  </div>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href={action.href}>
                      Go to {action.title}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest actions and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Service request resolved</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">New form submitted</p>
                <p className="text-xs text-gray-500">5 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Service milestone achieved</p>
                <p className="text-xs text-gray-500">1 day ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 