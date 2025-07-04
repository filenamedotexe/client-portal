'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { 
  ArrowLeft, 
  CheckCircle, 
  Circle, 
  Clock,
  Briefcase,
  Save,
  RefreshCw
} from 'lucide-react'
import { usePermissions } from '@/lib/roles'

interface ServiceTasks {
  id: string
  name: string
  description: string
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'
  clientId: string
  template?: {
    name: string
  }
  tasks?: Array<{
    id: string
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
    completedAt?: string
    task: {
      id: string
      title: string
      description: string
      order: number
    }
  }>
}

export default function ServiceTasksPage() {
  const params = useParams()
  const router = useRouter()
  const permissions = usePermissions()
  const [service, setService] = useState<ServiceTasks | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [taskUpdates, setTaskUpdates] = useState<Record<string, string>>({})
  const [originalStatuses, setOriginalStatuses] = useState<Record<string, string>>({})

  const fetchService = useCallback(async (id: string) => {
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
      
      // Initialize task status tracking
      const statuses: Record<string, string> = {}
      data.tasks?.forEach((task: NonNullable<ServiceTasks['tasks']>[number]) => {
        statuses[task.id] = task.status
      })
      setOriginalStatuses(statuses)
      setTaskUpdates(statuses)
    } catch (error) {
      console.error('Error fetching service:', error)
      router.push('/services')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    if (params.id) {
      fetchService(params.id as string)
    }
  }, [params.id, fetchService])

  const handleTaskStatusChange = (taskId: string, newStatus: string) => {
    setTaskUpdates(prev => ({
      ...prev,
      [taskId]: newStatus
    }))
  }

  const hasChanges = () => {
    return Object.keys(taskUpdates).some(
      taskId => taskUpdates[taskId] !== originalStatuses[taskId]
    )
  }

  const handleSaveChanges = async () => {
    if (!hasChanges()) return

    setSaving(true)
    try {
      // Prepare updates for batch API call
      const updates = Object.entries(taskUpdates)
        .filter(([taskId, status]) => status !== originalStatuses[taskId])
        .map(([taskId, status]) => ({
          id: taskId,
          status,
          completedAt: status === 'COMPLETED' ? new Date().toISOString() : null
        }))

      const response = await fetch(`/api/services/${params.id}/batch-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: updates })
      })

      if (!response.ok) {
        throw new Error('Failed to update tasks')
      }

      // Refresh service data
      await fetchService(params.id as string)
      alert('Tasks updated successfully!')
    } catch (error) {
      console.error('Error updating tasks:', error)
      alert('Failed to update tasks. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setTaskUpdates(originalStatuses)
  }

  const calculateProgress = () => {
    if (!service?.tasks || service.tasks.length === 0) return 0
    const completed = Object.values(taskUpdates).filter(status => status === 'COMPLETED').length
    return Math.round((completed / service.tasks.length) * 100)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'IN_PROGRESS':
        return <Clock className="h-5 w-5 text-yellow-600" />
      default:
        return <Circle className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-600 bg-green-50'
      case 'IN_PROGRESS':
        return 'text-yellow-600 bg-yellow-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  // Check permissions
  const canEditTasks = permissions.canAssignServices || permissions.canManageServices

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading tasks...</div>
  }

  if (!service) {
    return <div className="flex items-center justify-center min-h-screen">Service not found</div>
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/services/${params.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Service Details
          </Link>
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Task Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage tasks for {service.name || service.template?.name || 'Service'}
            </p>
          </div>
          <Badge 
            variant="outline" 
            className={service.status === 'ACTIVE' ? 'bg-green-500 text-white border-0' : 'bg-gray-500 text-white border-0'}
          >
            {service.status}
          </Badge>
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600">Overall Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold">{calculateProgress()}%</span>
              <span className="text-sm text-gray-600">
                {Object.values(taskUpdates).filter(s => s === 'COMPLETED').length} of {service.tasks?.length || 0} tasks completed
              </span>
            </div>
            <Progress value={calculateProgress()} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Tasks
              </CardTitle>
              <CardDescription>
                {canEditTasks 
                  ? 'Update task statuses as work progresses'
                  : 'View the status of your service tasks'}
              </CardDescription>
            </div>
            {canEditTasks && hasChanges() && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
                <Button size="sm" onClick={handleSaveChanges} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {service.tasks && service.tasks.length > 0 ? (
            <div className="space-y-4">
              {service.tasks
                .sort((a, b) => a.task.order - b.task.order)
                .map((serviceTask) => (
                  <div
                    key={serviceTask.id}
                    className={`border rounded-lg p-4 transition-all ${
                      taskUpdates[serviceTask.id] !== originalStatuses[serviceTask.id]
                        ? 'border-blue-300 bg-blue-50/50'
                        : 'hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        {getStatusIcon(taskUpdates[serviceTask.id])}
                      </div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="font-medium text-lg">{serviceTask.task.title}</h3>
                          {serviceTask.task.description && (
                            <p className="text-sm text-gray-600 mt-1">{serviceTask.task.description}</p>
                          )}
                          {serviceTask.completedAt && (
                            <p className="text-xs text-gray-500 mt-2">
                              Completed on {new Date(serviceTask.completedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        
                        {canEditTasks ? (
                          <RadioGroup
                            value={taskUpdates[serviceTask.id]}
                            onValueChange={(value) => handleTaskStatusChange(serviceTask.id, value)}
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="PENDING" id={`${serviceTask.id}-pending`} />
                              <Label 
                                htmlFor={`${serviceTask.id}-pending`} 
                                className="cursor-pointer text-sm"
                              >
                                Pending
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="IN_PROGRESS" id={`${serviceTask.id}-progress`} />
                              <Label 
                                htmlFor={`${serviceTask.id}-progress`} 
                                className="cursor-pointer text-sm"
                              >
                                In Progress
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="COMPLETED" id={`${serviceTask.id}-completed`} />
                              <Label 
                                htmlFor={`${serviceTask.id}-completed`} 
                                className="cursor-pointer text-sm"
                              >
                                Completed
                              </Label>
                            </div>
                          </RadioGroup>
                        ) : (
                          <Badge 
                            variant="outline" 
                            className={getStatusColor(taskUpdates[serviceTask.id])}
                          >
                            {taskUpdates[serviceTask.id].replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No tasks defined for this service</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      {canEditTasks && service.tasks && service.tasks.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-medium text-blue-900 mb-2">Managing Tasks</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Click on the status options to update task progress</li>
              <li>Changes are highlighted in blue until saved</li>
              <li>Click &quot;Save Changes&quot; to update multiple tasks at once</li>
              <li>Use &quot;Reset&quot; to undo unsaved changes</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}