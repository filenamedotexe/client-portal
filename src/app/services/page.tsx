'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Briefcase, MessageSquare, CheckCircle, Circle, Clock, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface Service {
  id: string
  name: string
  description: string
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'
  progress: number
  tasksCompleted: number
  totalTasks: number
  upcomingMilestone: string | null
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Fetch services from API
    // For now, using mock data
    setServices([
      {
        id: '1',
        name: 'Website Development',
        description: 'Full website redesign and development project',
        status: 'ACTIVE',
        progress: 65,
        tasksCompleted: 8,
        totalTasks: 12,
        upcomingMilestone: 'Beta Launch'
      },
      {
        id: '2',
        name: 'Marketing Campaign',
        description: 'Q4 marketing campaign planning and execution',
        status: 'ACTIVE',
        progress: 30,
        tasksCompleted: 3,
        totalTasks: 10,
        upcomingMilestone: 'Campaign Strategy Review'
      },
      {
        id: '3',
        name: 'Annual Report',
        description: 'Annual financial report preparation',
        status: 'COMPLETED',
        progress: 100,
        tasksCompleted: 15,
        totalTasks: 15,
        upcomingMilestone: null
      }
    ])
    setLoading(false)
  }, [])

  const getStatusColor = (status: Service['status']) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500'
      case 'PAUSED': return 'bg-yellow-500'
      case 'COMPLETED': return 'bg-blue-500'
      case 'CANCELLED': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: Service['status']) => {
    switch (status) {
      case 'ACTIVE': return <Circle className="h-4 w-4" />
      case 'PAUSED': return <Clock className="h-4 w-4" />
      case 'COMPLETED': return <CheckCircle className="h-4 w-4" />
      case 'CANCELLED': return <X className="h-4 w-4" />
      default: return <Circle className="h-4 w-4" />
    }
  }

  if (loading) {
    return <div>Loading services...</div>
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Services</h1>
          <p className="text-gray-600 mt-2">View and manage your active services</p>
        </div>
        <Button asChild>
          <Link href="/services/requests/new">
            <MessageSquare className="mr-2 h-4 w-4" />
            Submit Request
          </Link>
        </Button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <Card key={service.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between">
                <Briefcase className="h-5 w-5 text-blue-600" />
                <Badge 
                  variant="outline" 
                  className={`${getStatusColor(service.status)} text-white border-0`}
                >
                  <span className="flex items-center gap-1">
                    {getStatusIcon(service.status)}
                    {service.status}
                  </span>
                </Badge>
              </div>
              <CardTitle className="mt-4">{service.name}</CardTitle>
              <CardDescription>{service.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium">{service.progress}%</span>
                </div>
                <Progress value={service.progress} className="h-2" />
              </div>

              {/* Tasks */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tasks</span>
                <span className="font-medium">
                  {service.tasksCompleted} / {service.totalTasks}
                </span>
              </div>

              {/* Upcoming Milestone */}
              {service.upcomingMilestone && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-600">Next Milestone</p>
                  <p className="text-sm font-medium">{service.upcomingMilestone}</p>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 space-y-2">
                <Button asChild className="w-full" variant="outline">
                  <Link href={`/services/${service.id}`}>View Details</Link>
                </Button>
                {service.status === 'ACTIVE' && (
                  <Button asChild className="w-full" variant="secondary" size="sm">
                    <Link href={`/services/${service.id}/forms`}>View Forms</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {services.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No services yet</h3>
            <p className="text-gray-600 mb-4">You don&apos;t have any active services at the moment.</p>
            <Button asChild>
              <Link href="/services/requests/new">
                <MessageSquare className="mr-2 h-4 w-4" />
                Submit a Request
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}