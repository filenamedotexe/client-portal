'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { GripVertical, Trash2, Settings } from 'lucide-react'
import { FormField } from '@/types/forms'
import { useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Textarea } from '@/components/ui/textarea'

interface SortableFormFieldProps {
  field: FormField
  onUpdate: (id: string, updates: Partial<FormField>) => void
  onRemove: (id: string) => void
}

export default function SortableFormField({ field, onUpdate, onRemove }: SortableFormFieldProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [optionsText, setOptionsText] = useState(field.options?.join('\n') || '')
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleOptionsChange = (text: string) => {
    setOptionsText(text)
    const options = text.split('\n').filter(opt => opt.trim())
    onUpdate(field.id, { options })
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`${isDragging ? 'shadow-lg' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Drag Handle */}
            <div
              className="cursor-grab active:cursor-grabbing mt-1"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-5 w-5 text-gray-400" />
            </div>

            {/* Field Content */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <Input
                  value={field.label}
                  onChange={(e) => onUpdate(field.id, { label: e.target.value })}
                  className="font-medium"
                  placeholder="Field label"
                />
                <div className="flex items-center gap-2">
                  <Popover open={showSettings} onOpenChange={setShowSettings}>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="end">
                      <div className="space-y-4">
                        <h4 className="font-medium text-sm">Field Settings</h4>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`placeholder-${field.id}`}>Placeholder</Label>
                          <Input
                            id={`placeholder-${field.id}`}
                            value={field.placeholder || ''}
                            onChange={(e) => onUpdate(field.id, { placeholder: e.target.value })}
                            placeholder="Enter placeholder text"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor={`required-${field.id}`}>Required</Label>
                          <Switch
                            id={`required-${field.id}`}
                            checked={field.required}
                            onCheckedChange={(checked) => onUpdate(field.id, { required: checked })}
                          />
                        </div>

                        {(field.type === 'select' || field.type === 'radio') && (
                          <div className="space-y-2">
                            <Label>Options (one per line)</Label>
                            <Textarea
                              value={optionsText}
                              onChange={(e) => handleOptionsChange(e.target.value)}
                              rows={4}
                              placeholder="Option 1&#10;Option 2&#10;Option 3"
                            />
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(field.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                Type: {field.type}
                {field.required && ' • Required'}
                {field.options && ` • ${field.options.length} options`}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}