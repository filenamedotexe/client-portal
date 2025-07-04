'use client'

import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useUserRole, getUserDisplayName, usePermissions } from '@/lib/roles'
import { Users, FileText, Shield, Briefcase, MessageSquare, ClipboardList } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

interface DashboardData {
  services: {
    total: number
    active: number
  }
  requests: {
    total: number
    open: number
    urgent: number
  }
  forms: {
    total: number
    pending: number
  }
  milestones: {
    total: number
    upcoming: number
    achieved: number
  }
  recentActivity: Array<{
    id: string
    type: 'service' | 'request' | 'form' | 'milestone'
    title: string
    timestamp: string
  }>
}

export default function Dashboard() {
  const { user } = useUser()
  const userRole = useUserRole()
  const permissions = usePermissions()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard')
      if (response.ok) {
        const data = await response.json()
        setDashboardData(data)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const adminCards = [
    {
      title: 'Service Management',
      description: 'Manage services, templates & requests',
      icon: Briefcase,
      href: '/admin/services',
      show: permissions.canViewAdminPanel,
    },
    {
      title: 'Client Management',
      description: 'View and manage all clients',
      icon: Users,
      href: '/admin/clients',
      show: permissions.canViewAdminPanel,
    },
    {
      title: 'Form Builder',
      description: 'Create custom forms and templates',
      icon: FileText,
      href: '/admin/forms',
      show: permissions.canManageForms,
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
      show: permissions.canSubmitRequests,
    },
  ]

  let quickActions = [];
  if (userRole === 'admin') {
    quickActions = adminCards;
  } else if (userRole === 'manager') {
    quickActions = [...adminCards, ...clientCards].filter((card, index, self) =>
      index === self.findIndex((c) => c.href === card.href)
    );
  } else {
    quickActions = clientCards;
  }
  quickActions = quickActions.filter(card => card.show);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'service': return <div className="w-2 h-2 bg-blue-600 rounded-full" />
      case 'request': return <div className="w-2 h-2 bg-yellow-600 rounded-full" />
      case 'form': return <div className="w-2 h-2 bg-green-600 rounded-full" />
      case 'milestone': return <div className="w-2 h-2 bg-purple-600 rounded-full" />
      default: return <div className="w-2 h-2 bg-gray-600 rounded-full" />
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      return `${diffInMinutes} minutes ago`
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
    }
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Services</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {dashboardData?.services.active || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData?.services.total || 0} total services
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Requests</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {dashboardData?.requests.open || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData?.requests.urgent ? (
                    <span className="text-red-600">{dashboardData.requests.urgent} urgent</span>
                  ) : (
                    'No urgent requests'
                  )}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Forms</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {dashboardData?.forms.pending || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Pending forms
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Milestones</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {dashboardData?.milestones.upcoming || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData?.milestones.achieved || 0} achieved
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Card key={action.href} className="hover:shadow-md transition-shadow">
                <Link href={action.href} className="block h-full">
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <Icon className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-lg">{action.title}</CardTitle>
                    </div>
                    <CardDescription>{action.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full" variant="outline">
                      <span className="w-full text-center">Go to {action.title}</span>
                    </Button>
                  </CardContent>
                </Link>
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
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-48 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4">
                  {getActivityIcon(activity.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-gray-500">{formatTimestamp(activity.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}