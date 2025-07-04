'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog'
import { usePermissions } from '@/lib/roles'
import { Plus, Edit, FileText, Copy, Eye } from 'lucide-react'
import Link from 'next/link'

interface FormTemplate {
  id: string
  name: string
  description: string
  fields: Record<string, unknown>[]
  isTemplate: boolean
  createdAt: string
  _count?: {
    submissions: number
    assignedForms: number
  }
}

export default function FormsPage() {
  const permissions = usePermissions()
  const [forms, setForms] = useState<FormTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')

  useEffect(() => {
    fetchForms()
  }, [])

  const fetchForms = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/forms')
      if (response.ok) {
        const data = await response.json()
        setForms(data)
      } else {
        console.error('Failed to fetch forms:', response.statusText)
        setForms([])
      }
    } catch (error) {
      console.error('Error fetching forms:', error)
      setForms([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateForm = async () => {
    if (!formName.trim()) return

    try {
      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formName.trim(),
          description: formDescription.trim(),
          fields: []
        })
      })

      if (response.ok) {
        const newForm = await response.json()
        setForms(prev => [newForm, ...prev])
        setFormName('')
        setFormDescription('')
        setShowCreateDialog(false)
        // Navigate to form builder
        window.location.href = `/admin/forms/builder/${newForm.id}`
      } else {
        console.error('Failed to create form:', response.statusText)
        alert('Failed to create form. Please try again.')
      }
    } catch (error) {
      console.error('Error creating form:', error)
      alert('An error occurred. Please try again.')
    }
  }

  if (!permissions.canManageForms) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">
              You don&apos;t have permission to manage forms.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Form Templates</h1>
          <p className="text-gray-600 mt-2">Create and manage form templates</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Form
        </Button>
      </div>

      {/* Forms Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {forms.map((form) => (
          <Card key={form.id} className="hover:shadow-lg transition-shadow flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <FileText className="h-5 w-5 text-blue-600" />
                <Badge variant="secondary">
                  {form.isTemplate ? 'Template' : 'Custom'}
                </Badge>
              </div>
              <CardTitle className="mt-4">{form.name}</CardTitle>
              <CardDescription>{form.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-grow flex flex-col justify-end">
              {form._count && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Submissions</span>
                    <span className="font-medium">{form._count.submissions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Assigned</span>
                    <span className="font-medium">{form._count.assignedForms}</span>
                  </div>
                </div>
              )}
              
              <div className="flex flex-wrap gap-2 pt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  asChild
                >
                  <Link href={`/admin/forms/builder/${form.id}`}>
                    <Edit className="mr-2 h-3 w-3" />
                    Edit
                  </Link>
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {forms.length === 0 && !loading && (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No forms yet</h3>
            <p className="text-gray-600 mb-4">Create your first form template to get started.</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Form
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Form</DialogTitle>
            <DialogDescription>
              Give your form a name and description to get started.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="form-name">Form Name</Label>
              <Input
                id="form-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Client Feedback Form"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="form-description">Description</Label>
              <Input
                id="form-description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Brief description of the form's purpose"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateForm} disabled={!formName}>
              Continue to Builder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}