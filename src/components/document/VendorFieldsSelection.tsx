"use client";

import { useState } from "react";
import { VENDOR_DOCUMENT_TYPES } from "@/types/vendor";

export interface VendorFieldConfig {
  path: string;
  label: string;
  section: string;
}

// Document type labels mapping
const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  [VENDOR_DOCUMENT_TYPES.BUSINESS_CONTINUITY]: "Business Continuity Plan",
  [VENDOR_DOCUMENT_TYPES.AUDITED_ACCOUNTS]: "3 Years Audited Books of Accounts",
  [VENDOR_DOCUMENT_TYPES.MEMORANDUM_ARTICLES]: "Memorandum and Articles of Association",
  [VENDOR_DOCUMENT_TYPES.CR12_FORM]: "CR12 Form",
  [VENDOR_DOCUMENT_TYPES.BANK_CONFIRMATION]: "Letter of Confirmation from Bank",
  [VENDOR_DOCUMENT_TYPES.INCORPORATION_CERT]: "Certificate of Incorporation",
  [VENDOR_DOCUMENT_TYPES.PACRA_DOCUMENTS]: "PACRA Documents detailing Shareholders",
  [VENDOR_DOCUMENT_TYPES.TAX_CERTIFICATE]: "Valid Tax Certificate",
  [VENDOR_DOCUMENT_TYPES.UTILITY_BILL]: "Utility Bill",
  [VENDOR_DOCUMENT_TYPES.REFERENCE_LETTER_1]: "Reference Letter - 1",
  [VENDOR_DOCUMENT_TYPES.REFERENCE_LETTER_2]: "Reference Letter - 2",
  [VENDOR_DOCUMENT_TYPES.REFERENCE_LETTER_3]: "Reference Letter - 3",
  [VENDOR_DOCUMENT_TYPES.VAT_CERTIFICATE]: "VAT Registration Certificate",
  [VENDOR_DOCUMENT_TYPES.GST_CERTIFICATE]: "Goods & Services Tax Certificate",
  [VENDOR_DOCUMENT_TYPES.TRADING_LICENSE]: "Valid Trading License (2024)",
  [VENDOR_DOCUMENT_TYPES.TAX_CLEARANCE]: "Tax Clearance Certificate",
  [VENDOR_DOCUMENT_TYPES.MANUFACTURER_AUTH]: "Manufacturer Authorization or Equivalent",
  [VENDOR_DOCUMENT_TYPES.DECLARATION_INSOLVENCY]: "Self Declaration - Company is Not Insolvent",
  [VENDOR_DOCUMENT_TYPES.DECLARATION_SUSPENSION]: "Self Declaration - No Business Suspension/Conflict of Interest",
  [VENDOR_DOCUMENT_TYPES.BALANCE_SHEET_2022]: "Balance Sheet for FY 2021-22",
  [VENDOR_DOCUMENT_TYPES.PROFIT_LOSS_2024]: "Profit & Loss Statement for FY 2023-24",
  [VENDOR_DOCUMENT_TYPES.ORGANOGRAM]: "Organogram and Employee Strength Chart",
  [VENDOR_DOCUMENT_TYPES.ORGANIZATIONAL_STRUCTURE]: "Organizational Structure Diagram",
  [VENDOR_DOCUMENT_TYPES.FINANCIAL_STATEMENT_2022]: "Financial Statements FY 2021-22",
  [VENDOR_DOCUMENT_TYPES.FINANCIAL_STATEMENT_2023]: "Financial Statements FY 2022-23",
  [VENDOR_DOCUMENT_TYPES.FINANCIAL_STATEMENT_2024]: "Financial Statements FY 2023-24",
  [VENDOR_DOCUMENT_TYPES.PERSONNEL_CV]: "Personnel CV(s)",
};

