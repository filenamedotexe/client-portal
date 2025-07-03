import { useUser } from '@clerk/nextjs'
import { UserRole, rolePermissions } from '@/types/roles'

export function useUserRole(): UserRole | null {
  const { user } = useUser()
  
  // Get role from user metadata - you can customize this based on how you store roles
  const role = user?.publicMetadata?.role as UserRole
  
  // Default to 'client' if no role is set
  return role || 'client'
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