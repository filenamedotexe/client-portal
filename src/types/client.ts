export interface SocialMediaProfile {
  platform: string
  url: string
}

export interface ClientProfile {
  businessName?: string
  phoneNumber?: string
  workHours?: string
  logoUrl?: string
  customFont?: string
  brandColor1?: string
  brandColor2?: string
  brandColor3?: string
  brandColor4?: string
  socialMediaProfiles: SocialMediaProfile[]
} 