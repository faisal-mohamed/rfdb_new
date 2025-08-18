# Simplified Permission System

## Overview
This application uses a simple role-based access control (RBAC) system with four user roles and clear permission boundaries.

## User Roles

### VIEWER
- **Description**: Can only view documents and workflow
- **Permissions**: 
  - ✅ View documents
  - ❌ Edit documents
  - ❌ Process documents
  - ❌ Approve documents
  - ❌ Generate documents
  - ❌ Manage users

### EDITOR
- **Description**: Can view, edit, and process documents
- **Permissions**: 
  - ✅ View documents
  - ✅ Edit documents (V1 and V2 JSON)
  - ✅ Process documents (generate V1 and V2)
  - ❌ Approve documents
  - ❌ Generate Word documents
  - ❌ Manage users

### APPROVER
- **Description**: Can view, approve, and generate documents
- **Permissions**: 
  - ✅ View documents
  - ❌ Edit documents
  - ❌ Process documents
  - ✅ Approve documents
  - ✅ Generate Word documents
  - ❌ Manage users

### ADMIN
- **Description**: Full access to everything
- **Permissions**: 
  - ✅ View documents
  - ✅ Edit documents
  - ✅ Process documents
  - ✅ Approve documents
  - ✅ Generate Word documents
  - ✅ Manage users

## Permission Functions

All permissions are handled by simple functions in `/src/lib/simplePermissions.ts`:

```typescript
// Check if user can view documents
canViewDocument(userRole) // Returns true for all roles

// Check if user can edit documents
canEditDocument(userRole) // Returns true for ADMIN, EDITOR

// Check if user can approve documents
canApproveDocument(userRole) // Returns true for ADMIN, APPROVER

// Check if user can process documents
canProcessDocument(userRole) // Returns true for ADMIN, EDITOR

// Check if user can generate Word documents
canGenerateDocument(userRole) // Returns true for ADMIN, APPROVER

// Check if user can manage other users
canManageUsers(userRole) // Returns true for ADMIN only
```

## Usage in Components

```typescript
import { getSimplePermissions } from '@/lib/simplePermissions';

// Get all permissions for a user
const permissions = getSimplePermissions(userRole);

// Use permissions in UI
{permissions.canEdit && (
  <button>Edit Document</button>
)}

{permissions.canApprove && (
  <button>Approve Document</button>
)}
```

## API Protection

All API endpoints check permissions using the same simple functions:

```typescript
const permissions = getSimplePermissions(session.user.role);

if (!permissions.canEdit) {
  return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
}
```

## Benefits

1. **Simple**: No complex conditional logic
2. **Predictable**: Same permissions regardless of document state
3. **Maintainable**: Easy to understand and modify
4. **Secure**: Clear permission boundaries
5. **Extensible**: Easy to add new roles or permissions

## File Structure

- `/src/lib/simplePermissions.ts` - All permission logic
- `/src/app/api/workflow/route.ts` - API with permission checks
- `/src/app/api/workflow/stats/route.ts` - Stats API with permission checks
- Components use `getSimplePermissions()` for UI logic

## No Complex Logic

This system intentionally avoids:
- ❌ Workflow status-dependent permissions
- ❌ Complex conditional access control
- ❌ State-based permission calculations
- ❌ Multiple permission interfaces

Instead, it uses:
- ✅ Simple role-based checks
- ✅ Clear permission functions
- ✅ Consistent access control
- ✅ Easy-to-understand logic