// All vendor qualification fields organized by sections
export const VENDOR_FIELDS: VendorFieldConfig[] = [
  // Step 1: General Information
  { path: "organizationName", label: "Name of the Organization", section: "General Information" },
  { path: "incorporationDate", label: "Date of Incorporation", section: "General Information" },
  { path: "postalAddress", label: "Postal Address", section: "General Information" },
  { path: "telephone", label: "Telephone Number", section: "General Information" },
  { path: "email", label: "E-mail Address", section: "General Information" },
  { path: "registeredOfficeLocation", label: "Location of Registered Office", section: "General Information" },
  { path: "bankersInfo", label: "Name and Address of Bankers", section: "General Information" },
  { path: "insurersInfo", label: "Name and Address of Insurers", section: "General Information" },
  { path: "businessDescription", label: "Brief Description of Business", section: "General Information" },
  { path: "companyAuditors", label: "Company Auditors", section: "General Information" },
  { path: "mainBusinessActivity", label: "Main Business Activity", section: "General Information" },
  
  // Step 2: Banking Details
  { path: "bankName", label: "Bank Name", section: "Banking Details" },
  { path: "accountNumber", label: "Account Number", section: "Banking Details" },
  { path: "branch", label: "Branch", section: "Banking Details" },
  { path: "authorizedSignatories", label: "Authorized Signatories", section: "Banking Details" },
  
  // Step 2: Directors (array)
  { path: "directors", label: "Directors List", section: "Directors" },
  
  // Step 3: Contact Person
  { path: "contactPersonName", label: "Contact Person Name", section: "Contact Person" },
  { path: "contactPersonEmail", label: "Contact Person Email", section: "Contact Person" },
  { path: "contactPersonPhone", label: "Contact Person Phone", section: "Contact Person" },
  
  // Step 3: References (array)
  { path: "references", label: "Bank References", section: "References" },
  
  // Step 4: Employee Strength
  { path: "totalEmployees", label: "Total Number of Employees", section: "Employee Strength" },
  { path: "managementTeam", label: "Management Team", section: "Employee Strength" },
  { path: "technicalTeam", label: "Technical Team", section: "Employee Strength" },
  { path: "nonTechnicalTeam", label: "Non-Technical Team", section: "Employee Strength" },
  
  // Step 4: Personnel (array)
  { path: "personnel", label: "Key Personnel", section: "Personnel" },
];

