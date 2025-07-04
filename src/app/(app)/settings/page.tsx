"use client"

import { useEffect, useState, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useRouter } from 'next/navigation'
import { useAuth, useClerk } from '@clerk/nextjs'
import { SocialMediaProfile } from '@/types/client'
import Image from 'next/image'
import { 
  Edit2, 
  Check, 
  X, 
  Building2, 
  Phone, 
  Clock, 
  Upload, 
  Type, 
  Palette, 
  Shield, 
  Save,
  AlertCircle,
  Key,
  ExternalLink,
  Mail,
  MapPin
} from 'lucide-react'
import { 
  FaInstagram, 
  FaFacebook, 
  FaTwitter, 
  FaPinterest, 
  FaGoogle 
} from 'react-icons/fa'

interface EditableField {
  id: string
  value: string
  isEditing: boolean
  originalValue: string
}

interface SocialPlatform {
  id: string
  name: string
  icon: React.ReactNode
  placeholder: string
  color: string
}

interface UserData {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  name: string
  role: 'CLIENT' | 'MANAGER' | 'ADMIN'
  clientProfile?: {
    businessName?: string
    phoneNumber?: string
    workHours?: string
    logoUrl?: string
    customFont?: string
    brandColor1?: string
    brandColor2?: string
    brandColor3?: string
    brandColor4?: string
    socialMediaProfiles?: SocialMediaProfile[]
  }
}

interface WorkHours {
  [key: string]: { am: string; pm: string }
}

const socialPlatforms: SocialPlatform[] = [
  { 
    id: 'instagram', 
    name: 'Instagram', 
    icon: <FaInstagram className="h-5 w-5" />, 
    placeholder: 'instagram.com/yourbusiness',
    color: 'hover:text-pink-600'
  },
  { 
    id: 'facebook', 
    name: 'Facebook', 
    icon: <FaFacebook className="h-5 w-5" />, 
    placeholder: 'facebook.com/yourbusiness',
    color: 'hover:text-blue-600'
  },
  { 
    id: 'twitter', 
    name: 'Twitter/X', 
    icon: <FaTwitter className="h-5 w-5" />, 
    placeholder: 'twitter.com/yourbusiness',
    color: 'hover:text-sky-500'
  },
  { 
    id: 'pinterest', 
    name: 'Pinterest', 
    icon: <FaPinterest className="h-5 w-5" />, 
    placeholder: 'pinterest.com/yourbusiness',
    color: 'hover:text-red-600'
  },
  { 
    id: 'google', 
    name: 'Google Business', 
    icon: <FaGoogle className="h-5 w-5" />, 
    placeholder: 'g.page/yourbusiness',
    color: 'hover:text-green-600'
  }
]


