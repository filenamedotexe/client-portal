'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  FileText,
  CheckCircle,
  Circle,
  ExternalLink,
  Clock,
  AlertCircle
} from 'lucide-react'

interface ServiceForm {
  id: string
  name: string
  description: string
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'
  forms?: Array<{
    id: string
    required: boolean
    submittedAt?: string
    form: {
      id: string
      name: string
      description: string
      fields?: Array<{ id: string; type: string; label: string; value?: unknown }>
    }
  }>
  template?: {
    name: string
  }
}

export default function ServiceFormsPage() {
  const params = useParams()
  const router = useRouter()
  const [service, setService] = useState<ServiceForm | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchServiceForms = useCallback(async (id: string) => {
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
      console.error('Error fetching service forms:', error)
      router.push('/services')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    if (params.id) {
      fetchServiceForms(params.id as string)
    }
  }, [params.id, fetchServiceForms])

  const getFormStatus = (form: NonNullable<ServiceForm['forms']>[number]) => {
    if (form.submittedAt) {
      return { 
        status: 'submitted', 
        text: 'Submitted', 
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        icon: <CheckCircle className="h-4 w-4" />
      }
    } else if (form.required) {
      return { 
        status: 'required', 
        text: 'Required', 
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        icon: <AlertCircle className="h-4 w-4" />
      }
    } else {
      return { 
        status: 'optional', 
        text: 'Optional', 
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        icon: <Circle className="h-4 w-4" />
      }
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading forms...</div>
  }

  if (!service) {
    return <div className="flex items-center justify-center min-h-screen">Service not found</div>
  }

  const totalForms = service.forms?.length || 0
  const submittedForms = service.forms?.filter(f => f.submittedAt).length || 0
  const requiredForms = service.forms?.filter(f => f.required).length || 0
  const requiredSubmitted = service.forms?.filter(f => f.required && f.submittedAt).length || 0

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
              Service Forms
            </h1>
            <p className="text-gray-600 mt-2">
              Forms for {service.name || service.template?.name || 'Service'}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Forms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalForms}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Submitted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{submittedForms}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Required</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{requiredForms}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requiredForms > 0 ? Math.round((requiredSubmitted / requiredForms) * 100) : 100}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forms List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Forms
          </CardTitle>
          <CardDescription>
            Complete the required forms for your service
          </CardDescription>
        </CardHeader>
        <CardContent>
          {service.forms && service.forms.length > 0 ? (
            <div className="space-y-4">
              {service.forms.map((assignedForm) => {
                const formStatus = getFormStatus(assignedForm)
                return (
                  <div
                    key={assignedForm.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{assignedForm.form.name}</h3>
                          <Badge 
                            variant="outline" 
                            className={`${formStatus.bgColor} ${formStatus.color} border-0`}
                          >
                            <span className="flex items-center gap-1">
                              {formStatus.icon}
                              {formStatus.text}
                            </span>
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {assignedForm.form.description}
                        </p>
                        {assignedForm.submittedAt && (
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Submitted on {new Date(assignedForm.submittedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="ml-4">
                        {assignedForm.submittedAt ? (
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/forms/${assignedForm.form.id}/view`}>
                              View Submission
                            </Link>
                          </Button>
                        ) : (
                          <Button size="sm" asChild>
                            <Link href={`/forms/${assignedForm.form.id}`}>
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Fill Form
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No forms assigned to this service</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      {service.forms && service.forms.some(f => f.required && !f.submittedAt) && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-900 mb-1">Required Forms Pending</h3>
                <p className="text-sm text-yellow-800">
                  You have {requiredForms - requiredSubmitted} required form(s) that need to be completed. 
                  Please submit these forms as soon as possible to avoid service delays.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}