// All vendor document types organized by sections
export const VENDOR_DOCUMENT_FIELDS: VendorFieldConfig[] = [
  // General Documents
  { path: `documents:${VENDOR_DOCUMENT_TYPES.BUSINESS_CONTINUITY}`, label: DOCUMENT_TYPE_LABELS[VENDOR_DOCUMENT_TYPES.BUSINESS_CONTINUITY], section: "General Documents" },
  { path: `documents:${VENDOR_DOCUMENT_TYPES.AUDITED_ACCOUNTS}`, label: DOCUMENT_TYPE_LABELS[VENDOR_DOCUMENT_TYPES.AUDITED_ACCOUNTS], section: "General Documents" },
  { path: `documents:${VENDOR_DOCUMENT_TYPES.MEMORANDUM_ARTICLES}`, label: DOCUMENT_TYPE_LABELS[VENDOR_DOCUMENT_TYPES.MEMORANDUM_ARTICLES], section: "General Documents" },
  { path: `documents:${VENDOR_DOCUMENT_TYPES.CR12_FORM}`, label: DOCUMENT_TYPE_LABELS[VENDOR_DOCUMENT_TYPES.CR12_FORM], section: "General Documents" },
  
  // Vendor Documents
  { path: `documents:${VENDOR_DOCUMENT_TYPES.BANK_CONFIRMATION}`, label: DOCUMENT_TYPE_LABELS[VENDOR_DOCUMENT_TYPES.BANK_CONFIRMATION], section: "Vendor Documents" },
  { path: `documents:${VENDOR_DOCUMENT_TYPES.INCORPORATION_CERT}`, label: DOCUMENT_TYPE_LABELS[VENDOR_DOCUMENT_TYPES.INCORPORATION_CERT], section: "Vendor Documents" },
  { path: `documents:${VENDOR_DOCUMENT_TYPES.PACRA_DOCUMENTS}`, label: DOCUMENT_TYPE_LABELS[VENDOR_DOCUMENT_TYPES.PACRA_DOCUMENTS], section: "Vendor Documents" },
  { path: `documents:${VENDOR_DOCUMENT_TYPES.TAX_CERTIFICATE}`, label: DOCUMENT_TYPE_LABELS[VENDOR_DOCUMENT_TYPES.TAX_CERTIFICATE], section: "Vendor Documents" },
  { path: `documents:${VENDOR_DOCUMENT_TYPES.UTILITY_BILL}`, label: DOCUMENT_TYPE_LABELS[VENDOR_DOCUMENT_TYPES.UTILITY_BILL], section: "Vendor Documents" },
  
  // Reference Letters
  { path: `documents:${VENDOR_DOCUMENT_TYPES.REFERENCE_LETTER_1}`, label: DOCUMENT_TYPE_LABELS[VENDOR_DOCUMENT_TYPES.REFERENCE_LETTER_1], section: "Reference Letters" },
  { path: `documents:${VENDOR_DOCUMENT_TYPES.REFERENCE_LETTER_2}`, label: DOCUMENT_TYPE_LABELS[VENDOR_DOCUMENT_TYPES.REFERENCE_LETTER_2], section: "Reference Letters" },
  { path: `documents:${VENDOR_DOCUMENT_TYPES.REFERENCE_LETTER_3}`, label: DOCUMENT_TYPE_LABELS[VENDOR_DOCUMENT_TYPES.REFERENCE_LETTER_3], section: "Reference Letters" },
  
  // Compliance Certificates
  { path: `documents:${VENDOR_DOCUMENT_TYPES.VAT_CERTIFICATE}`, label: DOCUMENT_TYPE_LABELS[VENDOR_DOCUMENT_TYPES.VAT_CERTIFICATE], section: "Compliance Certificates" },
  { path: `documents:${VENDOR_DOCUMENT_TYPES.GST_CERTIFICATE}`, label: DOCUMENT_TYPE_LABELS[VENDOR_DOCUMENT_TYPES.GST_CERTIFICATE], section: "Compliance Certificates" },
  { path: `documents:${VENDOR_DOCUMENT_TYPES.TRADING_LICENSE}`, label: DOCUMENT_TYPE_LABELS[VENDOR_DOCUMENT_TYPES.TRADING_LICENSE], section: "Compliance Certificates" },
  { path: `documents:${VENDOR_DOCUMENT_TYPES.TAX_CLEARANCE}`, label: DOCUMENT_TYPE_LABELS[VENDOR_DOCUMENT_TYPES.TAX_CLEARANCE], section: "Compliance Certificates" },
  { path: `documents:${VENDOR_DOCUMENT_TYPES.MANUFACTURER_AUTH}`, label: DOCUMENT_TYPE_LABELS[VENDOR_DOCUMENT_TYPES.MANUFACTURER_AUTH], section: "Compliance Certificates" },
  
  // Self Declarations
  { path: `documents:${VENDOR_DOCUMENT_TYPES.DECLARATION_INSOLVENCY}`, label: DOCUMENT_TYPE_LABELS[VENDOR_DOCUMENT_TYPES.DECLARATION_INSOLVENCY], section: "Self Declarations" },
  { path: `documents:${VENDOR_DOCUMENT_TYPES.DECLARATION_SUSPENSION}`, label: DOCUMENT_TYPE_LABELS[VENDOR_DOCUMENT_TYPES.DECLARATION_SUSPENSION], section: "Self Declarations" },
  
  // Financial Documents
  { path: `documents:${VENDOR_DOCUMENT_TYPES.FINANCIAL_STATEMENT_2022}`, label: DOCUMENT_TYPE_LABELS[VENDOR_DOCUMENT_TYPES.FINANCIAL_STATEMENT_2022], section: "Financial Documents" },
  { path: `documents:${VENDOR_DOCUMENT_TYPES.FINANCIAL_STATEMENT_2023}`, label: DOCUMENT_TYPE_LABELS[VENDOR_DOCUMENT_TYPES.FINANCIAL_STATEMENT_2023], section: "Financial Documents" },
  { path: `documents:${VENDOR_DOCUMENT_TYPES.FINANCIAL_STATEMENT_2024}`, label: DOCUMENT_TYPE_LABELS[VENDOR_DOCUMENT_TYPES.FINANCIAL_STATEMENT_2024], section: "Financial Documents" },
  { path: `documents:${VENDOR_DOCUMENT_TYPES.BALANCE_SHEET_2022}`, label: DOCUMENT_TYPE_LABELS[VENDOR_DOCUMENT_TYPES.BALANCE_SHEET_2022], section: "Financial Documents" },
  { path: `documents:${VENDOR_DOCUMENT_TYPES.PROFIT_LOSS_2024}`, label: DOCUMENT_TYPE_LABELS[VENDOR_DOCUMENT_TYPES.PROFIT_LOSS_2024], section: "Financial Documents" },
  
  // Organizational Documents
  { path: `documents:${VENDOR_DOCUMENT_TYPES.ORGANOGRAM}`, label: DOCUMENT_TYPE_LABELS[VENDOR_DOCUMENT_TYPES.ORGANOGRAM], section: "Organizational Documents" },
  { path: `documents:${VENDOR_DOCUMENT_TYPES.ORGANIZATIONAL_STRUCTURE}`, label: DOCUMENT_TYPE_LABELS[VENDOR_DOCUMENT_TYPES.ORGANIZATIONAL_STRUCTURE], section: "Organizational Documents" },
  { path: `documents:${VENDOR_DOCUMENT_TYPES.PERSONNEL_CV}`, label: DOCUMENT_TYPE_LABELS[VENDOR_DOCUMENT_TYPES.PERSONNEL_CV], section: "Organizational Documents" },
];