const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function SettingsPage() {
  const router = useRouter()
  const { isSignedIn } = useAuth()
  const { openUserProfile } = useClerk()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)

  // Common fields for all roles
  const [commonFields, setCommonFields] = useState<Record<string, EditableField>>({
    name: { id: 'name', value: '', isEditing: false, originalValue: '' },
    email: { id: 'email', value: '', isEditing: false, originalValue: '' },
    phoneNumber: { id: 'phoneNumber', value: '', isEditing: false, originalValue: '' },
    address: { id: 'address', value: '', isEditing: false, originalValue: '' }
  })

  // Work hours for admin/manager
  const [workHours, setWorkHours] = useState<WorkHours>({
    Monday: { am: '', pm: '' },
    Tuesday: { am: '', pm: '' },
    Wednesday: { am: '', pm: '' },
    Thursday: { am: '', pm: '' },
    Friday: { am: '', pm: '' },
    Saturday: { am: '', pm: '' },
    Sunday: { am: '', pm: '' }
  })
  const [originalWorkHours] = useState<WorkHours>({
    Monday: { am: '', pm: '' },
    Tuesday: { am: '', pm: '' },
    Wednesday: { am: '', pm: '' },
    Thursday: { am: '', pm: '' },
    Friday: { am: '', pm: '' },
    Saturday: { am: '', pm: '' },
    Sunday: { am: '', pm: '' }
  })

  // Client-specific fields
  const [clientFields, setClientFields] = useState<Record<string, EditableField>>({
    businessName: { id: 'businessName', value: '', isEditing: false, originalValue: '' },
    customFont: { id: 'customFont', value: '', isEditing: false, originalValue: '' }
  })

  const [logoUrl, setLogoUrl] = useState('')
  const [originalLogoUrl, setOriginalLogoUrl] = useState('')
  const [brandColors, setBrandColors] = useState<string[]>(['#3B82F6', '#10B981', '#F59E0B', '#F3F4F6'])
  const [originalBrandColors, setOriginalBrandColors] = useState<string[]>(['#3B82F6', '#10B981', '#F59E0B', '#F3F4F6'])
  
  // Social profiles
  const [socialProfiles, setSocialProfiles] = useState<Record<string, string>>({})
  const [originalSocialProfiles, setOriginalSocialProfiles] = useState<Record<string, string>>({})

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    requestUpdates: true,
    weeklyReports: false
  })

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/sign-in')
      return
    }
    fetchUserData()
  }, [isSignedIn, router])

  useEffect(() => {
    // Track unsaved changes based on role
    let hasChanges = false
    
    // Common fields changes
    hasChanges = Object.values(commonFields).some(field => field.value !== field.originalValue)
    
    // Work hours changes (for admin/manager)
    if (userData?.role !== 'CLIENT') {
      hasChanges = hasChanges || JSON.stringify(workHours) !== JSON.stringify(originalWorkHours)
    }
    
    // Client-specific changes
    if (userData?.role === 'CLIENT') {
      hasChanges = hasChanges || Object.values(clientFields).some(field => field.value !== field.originalValue)
      hasChanges = hasChanges || brandColors.some((color, i) => color !== originalBrandColors[i])
      hasChanges = hasChanges || JSON.stringify(socialProfiles) !== JSON.stringify(originalSocialProfiles)
      hasChanges = hasChanges || logoUrl !== originalLogoUrl
    }
    
    setHasUnsavedChanges(hasChanges)
  }, [commonFields, clientFields, brandColors, socialProfiles, logoUrl, workHours, userData, originalBrandColors, originalSocialProfiles, originalLogoUrl, originalWorkHours])

  async function fetchUserData() {
    try {
      // Get user data with role
      const userRes = await fetch('/api/users/me')
      if (!userRes.ok) {
        throw new Error('Failed to fetch user data')
      }
      const user = await userRes.json()
      setUserData(user)
      
      // Set common fields
      setCommonFields({
        name: { id: 'name', value: user.name || '', isEditing: false, originalValue: user.name || '' },
        email: { id: 'email', value: user.email || '', isEditing: false, originalValue: user.email || '' },
        phoneNumber: { id: 'phoneNumber', value: '', isEditing: false, originalValue: '' },
        address: { id: 'address', value: '', isEditing: false, originalValue: '' }
      })
      
      // If client, fetch profile data
      if (user.role === 'CLIENT' && user.clientProfile) {
        const profile = user.clientProfile
        
        setClientFields({
          businessName: { id: 'businessName', value: profile.businessName || '', isEditing: false, originalValue: profile.businessName || '' },
          customFont: { id: 'customFont', value: profile.customFont || '', isEditing: false, originalValue: profile.customFont || '' }
        })
        
        setCommonFields(prev => ({
          ...prev,
          phoneNumber: { id: 'phoneNumber', value: profile.phoneNumber || '', isEditing: false, originalValue: profile.phoneNumber || '' }
        }))
        
        setLogoUrl(profile.logoUrl || '')
        setOriginalLogoUrl(profile.logoUrl || '')
        
        const colors = [
          profile.brandColor1 || '#3B82F6',
          profile.brandColor2 || '#10B981',
          profile.brandColor3 || '#F59E0B',
          profile.brandColor4 || '#F3F4F6',
        ]
        setBrandColors(colors)
        setOriginalBrandColors(colors)
        
        // Convert social media profiles to platform-based object
        const socialObj: Record<string, string> = {}
        if (profile.socialMediaProfiles && Array.isArray(profile.socialMediaProfiles)) {
          profile.socialMediaProfiles.forEach((socialProfile: SocialMediaProfile) => {
            const platform = socialPlatforms.find(p => 
              p.name.toLowerCase() === socialProfile.platform.toLowerCase() ||
              p.id === socialProfile.platform.toLowerCase()
            )
            if (platform) {
              socialObj[platform.id] = socialProfile.url
            }
          })
        }
        setSocialProfiles(socialObj)
        setOriginalSocialProfiles(socialObj)
        
        // Parse work hours if available
        if (profile.workHours) {
          // For clients, workHours is a simple string like "Mon-Fri 9am-5pm"
          // We'll keep it simple for them
        }
      }
    } catch (err) {
      console.error(err)
      setError('Failed to load user data')
    } finally {
      setLoading(false)
    }
  }

  const handleFieldEdit = (fieldId: string, isClient: boolean = false) => {
    const setFields = isClient ? setClientFields : setCommonFields
    
    setFields(prev => ({
      ...prev,
      [fieldId]: { ...prev[fieldId], isEditing: true }
    }))
  }

  const handleFieldSave = (fieldId: string, isClient: boolean = false) => {
    const setFields = isClient ? setClientFields : setCommonFields
    
    setFields(prev => ({
      ...prev,
      [fieldId]: { ...prev[fieldId], isEditing: false }
    }))
  }

  const handleFieldCancel = (fieldId: string, isClient: boolean = false) => {
    const setFields = isClient ? setClientFields : setCommonFields
    
    setFields(prev => ({
      ...prev,
      [fieldId]: { 
        ...prev[fieldId], 
        value: prev[fieldId].originalValue,
        isEditing: false 
      }
    }))
  }

  const handleFieldChange = (fieldId: string, value: string, isClient: boolean = false) => {
    const setFields = isClient ? setClientFields : setCommonFields
    
    setFields(prev => ({
      ...prev,
      [fieldId]: { ...prev[fieldId], value }
    }))
  }

  const handleColorChange = (index: number, color: string) => {
    const copy = [...brandColors]
    copy[index] = color
    setBrandColors(copy)
  }

  const handleSocialChange = (platformId: string, value: string) => {
    setSocialProfiles(prev => ({
      ...prev,
      [platformId]: value
    }))
  }

  const handleWorkHoursChange = (day: string, period: 'am' | 'pm', value: string) => {
    setWorkHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [period]: value }
    }))
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }

    setUploadingLogo(true)
    
    // Convert to base64 for storage (in production, you'd upload to a CDN)
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoUrl(reader.result as string)
      setUploadingLogo(false)
    }
    reader.onerror = () => {
      setError('Failed to upload image')
      setUploadingLogo(false)
    }
    reader.readAsDataURL(file)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      if (userData?.role === 'CLIENT') {
        // Save client profile
        const socialMediaProfiles = Object.entries(socialProfiles)
          .filter(([, url]) => url)
          .map(([platformId, url]) => {
            const platform = socialPlatforms.find(p => p.id === platformId)
            return {
              platform: platform?.name || platformId,
              url
            }
          })

        const res = await fetch('/api/client/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessName: clientFields.businessName.value,
            phoneNumber: commonFields.phoneNumber.value,
            workHours: clientFields.workHours?.value || '',
            logoUrl,
            customFont: clientFields.customFont.value,
            brandColor1: brandColors[0],
            brandColor2: brandColors[1],
            brandColor3: brandColors[2],
            brandColor4: brandColors[3],
            socialMediaProfiles,
          }),
        })
        if (!res.ok) {
          const data = await res.text()
          throw new Error(data)
        }
      } else {
        // For admin/manager, we'll save to user data
        // For now, just show success since we don't have separate profiles for them
        console.log('Saving admin/manager data:', {
          ...commonFields,
          workHours
        })
      }
      
      await fetchUserData()
      setHasUnsavedChanges(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const renderEditableField = (
    fieldId: string,
    label: string,
    icon: React.ReactNode,
    isClient: boolean = false,
    placeholder?: string,
    type: string = 'text',
    disabled: boolean = false
  ) => {
    const fields = isClient ? clientFields : commonFields
    const field = fields[fieldId]
    if (!field) return null
    
    const isEmpty = !field.value
    
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          {icon}
          {label}
        </Label>
        <div className="relative flex items-center gap-2">
          {field.isEditing && !disabled ? (
            <>
              <Input
                type={type}
                value={field.value}
                onChange={(e) => handleFieldChange(fieldId, e.target.value, isClient)}
                placeholder={placeholder}
                className="flex-1"
                autoFocus
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleFieldSave(fieldId, isClient)}
                className="h-8 w-8 p-0"
              >
                <Check className="h-4 w-4 text-green-600" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleFieldCancel(fieldId, isClient)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4 text-red-600" />
              </Button>
            </>
          ) : (
            <>
              {isEmpty && !disabled ? (
                <Input
                  type={type}
                  value={field.value}
                  onChange={(e) => handleFieldChange(fieldId, e.target.value, isClient)}
                  placeholder={placeholder || `Enter ${label.toLowerCase()}`}
                  className="flex-1"
                  disabled={disabled}
                />
              ) : (
                <div className="flex-1 px-3 py-2 text-sm">
                  {field.value}
                </div>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleFieldEdit(fieldId, isClient)}
                className="h-8 w-8 p-0"
                disabled={isEmpty || disabled}
              >
                <Edit2 className={`h-4 w-4 ${isEmpty || disabled ? 'text-gray-400' : 'text-gray-600'}`} />
              </Button>
            </>
          )}
        </div>
      </div>
    )
  }

  const renderAdminManagerSettings = () => (
    <>
      <TabsContent value="profile" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Your personal details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {renderEditableField('name', 'Full Name', <Building2 className="h-4 w-4" />, false, 'John Doe')}
              {renderEditableField('email', 'Email', <Mail className="h-4 w-4" />, false, 'email@example.com', 'email', true)}
              {renderEditableField('phoneNumber', 'Phone Number', <Phone className="h-4 w-4" />, false, '(555) 123-4567')}
              {renderEditableField('address', 'Address', <MapPin className="h-4 w-4" />, false, '123 Main St, City, State')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Work Hours</CardTitle>
            <CardDescription>
              Set your availability for each day of the week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm font-medium">
                <div>Day</div>
                <div>Morning (AM)</div>
                <div>Afternoon/Evening (PM)</div>
              </div>
              {daysOfWeek.map((day) => (
                <div key={day} className="grid grid-cols-3 gap-4 items-center">
                  <div className="text-sm font-medium">{day}</div>
                  <Input
                    placeholder="e.g., 9:00 AM - 12:00 PM"
                    value={workHours[day].am}
                    onChange={(e) => handleWorkHoursChange(day, 'am', e.target.value)}
                    className="text-sm"
                  />
                  <Input
                    placeholder="e.g., 1:00 PM - 5:00 PM"
                    value={workHours[day].pm}
                    onChange={(e) => handleWorkHoursChange(day, 'pm', e.target.value)}
                    className="text-sm"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Social Media</CardTitle>
            <CardDescription>
              Connect your social media profiles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {socialPlatforms.map((platform) => (
              <div key={platform.id} className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 text-gray-600 transition-colors ${platform.color}`}>
                  {platform.icon}
                </div>
                <div className="flex-1">
                  <Input
                    placeholder={platform.placeholder}
                    value={socialProfiles[platform.id] || ''}
                    onChange={(e) => handleSocialChange(platform.id, e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="security" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Security</CardTitle>
            <CardDescription>
              Manage your account security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100">
                    <Key className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Change Password</p>
                    <p className="text-sm text-gray-600">Update your account password</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => openUserProfile({ 
                    appearance: { 
                      elements: { 
                        rootBox: 'modal' 
                      } 
                    } 
                  })}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Manage
                </Button>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium text-green-900">Account Protected</p>
                  <p className="text-sm text-green-700">
                    Your account is secured with Clerk authentication
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </>
  )

  const renderClientSettings = () => (
    <>
      <TabsContent value="profile" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>
              Your business details are displayed to team members and on reports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {renderEditableField('businessName', 'Business Name', <Building2 className="h-4 w-4" />, true, 'Your Company Name')}
              {renderEditableField('phoneNumber', 'Phone Number', <Phone className="h-4 w-4" />, false, '(555) 123-4567')}
              <div className="md:col-span-2">
                {renderEditableField('workHours', 'Work Hours', <Clock className="h-4 w-4" />, true, 'Mon-Fri 9am-5pm')}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Social Media Profiles</CardTitle>
            <CardDescription>
              Connect your social media accounts to display on your profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {socialPlatforms.map((platform) => (
              <div key={platform.id} className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 text-gray-600 transition-colors ${platform.color}`}>
                  {platform.icon}
                </div>
                <div className="flex-1">
                  <Input
                    placeholder={platform.placeholder}
                    value={socialProfiles[platform.id] || ''}
                    onChange={(e) => handleSocialChange(platform.id, e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            ))}
            <p className="text-sm text-gray-500 mt-2">
              Enter the full URL or just the username for each platform
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="branding" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Brand Identity</CardTitle>
            <CardDescription>
              Customize your brand appearance across the platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Company Logo
              </Label>
              <div className="flex items-center gap-4">
                {logoUrl && (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
                    <Image 
                      src={logoUrl} 
                      alt="Company logo" 
                      fill
                      className="object-contain"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingLogo}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadingLogo ? 'Uploading...' : logoUrl ? 'Change Logo' : 'Upload Logo'}
                  </Button>
                  <p className="text-sm text-gray-500 mt-1">
                    PNG, JPG or GIF (max 5MB)
                  </p>
                </div>
              </div>
            </div>

            {renderEditableField('customFont', 'Custom Font', <Type className="h-4 w-4" />, true, 'Inter, Roboto, etc.')}
            
            {/* Simple Brand Colors */}
            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <Palette className="h-4 w-4 mt-1" />
                <div className="flex-1">
                  <Label className="text-sm font-medium">Brand Colors</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Choose colors that represent your brand
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {brandColors.map((color, i) => (
                  <div key={i} className="space-y-2">
                    <Label className="text-xs font-medium">
                      Color {i + 1}
                    </Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => handleColorChange(i, e.target.value)}
                        className="h-10 w-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={color}
                        onChange={(e) => handleColorChange(i, e.target.value)}
                        className="flex-1 text-xs font-mono"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="notifications" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>
              Choose how you want to be notified about important updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Alerts</Label>
                  <p className="text-sm text-gray-600">Receive email notifications for important updates</p>
                </div>
                <Switch 
                  checked={notifications.emailAlerts}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, emailAlerts: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SMS Alerts</Label>
                  <p className="text-sm text-gray-600">Get text messages for urgent matters</p>
                </div>
                <Switch 
                  checked={notifications.smsAlerts}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, smsAlerts: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Service Request Updates</Label>
                  <p className="text-sm text-gray-600">Get notified when your requests are updated</p>
                </div>
                <Switch 
                  checked={notifications.requestUpdates}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, requestUpdates: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Reports</Label>
                  <p className="text-sm text-gray-600">Receive weekly summary of your account activity</p>
                </div>
                <Switch 
                  checked={notifications.weeklyReports}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, weeklyReports: checked }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="security" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Security</CardTitle>
            <CardDescription>
              Manage your account security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100">
                    <Key className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Change Password</p>
                    <p className="text-sm text-gray-600">Update your account password</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => openUserProfile({ 
                    appearance: { 
                      elements: { 
                        rootBox: 'modal' 
                      } 
                    } 
                  })}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Manage
                </Button>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium text-green-900">Account Protected</p>
                  <p className="text-sm text-green-700">
                    Your account is secured with Clerk authentication
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-sm text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  const isClient = userData?.role === 'CLIENT'

  return (
    <>
      <div className="max-w-5xl mx-auto space-y-8 p-4">
        {/* Header with save reminder */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-gray-600 mt-1">
              {isClient 
                ? 'Manage your account preferences and business information'
                : 'Manage your personal information and preferences'}
            </p>
          </div>
          {hasUnsavedChanges && (
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1.5">
                <AlertCircle className="h-3 w-3" />
                Unsaved changes
              </Badge>
              <Button onClick={handleSave} disabled={saving} size="sm">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 text-red-800 p-4 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className={`grid w-full ${isClient ? 'grid-cols-4' : 'grid-cols-2'} max-w-2xl`}>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            {isClient && <TabsTrigger value="branding">Branding</TabsTrigger>}
            {isClient && <TabsTrigger value="notifications">Notifications</TabsTrigger>}
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {isClient ? renderClientSettings() : renderAdminManagerSettings()}
        </Tabs>
      </div>

      {/* Unsaved changes dialog */}
      <Dialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Would you like to save them before leaving?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUnsavedDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              handleSave()
              setShowUnsavedDialog(false)
            }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}