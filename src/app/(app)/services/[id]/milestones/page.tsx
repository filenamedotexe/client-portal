'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  ArrowLeft, 
  Target,
  Trophy,
  Calendar,
  Save,
  RefreshCw,
  Star
} from 'lucide-react'
import { usePermissions } from '@/lib/roles'

interface ServiceMilestones {
  id: string
  name: string
  description: string
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'
  template?: {
    name: string
  }
  milestones?: Array<{
    id: string
    achieved: boolean
    achievedAt?: string
    milestone: {
      id: string
      title: string
      description: string
      order: number
    }
  }>
}

export default function ServiceMilestonesPage() {
  const params = useParams()
  const router = useRouter()
  const permissions = usePermissions()
  const [service, setService] = useState<ServiceMilestones | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [milestoneUpdates, setMilestoneUpdates] = useState<Record<string, boolean>>({})
  const [originalStatuses, setOriginalStatuses] = useState<Record<string, boolean>>({})

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
      
      // Initialize milestone status tracking
      const statuses: Record<string, boolean> = {}
      data.milestones?.forEach((milestone: NonNullable<ServiceMilestones['milestones']>[number]) => {
        statuses[milestone.id] = milestone.achieved
      })
      setOriginalStatuses(statuses)
      setMilestoneUpdates(statuses)
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

  const handleMilestoneChange = (milestoneId: string, achieved: boolean) => {
    setMilestoneUpdates(prev => ({
      ...prev,
      [milestoneId]: achieved
    }))
  }

  const hasChanges = () => {
    return Object.keys(milestoneUpdates).some(
      milestoneId => milestoneUpdates[milestoneId] !== originalStatuses[milestoneId]
    )
  }

  const handleSaveChanges = async () => {
    if (!hasChanges() || !permissions.canAssignServices) return

    setSaving(true)
    try {
      // Prepare updates for batch API call
      const updates = Object.entries(milestoneUpdates)
        .filter(([milestoneId, achieved]) => achieved !== originalStatuses[milestoneId])
        .map(([milestoneId, achieved]) => ({
          id: milestoneId,
          achieved,
          achievedAt: achieved ? new Date().toISOString() : null
        }))

      const response = await fetch(`/api/services/${params.id}/batch-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ milestones: updates })
      })

      if (!response.ok) {
        throw new Error('Failed to update milestones')
      }

      // Refresh service data
      await fetchService(params.id as string)
      alert('Milestones updated successfully!')
    } catch (error) {
      console.error('Error updating milestones:', error)
      alert('Failed to update milestones. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setMilestoneUpdates(originalStatuses)
  }

  const calculateProgress = () => {
    if (!service?.milestones || service.milestones.length === 0) return 0
    const achieved = Object.values(milestoneUpdates).filter(Boolean).length
    return Math.round((achieved / service.milestones.length) * 100)
  }

  const canEditMilestones = permissions.canAssignServices

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading milestones...</div>
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
              Milestone Tracking
            </h1>
            <p className="text-gray-600 mt-2">
              Track milestones for {service.name || service.template?.name || 'Service'}
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
          <CardTitle className="text-sm font-medium text-gray-600">Milestone Achievement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Trophy className={`h-8 w-8 ${calculateProgress() === 100 ? 'text-yellow-500' : 'text-gray-400'}`} />
                <span className="text-2xl font-bold">{calculateProgress()}%</span>
              </div>
              <span className="text-sm text-gray-600">
                {Object.values(milestoneUpdates).filter(Boolean).length} of {service.milestones?.length || 0} milestones achieved
              </span>
            </div>
            <Progress value={calculateProgress()} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Milestones List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Milestones
              </CardTitle>
              <CardDescription>
                {canEditMilestones 
                  ? 'Mark milestones as achieved when completed'
                  : 'View the progress of key project milestones'}
              </CardDescription>
            </div>
            {canEditMilestones && hasChanges() && (
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
          {service.milestones && service.milestones.length > 0 ? (
            <div className="space-y-4">
              {service.milestones
                .sort((a, b) => a.milestone.order - b.milestone.order)
                .map((serviceMilestone) => {
                  const isAchieved = milestoneUpdates[serviceMilestone.id]
                  const hasChanged = milestoneUpdates[serviceMilestone.id] !== originalStatuses[serviceMilestone.id]
                  
                  return (
                    <div
                      key={serviceMilestone.id}
                      className={`border rounded-lg p-4 transition-all ${
                        hasChanged
                          ? 'border-blue-300 bg-blue-50/50'
                          : isAchieved
                          ? 'bg-green-50 border-green-200'
                          : 'hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {canEditMilestones ? (
                          <Checkbox
                            id={serviceMilestone.id}
                            checked={isAchieved}
                            onCheckedChange={(checked) => 
                              handleMilestoneChange(serviceMilestone.id, checked as boolean)
                            }
                            className="mt-1"
                          />
                        ) : (
                          <div className="mt-1">
                            {isAchieved ? (
                              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                            ) : (
                              <Star className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                        )}
                        
                        <div className="flex-1 space-y-2">
                          <label
                            htmlFor={serviceMilestone.id}
                            className={`font-medium text-lg cursor-pointer ${
                              isAchieved ? 'text-green-800' : ''
                            }`}
                          >
                            {serviceMilestone.milestone.title}
                          </label>
                          
                          {serviceMilestone.milestone.description && (
                            <p className="text-sm text-gray-600">
                              {serviceMilestone.milestone.description}
                            </p>
                          )}
                          
                          {serviceMilestone.achievedAt && (
                            <div className="flex items-center gap-2 text-xs text-green-600">
                              <Calendar className="h-3 w-3" />
                              Achieved on {new Date(serviceMilestone.achievedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        
                        {isAchieved && (
                          <Badge className="bg-green-100 text-green-800 border-green-300">
                            Achieved
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No milestones defined for this service</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Achievement Summary */}
      {service.milestones && service.milestones.length > 0 && calculateProgress() === 100 && (
        <Card className="bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Trophy className="h-12 w-12 text-yellow-600" />
              <div>
                <h3 className="font-bold text-lg text-yellow-900">All Milestones Achieved! 🎉</h3>
                <p className="text-yellow-800">
                  Congratulations! All project milestones have been successfully completed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {canEditMilestones && service.milestones && service.milestones.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-medium text-blue-900 mb-2">Managing Milestones</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Check the box next to a milestone when it has been achieved</li>
              <li>Changes are highlighted in blue until saved</li>
              <li>Only administrators and managers can update milestones</li>
              <li>Achievement dates are automatically recorded when saved</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}