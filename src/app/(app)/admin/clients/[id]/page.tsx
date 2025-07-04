'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, redirect } from 'next/navigation'
import { ArrowLeft, MoreVertical, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { usePermissions } from '@/lib/roles'
import { ClientProfile } from '@/types/client'

interface Service {
  id: string
  name: string
  description: string
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'
  createdAt: string
  template: {
    id: string
    name: string
  }
  isActive: boolean
}

interface ServiceTemplate {
  id: string
  name: string
  description: string
  isActive: boolean
}


interface Client {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  createdAt: string
  services: Service[]
  clientProfile?: ClientProfile
}

export default function ClientDetailPage() {
  const params = useParams()
  const permissions = usePermissions()
  const [client, setClient] = useState<Client | null>(null)
  const [templates, setTemplates] = useState<ServiceTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [isAssigning, setIsAssigning] = useState(false)
  const [loading, setLoading] = useState(true)

  if (!permissions.canViewAdminPanel && !permissions.canManageForms) {
    redirect('/dashboard')
  }

  const fetchClient = useCallback(async () => {
    try {
      const response = await fetch(`/api/users/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setClient(data)
      }
    } catch (error) {
      console.error('Failed to fetch client:', error)
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    fetchClient()
    fetchTemplates()
  }, [fetchClient])

  async function fetchTemplates() {
    try {
      const response = await fetch('/api/service-templates?activeOnly=true')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    }
  }

  async function assignService() {
    if (!selectedTemplate || !client) return

    setIsAssigning(true)
    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate,
          clientId: client.id,
          name: templates.find(t => t.id === selectedTemplate)?.name || 'Service'
        })
      })

      if (response.ok) {
        fetchClient() // Refresh client data
        setSelectedTemplate('')
      }
    } catch (error) {
      console.error('Failed to assign service:', error)
    } finally {
      setIsAssigning(false)
    }
  }

  async function updateServiceStatus(serviceId: string, status: string) {
    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        fetchClient() // Refresh client data
      }
    } catch (error: unknown) {
      console.error('Failed to update service:', error)
    }
  }


  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      'ACTIVE': 'default',
      'PAUSED': 'secondary',
      'COMPLETED': 'outline',
      'CANCELLED': 'destructive'
    }
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading client details...</p>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Client not found</h3>
            <p className="text-gray-500 mb-4">The client you&apos;re looking for doesn&apos;t exist or has been removed.</p>
            <Button asChild>
              <Link href="/admin/clients">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Clients
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="mb-4">
        <Link href="/admin/clients" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Clients
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {client.firstName || client.lastName 
                ? `${client.firstName || ''} ${client.lastName || ''}`.trim()
                : client.email}
            </h1>
            <p className="mt-1 text-gray-600">{client.email}</p>
          </div>
          <Badge variant="secondary">Client</Badge>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        {/* ... existing code ... */}
      </div>

      {client.clientProfile && (
        <Card>
          <CardHeader>
            <CardTitle>Business Profile</CardTitle>
            <CardDescription>Detailed information about the client&apos;s business.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">Business Name</h4>
                  <p>{client.clientProfile.businessName || 'N/A'}</p>
                </div>
                 <div>
                  <h4 className="font-semibold">Phone Number</h4>
                  <p>{client.clientProfile.phoneNumber || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Work Hours</h4>
                  <p>{client.clientProfile.workHours || 'N/A'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">Logo</h4>
                  {client.clientProfile.logoUrl ? (
                    <Image src={client.clientProfile.logoUrl} alt="Business Logo" width={64} height={64} className="h-16 w-auto rounded-md object-contain bg-gray-100" />
                  ) : <p>N/A</p>}
                </div>
                <div>
                  <h4 className="font-semibold">Brand Colors</h4>
                  <div className="flex gap-2">
                    {client.clientProfile.brandColor1 && <div className="h-8 w-8 rounded-full border" style={{ backgroundColor: client.clientProfile.brandColor1 }} />}
                    {client.clientProfile.brandColor2 && <div className="h-8 w-8 rounded-full border" style={{ backgroundColor: client.clientProfile.brandColor2 }} />}
                    {client.clientProfile.brandColor3 && <div className="h-8 w-8 rounded-full border" style={{ backgroundColor: client.clientProfile.brandColor3 }} />}
                    {client.clientProfile.brandColor4 && <div className="h-8 w-8 rounded-full border" style={{ backgroundColor: client.clientProfile.brandColor4 }} />}
                  </div>
                </div>
                 <div>
                  <h4 className="font-semibold">Custom Font</h4>
                  <p>{client.clientProfile.customFont || 'N/A'}</p>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold">Social Media</h4>
              <div className="space-y-2 mt-2">
                {client.clientProfile.socialMediaProfiles.length > 0 ? client.clientProfile.socialMediaProfiles.map(p => (
                  <div key={p.platform}>
                    <span className="font-medium">{p.platform}:</span>{' '}
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{p.url}</a>
                  </div>
                )) : <p>N/A</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-8">
        <Tabs defaultValue="services" className="w-full">
          <TabsList>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="assign">Assign New Service</TabsTrigger>
          </TabsList>
          <TabsContent value="services">
            <Card>
              <CardHeader>
                <CardTitle>Active Services</CardTitle>
                <CardDescription>Services currently assigned to this client.</CardDescription>
              </CardHeader>
              <CardContent>
                {client.services.length > 0 ? (
                  <div className="space-y-4">
                    {client.services.map(service => (
                      <div key={service.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="font-semibold">{service.name}</p>
                          <p className="text-sm text-gray-500">Template: {service.template.name}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          {getStatusBadge(service.status)}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onSelect={() => updateServiceStatus(service.id, 'ACTIVE')}>Set Active</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => updateServiceStatus(service.id, 'PAUSED')}>Set Paused</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => updateServiceStatus(service.id, 'COMPLETED')}>Set Completed</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => updateServiceStatus(service.id, 'CANCELLED')}>Set Cancelled</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No services assigned yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="assign">
            <Card>
              <CardHeader>
                <CardTitle>Assign Service</CardTitle>
                <CardDescription>Choose a service template to assign to the client.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={assignService} disabled={!selectedTemplate || isAssigning}>
                  {isAssigning ? 'Assigning...' : 'Assign Service'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}