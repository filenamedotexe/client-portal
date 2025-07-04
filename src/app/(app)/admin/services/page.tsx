'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePermissions } from '@/lib/roles'
import { 
  Plus, 
  Users, 
  Briefcase, 
  Calendar, 
  Search, 
  MessageSquare,
  ClipboardList,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Archive
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from '@/lib/utils'

interface Client {
  id: string
  firstName?: string
  lastName?: string
  email: string
  name?: string
}

interface ServiceTemplate {
  id: string
  name: string
  description: string
  isActive: boolean
  _count?: {
    services: number
    tasks: number
    milestones: number
  }
}

interface AssignedService {
  id: string
  name: string
  client: Client
  template: ServiceTemplate
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'
  startDate: string
  endDate?: string
  _count?: {
    tasks: number
    milestones: number
  }
}

interface ServiceRequest {
  id: string
  title: string
  description: string
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  createdAt: string
  client: Client
  service?: {
    name: string
  }
}

export default function ServiceManagementPage() {
  const permissions = usePermissions()
  const [activeTab, setActiveTab] = useState('overview')
  const [services, setServices] = useState<AssignedService[]>([])
  const [templates, setTemplates] = useState<ServiceTemplate[]>([])
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  
  const [assignData, setAssignData] = useState({
    clientId: '',
    templateId: '',
    name: '',
    description: ''
  })

  const [templateData, setTemplateData] = useState({
    name: '',
    description: '',
    tasks: [] as Array<{ title: string; description?: string }>,
    milestones: [] as Array<{ title: string; description?: string }>
  })

  const fetchAllData = useCallback(async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchServices(),
        fetchTemplates(),
        fetchRequests(),
        fetchClients()
      ])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/users?role=CLIENT')
      if (response.ok) {
        const data = await response.json()
        const clientsWithNames = data.map((client: Client) => ({
          ...client,
          name: `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.email
        }))
        console.log('Fetched clients:', clientsWithNames)
        setClients(clientsWithNames)
      } else {
        console.error('Failed to fetch clients:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error)
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

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services')
      if (response.ok) {
        const data = await response.json()
        setServices(data)
      }
    } catch (error) {
      console.error('Failed to fetch services:', error)
    }
  }

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/service-requests')
      if (response.ok) {
        const data = await response.json()
        setRequests(data)
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error)
    }
  }

  const handleAssignService = async () => {
    try {
      console.log('Assigning service with data:', assignData)
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: assignData.name,
          description: assignData.description,
          templateId: assignData.templateId,
          clientId: assignData.clientId
        })
      })

      if (response.ok) {
        await fetchServices()
        setShowAssignDialog(false)
        resetAssignForm()
        alert('Service assigned successfully!')
      } else {
        const error = await response.text()
        console.error('Failed to assign service:', response.status, error)
        alert(`Failed to assign service: ${error}`)
      }
    } catch (error) {
      console.error('Failed to assign service:', error)
      alert('Failed to assign service. Please check the console for details.')
    }
  }

  const handleCreateTemplate = async () => {
    try {
      const response = await fetch('/api/service-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateData.name,
          description: templateData.description,
          tasks: templateData.tasks.filter(t => t.title.trim() !== ''),
          milestones: templateData.milestones.filter(m => m.title.trim() !== '')
        })
      })

      if (response.ok) {
        await fetchTemplates()
        setShowTemplateDialog(false)
        setTemplateData({ name: '', description: '', tasks: [], milestones: [] })
      } else {
        const error = await response.text()
        console.error('Failed to create template:', response.status, error)
        alert('Failed to create template. Please try again.')
      }
    } catch (error) {
      console.error('Failed to create template:', error)
      alert('Failed to create template. Please try again.')
    }
  }

  const handleUpdateRequestStatus = async (requestId: string, status: string) => {
    try {
      const response = await fetch(`/api/service-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        await fetchRequests()
      }
    } catch (error) {
      console.error('Failed to update request:', error)
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

  const addTemplateTask = () => {
    setTemplateData({
      ...templateData,
      tasks: [...templateData.tasks, { title: '', description: '' }]
    })
  }

  const removeTemplateTask = (index: number) => {
    setTemplateData({
      ...templateData,
      tasks: templateData.tasks.filter((_, i) => i !== index)
    })
  }

  const updateTemplateTask = (index: number, field: 'title' | 'description', value: string) => {
    const updatedTasks = [...templateData.tasks]
    updatedTasks[index] = { ...updatedTasks[index], [field]: value }
    setTemplateData({ ...templateData, tasks: updatedTasks })
  }

  const addTemplateMilestone = () => {
    setTemplateData({
      ...templateData,
      milestones: [...templateData.milestones, { title: '', description: '' }]
    })
  }

  const removeTemplateMilestone = (index: number) => {
    setTemplateData({
      ...templateData,
      milestones: templateData.milestones.filter((_, i) => i !== index)
    })
  }

  const updateTemplateMilestone = (index: number, field: 'title' | 'description', value: string) => {
    const updatedMilestones = [...templateData.milestones]
    updatedMilestones[index] = { ...updatedMilestones[index], [field]: value }
    setTemplateData({ ...templateData, milestones: updatedMilestones })
  }

  // Filter functions
  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.template.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || service.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.client.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus
    const matchesPriority = filterPriority === 'all' || request.priority === filterPriority
    return matchesSearch && matchesStatus && matchesPriority
  })

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Metrics calculations
  const metrics = {
    totalServices: services.length,
    activeServices: services.filter(s => s.status === 'ACTIVE').length,
    totalRequests: requests.length,
    openRequests: requests.filter(r => r.status === 'OPEN').length,
    urgentRequests: requests.filter(r => r.priority === 'URGENT' && r.status !== 'CLOSED').length,
    totalTemplates: templates.length,
    activeTemplates: templates.filter(t => t.isActive).length,
    totalClients: clients.length,
    clientsWithServices: new Set(services.map(s => s.client.id)).size
  }

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': 
      case 'RESOLVED': 
        return 'bg-green-500'
      case 'PAUSED': 
      case 'IN_PROGRESS': 
        return 'bg-yellow-500'
      case 'COMPLETED': 
        return 'bg-blue-500'
      case 'CANCELLED': 
      case 'CLOSED': 
        return 'bg-gray-500'
      case 'OPEN': 
        return 'bg-orange-500'
      default: 
        return 'bg-gray-500'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'text-red-600 bg-red-50 border-red-200'
      case 'HIGH': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'LOW': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  if (!permissions.canAssignServices) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">
              You don&apos;t have permission to access service management.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Service Management</h1>
          <p className="text-gray-600 mt-1">Manage services, templates, and client requests</p>
        </div>
        <div className="flex gap-2">
          {permissions.canManageServices && (
            <Button variant="outline" onClick={() => setShowTemplateDialog(true)}>
              <ClipboardList className="mr-2 h-4 w-4" />
              New Template
            </Button>
          )}
          <Button onClick={() => setShowAssignDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Assign Service
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Services</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeServices}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalServices} total services
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Requests</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.openRequests}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.urgentRequests > 0 && (
                <span className="text-red-600">{metrics.urgentRequests} urgent</span>
              )}
              {metrics.urgentRequests === 0 && 'No urgent requests'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Templates</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeTemplates}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalTemplates} total templates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.clientsWithServices}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalClients} total clients
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search services, clients, or templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="PAUSED">Paused</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
        {activeTab === 'requests' && (
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">
            Services ({filteredServices.length})
          </TabsTrigger>
          <TabsTrigger value="requests">
            Requests ({filteredRequests.filter(r => r.status !== 'CLOSED').length})
          </TabsTrigger>
          {permissions.canManageServices && (
            <TabsTrigger value="templates">
              Templates ({filteredTemplates.length})
            </TabsTrigger>
          )}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates across all services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Recent Requests */}
              {requests.slice(0, 3).map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-start space-x-4">
                    <AlertCircle className={cn(
                      "h-5 w-5 mt-0.5",
                      request.priority === 'URGENT' ? 'text-red-500' : 'text-yellow-500'
                    )} />
                    <div>
                      <p className="font-medium">{request.title}</p>
                      <p className="text-sm text-gray-600">{request.client.name} • {format(new Date(request.createdAt), 'MMM d, h:mm a')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(request.priority)}>
                      {request.priority}
                    </Badge>
                    <Badge variant="outline" className={`${getStatusColor(request.status)} text-white border-0`}>
                      {request.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Services by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['ACTIVE', 'PAUSED', 'COMPLETED'].map(status => {
                    const count = services.filter(s => s.status === status).length
                    const percentage = services.length > 0 ? (count / services.length * 100).toFixed(0) : 0
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-3 h-3 rounded-full", getStatusColor(status))} />
                          <span className="text-sm">{status}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{count}</span>
                          <span className="text-xs text-gray-500">({percentage}%)</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Service Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {templates.slice(0, 3).map(template => {
                    const serviceCount = services.filter(s => s.template.id === template.id).length
                    return (
                      <div key={template.id} className="flex items-center justify-between">
                        <span className="text-sm truncate">{template.name}</span>
                        <Badge variant="secondary">{serviceCount} services</Badge>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4">
          {filteredServices.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Briefcase className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm ? `No services match "${searchTerm}"` : 'No services have been assigned yet.'}
                </p>
                <Button onClick={() => setShowAssignDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Assign First Service
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredServices.map((service) => (
                <Card key={service.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                      <div className="space-y-2 flex-grow">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-gray-500" />
                          <h3 className="font-semibold text-lg">{service.name}</h3>
                          <Badge
                            variant="outline"
                            className={`${getStatusColor(service.status)} text-white border-0`}
                          >
                            {service.status}
                          </Badge>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {service.client.name || service.client.email}
                          </div>
                          <div className="hidden sm:block">•</div>
                          <div>Template: {service.template.name}</div>
                          <div className="hidden sm:block">•</div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Started {format(new Date(service.startDate), 'MMM d, yyyy')}
                          </div>
                        </div>

                        {service._count && (
                          <div className="flex gap-4 text-sm">
                            <span className="text-gray-600">
                              {service._count.tasks} tasks
                            </span>
                            <span className="text-gray-600">
                              {service._count.milestones} milestones
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/services/${service.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Service
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Archive className="mr-2 h-4 w-4" />
                            Archive Service
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          {filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
                <p className="text-gray-500">
                  {searchTerm ? `No requests match "${searchTerm}"` : 'No service requests have been submitted.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-grow space-y-2">
                        <div className="flex items-start gap-3">
                          <AlertCircle className={cn(
                            "h-5 w-5 mt-0.5",
                            request.priority === 'URGENT' ? 'text-red-500' : 
                            request.priority === 'HIGH' ? 'text-orange-500' : 'text-gray-400'
                          )} />
                          <div className="flex-grow">
                            <h3 className="font-semibold">{request.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{request.description}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {request.client.name}
                          </div>
                          {request.service && (
                            <>
                              <div>•</div>
                              <div>Service: {request.service.name}</div>
                            </>
                          )}
                          <div>•</div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(request.createdAt), 'MMM d, h:mm a')}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex gap-2">
                          <Badge className={getPriorityColor(request.priority)}>
                            {request.priority}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={`${getStatusColor(request.status)} text-white border-0`}
                          >
                            {request.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Update Status
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleUpdateRequestStatus(request.id, 'IN_PROGRESS')}>
                              <Clock className="mr-2 h-4 w-4" />
                              In Progress
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateRequestStatus(request.id, 'RESOLVED')}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Resolved
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateRequestStatus(request.id, 'CLOSED')}>
                              <Archive className="mr-2 h-4 w-4" />
                              Closed
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Templates Tab (Admin Only) */}
        {permissions.canManageServices && (
          <TabsContent value="templates" className="space-y-4">
            {filteredTemplates.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ClipboardList className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm ? `No templates match "${searchTerm}"` : 'Create your first service template.'}
                  </p>
                  <Button onClick={() => setShowTemplateDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Template
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <ClipboardList className="h-5 w-5 text-blue-600" />
                        <Badge variant={template.isActive ? "default" : "secondary"}>
                          {template.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <CardTitle className="mt-4">{template.name}</CardTitle>
                      <CardDescription>{template.description || 'No description'}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {template._count && (
                        <div className="flex justify-between text-sm text-gray-600 mb-4">
                          <span>{template._count.services} services</span>
                          <span>{template._count.tasks} tasks</span>
                          <span>{template._count.milestones} milestones</span>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button asChild variant="outline" size="sm" className="flex-1">
                          <Link href={`/admin/service-templates/${template.id}`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Assign Service Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign New Service</DialogTitle>
            <DialogDescription>
              Select a client and service template to create a new assignment.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
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
                      {client.name || client.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template">Service Template</Label>
              <Select
                value={assignData.templateId}
                onValueChange={(value) => {
                  const template = templates.find(t => t.id === value)
                  const client = clients.find(c => c.id === assignData.clientId)
                  setAssignData({ 
                    ...assignData, 
                    templateId: value,
                    name: template && client ? `${client.name || client.email} - ${template.name}` : ''
                  })
                }}
              >
                <SelectTrigger id="template">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.filter(t => t.isActive).map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-name">Service Name</Label>
              <Input
                id="service-name"
                value={assignData.name}
                onChange={(e) => setAssignData({ ...assignData, name: e.target.value })}
                placeholder="e.g., Acme Corp Website Redesign"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={assignData.description}
                onChange={(e) => setAssignData({ ...assignData, description: e.target.value })}
                placeholder="Additional notes about this service"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssignService}
              disabled={!assignData.clientId || !assignData.templateId || !assignData.name}
            >
              Assign Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Template Dialog (Admin Only) */}
      {permissions.canManageServices && (
        <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Service Template</DialogTitle>
              <DialogDescription>
                Create a new template with tasks and milestones that can be assigned to clients.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    value={templateData.name}
                    onChange={(e) => setTemplateData({ ...templateData, name: e.target.value })}
                    placeholder="e.g., Website Development Package"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-description">Description</Label>
                  <Input
                    id="template-description"
                    value={templateData.description}
                    onChange={(e) => setTemplateData({ ...templateData, description: e.target.value })}
                    placeholder="Brief description of the service template"
                  />
                </div>
              </div>

              {/* Tasks Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Tasks</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addTemplateTask}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Task
                  </Button>
                </div>
                {templateData.tasks.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4 border rounded-lg">
                    No tasks added yet. Click &quot;Add Task&quot; to create one.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {templateData.tasks.map((task, index) => (
                      <div key={index} className="flex gap-2 p-3 border rounded-lg">
                        <div className="flex-grow space-y-2">
                          <Input
                            value={task.title}
                            onChange={(e) => updateTemplateTask(index, 'title', e.target.value)}
                            placeholder="Task title"
                          />
                          <Input
                            value={task.description || ''}
                            onChange={(e) => updateTemplateTask(index, 'description', e.target.value)}
                            placeholder="Task description (optional)"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTemplateTask(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Milestones Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Milestones</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addTemplateMilestone}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Milestone
                  </Button>
                </div>
                {templateData.milestones.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4 border rounded-lg">
                    No milestones added yet. Click &quot;Add Milestone&quot; to create one.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {templateData.milestones.map((milestone, index) => (
                      <div key={index} className="flex gap-2 p-3 border rounded-lg">
                        <div className="flex-grow space-y-2">
                          <Input
                            value={milestone.title}
                            onChange={(e) => updateTemplateMilestone(index, 'title', e.target.value)}
                            placeholder="Milestone title"
                          />
                          <Input
                            value={milestone.description || ''}
                            onChange={(e) => updateTemplateMilestone(index, 'description', e.target.value)}
                            placeholder="Milestone description (optional)"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTemplateMilestone(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateTemplate}
                disabled={!templateData.name || templateData.tasks.length === 0}
              >
                Create Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}