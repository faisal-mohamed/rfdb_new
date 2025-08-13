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
  | 'view_access_logs';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  viewer: ['view_proposals', 'download_files'],
  editor: [
    'view_proposals', 
    'download_files', 
    'upload_rfp', 
    'edit_responses', 
    'generate_proposals'
  ],
  approver: [
    'view_proposals', 
    'download_files', 
    'approve_drafts', 
    'export_documents'
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
    'view_access_logs'
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
  '/reports': ['export_documents']
};

export function canAccessPage(userRole: Role, pathname: string): boolean {
  const requiredPermissions = PAGE_PERMISSIONS[pathname];
  if (!requiredPermissions) return true; // Public page
  return hasAnyPermission(userRole, requiredPermissions);
}
