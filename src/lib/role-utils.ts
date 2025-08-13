import { UserRole, UserType } from "../generated/prisma";

// Simple role checking utilities for Next-Auth sessions
export function isAdmin(role: UserRole): boolean {
  return role === 'ADMIN';
}

export function isEditor(role: UserRole): boolean {
  return role === 'EDITOR';
}

export function isApprover(role: UserRole): boolean {
  return role === 'APPROVER';
}

export function isViewer(role: UserRole): boolean {
  return role === 'VIEWER';
}

export function canCreateUsers(userType: UserType): boolean {
  return userType === 'ADMIN';
}

// Future RBAC functions (empty for now)
export function hasPermission(role: UserRole, permission: string): boolean {
  // TODO: Implement when RBAC is needed
  return true;
}

export function canAccessPage(role: UserRole, pathname: string): boolean {
  // TODO: Implement when RBAC is needed
  return true;
}
