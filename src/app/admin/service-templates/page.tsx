'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { usePermissions } from '@/lib/roles'
import { Plus, Edit, Trash2, ClipboardList } from 'lucide-react'

interface Task {
  id?: string
  title: string
  description: string
  order: number
}

interface Milestone {
  id?: string
  title: string
  description: string
  order: number
}

interface ServiceTemplate {
  id: string
  name: string
  description: string
  tasks: Task[]
  milestones: Milestone[]
  requiredForms: { id: string; name: string; description?: string }[]
  _count?: {
    services: number
  }
}

export default function ServiceTemplatesPage() {
  const permissions = usePermissions()
  const [templates, setTemplates] = useState<ServiceTemplate[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tasks: [] as Task[],
    milestones: [] as Milestone[],
    requiredFormIds: [] as string[]
  })
  const [availableForms, setAvailableForms] = useState<{ id: string; name: string; description?: string }[]>([])

  useEffect(() => {
    fetchTemplates()
    fetchForms()
  }, [])

  const fetchForms = async () => {
    try {
      const response = await fetch('/api/forms')
      if (response.ok) {
        const data = await response.json()
        setAvailableForms(data)
      }
    } catch (error) {
      console.error('Failed to fetch forms:', error)
    }
  }

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/service-templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    }
  }

  const handleCreateTemplate = async () => {
    try {
      const response = await fetch('/api/service-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        await fetchTemplates()
        setShowCreateDialog(false)
        resetForm()
      }
    } catch (error) {
      console.error('Failed to create template:', error)
    }
  }

  const handleAddTask = () => {
    setFormData({
      ...formData,
      tasks: [...formData.tasks, { title: '', description: '', order: formData.tasks.length }]
    })
  }

  const handleAddMilestone = () => {
    setFormData({
      ...formData,
      milestones: [...formData.milestones, { title: '', description: '', order: formData.milestones.length }]
    })
  }

  const handleTaskChange = (index: number, field: keyof Task, value: string) => {
    const updatedTasks = [...formData.tasks]
    updatedTasks[index] = { ...updatedTasks[index], [field]: value }
    setFormData({ ...formData, tasks: updatedTasks })
  }

  const handleMilestoneChange = (index: number, field: keyof Milestone, value: string) => {
    const updatedMilestones = [...formData.milestones]
    updatedMilestones[index] = { ...updatedMilestones[index], [field]: value }
    setFormData({ ...formData, milestones: updatedMilestones })
  }

  const handleRemoveTask = (index: number) => {
    setFormData({
      ...formData,
      tasks: formData.tasks.filter((_, i) => i !== index)
    })
  }

  const handleRemoveMilestone = (index: number) => {
    setFormData({
      ...formData,
      milestones: formData.milestones.filter((_, i) => i !== index)
    })
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      tasks: [],
      milestones: [],
      requiredFormIds: []
    })
  }

  if (!permissions.canManageServices) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">
              You don&apos;t have permission to manage service templates.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Service Templates</h1>
          <p className="text-gray-600 mt-2">Create and manage service templates</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <ClipboardList className="h-5 w-5 text-blue-600" />
                {template._count && (
                  <Badge variant="secondary">
                    {template._count.services} active
                  </Badge>
                )}
              </div>
              <CardTitle className="mt-4">{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Tasks</span>
                  <span className="font-medium">{template.tasks.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Milestones</span>
                  <span className="font-medium">{template.milestones.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Required Forms</span>
                  <span className="font-medium">{template.requiredForms.length}</span>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit className="mr-2 h-3 w-3" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Trash2 className="mr-2 h-3 w-3" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Create Service Template
            </DialogTitle>
            <DialogDescription>
              Define the tasks, milestones, and requirements for this service template.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Website Development Package"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this service template includes..."
                  rows={3}
                />
              </div>
            </div>

            {/* Tasks */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Tasks</Label>
                <Button type="button" size="sm" variant="outline" onClick={handleAddTask}>
                  <Plus className="mr-2 h-3 w-3" />
                  Add Task
                </Button>
              </div>
              <div className="space-y-3">
                {formData.tasks.map((task, index) => (
                  <Card key={index} className="p-3">
                    <div className="space-y-2">
                      <Input
                        placeholder="Task title"
                        value={task.title}
                        onChange={(e) => handleTaskChange(index, 'title', e.target.value)}
                      />
                      <Textarea
                        placeholder="Task description (optional)"
                        value={task.description}
                        onChange={(e) => handleTaskChange(index, 'description', e.target.value)}
                        rows={2}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTask(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="mr-2 h-3 w-3" />
                        Remove
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Milestones */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Milestones</Label>
                <Button type="button" size="sm" variant="outline" onClick={handleAddMilestone}>
                  <Plus className="mr-2 h-3 w-3" />
                  Add Milestone
                </Button>
              </div>
              <div className="space-y-3">
                {formData.milestones.map((milestone, index) => (
                  <Card key={index} className="p-3">
                    <div className="space-y-2">
                      <Input
                        placeholder="Milestone title"
                        value={milestone.title}
                        onChange={(e) => handleMilestoneChange(index, 'title', e.target.value)}
                      />
                      <Textarea
                        placeholder="Milestone description (optional)"
                        value={milestone.description}
                        onChange={(e) => handleMilestoneChange(index, 'description', e.target.value)}
                        rows={2}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMilestone(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="mr-2 h-3 w-3" />
                        Remove
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Required Forms */}
            <div>
              <Label>Required Forms</Label>
              <p className="text-sm text-gray-500 mb-3">
                Select forms that clients must complete for this service
              </p>
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                {availableForms.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-2">
                    No forms available. Create forms first.
                  </p>
                ) : (
                  availableForms.map((form) => (
                    <div key={form.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`form-${form.id}`}
                        checked={formData.requiredFormIds.includes(form.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              requiredFormIds: [...formData.requiredFormIds, form.id]
                            })
                          } else {
                            setFormData({
                              ...formData,
                              requiredFormIds: formData.requiredFormIds.filter(id => id !== form.id)
                            })
                          }
                        }}
                        className="rounded"
                      />
                      <label htmlFor={`form-${form.id}`} className="text-sm flex-1 cursor-pointer">
                        {form.name}
                        {form.description && (
                          <span className="text-gray-500 block text-xs">{form.description}</span>
                        )}
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTemplate}>
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}