// Combine all fields for selection
const ALL_VENDOR_FIELDS = [...VENDOR_FIELDS, ...VENDOR_DOCUMENT_FIELDS];

interface Props {
  selectedFields: string[];
  onSelectionChange: (selectedFields: string[]) => void;
}

export default function VendorFieldsSelection({ selectedFields, onSelectionChange }: Props) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    "General Information": true,
    "Banking Details": true,
    "Directors": false,
    "Contact Person": false,
    "References": false,
    "Employee Strength": false,
    "Personnel": false,
    "General Documents": false,
    "Vendor Documents": false,
    "Reference Letters": false,
    "Compliance Certificates": false,
    "Self Declarations": false,
    "Financial Documents": false,
    "Organizational Documents": false,
  });

  // Group fields by section (combine both regular fields and document fields)
  const fieldsBySection = ALL_VENDOR_FIELDS.reduce((acc, field) => {
    if (!acc[field.section]) {
      acc[field.section] = [];
    }
    acc[field.section].push(field);
    return acc;
  }, {} as Record<string, VendorFieldConfig[]>);

  const toggleField = (path: string) => {
    if (selectedFields.includes(path)) {
      onSelectionChange(selectedFields.filter(f => f !== path));
    } else {
      onSelectionChange([...selectedFields, path]);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleAllInSection = (section: string) => {
    const sectionFields = fieldsBySection[section] || [];
    const sectionPaths = sectionFields.map(f => f.path);
    const allSelected = sectionPaths.every(path => selectedFields.includes(path));
    
    if (allSelected) {
      // Deselect all in section
      onSelectionChange(selectedFields.filter(path => !sectionPaths.includes(path)));
    } else {
      // Select all in section
      const newSelection = [...selectedFields];
      sectionPaths.forEach(path => {
        if (!newSelection.includes(path)) {
          newSelection.push(path);
        }
      });
      onSelectionChange(newSelection);
    }
  };

  const selectAll = () => {
    onSelectionChange(ALL_VENDOR_FIELDS.map(f => f.path));
  };

  const deselectAll = () => {
    onSelectionChange([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Company Documents (Annexure)</h3>
          <p className="text-sm text-slate-600 mt-1">
            Select which vendor qualification fields to include in generated documents
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={deselectAll}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Deselect All
          </button>
        </div>
      </div>

      {/* Fields by Section */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
        {Object.entries(fieldsBySection).map(([section, fields]) => {
          const isExpanded = expandedSections[section];
          const sectionPaths = fields.map(f => f.path);
          const selectedCount = sectionPaths.filter(path => selectedFields.includes(path)).length;
          const allSelected = sectionPaths.length > 0 && selectedCount === sectionPaths.length;

          return (
            <div key={section} className="border border-slate-200 rounded-lg overflow-hidden">
              {/* Section Header */}
              <div
                className="bg-slate-50 px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => toggleSection(section)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg
                      className={`w-5 h-5 text-slate-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <h4 className="font-semibold text-slate-800">{section}</h4>
                    <span className="text-xs text-slate-500">
                      ({selectedCount}/{fields.length} selected)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAllInSection(section);
                    }}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                  >
                    {allSelected ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>

              {/* Section Fields */}
              {isExpanded && (
                <div className="bg-white p-4 space-y-3">
                  {fields.map((field) => {
                    const isChecked = selectedFields.includes(field.path);
                    return (
                      <label
                        key={field.path}
                        className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleField(field.path)}
                          className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                        />
                        <span className="flex-1 text-sm text-slate-700">{field.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selection Summary */}
      <div className="pt-3 border-t border-slate-200">
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-slate-800">{selectedFields.length}</span> of {ALL_VENDOR_FIELDS.length} fields selected
        </p>
      </div>
    </div>
  );
}

