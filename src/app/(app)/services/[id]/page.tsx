'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { usePermissions } from '@/lib/roles'
import { cn } from '@/lib/utils'
import { 
  ArrowLeft, 
  Briefcase, 
  CheckCircle, 
  Circle, 
  Clock, 
  FileText,
  MessageSquare,
  Target,
  Calendar,
  Settings
} from 'lucide-react'

interface ServiceDetail {
  id: string
  name: string
  description: string
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'
  startDate: string
  endDate?: string
  client: {
    name: string
    email: string
  }
  template?: {
    name: string
    description: string
  }
  tasks?: Array<{
    id: string
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
    task: {
      title: string
      description: string
      order: number
    }
  }>
  milestones?: Array<{
    id: string
    achieved: boolean
    achievedAt?: string
    milestone: {
      title: string
      description: string
      targetDate?: string
    }
  }>
  forms?: Array<{
    id: string
    form: {
      id: string
      name: string
      description: string
      submissions?: Array<{
        id: string
        submittedAt: string
      }>
    }
    required: boolean
    dueDate?: string
  }>
  requests?: Array<{
    id: string
    title: string
    status: string
    priority: string
    createdAt: string
  }>
}

export default function ServiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const permissions = usePermissions()
  const [service, setService] = useState<ServiceDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchServiceDetail = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/services/${id}`)
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/services')
          return
        }
        throw new Error('Failed to fetch service')
      }
      const data = await response.json()
      setService(data)
    } catch (error) {
      console.error('Error fetching service:', error)
      router.push('/services')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    if (params.id) {
      fetchServiceDetail(params.id as string)
    }
  }, [params.id, fetchServiceDetail])

  const calculateProgress = () => {
    if (!service?.tasks || service.tasks.length === 0) return 0
    const completed = service.tasks.filter(t => t.status === 'COMPLETED').length
    return Math.round((completed / service.tasks.length) * 100)
  }

  const getStatusColor = (status: ServiceDetail['status']) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500'
      case 'PAUSED': return 'bg-yellow-500'
      case 'COMPLETED': return 'bg-blue-500'
      case 'CANCELLED': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'IN_PROGRESS': return <Clock className="h-4 w-4 text-yellow-600" />
      default: return <Circle className="h-4 w-4 text-gray-400" />
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading service details...</div>
  }

  if (!service) {
    return <div className="flex items-center justify-center min-h-screen">Service not found</div>
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/services">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Services
          </Link>
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {service.name || service.template?.name || 'Unnamed Service'}
            </h1>
            <p className="text-gray-600 mt-2">
              {service.description || service.template?.description || 'No description'}
            </p>
          </div>
          <Badge 
            variant="outline" 
            className={`${getStatusColor(service.status)} text-white border-0`}
          >
            {service.status}
          </Badge>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Progress Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Overall Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{calculateProgress()}%</div>
            <Progress value={calculateProgress()} className="h-2" />
            <p className="text-sm text-gray-600 mt-2">
              {service.tasks?.filter(t => t.status === 'COMPLETED').length || 0} of {service.tasks?.length || 0} tasks completed
            </p>
          </CardContent>
        </Card>

        {/* Timeline Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>Started: {new Date(service.startDate).toLocaleDateString()}</span>
              </div>
              {service.endDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>Due: {new Date(service.endDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {permissions.canSubmitRequests && (
              <Button asChild className="w-full" size="sm">
                <Link href="/services/requests/new">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Submit Request
                </Link>
              </Button>
            )}
            {service.forms && service.forms.length > 0 && (
              <Button asChild className="w-full" variant="outline" size="sm">
                <Link href={`/services/${service.id}/forms`}>
                  <FileText className="mr-2 h-4 w-4" />
                  View Forms
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tasks Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Tasks
                </CardTitle>
                <CardDescription>Track the progress of individual tasks</CardDescription>
              </div>
              {service.tasks && service.tasks.length > 0 && (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/services/${service.id}/tasks`}>
                    <Settings className="mr-2 h-4 w-4" />
                    Manage Tasks
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {service.tasks && service.tasks.length > 0 ? (
              <div className="space-y-3">
                {service.tasks
                  .sort((a, b) => a.task.order - b.task.order)
                  .map((task) => (
                    <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                      {getTaskStatusIcon(task.status)}
                      <div className="flex-1">
                        <p className="font-medium text-sm">{task.task.title}</p>
                        {task.task.description && (
                          <p className="text-xs text-gray-600 mt-1">{task.task.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-600 text-sm">No tasks defined for this service</p>
            )}
          </CardContent>
        </Card>

        {/* Milestones Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Milestones
                </CardTitle>
                <CardDescription>Key milestones and achievements</CardDescription>
              </div>
              {service.milestones && service.milestones.length > 0 && (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/services/${service.id}/milestones`}>
                    <Settings className="mr-2 h-4 w-4" />
                    Track Milestones
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {service.milestones && service.milestones.length > 0 ? (
              <div className="space-y-3">
                {service.milestones.map((milestone) => (
                  <div key={milestone.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                    {milestone.achieved ? (
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    ) : (
                      <Circle className="h-4 w-4 text-gray-400 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{milestone.milestone.title}</p>
                      {milestone.milestone.description && (
                        <p className="text-xs text-gray-600 mt-1">{milestone.milestone.description}</p>
                      )}
                      {milestone.achieved && milestone.achievedAt && (
                        <p className="text-xs text-green-600 mt-1">
                          Achieved on {new Date(milestone.achievedAt).toLocaleDateString()}
                        </p>
                      )}
                      {!milestone.achieved && milestone.milestone.targetDate && (
                        <p className="text-xs text-gray-500 mt-1">
                          Target: {new Date(milestone.milestone.targetDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-sm">No milestones defined for this service</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Forms Section */}
      {service.forms && service.forms.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Required Forms
                </CardTitle>
                <CardDescription>Forms that need to be completed for this service</CardDescription>
              </div>
              <Button asChild size="sm">
                <Link href={`/services/${service.id}/forms`}>
                  View All Forms
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {service.forms.map((assignedForm) => {
                const isSubmitted = assignedForm.form.submissions && assignedForm.form.submissions.length > 0
                const latestSubmission = isSubmitted && assignedForm.form.submissions ? assignedForm.form.submissions[assignedForm.form.submissions.length - 1] : null
                
                return (
                  <div key={assignedForm.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50">
                    <div className="flex items-start gap-3">
                      <FileText className={cn(
                        "h-5 w-5 mt-0.5",
                        isSubmitted ? "text-green-600" : assignedForm.required ? "text-orange-500" : "text-gray-400"
                      )} />
                      <div>
                        <p className="font-medium text-sm">{assignedForm.form.name}</p>
                        {assignedForm.form.description && (
                          <p className="text-xs text-gray-600 mt-1">{assignedForm.form.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2">
                          {assignedForm.required && (
                            <Badge variant="outline" className="text-xs">Required</Badge>
                          )}
                          {assignedForm.dueDate && !isSubmitted && (
                            <p className="text-xs text-gray-500">
                              Due: {new Date(assignedForm.dueDate).toLocaleDateString()}
                            </p>
                          )}
                          {isSubmitted && latestSubmission && (
                            <p className="text-xs text-green-600">
                              Submitted on {new Date(latestSubmission.submittedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      asChild
                      size="sm"
                      variant={isSubmitted ? "outline" : "default"}
                    >
                      <Link href={`/forms/${assignedForm.form.id}/fill?serviceId=${service.id}`}>
                        {isSubmitted ? "View Submission" : "Fill Out Form"}
                      </Link>
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Requests */}
      {service.requests && service.requests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Recent Requests
            </CardTitle>
            <CardDescription>Your recent service requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {service.requests.slice(0, 5).map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-sm">{request.title}</p>
                    <p className="text-xs text-gray-600">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {request.priority}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {request.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}