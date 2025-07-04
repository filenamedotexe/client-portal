'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Eye, Plus, Type, Hash, Calendar, Mail, Phone, FileText, List, CheckSquare, Radio } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import SortableFormField from '@/components/forms/SortableFormField'
import { FormField, FieldType } from '@/types/forms'

const fieldTypes: { value: FieldType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'text', label: 'Text Input', icon: Type },
  { value: 'textarea', label: 'Text Area', icon: FileText },
  { value: 'number', label: 'Number', icon: Hash },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'phone', label: 'Phone', icon: Phone },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'select', label: 'Dropdown', icon: List },
  { value: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { value: 'radio', label: 'Radio Buttons', icon: Radio },
]

interface FormBuilderPageProps {
  params: Promise<{ id: string }>;
}

export default function FormBuilderPage({ params }: FormBuilderPageProps) {
  const router = useRouter()
  const { id: formId } = use(params)
  const isNewForm = formId === 'new'

  const [formName, setFormName] = useState('New Form')
  const [formDescription, setFormDescription] = useState('')
  const [fields, setFields] = useState<FormField[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [loading, setLoading] = useState(!isNewForm)
  const [saving, setSaving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const loadFormData = useCallback(async () => {
    if (isNewForm) return

    try {
      const response = await fetch(`/api/forms/${formId}`)
      if (response.ok) {
        const form = await response.json()
        setFormName(form.name)
        setFormDescription(form.description || '')
        const formFields = form.fields?.sections?.[0]?.fields || form.fields?.fields || []
        setFields(formFields)
      } else {
        console.error('Failed to load form:', response.statusText)
        router.push('/admin/forms')
      }
    } catch (error) {
      console.error('Error loading form:', error)
      router.push('/admin/forms')
    } finally {
      setLoading(false)
    }
  }, [formId, isNewForm, router])

  useEffect(() => {
    loadFormData()
  }, [loadFormData])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over!.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const addField = (type: FieldType) => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type,
      label: `New ${type} field`,
      required: false,
      options: type === 'select' || type === 'radio' ? ['Option 1', 'Option 2'] : undefined
    }
    setFields((prev) => [...prev, newField])
  }

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields((prev) => prev.map(field => (field.id === id ? { ...field, ...updates } : field)))
  }

  const removeField = (id: string) => {
    setFields((prev) => prev.filter(field => field.id !== id))
  }

  const saveForm = async () => {
    setSaving(true)
    const formData = {
      name: formName,
      description: formDescription,
      fields: {
        sections: [{ id: 'main', title: 'Form Fields', fields: fields }]
      }
    }

    try {
      const url = isNewForm ? `/api/forms` : `/api/forms/${formId}`
      const method = isNewForm ? 'POST' : 'PUT'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        router.push('/admin/forms')
        router.refresh() // Ensures the forms list is updated
      } else {
        const errorData = await response.text()
        alert(`Failed to save form: ${errorData}`)
      }
    } catch (error) {
      console.error('Error saving form:', error)
      alert('An error occurred while saving the form.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/forms">
              <ArrowLeft />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{!isNewForm ? 'Edit Form' : 'Create Form'}</h1>
            <p className="text-muted-foreground">{!isNewForm ? 'Modify your existing form template.' : 'Create a new form from scratch.'}</p>
          </div>
        </div>
        <div className="flex gap-2 self-start sm:self-center">
          <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button onClick={saveForm} disabled={saving || loading}>
            {saving ? 'Saving...' : 'Save Form'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="space-y-6 lg:col-span-4">
            <Card>
              <CardHeader><CardTitle>Form Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="form-name">Form Name</Label>
                  <Input id="form-name" value={formName} onChange={(e) => setFormName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="form-description">Description</Label>
                  <Textarea id="form-description" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Form Fields</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {fieldTypes.map(({ value, label, icon: Icon }) => (
                  <Button key={value} variant="outline" className="justify-start" onClick={() => addField(value)}>
                    <Icon className="mr-2 h-4 w-4" />
                    {label}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-8">
            <Card className="min-h-[600px]">
              <CardHeader>
                <CardTitle>{showPreview ? 'Form Preview' : 'Canvas'}</CardTitle>
                <CardDescription>{showPreview ? 'This is how your form will look.' : 'Drag & drop fields to build your form.'}</CardDescription>
              </CardHeader>
              <CardContent>
                {showPreview ? (
                   <div className="space-y-4 p-4 border rounded-md">
                   {fields.map((field) => (
                     <div key={field.id} className="space-y-2">
                       <Label>
                         {field.label}
                         {field.required && <span className="text-red-500 ml-1">*</span>}
                       </Label>
                       {field.type === 'text' && <Input placeholder={field.placeholder} disabled />}
                       {field.type === 'textarea' && <Textarea placeholder={field.placeholder} disabled rows={4} />}
                       {field.type === 'number' && <Input type="number" placeholder={field.placeholder} disabled />}
                       {field.type === 'email' && <Input type="email" placeholder={field.placeholder} disabled />}
                       {field.type === 'phone' && <Input type="tel" placeholder={field.placeholder} disabled />}
                       {field.type === 'date' && <Input type="date" disabled />}
                       {field.type === 'select' && (
                         <Select disabled>
                           <SelectTrigger>
                             <SelectValue placeholder="Select an option" />
                           </SelectTrigger>
                           <SelectContent>
                             {field.options?.map((option, idx) => (
                               <SelectItem key={idx} value={option}>
                                 {option}
                               </SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                       )}
                       {field.type === 'checkbox' && (
                         <div className="flex items-center space-x-2">
                           <input 
                             type="checkbox" 
                             disabled 
                             className="rounded" 
                             aria-label={field.placeholder || 'Check this box'}
                           />
                           <span className="text-sm">{field.placeholder || 'Check this box'}</span>
                         </div>
                       )}
                       {field.type === 'radio' && (
                         <div className="space-y-2">
                           {field.options?.map((option, idx) => (
                             <div key={idx} className="flex items-center space-x-2">
                               <input 
                                 type="radio" 
                                 name={field.id} 
                                 disabled 
                                 aria-label={option}
                               />
                               <span className="text-sm">{option}</span>
                             </div>
                           ))}
                         </div>
                       )}
                     </div>
                   ))}
                 </div>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-4">
                        {fields.length > 0 ? (
                          fields.map((field) => (
                            <SortableFormField key={field.id} field={field} onUpdate={updateField} onRemove={removeField} />
                          ))
                        ) : (
                          <div className="text-center py-20 border-2 border-dashed rounded-lg">
                            <Plus className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-2 text-sm font-medium">No fields yet</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Add a field from the left panel to get started.</p>
                          </div>
                        )}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}