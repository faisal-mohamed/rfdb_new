# RFP Portal Workflow System

## Overview

The RFP Portal implements a sophisticated document processing workflow that transforms uploaded documents through multiple stages with **simplified role-based access control**.

## Workflow Stages

### 1. Document Upload
- **Status**: `UPLOADED`
- **Action**: Editor uploads document (converted to base64)
- **Next**: Process to Version 1

### 2. Version 1 Processing
- **Status**: `PROCESSING_V1` → `V1_READY`
- **Action**: External API processes document and returns JSON summary
- **Permissions**: Editor can initiate processing
- **Next**: Edit Version 1

### 3. Version 1 Editing
- **Status**: `V1_EDITING` → `V1_COMPLETED`
- **Action**: Editor modifies the JSON summary using UI editor
- **Permissions**: Editor can edit and complete
- **Next**: Process to Version 2

### 4. Version 2 Processing
- **Status**: `PROCESSING_V2` → `V2_READY`
- **Action**: Edited V1 JSON sent to second external API for refinement
- **Permissions**: Editor can initiate processing
- **Next**: Edit Version 2

### 5. Version 2 Editing
- **Status**: `V2_EDITING` → `V2_COMPLETED`
- **Action**: Final editing of refined JSON using UI editor
- **Permissions**: Editor can edit and complete
- **Next**: Approval

### 6. Approval
- **Status**: `APPROVED`
- **Action**: Approver reviews and approves final version
- **Permissions**: Approver only
- **Next**: Generate Word document

### 7. Completion
- **Status**: `COMPLETED`
- **Action**: Generate Word document from approved JSON
- **Permissions**: Approver can generate document
- **Result**: Final Word document available for download

## Simplified Role-Based Permissions

### VIEWER
- ✅ View all documents and workflow stages
- ❌ Cannot perform any actions

### EDITOR
- ✅ View all documents and workflow stages
- ✅ Edit Version 1 and Version 2 JSON content
- ✅ Process documents (generate V1 and V2)
- ❌ Cannot approve or generate final documents

### APPROVER
- ✅ View all documents and workflow stages
- ✅ Approve completed Version 2
- ✅ Generate Word documents from approved content
- ❌ Cannot edit JSON content or process documents

### ADMIN
- ✅ Full access to all workflow actions
- ✅ User management
- ✅ System administration

**Key Simplification**: Permissions are based **only on user role**, not on document workflow status. This makes the system predictable and easy to understand.

## Database Schema

### Documents Table
- Added `workflowStatus` field to track current stage
- Maintains existing document metadata

### DocumentVersion Table (New)
- Stores JSON content for each version
- Tracks editing history and approvals
- Links to external API requests
- Maintains audit trail

## API Endpoints

### `/api/workflow`
- **POST**: Execute workflow actions (process, edit, approve, etc.)
- **GET**: Retrieve document with all versions

### `/api/workflow/stats`
- **GET**: Retrieve workflow statistics and metrics

## Components

### WorkflowStatusBadge
- Visual indicator of current workflow status
- Color-coded for easy identification

### WorkflowProgress
- Step-by-step progress visualization
- Shows completed, current, and upcoming stages

### JsonEditor
- Rich UI for editing JSON content
- Tabbed interface for different sections
- Real-time validation and change tracking

### DocumentTable
- Enhanced table with workflow status
- Quick access to workflow actions
- Role-based action visibility

## Permission System

### Simple Permission Checks
```typescript
import { getSimplePermissions } from '@/lib/simplePermissions';

const permissions = getSimplePermissions(userRole);

// Use in components
{permissions.canEdit && <EditButton />}
{permissions.canApprove && <ApproveButton />}
```

### API Protection
```typescript
if (!permissions.canEdit) {
  return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
}
```

## External API Integration

### Mock Implementation (Development)
- `MockExternalApiService` provides realistic test data
- Simulates processing delays and responses
- Easy to replace with real API endpoints

### Real API Integration (Production)
- Replace mock service with actual API calls
- Maintain same interface for seamless transition
- Add error handling and retry logic

## Usage Instructions

### For Editors
1. Upload document using the upload interface
2. Navigate to document workflow page
3. Click "Generate Version 1" to process document
4. Edit the generated JSON using the editor
5. Complete Version 1 editing
6. Generate Version 2 for refinement
7. Edit and complete Version 2

### For Approvers
1. Review documents with "V2 Completed" status
2. Navigate to workflow page to review content
3. Approve the final version
4. Generate Word document for delivery

### For Viewers
1. Browse documents and view workflow status
2. Access workflow page to view JSON content
3. Monitor progress through workflow stages

## Development Setup

### After Migration
1. Run database migration: `npx prisma migrate dev --name add-workflow-system`
2. Update existing documents: `npm run update-documents`
3. Restart development server

### Environment Variables
- Ensure `DATABASE_URL` is configured
- Add external API credentials when available

## File Structure

### Permission System
- `/src/lib/simplePermissions.ts` - All permission logic
- `/PERMISSIONS.md` - Detailed permission documentation

### Workflow System
- `/src/types/workflow.ts` - Type definitions
- `/src/lib/workflowService.ts` - Business logic
- `/src/lib/mockExternalApi.ts` - Mock API service
- `/src/app/api/workflow/` - API endpoints
- `/src/components/` - UI components

## Future Enhancements

### Planned Features
- Real-time notifications for workflow updates
- Advanced analytics and reporting
- Bulk workflow operations
- Custom workflow templates
- Integration with document generation services

### External API Integration
- Replace mock services with production APIs
- Add webhook support for async processing
- Implement retry mechanisms and error handling

## Security Considerations

- All workflow actions require authentication
- Simple role-based access control enforced at API level
- Audit trail maintained for all document changes
- Sensitive data encrypted in transit and at rest
- No complex permission logic to create security gaps
