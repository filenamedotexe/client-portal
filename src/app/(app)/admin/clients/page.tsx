'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Users, Mail, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { usePermissions } from '@/lib/roles'
import { redirect } from 'next/navigation'

interface Client {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  activeServices: number
  createdAt: string
  name?: string // Computed field
}

export default function ClientsPage() {
  const permissions = usePermissions()
  const [clients, setClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  
  // State for invite form
  const [inviteEmail, setInviteEmail] = useState('')
  
  // State for manual add form
  const [manualFirstName, setManualFirstName] = useState('')
  const [manualLastName, setManualLastName] = useState('')
  const [manualEmail, setManualEmail] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [workHours, setWorkHours] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [customFont, setCustomFont] = useState('')
  const [brandColors, setBrandColors] = useState(['#000000', '#000000', '#000000', '#000000'])
  const [socialMediaProfiles, setSocialMediaProfiles] = useState([{ platform: '', url: '' }])

  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('invite')
  const [error, setError] = useState<string | null>(null)

  if (!permissions.canViewAdminPanel && !permissions.canManageForms) {
    redirect('/dashboard')
  }

  useEffect(() => {
    fetchClients()
  }, [])

  async function fetchClients() {
    try {
      const response = await fetch('/api/users?includeServices=true&role=CLIENT')
      if (response.ok) {
        const data = await response.json()
        // Add computed name field
        const clientsWithNames = data.map((client: Client) => ({
          ...client,
          name: `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.email
        }))
        setClients(clientsWithNames)
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter(client =>
    `${client.firstName} ${client.lastName} ${client.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  const handleSocialChange = (index: number, field: 'platform' | 'url', value: string) => {
    const newProfiles = [...socialMediaProfiles]
    newProfiles[index][field] = value
    setSocialMediaProfiles(newProfiles)
  }

  const addSocialField = () => {
    setSocialMediaProfiles([...socialMediaProfiles, { platform: '', url: '' }])
  }

  const removeSocialField = (index: number) => {
    const newProfiles = socialMediaProfiles.filter((_, i) => i !== index)
    setSocialMediaProfiles(newProfiles)
  }

  const handleColorChange = (index: number, color: string) => {
    const newColors = [...brandColors]
    newColors[index] = color
    setBrandColors(newColors)
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    const url = '/api/admin/clients'
    let body;
    if (activeTab === 'invite') {
      body = {
        action: 'invite',
        email: inviteEmail
      }
    } else {
      body = {
        action: 'create',
        firstName: manualFirstName,
        lastName: manualLastName,
        email: manualEmail,
        businessName,
        phoneNumber,
        workHours,
        logoUrl,
        customFont,
        brandColor1: brandColors[0],
        brandColor2: brandColors[1],
        brandColor3: brandColors[2],
        brandColor4: brandColors[3],
        socialMediaProfiles: socialMediaProfiles.filter(p => p.platform && p.url),
      }
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setShowAddDialog(false)
        // Reset forms
        setInviteEmail('')
        setManualFirstName('')
        setManualLastName('')
        setManualEmail('')
        setBusinessName('')
        setPhoneNumber('')
        setWorkHours('')
        setLogoUrl('')
        setCustomFont('')
        setBrandColors(['#000000', '#000000', '#000000', '#000000'])
        setSocialMediaProfiles([{ platform: '', url: '' }])
        await fetchClients()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'An unknown error occurred.')
      }
    } catch (error: unknown) {
      console.error('Failed to add client:', error)
      setError('An unexpected error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="mt-2 text-gray-600">Manage client accounts and their services</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add New Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>
                Choose to invite a client via email or add their details manually.
              </DialogDescription>
            </DialogHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="invite">Invite by Email</TabsTrigger>
                <TabsTrigger value="manual">Add Manually</TabsTrigger>
              </TabsList>
              <TabsContent value="invite">
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-email">Email Address</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      placeholder="client@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="manual">
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first-name">First Name</Label>
                      <Input id="first-name" value={manualFirstName} onChange={e => setManualFirstName(e.target.value)} placeholder="John" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last-name">Last Name</Label>
                      <Input id="last-name" value={manualLastName} onChange={e => setManualLastName(e.target.value)} placeholder="Doe" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manual-email">Email Address</Label>
                    <Input id="manual-email" type="email" value={manualEmail} onChange={e => setManualEmail(e.target.value)} placeholder="client@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="business-name">Business Name</Label>
                    <Input id="business-name" value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Acme Inc." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone-number">Phone Number</Label>
                    <Input id="phone-number" type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="(123) 456-7890" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="work-hours">Work Hours (optional)</Label>
                    <Input id="work-hours" value={workHours} onChange={e => setWorkHours(e.target.value)} placeholder="Mon-Fri, 9am - 5pm EST" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="logo-url">Logo URL (optional)</Label>
                    <Input id="logo-url" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custom-font">Custom Font (optional)</Label>
                    <Input id="custom-font" value={customFont} onChange={e => setCustomFont(e.target.value)} placeholder="e.g., 'Roboto', 'Open Sans'" />
                  </div>
                  <div className="space-y-2">
                    <Label>Brand Colors</Label>
                    <div className="flex gap-2">
                      {brandColors.map((color, i) => (
                        <Input key={i} type="color" value={color} onChange={e => handleColorChange(i, e.target.value)} className="p-1 h-10 w-10" />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Social Profiles</Label>
                    {socialMediaProfiles.map((profile, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <Input placeholder="Platform (e.g. Twitter)" value={profile.platform} onChange={e => handleSocialChange(i, 'platform', e.target.value)} />
                        <Input placeholder="URL" value={profile.url} onChange={e => handleSocialChange(i, 'url', e.target.value)} />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeSocialField(i)} disabled={socialMediaProfiles.length === 1}>
                          <Plus className="h-4 w-4 rotate-45" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addSocialField}>Add Social Profile</Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Submitting...' : (activeTab === 'invite' ? 'Send Invitation' : 'Add Client')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{clients.length}</span>
                <span className="text-gray-500">Total Clients</span>
              </div>
              <div className="hidden sm:block h-4 w-px bg-gray-300" />
              <div className="flex items-center gap-2">
                <span className="font-medium">{clients.filter(c => c.activeServices > 0).length}</span>
                <span className="text-gray-500">With Active Services</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center gap-2 text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
            Loading clients...
          </div>
        </div>
      ) : filteredClients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No clients found' : 'No clients yet'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm 
                ? `No clients match "${searchTerm}"`
                : 'Get started by inviting your first client to the portal.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Client
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
            <Link key={client.id} href={`/admin/clients/${client.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium">
                        {client.firstName?.charAt(0) || client.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {client.name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {client.email}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Active Services</span>
                    <Badge variant={client.activeServices > 0 ? 'default' : 'secondary'}>
                      {client.activeServices}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Calendar className="h-3 w-3" />
                    Client since {new Date(client.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}