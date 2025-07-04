import { useUser } from '@clerk/nextjs'
import { UserRole, rolePermissions } from '@/types/roles'

export function useUserRole(): UserRole | null {
  const { user } = useUser()
  
  let role = user?.publicMetadata?.role as string | undefined
  
  if (typeof role === 'string') {
    role = role.toLowerCase()
    if (role in rolePermissions) {
      return role as UserRole
    }
  }
  
  // Default to 'client' if no valid role is set
  return 'client'
}

export function usePermissions() {
  const role = useUserRole()
  
  if (!role) {
    return {
      canViewAdminPanel: false,
      canManageUsers: false,
      canManageServices: false,
      canManageForms: false,
      canAssignServices: false,
      canSubmitRequests: false,
      canViewAllServices: false,
      canViewOwnData: false,
    }
  }
  
  return rolePermissions[role]
}

export function hasPermission(userRole: UserRole | null, permission: keyof typeof rolePermissions.admin): boolean {
  if (!userRole) return false
  return rolePermissions[userRole][permission]
}

export function getUserDisplayName(role: UserRole): string {
  switch (role) {
    case 'admin':
      return 'Administrator'
    case 'manager':
      return 'Manager'
    case 'client':
      return 'Client'
    default:
      return 'User'
  }
} 