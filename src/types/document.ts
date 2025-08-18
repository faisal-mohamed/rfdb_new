import { WorkflowStatus, DocumentVersion } from './workflow';

export interface Document {
  id: string;
  fileName: string;
  fileType: string;
  mimeType: string;
  fileSize: number;
  fileContent?: string; // Only included when downloading
  customerName: string;
  uploadedDate: string;
  status: DocumentStatus;
  workflowStatus: WorkflowStatus;
  description?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  uploadedBy: string;
  uploader: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  versions?: DocumentVersion[];
}

export enum DocumentStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED'
}

export interface DocumentStats {
  totalDocuments: number;
  activeDocuments: number;
  archivedDocuments: number;
  deletedDocuments: number;
  recentDocuments: number;
  fileTypeBreakdown: Record<string, number>;
  topCustomers: Array<{
    customerName: string;
    documentCount: number;
  }>;
  totalStorageMB: number;
  topUploaders: Array<{
    uploader: {
      id: string;
      name: string;
      email: string;
    };
    uploadCount: number;
  }>;
  // Workflow stats
  workflowStatusBreakdown: Record<WorkflowStatus, number>;
  averageProcessingTime: number;
  pendingApprovals: number;
}

export interface DocumentFilters {
  search?: string;
  fileType?: string;
  customerName?: string;
  status?: DocumentStatus;
  workflowStatus?: WorkflowStatus;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DocumentPagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface DocumentListResponse {
  documents: Document[];
  pagination: DocumentPagination;
}

export interface UploadDocumentData {
  fileName: string;
  fileType: string;
  mimeType: string;
  fileSize: number;
  fileContent: string;
  customerName: string;
  uploadedDate: string;
  description?: string;
  tags?: string[];
}
