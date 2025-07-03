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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePermissions } from '@/lib/roles'
import { Plus, Users, Briefcase, Calendar, Search } from 'lucide-react'
import { format } from 'date-fns'

interface Client {
  id: string
  name: string
  email: string
}

interface ServiceTemplate {
  id: string
  name: string
  description: string
}

interface AssignedService {
  id: string
  name: string
  client: Client
  template: ServiceTemplate
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'
  startDate: string
  endDate?: string
}

export default function AdminServicesPage() {
  const permissions = usePermissions()
  const [services, setServices] = useState<AssignedService[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [templates, setTemplates] = useState<ServiceTemplate[]>([])
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [assignData, setAssignData] = useState({
    clientId: '',
    templateId: '',
    name: '',
    description: ''
  })

  useEffect(() => {
    // TODO: Fetch data from API
    // Mock data for now
    setClients([
      { id: '1', name: 'John Smith', email: 'john@example.com' },
      { id: '2', name: 'Jane Doe', email: 'jane@example.com' },
      { id: '3', name: 'Acme Corp', email: 'contact@acme.com' }
    ])
    
    setTemplates([
      { id: '1', name: 'Website Development', description: 'Full website package' },
      { id: '2', name: 'Marketing Campaign', description: 'Marketing services package' }
    ])
    
    setServices([
      {
        id: '1',
        name: 'Acme Corp Website Redesign',
        client: { id: '3', name: 'Acme Corp', email: 'contact@acme.com' },
        template: { id: '1', name: 'Website Development', description: 'Full website package' },
        status: 'ACTIVE',
        startDate: new Date().toISOString()
      },
      {
        id: '2',
        name: 'John Smith Marketing Q4',
        client: { id: '1', name: 'John Smith', email: 'john@example.com' },
        template: { id: '2', name: 'Marketing Campaign', description: 'Marketing services package' },
        status: 'ACTIVE',
        startDate: new Date().toISOString()
      }
    ])
    
  }, [])

  const handleAssignService = async () => {
    try {
      // TODO: Call API to assign service
      const selectedTemplate = templates.find(t => t.id === assignData.templateId)
      const selectedClient = clients.find(c => c.id === assignData.clientId)
      
      if (selectedTemplate && selectedClient) {
        const newService: AssignedService = {
          id: Date.now().toString(),
          name: assignData.name || `${selectedClient.name} - ${selectedTemplate.name}`,
          client: selectedClient,
          template: selectedTemplate,
          status: 'ACTIVE',
          startDate: new Date().toISOString()
        }
        
        setServices([...services, newService])
        setShowAssignDialog(false)
        resetAssignForm()
      }
    } catch (error) {
      console.error('Failed to assign service:', error)
    }
  }

  const resetAssignForm = () => {
    setAssignData({
      clientId: '',
      templateId: '',
      name: '',
      description: ''
    })
  }

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.template.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: AssignedService['status']) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500'
      case 'PAUSED': return 'bg-yellow-500'
      case 'COMPLETED': return 'bg-blue-500'
      case 'CANCELLED': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  if (!permissions.canAssignServices) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">
              You don&apos;t have permission to manage service assignments.
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
          <h1 className="text-3xl font-bold text-gray-900">Service Assignments</h1>
          <p className="text-gray-600 mt-2">Manage client service assignments</p>
        </div>
        <Button onClick={() => setShowAssignDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Assign Service
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by client, service, or template..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Services Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Services</CardTitle>
          <CardDescription>All assigned services across clients</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredServices.map((service) => (
              <Card key={service.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-gray-500" />
                      <h3 className="font-medium">{service.name}</h3>
                      <Badge 
                        variant="outline" 
                        className={`${getStatusColor(service.status)} text-white border-0`}
                      >
                        {service.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {service.client.name}
                      </div>
                      <div>Template: {service.template.name}</div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Started {format(new Date(service.startDate), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Assign Service Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign New Service</DialogTitle>
            <DialogDescription>
              Select a client and service template to create a new assignment.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Client Selection */}
            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Select
                value={assignData.clientId}
                onValueChange={(value) => setAssignData({ ...assignData, clientId: value })}
              >
                <SelectTrigger id="client">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} ({client.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Template Selection */}
            <div className="space-y-2">
              <Label htmlFor="template">Service Template</Label>
              <Select
                value={assignData.templateId}
                onValueChange={(value) => {
                  const template = templates.find(t => t.id === value)
                  setAssignData({ 
                    ...assignData, 
                    templateId: value,
                    name: template ? `${clients.find(c => c.id === assignData.clientId)?.name || 'Client'} - ${template.name}` : ''
                  })
                }}
              >
                <SelectTrigger id="template">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Service Name */}
            <div className="space-y-2">
              <Label htmlFor="service-name">Service Name</Label>
              <Input
                id="service-name"
                value={assignData.name}
                onChange={(e) => setAssignData({ ...assignData, name: e.target.value })}
                placeholder="e.g., Acme Corp Website Redesign"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssignService}
              disabled={!assignData.clientId || !assignData.templateId}
            >
              Assign Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}