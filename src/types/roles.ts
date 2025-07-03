export type UserRole = 'admin' | 'manager' | 'client'

export interface RolePermissions {
  canViewAdminPanel: boolean
  canManageUsers: boolean
  canManageServices: boolean
  canManageForms: boolean
  canAssignServices: boolean
  canSubmitRequests: boolean
  canViewAllServices: boolean
  canViewOwnData: boolean
}

export const rolePermissions: Record<UserRole, RolePermissions> = {
  admin: {
    canViewAdminPanel: true,
    canManageUsers: true,
    canManageServices: true,
    canManageForms: true,
    canAssignServices: true,
    canSubmitRequests: true,
    canViewAllServices: true,
    canViewOwnData: true,
  },
  manager: {
    canViewAdminPanel: false,
    canManageUsers: false,
    canManageServices: false,
    canManageForms: false,
    canAssignServices: false,
    canSubmitRequests: true,
    canViewAllServices: false,
    canViewOwnData: true,
  },
  client: {
    canViewAdminPanel: false,
    canManageUsers: false,
    canManageServices: false,
    canManageForms: false,
    canAssignServices: false,
    canSubmitRequests: true,
    canViewAllServices: false,
    canViewOwnData: true,
  },
} 