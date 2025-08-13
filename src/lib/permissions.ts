export type Role = 'viewer' | 'editor' | 'approver' | 'admin';

export type Permission = 
  | 'view_proposals'
  | 'download_files'
  | 'upload_rfp'
  | 'edit_responses'
  | 'generate_proposals'
  | 'approve_drafts'
  | 'export_documents'
  | 'manage_users'
  | 'manage_templates'
  | 'view_access_logs'
  | 'view_documents'
  | 'upload_documents'
  | 'edit_documents'
  | 'delete_documents'
  | 'download_documents'
  | 'manage_documents';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  viewer: [
    'view_proposals', 
    'download_files',
    'view_documents',
    'download_documents'
  ],
  editor: [
    'view_proposals', 
    'download_files', 
    'upload_rfp', 
    'edit_responses', 
    'generate_proposals',
    'view_documents',
    'upload_documents',
    'edit_documents',
    'download_documents'
  ],
  approver: [
    'view_proposals', 
    'download_files', 
    'approve_drafts', 
    'export_documents',
    'view_documents',
    'download_documents'
  ],
  admin: [
    'view_proposals',
    'download_files',
    'upload_rfp',
    'edit_responses',
    'generate_proposals',
    'approve_drafts',
    'export_documents',
    'manage_users',
    'manage_templates',
    'view_access_logs',
    'view_documents',
    'upload_documents',
    'edit_documents',
    'delete_documents',
    'download_documents',
    'manage_documents'
  ]
};

export function hasPermission(userRole: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[userRole].includes(permission);
}

export function hasAnyPermission(userRole: Role, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

export function hasAllPermissions(userRole: Role, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

// Page access mapping
export const PAGE_PERMISSIONS: Record<string, Permission[]> = {
  '/dashboard': ['view_proposals'], // All roles can access dashboard
  '/proposals': ['view_proposals'],
  '/proposals/upload': ['upload_rfp'],
  '/proposals/edit': ['edit_responses'],
  '/proposals/approve': ['approve_drafts'],
  '/users': ['manage_users'],
  '/templates': ['manage_templates'],
  '/logs': ['view_access_logs'],
  '/reports': ['export_documents'],
  '/documents': ['view_documents'],
  '/documents/upload': ['upload_documents']
};

export function canAccessPage(userRole: Role, pathname: string): boolean {
  const requiredPermissions = PAGE_PERMISSIONS[pathname];
  if (!requiredPermissions) return true; // Public page
  return hasAnyPermission(userRole, requiredPermissions);
}

// Document-specific permission checks
export function canUploadDocuments(role: Role): boolean {
  return hasPermission(role, 'upload_documents');
}

export function canEditDocuments(role: Role): boolean {
  return hasPermission(role, 'edit_documents');
}

export function canDeleteDocuments(role: Role): boolean {
  return hasPermission(role, 'delete_documents');
}

export function canDownloadDocuments(role: Role): boolean {
  return hasPermission(role, 'download_documents');
}

export function canViewDocuments(role: Role): boolean {
  return hasPermission(role, 'view_documents');
}

// Helper function to convert Prisma UserRole to our Role type
export function mapPrismaRoleToRole(prismaRole: string): Role {
  switch (prismaRole.toLowerCase()) {
    case 'admin':
      return 'admin';
    case 'editor':
      return 'editor';
    case 'approver':
      return 'approver';
    case 'viewer':
    default:
      return 'viewer';
  }
}
