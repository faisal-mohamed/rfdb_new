"use client";

import { useState, useEffect } from "react";
import { VendorQualificationFormData } from "@/types/vendor";
import { apiGet } from "@/lib/api";

interface Props {
  data: Partial<VendorQualificationFormData>;
  qualificationId: string | null;
}

interface Document {
  id: string;
  documentType: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

export default function ReviewSubmitSection({ data, qualificationId }: Props) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  useEffect(() => {
    if (qualificationId) {
      fetchDocuments();
    }
  }, [qualificationId]);

  const fetchDocuments = async () => {
    setIsLoadingDocs(true);
    try {
      const response = await apiGet(`/api/vendor-qualification/${qualificationId}/documents`);
      if (response.ok) {
        const result = await response.json();
        setDocuments(result.documents || []);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const downloadDocument = async (docId: string, fileName: string) => {
    try {
      const response = await apiGet(`/api/vendor-qualification/${qualificationId}/documents/${docId}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Error downloading document');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getDocumentCategory = (documentType: string) => {
    // Compliance Documents (Step 5)
    if (documentType.includes('business_continuity') || documentType.includes('audited_accounts') || 
        documentType.includes('memorandum') || documentType.includes('cr12') ||
        documentType.includes('bank_confirmation') || documentType.includes('incorporation') ||
        documentType.includes('pacra') || documentType.includes('tax_certificate') ||
        documentType.includes('utility') || documentType.includes('reference_letter') ||
        documentType.includes('vat') || documentType.includes('gst') ||
        documentType.includes('trading') || documentType.includes('tax_clearance') ||
        documentType.includes('manufacturer') || documentType.includes('declaration')) {
      return 'Compliance Documents';
    }
    // Financial Documents (Step 6)
    if (documentType.includes('financial_statement') || documentType.includes('balance_sheet') ||
        documentType.includes('profit_loss') || documentType.includes('organogram') ||
        documentType.includes('organizational') || documentType.includes('personnel_cv')) {
      return 'Financial Documents';
    }
    return 'Other Documents';
  };

  const groupedDocuments = documents.reduce((acc, doc) => {
    const category = getDocumentCategory(doc.documentType);
    if (!acc[category]) acc[category] = [];
    acc[category].push(doc);
    return acc;
  }, {} as Record<string, Document[]>);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Review & Submit</h2>
        <p className="text-slate-600">Review all information before final submission</p>
      </div>

      {/* General Information Review - COMPLETE */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">General Information</h3>
        <div className="bg-slate-50 rounded-lg p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-slate-600">Organization Name</p>
            <p className="font-semibold text-slate-900">{data.organizationName || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Incorporation Date</p>
            <p className="font-semibold text-slate-900">
              {data.incorporationDate ? new Date(data.incorporationDate).toLocaleDateString() : '-'}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Email</p>
            <p className="font-semibold text-slate-900">{data.email || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Telephone</p>
            <p className="font-semibold text-slate-900">{data.telephone || '-'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-slate-600">Main Business Activity</p>
            <p className="font-semibold text-slate-900">{data.mainBusinessActivity || '-'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-slate-600">Postal Address</p>
            <p className="font-semibold text-slate-900 whitespace-pre-line">{data.postalAddress || '-'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-slate-600">Location of Registered Office</p>
            <p className="font-semibold text-slate-900 whitespace-pre-line">{data.registeredOfficeLocation || '-'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-slate-600">Brief Description of Business</p>
            <p className="font-semibold text-slate-900 whitespace-pre-line">{data.businessDescription || '-'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-slate-600">Name and Address of Bankers</p>
            <p className="font-semibold text-slate-900 whitespace-pre-line">{data.bankersInfo || '-'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-slate-600">Name and Address of Insurers</p>
            <p className="font-semibold text-slate-900 whitespace-pre-line">{data.insurersInfo || '-'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-slate-600">Company Auditors</p>
            <p className="font-semibold text-slate-900">{data.companyAuditors || '-'}</p>
          </div>
        </div>
      </div>

      {/* Banking Details Review - COMPLETE */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Banking Details</h3>
        <div className="bg-slate-50 rounded-lg p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-slate-600">Bank Name</p>
            <p className="font-semibold text-slate-900">{data.bankName || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Account Number</p>
            <p className="font-semibold text-slate-900">{data.accountNumber || '-'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-slate-600">Branch</p>
            <p className="font-semibold text-slate-900">{data.branch || '-'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-slate-600">Authorized Signatories</p>
            {data.authorizedSignatories && data.authorizedSignatories.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {data.authorizedSignatories.map((signatory, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                  >
                    {signatory}
                  </span>
                ))}
              </div>
            ) : (
              <p className="font-semibold text-slate-900 text-slate-400">-</p>
            )}
          </div>
        </div>
      </div>

      {/* Directors Review */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">
          Directors ({data.directors?.length || 0})
        </h3>
        {data.directors && data.directors.length > 0 ? (
          <div className="space-y-3">
            {data.directors.map((director, index) => (
              <div key={index} className="bg-slate-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Name</p>
                    <p className="font-semibold text-slate-900">{director.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Position</p>
                    <p className="font-semibold text-slate-900">{director.position || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Contact</p>
                    <p className="font-semibold text-slate-900">{director.contact || '-'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">No directors added</p>
        )}
      </div>

      {/* Contact Person Review */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Contact Person</h3>
        <div className="bg-slate-50 rounded-lg p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-slate-600">Name</p>
            <p className="font-semibold text-slate-900">{data.contactPersonName || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Email</p>
            <p className="font-semibold text-slate-900">{data.contactPersonEmail || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Phone</p>
            <p className="font-semibold text-slate-900">{data.contactPersonPhone || '-'}</p>
          </div>
        </div>
      </div>

      {/* References Review */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">
          Bank References ({data.references?.length || 0})
        </h3>
        {data.references && data.references.length > 0 ? (
          <div className="space-y-3">
            {data.references.map((reference, index) => (
              <div key={index} className="bg-slate-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">S.No</p>
                    <p className="font-semibold text-slate-900">{reference.serialNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Bank Name</p>
                    <p className="font-semibold text-slate-900">{reference.bankName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Contact Person</p>
                    <p className="font-semibold text-slate-900">{reference.contactPerson}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Details</p>
                    <p className="font-semibold text-slate-900 text-sm">{reference.contactDetails}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">No references added</p>
        )}
      </div>

      {/* Employee Strength Review */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Employee Strength</h3>
        <div className="bg-slate-50 rounded-lg p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{data.totalEmployees || 0}</p>
              <p className="text-sm text-slate-600 mt-1">Total Employees</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{data.managementTeam || 0}</p>
              <p className="text-sm text-slate-600 mt-1">Management</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">{data.technicalTeam || 0}</p>
              <p className="text-sm text-slate-600 mt-1">Technical</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">{data.nonTechnicalTeam || 0}</p>
              <p className="text-sm text-slate-600 mt-1">Non-Technical</p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Personnel Review - COMPLETE */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">
          Key Personnel ({data.personnel?.length || 0})
        </h3>
        {data.personnel && data.personnel.length > 0 ? (
          <div className="space-y-3">
            {data.personnel.map((person, index) => (
              <div key={index} className="bg-slate-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Name</p>
                    <p className="font-semibold text-slate-900">{person.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Role</p>
                    <p className="font-semibold text-slate-900">{person.role}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Qualification</p>
                    <p className="font-semibold text-slate-900">{person.qualification}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Experience</p>
                    <p className="font-semibold text-slate-900">{person.experience}</p>
                  </div>
                  {person.cvContent && (
                    <div className="md:col-span-4">
                      <p className="text-sm text-slate-600">CV Summary</p>
                      <p className="font-medium text-slate-900 text-sm whitespace-pre-line mt-1 bg-white p-3 rounded border border-slate-200">
                        {person.cvContent}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">No personnel added</p>
        )}
      </div>

      {/* Uploaded Documents Review - Step 5 & 6 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">
          Uploaded Documents ({documents.length} files)
        </h3>
        {isLoadingDocs ? (
          <div className="bg-slate-50 rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-slate-600 mt-2">Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="bg-slate-50 rounded-lg p-6 text-center">
            <p className="text-slate-500">No documents uploaded yet</p>
            <p className="text-sm text-slate-400 mt-1">
              Documents uploaded in Steps 5 and 6 will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedDocuments).map(([category, docs]) => (
              <div key={category} className="bg-slate-50 rounded-lg p-6">
                <h4 className="font-semibold text-slate-800 mb-4">{category}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {docs.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 text-sm truncate" title={doc.fileName}>
                            {doc.fileName}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {doc.documentType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {formatFileSize(doc.fileSize)} • {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => downloadDocument(doc.id, doc.fileName)}
                        className="mt-2 w-full px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submission Checklist */}
      {/* <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">📋 Submission Checklist</h3>
        <div className="space-y-2">
          {[
            { label: 'General information completed', checked: !!data.organizationName && !!data.incorporationDate },
            { label: 'Banking details provided', checked: !!data.bankName && !!data.accountNumber },
            { label: 'At least one director added', checked: (data.directors?.length || 0) > 0 },
            { label: 'Authorized signatories added', checked: (data.authorizedSignatories?.length || 0) > 0 },
            { label: 'Contact person details filled', checked: !!data.contactPersonName },
            { label: 'At least one reference provided', checked: (data.references?.length || 0) > 0 },
            { label: 'Employee strength filled', checked: !!data.totalEmployees && data.totalEmployees > 0 },
            { label: 'Documents uploaded', checked: documents.length > 0 }
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                item.checked ? 'bg-green-500 text-white' : 'bg-slate-300 text-slate-500'
              }`}>
                {item.checked ? '✓' : '○'}
              </div>
              <span className={item.checked ? 'text-slate-700 font-medium' : 'text-slate-500'}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div> */}

      {/* Final Note */}
      {/* <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-amber-600 text-xl">⚠️</div>
          <div>
            <h3 className="font-semibold text-amber-900 mb-1">Before Submission</h3>
            <p className="text-sm text-amber-800">
              Please ensure all information is accurate and all required documents are uploaded. 
              Once submitted, you will not be able to edit the qualification form.
            </p>
          </div>
        </div>
      </div> */}
    </div>
  );
}











