'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Briefcase, MessageSquare, CheckCircle, Circle, Clock, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePermissions } from '@/lib/roles'

interface Service {
  id: string
  name: string
  description: string
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'
  template?: {
    name: string
    description: string
  }
  tasks?: Array<{
    status: string
    task: {
      title: string
    }
  }>
  milestones?: Array<{
    achieved: boolean
    milestone: {
      title: string
    }
  }>
}

interface ServiceRequest {
  id: string
  title: string
  description: string
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  createdAt: string
  service?: {
    name: string
    template?: {
      name: string
    }
  }
}

export default function ServicesPage() {
  const permissions = usePermissions()
  const [services, setServices] = useState<Service[]>([])
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  useEffect(() => {
    fetchData()
    
    // Check if coming from a successful request submission
    const params = new URLSearchParams(window.location.search)
    if (params.get('request') === 'submitted') {
      setShowSuccessMessage(true)
      setTimeout(() => setShowSuccessMessage(false), 5000)
    }
  }, [])

  const fetchData = async () => {
    try {
      const [servicesRes, requestsRes] = await Promise.all([
        fetch('/api/services'),
        fetch('/api/service-requests')
      ])
      
      if (servicesRes.ok) {
        const servicesData = await servicesRes.json()
        setServices(servicesData)
      }
      
      if (requestsRes.ok) {
        const requestsData = await requestsRes.json()
        setRequests(requestsData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateProgress = (service: Service) => {
    if (!service.tasks || service.tasks.length === 0) return 0
    const completed = service.tasks.filter(t => t.status === 'COMPLETED').length
    return Math.round((completed / service.tasks.length) * 100)
  }

  const getTasksCompleted = (service: Service) => {
    if (!service.tasks) return 0
    return service.tasks.filter(t => t.status === 'COMPLETED').length
  }

  const getUpcomingMilestone = (service: Service) => {
    if (!service.milestones) return null
    const upcoming = service.milestones.find(m => !m.achieved)
    return upcoming?.milestone.title || null
  }

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

  const getRequestStatusColor = (status: ServiceRequest['status']) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-500'
      case 'IN_PROGRESS': return 'bg-yellow-500'
      case 'RESOLVED': return 'bg-green-500'
      case 'CLOSED': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getRequestPriorityColor = (priority: ServiceRequest['priority']) => {
    switch (priority) {
      case 'URGENT': return 'text-red-600 bg-red-50'
      case 'HIGH': return 'text-orange-600 bg-orange-50'
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50'
      case 'LOW': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  if (loading) {
    return <div>Loading services...</div>
  }

  return (
    <div className="space-y-8">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md">
          Service request submitted successfully! We&apos;ll review it and get back to you soon.
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Service Center</h1>
          <p className="text-gray-600 mt-2">Manage your services and requests</p>
        </div>
        {permissions.canSubmitRequests && (
          <Button asChild>
            <Link href="/services/requests/new">
              <MessageSquare className="mr-2 h-4 w-4" />
              Submit Request
            </Link>
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="services" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Active Services ({services.filter(s => s.status === 'ACTIVE').length})
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Service Requests ({requests.filter(r => r.status !== 'CLOSED').length})
          </TabsTrigger>
        </TabsList>

        {/* Services Tab */}
        <TabsContent value="services" className="mt-6">
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
                  <CardTitle className="mt-4">{service.name || service.template?.name || 'Unnamed Service'}</CardTitle>
                  <CardDescription>{service.description || service.template?.description || 'No description'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">{calculateProgress(service)}%</span>
                    </div>
                    <Progress value={calculateProgress(service)} className="h-2" />
                  </div>

                  {/* Tasks */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tasks</span>
                    <span className="font-medium">
                      {getTasksCompleted(service)} / {service.tasks?.length || 0}
                    </span>
                  </div>

                  {/* Upcoming Milestone */}
                  {getUpcomingMilestone(service) && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-gray-600">Next Milestone</p>
                      <p className="text-sm font-medium">{getUpcomingMilestone(service)}</p>
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
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="mt-6">
          <div className="space-y-4">
            {requests.map((request) => (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{request.title}</CardTitle>
                      <CardDescription className="mt-1">{request.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getRequestPriorityColor(request.priority)}>
                        {request.priority}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`${getRequestStatusColor(request.status)} text-white border-0`}
                      >
                        {request.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-gray-500">
                      {request.service && (
                        <span>Related to: {request.service.name || request.service.template?.name || 'Service'}</span>
                      )}
                    </div>
                    <div className="text-gray-500">
                      Submitted {new Date(request.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/services/requests/${request.id}`}>View Details</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {requests.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No service requests</h3>
                <p className="text-gray-600 mb-4">You haven&apos;t submitted any service requests yet.</p>
                {permissions.canSubmitRequests && (
                  <Button asChild>
                    <Link href="/services/requests/new">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Submit a Request
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}