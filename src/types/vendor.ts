// Vendor Qualification Types

export enum VendorQualificationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface VendorDirector {
  id?: string;
  name: string;
  position?: string;
  contact?: string;
}

export interface VendorReference {
  id?: string;
  serialNumber: number;
  bankName: string;
  contactPerson: string;
  contactDetails: string;
  referenceLetterPath?: string;
}

export interface VendorPersonnel {
  id?: string;
  name: string;
  qualification: string;
  experience: string;
  role: string;
  cvFilePath?: string;
  cvContent?: string;
}

export interface VendorDocument {
  id?: string;
  documentType: string;
  fileName: string;
  fileContent?: string; // Base64
  fileSize: number;
  mimeType: string;
  uploadedAt?: Date;
}

export interface VendorQualification {
  id?: string;
  
  // General Information
  organizationName: string;
  incorporationDate: Date | string;
  postalAddress: string;
  telephone: string;
  email: string;
  registeredOfficeLocation: string;
  bankersInfo: string;
  insurersInfo: string;
  businessDescription: string;
  companyAuditors: string;
  mainBusinessActivity: string;
  
  // Banking Details
  bankName: string;
  accountNumber: string;
  branch: string;
  authorizedSignatories: string[];
  
  // Contact Person
  contactPersonName: string;
  contactPersonEmail: string;
  contactPersonPhone: string;
  
  // Employee Strength
  totalEmployees: number;
  managementTeam: number;
  technicalTeam: number;
  nonTechnicalTeam: number;
  
  // Status
  status?: VendorQualificationStatus;
  documentId?: string;
  
  // Related data
  directors?: VendorDirector[];
  references?: VendorReference[];
  personnel?: VendorPersonnel[];
  documents?: VendorDocument[];
  
  // Audit
  submittedBy?: string;
  submittedAt?: Date | string;
  reviewedBy?: string;
  reviewedAt?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface VendorQualificationFormData {
  // Step 1: General Information
  organizationName: string;
  incorporationDate: string;
  postalAddress: string;
  telephone: string;
  email: string;
  registeredOfficeLocation: string;
  bankersInfo: string;
  insurersInfo: string;
  businessDescription: string;
  companyAuditors: string;
  mainBusinessActivity: string;
  
  // Step 2: Banking & Directors
  bankName: string;
  accountNumber: string;
  branch: string;
  authorizedSignatories: string[];
  directors: VendorDirector[];
  
  // Step 3: References
  contactPersonName: string;
  contactPersonEmail: string;
  contactPersonPhone: string;
  references: VendorReference[];
  
  // Step 4: Personnel
  totalEmployees: number;
  managementTeam: number;
  technicalTeam: number;
  nonTechnicalTeam: number;
  personnel: VendorPersonnel[];
  
  // Step 5-6: Documents (handled separately in file upload components)
}

// Document type categories
export const VENDOR_DOCUMENT_TYPES = {
  // General Documents
  BUSINESS_CONTINUITY: 'business_continuity',
  AUDITED_ACCOUNTS: 'audited_accounts',
  MEMORANDUM_ARTICLES: 'memorandum_articles',
  CR12_FORM: 'cr12_form',
  
  // ABSA Bank Requirements
  BANK_CONFIRMATION: 'bank_confirmation',
  INCORPORATION_CERT: 'incorporation_cert',
  PACRA_DOCUMENTS: 'pacra_documents',
  TAX_CERTIFICATE: 'tax_certificate',
  UTILITY_BILL: 'utility_bill',
  
  // References
  REFERENCE_LETTER_1: 'reference_letter_1',
  REFERENCE_LETTER_2: 'reference_letter_2',
  REFERENCE_LETTER_3: 'reference_letter_3',
  
  // Financial Documents
  BALANCE_SHEET_2022: 'balance_sheet_2022',
  PROFIT_LOSS_2024: 'profit_loss_2024',
  ORGANOGRAM: 'organogram',
  
  // Compliance Documents
  VAT_CERTIFICATE: 'vat_certificate',
  GST_CERTIFICATE: 'gst_certificate',
  TRADING_LICENSE: 'trading_license',
  TAX_CLEARANCE: 'tax_clearance',
  MANUFACTURER_AUTH: 'manufacturer_auth',
  DECLARATION_INSOLVENCY: 'declaration_insolvency',
  DECLARATION_SUSPENSION: 'declaration_suspension',
  
  // Financial Statements
  FINANCIAL_STATEMENT_2022: 'financial_statement_2022',
  FINANCIAL_STATEMENT_2023: 'financial_statement_2023',
  FINANCIAL_STATEMENT_2024: 'financial_statement_2024',
  
  // Personnel
  PERSONNEL_CV: 'personnel_cv',
  ORGANIZATIONAL_STRUCTURE: 'organizational_structure',
} as const;

export type VendorDocumentType = typeof VENDOR_DOCUMENT_TYPES[keyof typeof VENDOR_DOCUMENT_TYPES];



