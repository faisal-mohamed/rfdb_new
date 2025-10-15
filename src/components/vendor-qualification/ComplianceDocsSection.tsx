"use client";

import FileUploadField from "./FileUploadField";
import { VENDOR_DOCUMENT_TYPES } from "@/types/vendor";

interface Props {
  qualificationId: string | null;
}

export default function ComplianceDocsSection({ qualificationId }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Compliance Documents</h2>
        <p className="text-slate-600">Upload all required compliance and reference documents</p>
      </div>

      {/* General Documents */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">General Documents</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FileUploadField
            label="Business Continuity Plan"
            documentType={VENDOR_DOCUMENT_TYPES.BUSINESS_CONTINUITY}
            qualificationId={qualificationId}
            required
          />

          <FileUploadField
            label="3 Years Audited Books of Accounts"
            documentType={VENDOR_DOCUMENT_TYPES.AUDITED_ACCOUNTS}
            qualificationId={qualificationId}
            required
          />

          <FileUploadField
            label="Memorandum and Articles of Association"
            documentType={VENDOR_DOCUMENT_TYPES.MEMORANDUM_ARTICLES}
            qualificationId={qualificationId}
            required
          />

          <FileUploadField
            label="CR12 Form"
            documentType={VENDOR_DOCUMENT_TYPES.CR12_FORM}
            qualificationId={qualificationId}
            required
          />
        </div>
      </div>

      {/* ABSA Bank Requirements */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">ABSA Bank Requirements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FileUploadField
            label="1. Letter of Confirmation from Bank"
            documentType={VENDOR_DOCUMENT_TYPES.BANK_CONFIRMATION}
            qualificationId={qualificationId}
            required
          />

          <FileUploadField
            label="2. Certificate of Incorporation"
            documentType={VENDOR_DOCUMENT_TYPES.INCORPORATION_CERT}
            qualificationId={qualificationId}
            required
          />

          <FileUploadField
            label="3. PACRA Documents detailing Shareholders"
            documentType={VENDOR_DOCUMENT_TYPES.PACRA_DOCUMENTS}
            qualificationId={qualificationId}
            required
          />

          <FileUploadField
            label="4. Valid Tax Certificate"
            documentType={VENDOR_DOCUMENT_TYPES.TAX_CERTIFICATE}
            qualificationId={qualificationId}
            required
          />

          <FileUploadField
            label="5. Utility Bill"
            documentType={VENDOR_DOCUMENT_TYPES.UTILITY_BILL}
            qualificationId={qualificationId}
            acceptedTypes=".pdf,.jpg,.jpeg,.png"
            required
          />
        </div>
      </div>

      {/* Reference Letters */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Reference Letters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FileUploadField
            label="Reference Letter - 1"
            documentType={VENDOR_DOCUMENT_TYPES.REFERENCE_LETTER_1}
            qualificationId={qualificationId}
            required
          />

          <FileUploadField
            label="Reference Letter - 2"
            documentType={VENDOR_DOCUMENT_TYPES.REFERENCE_LETTER_2}
            qualificationId={qualificationId}
            required
          />

          <FileUploadField
            label="Reference Letter - 3"
            documentType={VENDOR_DOCUMENT_TYPES.REFERENCE_LETTER_3}
            qualificationId={qualificationId}
            required
          />
        </div>
      </div>

      {/* Compliance Certificates */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Compliance Certificates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FileUploadField
            label="VAT Registration Certificate"
            documentType={VENDOR_DOCUMENT_TYPES.VAT_CERTIFICATE}
            qualificationId={qualificationId}
            required
          />

          <FileUploadField
            label="Goods & Services Tax Certificate"
            documentType={VENDOR_DOCUMENT_TYPES.GST_CERTIFICATE}
            qualificationId={qualificationId}
          />

          <FileUploadField
            label="Valid Trading License (2024)"
            documentType={VENDOR_DOCUMENT_TYPES.TRADING_LICENSE}
            qualificationId={qualificationId}
            required
          />

          <FileUploadField
            label="Tax Clearance Certificate"
            documentType={VENDOR_DOCUMENT_TYPES.TAX_CLEARANCE}
            qualificationId={qualificationId}
            required
          />

          <FileUploadField
            label="Manufacturer Authorization or Equivalent"
            documentType={VENDOR_DOCUMENT_TYPES.MANUFACTURER_AUTH}
            qualificationId={qualificationId}
          />
        </div>
      </div>

      {/* Self Declarations */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Self Declarations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FileUploadField
            label="Self Declaration - Company is Not Insolvent"
            documentType={VENDOR_DOCUMENT_TYPES.DECLARATION_INSOLVENCY}
            qualificationId={qualificationId}
            required
          />

          <FileUploadField
            label="Self Declaration - No Business Suspension/Conflict of Interest"
            documentType={VENDOR_DOCUMENT_TYPES.DECLARATION_SUSPENSION}
            qualificationId={qualificationId}
            required
          />
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-blue-600 text-xl">💡</div>
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Important Notes</h3>
            <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
              <li>All documents should be in PDF format (images acceptable for utility bills)</li>
              <li>File size limit: 10MB per document</li>
              <li>Self-declarations can be uploaded as signed PDF documents</li>
              <li>Ensure all documents are current and valid</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}











