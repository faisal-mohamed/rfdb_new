export enum WorkflowStatus {
  UPLOADED = 'UPLOADED',
  PROCESSING_V1 = 'PROCESSING_V1',
  V1_READY = 'V1_READY',
  V1_EDITING = 'V1_EDITING',
  V1_COMPLETED = 'V1_COMPLETED',
  PROCESSING_V2 = 'PROCESSING_V2',
  V2_READY = 'V2_READY',
  V2_EDITING = 'V2_EDITING',
  V2_COMPLETED = 'V2_COMPLETED',
  APPROVED = 'APPROVED',
  COMPLETED = 'COMPLETED'
}

export enum VersionType {
  VERSION_1 = 'VERSION_1',
  VERSION_2 = 'VERSION_2'
}

export enum VersionStatus {
  GENERATED = 'GENERATED',
  EDITING = 'EDITING',
  COMPLETED = 'COMPLETED',
  APPROVED = 'APPROVED'
}

// Dynamic RFP tree types for V1/V2 JSONs
export type RfpLeaf = { extracted_data: string; pages: number[] };
export type RfpNode = { [section: string]: RfpNode | RfpLeaf };

export function isRfpLeaf(node: unknown): node is RfpLeaf {
  return !!node && typeof node === 'object'
    && 'extracted_data' in (node as any)
    && 'pages' in (node as any)
    && typeof (node as any).extracted_data === 'string'
    && Array.isArray((node as any).pages)
    && (node as any).pages.every((p: any) => Number.isInteger(p));
}

export function validateRfpTree(tree: unknown): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  function walk(node: any, path: string[]) {
    if (isRfpLeaf(node)) return;
    if (typeof node !== 'object' || node === null || Array.isArray(node)) {
      errors.push(`${path.join(' > ') || 'root'} must be an object`);
      return;
    }
    for (const [key, child] of Object.entries(node)) walk(child, [...path, key]);
  }
  walk(tree, []);
  return { isValid: errors.length === 0, errors };
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionType: VersionType;
  versionNumber: number;
  status: VersionStatus;
  jsonContent: any; // V1/V2 RFP tree (RfpNode)
  externalApiRequestId?: string;
  externalApiResponse?: any;
  editedBy?: string;
  editedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  generatedDocumentPath?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  
  // Relations
  document?: DocumentWithWorkflow;
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  editor?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  approver?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface DocumentWithWorkflow {
  id: string;
  fileName: string;
  fileType: string;
  mimeType: string;
  fileSize: number;
  fileContent?: string;
  customerName: string;
  uploadedDate: string;
  status: string;
  workflowStatus: WorkflowStatus;
  description?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  uploadedBy: string;
  
  // Relations
  uploader: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  versions: DocumentVersion[];
}

export interface WorkflowAction {
  action: 'process_v1' | 'edit_v1' | 'complete_v1' | 'process_v2' | 'edit_v2' | 'complete_v2' | 'approve' | 'generate_document';
  documentId: string;
  versionId?: string;
  jsonContent?: any;
  userId: string;
}

export interface ExternalApiRequest {
  documentId: string;
  fileContent: string; // base64
  fileName: string;
  versionType: VersionType;
}

export interface ExternalApiResponse {
  success: boolean;
  requestId: string;
  jsonData: any;
  message?: string;
  error?: string;
}

// Mock JSON structure for development (until external APIs are ready)
export interface MockRFPSummary {
  documentInfo: {
    title: string;
    type: string;
    submissionDeadline: string;
    contactPerson: string;
    organization: string;
  };
  requirements: {
    technical: string[];
    functional: string[];
    compliance: string[];
  };
  evaluation: {
    criteria: string[];
    weightage: Record<string, number>;
  };
  timeline: {
    phases: Array<{
      name: string;
      duration: string;
      deliverables: string[];
    }>;
  };
  budget: {
    estimatedRange: string;
    paymentTerms: string;
  };
}
