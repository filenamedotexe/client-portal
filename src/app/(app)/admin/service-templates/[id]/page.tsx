'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { usePermissions } from '@/lib/roles'
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react'

interface Task {
  id: string
  title: string
  description?: string
  order: number
}

interface Milestone {
  id: string
  title: string
  description?: string
  order: number
}

interface ServiceTemplate {
  id: string
  name: string
  description?: string
  isActive: boolean
  tasks: Task[]
  milestones: Milestone[]
}

export default function ServiceTemplateEditPage() {
  const params = useParams()
  const router = useRouter()
  const permissions = usePermissions()
  const [template, setTemplate] = useState<ServiceTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchTemplate = useCallback(async () => {
    try {
      const response = await fetch(`/api/service-templates/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setTemplate(data)
      }
    } catch (error) {
      console.error('Failed to fetch template:', error)
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    if (!permissions.canManageServices) {
      router.push('/admin/services')
      return
    }
    fetchTemplate()
  }, [params.id, permissions.canManageServices, router, fetchTemplate])

  const handleSave = async () => {
    if (!template) return
    
    setSaving(true)
    try {
      const response = await fetch(`/api/service-templates/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: template.name,
          description: template.description,
          isActive: template.isActive,
          tasks: template.tasks,
          milestones: template.milestones
        })
      })

      if (response.ok) {
        router.push('/admin/services?tab=templates')
      }
    } catch (error) {
      console.error('Failed to save template:', error)
    } finally {
      setSaving(false)
    }
  }

  const addTask = () => {
    if (!template) return
    const newTask: Task = {
      id: `new-${Date.now()}`,
      title: '',
      description: '',
      order: template.tasks.length
    }
    setTemplate({ ...template, tasks: [...template.tasks, newTask] })
  }

  const updateTask = (index: number, updates: Partial<Task>) => {
    if (!template) return
    const updatedTasks = [...template.tasks]
    updatedTasks[index] = { ...updatedTasks[index], ...updates }
    setTemplate({ ...template, tasks: updatedTasks })
  }

  const removeTask = (index: number) => {
    if (!template) return
    const updatedTasks = template.tasks.filter((_, i) => i !== index)
    setTemplate({ ...template, tasks: updatedTasks })
  }

  const addMilestone = () => {
    if (!template) return
    const newMilestone: Milestone = {
      id: `new-${Date.now()}`,
      title: '',
      description: '',
      order: template.milestones.length
    }
    setTemplate({ ...template, milestones: [...template.milestones, newMilestone] })
  }

  const updateMilestone = (index: number, updates: Partial<Milestone>) => {
    if (!template) return
    const updatedMilestones = [...template.milestones]
    updatedMilestones[index] = { ...updatedMilestones[index], ...updates }
    setTemplate({ ...template, milestones: updatedMilestones })
  }

  const removeMilestone = (index: number) => {
    if (!template) return
    const updatedMilestones = template.milestones.filter((_, i) => i !== index)
    setTemplate({ ...template, milestones: updatedMilestones })
  }

  if (!permissions.canManageServices) {
    return null
  }

  if (loading || !template) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/admin/services?tab=templates')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Service Template</h1>
            <p className="text-gray-600 mt-1">Modify template details, tasks, and milestones</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Template Details */}
      <Card>
        <CardHeader>
          <CardTitle>Template Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name</Label>
            <Input
              id="name"
              value={template.name}
              onChange={(e) => setTemplate({ ...template, name: e.target.value })}
              placeholder="e.g., Website Development Package"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={template.description || ''}
              onChange={(e) => setTemplate({ ...template, description: e.target.value })}
              placeholder="Brief description of the service template"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={template.isActive}
              onCheckedChange={(checked) => setTemplate({ ...template, isActive: checked })}
            />
            <Label htmlFor="active">Active (can be assigned to clients)</Label>
          </div>
        </CardContent>
      </Card>

      {/* Tasks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tasks</CardTitle>
              <CardDescription>Define the tasks for this service template</CardDescription>
            </div>
            <Button size="sm" onClick={addTask}>
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {template.tasks.map((task, index) => (
              <div key={task.id} className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="flex-grow space-y-3">
                  <Input
                    value={task.title}
                    onChange={(e) => updateTask(index, { title: e.target.value })}
                    placeholder="Task title"
                  />
                  <Input
                    value={task.description || ''}
                    onChange={(e) => updateTask(index, { description: e.target.value })}
                    placeholder="Task description (optional)"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTask(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {template.tasks.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No tasks added yet. Click &quot;Add Task&quot; to create one.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Milestones */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Milestones</CardTitle>
              <CardDescription>Define key milestones for tracking progress</CardDescription>
            </div>
            <Button size="sm" onClick={addMilestone}>
              <Plus className="mr-2 h-4 w-4" />
              Add Milestone
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {template.milestones.map((milestone, index) => (
              <div key={milestone.id} className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="flex-grow space-y-3">
                  <Input
                    value={milestone.title}
                    onChange={(e) => updateMilestone(index, { title: e.target.value })}
                    placeholder="Milestone title"
                  />
                  <Input
                    value={milestone.description || ''}
                    onChange={(e) => updateMilestone(index, { description: e.target.value })}
                    placeholder="Milestone description (optional)"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMilestone(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {template.milestones.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No milestones added yet. Click &quot;Add Milestone&quot; to create one.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}