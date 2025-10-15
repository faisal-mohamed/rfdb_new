"use client";

import FileUploadField from "./FileUploadField";
import { VENDOR_DOCUMENT_TYPES } from "@/types/vendor";

interface Props {
  qualificationId: string | null;
}

export default function FinancialDocsSection({ qualificationId }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Financial Documents</h2>
        <p className="text-slate-600">Upload financial statements and organizational documents</p>
      </div>

      {/* Financial Statements */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Financial Statements (Last 3 Years)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FileUploadField
            label="Financial Statements FY 2021-22"
            documentType={VENDOR_DOCUMENT_TYPES.FINANCIAL_STATEMENT_2022}
            qualificationId={qualificationId}
            required
          />

          <FileUploadField
            label="Financial Statements FY 2022-23"
            documentType={VENDOR_DOCUMENT_TYPES.FINANCIAL_STATEMENT_2023}
            qualificationId={qualificationId}
            required
          />

          <FileUploadField
            label="Financial Statements FY 2023-24"
            documentType={VENDOR_DOCUMENT_TYPES.FINANCIAL_STATEMENT_2024}
            qualificationId={qualificationId}
            required
          />
        </div>
      </div>

      {/* Balance Sheet & P&L */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Recent Financial Documents</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FileUploadField
            label="Balance Sheet for FY 2021-22"
            documentType={VENDOR_DOCUMENT_TYPES.BALANCE_SHEET_2022}
            qualificationId={qualificationId}
            required
          />

          <FileUploadField
            label="Profit & Loss Statement for FY 2023-24"
            documentType={VENDOR_DOCUMENT_TYPES.PROFIT_LOSS_2024}
            qualificationId={qualificationId}
            required
          />
        </div>
      </div>

      {/* Organizational Structure */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Organizational Documents</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FileUploadField
            label="Organogram and Employee Strength Chart"
            documentType={VENDOR_DOCUMENT_TYPES.ORGANOGRAM}
            qualificationId={qualificationId}
            acceptedTypes=".pdf,.jpg,.jpeg,.png"
            required
          />

          <FileUploadField
            label="Organizational Structure Diagram"
            documentType={VENDOR_DOCUMENT_TYPES.ORGANIZATIONAL_STRUCTURE}
            qualificationId={qualificationId}
            acceptedTypes=".pdf,.jpg,.jpeg,.png"
          />
        </div>
      </div>

      {/* Personnel CVs */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Key Personnel CVs</h3>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
          <p className="text-sm text-slate-700 mb-4">
            Upload CVs of key team members (can upload multiple files for different personnel)
          </p>
          <FileUploadField
            label="Personnel CV(s)"
            documentType={VENDOR_DOCUMENT_TYPES.PERSONNEL_CV}
            qualificationId={qualificationId}
            acceptedTypes=".pdf,.doc,.docx"
            required
          />
          <p className="text-xs text-slate-500 mt-2">
            Note: You can upload this multiple times for different personnel by clicking "Choose File" again after uploading.
          </p>
        </div>
      </div>

      {/* Info Boxes */}
      <div className="space-y-4">
        {/* <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-green-600 text-xl">✅</div>
            <div>
              <h3 className="font-semibold text-green-900 mb-1">Financial Document Requirements</h3>
              <ul className="text-sm text-green-800 list-disc list-inside space-y-1">
                <li>All financial statements must be audited and signed</li>
                <li>Documents should clearly show company name and fiscal year</li>
                <li>Ensure all figures are clearly visible and legible</li>
              </ul>
            </div>
          </div>
        </div> */}

        {/* <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-purple-600 text-xl">📊</div>
            <div>
              <h3 className="font-semibold text-purple-900 mb-1">Organogram Guidelines</h3>
              <p className="text-sm text-purple-800">
                Your organogram should clearly show:
              </p>
              <ul className="text-sm text-purple-800 list-disc list-inside space-y-1 mt-2">
                <li>Management hierarchy and reporting structure</li>
                <li>Department divisions (Technical, Non-Technical, Management)</li>
                <li>Team sizes for each department</li>
                <li>Key personnel positions</li>
              </ul>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
}











