// Simplified Role-Based Access Control

export type UserRole = 'ADMIN' | 'APPROVER' | 'EDITOR' | 'VIEWER';

// Simple permission check functions
export const canViewDocument = (userRole: UserRole): boolean => {
  return true; // Everyone can view documents
};

export const canEditDocument = (userRole: UserRole): boolean => {
  return ['ADMIN', 'EDITOR'].includes(userRole);
};

export const canApproveDocument = (userRole: UserRole): boolean => {
  return ['ADMIN', 'APPROVER'].includes(userRole);
};

export const canProcessDocument = (userRole: UserRole): boolean => {
  return ['ADMIN', 'EDITOR'].includes(userRole);
};

export const canGenerateDocument = (userRole: UserRole): boolean => {
  return ['ADMIN', 'APPROVER'].includes(userRole);
};

export const canManageUsers = (userRole: UserRole): boolean => {
  return userRole === 'ADMIN';
};

// Simple permission object for easy use
export const getSimplePermissions = (userRole: UserRole) => {
  return {
    canView: canViewDocument(userRole),
    canEdit: canEditDocument(userRole),
    canApprove: canApproveDocument(userRole),
    canProcess: canProcessDocument(userRole),
    canGenerate: canGenerateDocument(userRole),
    canManageUsers: canManageUsers(userRole)
  };
};

// Role descriptions for clarity
export const ROLE_DESCRIPTIONS = {
  ADMIN: 'Full access to everything',
  APPROVER: 'Can view, approve, and generate documents',
  EDITOR: 'Can view, edit, and process documents',
  VIEWER: 'Can only view documents'
} as const;
