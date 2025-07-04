'use client'

import { usePermissions } from '@/lib/roles'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Settings, Database, Activity, Briefcase, FileText, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

interface AdminStats {
  totalUsers: number
  newUsersThisMonth: number
  activeSessions: number
  storageUsed: string
  systemHealth: 'healthy' | 'warning' | 'error'
  recentActivity: Array<{
    id: string
    type: 'user' | 'service' | 'form' | 'system'
    title: string
    timestamp: string
  }>
}

export default function AdminPage() {
  const permissions = usePermissions()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!permissions.canViewAdminPanel) {
      router.push('/dashboard')
    } else {
      fetchAdminStats()
    }
  }, [permissions.canViewAdminPanel, router])

  const fetchAdminStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch admin stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!permissions.canViewAdminPanel) {
    return null
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user': return <div className="w-2 h-2 bg-blue-600 rounded-full" />
      case 'service': return <div className="w-2 h-2 bg-green-600 rounded-full" />
      case 'form': return <div className="w-2 h-2 bg-yellow-600 rounded-full" />
      case 'system': return <div className="w-2 h-2 bg-purple-600 rounded-full" />
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-2">Manage users, settings, and system configuration</p>
        </div>
        <Badge variant="default" className="flex items-center space-x-1">
          <span>{permissions.canManageUsers ? 'Administrator' : 'Manager'}</span>
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.newUsersThisMonth || 0} new this month
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.activeSessions || 0}</div>
                <p className="text-xs text-muted-foreground">Currently online</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.storageUsed || '0GB'}</div>
                <p className="text-xs text-muted-foreground">Database storage</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className={`text-2xl font-bold ${
                  stats?.systemHealth === 'healthy' ? 'text-green-600' :
                  stats?.systemHealth === 'warning' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {stats?.systemHealth === 'healthy' ? 'Healthy' :
                   stats?.systemHealth === 'warning' ? 'Warning' : 'Error'}
                </div>
                <p className="text-xs text-muted-foreground">All systems operational</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Service & Form Management</CardTitle>
            <CardDescription>Manage services, templates, and forms</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col justify-end">
            <div className="space-y-4">
              <Button className="w-full justify-start" variant="outline" onClick={() => router.push('/admin/services')}>
                <Briefcase className="mr-2 h-4 w-4" />
                Service Management
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={() => router.push('/admin/forms')}>
                <FileText className="mr-2 h-4 w-4" />
                Form Builder
              </Button>
            </div>
          </CardContent>
        </Card>

        {permissions.canManageUsers && (
          <>
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user accounts and permissions</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-end">
                <div className="space-y-4">
                  <Button className="w-full justify-start" variant="outline">
                    <Users className="mr-2 h-4 w-4" />
                    View All Users
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Users className="mr-2 h-4 w-4" />
                    Add New User
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Shield className="mr-2 h-4 w-4" />
                    Manage Roles
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure system-wide settings</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-end">
                <div className="space-y-4">
                  <Button className="w-full justify-start" variant="outline">
                    <Settings className="mr-2 h-4 w-4" />
                    General Settings
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Shield className="mr-2 h-4 w-4" />
                    Security Settings
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Database className="mr-2 h-4 w-4" />
                    Integration Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Admin Activity</CardTitle>
          <CardDescription>Latest administrative actions and system events</CardDescription>
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
          ) : stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="space-y-4">
              {stats.recentActivity.map((activity) => (
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