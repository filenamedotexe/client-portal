'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MessageSquare, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Service {
  id: string
  name: string
  description?: string
  template?: {
    name: string
    description?: string
  }
}

export default function NewServiceRequestPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    serviceId: '',
    priority: 'MEDIUM'
  })

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services')
      if (!response.ok) {
        console.error('Services fetch failed:', response.status)
        throw new Error('Failed to fetch services')
      }
      const data = await response.json()
      
      // Safely format services with better error handling
      const formattedServices = Array.isArray(data) ? data.map((service: Service) => ({
        id: service.id,
        name: service.name || service.template?.name || 'Unnamed Service',
        description: service.description || service.template?.description || ''
      })).filter(s => s.id) : []
      
      // Always add general request option at the beginning
      setServices([
        { id: 'general', name: 'General Request', description: 'Submit a general service request' },
        ...formattedServices
      ])
    } catch (error) {
      console.error('Error fetching services:', error)
      // Fallback to general request only
      setServices([{ id: 'general', name: 'General Request', description: 'Submit a general service request' }])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/service-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          serviceId: formData.serviceId || 'general' // Ensure serviceId is set
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Submission failed:', response.status, errorText)
        throw new Error(errorText || 'Failed to submit request')
      }

      const result = await response.json()
      console.log('Request submitted successfully:', result)
      
      // Redirect to requests page with success message
      router.push('/services/requests?success=true')
    } catch (error) {
      console.error('Failed to submit request:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit request'
      alert(`Error: ${errorMessage}. Please try again.`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/services">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Services
          </Link>
        </Button>
        
        <h1 className="text-3xl font-bold text-gray-900">Submit Service Request</h1>
        <p className="text-gray-600 mt-2">
          Have a question or need assistance? Submit a request and we&apos;ll get back to you soon.
        </p>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            New Request
          </CardTitle>
          <CardDescription>
            Fill out the form below to submit your service request
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Service Selection */}
            <div className="space-y-2">
              <Label htmlFor="service">Related Service</Label>
              <Select
                value={formData.serviceId}
                onValueChange={(value) => setFormData({ ...formData, serviceId: value })}
                required
              >
                <SelectTrigger id="service">
                  <SelectValue placeholder="Select a service or choose General" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">
                Set the priority based on how quickly you need a response
              </p>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Request Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Brief summary of your request"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Please provide detailed information about your request..."
                rows={6}
                required
              />
              <p className="text-sm text-gray-500">
                The more details you provide, the better we can assist you
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Help Text */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-medium text-blue-900 mb-2">Need immediate assistance?</h3>
          <p className="text-sm text-blue-800">
            For urgent matters, you can also reach us at support@example.com or call (555) 123-4567
            during business hours.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}