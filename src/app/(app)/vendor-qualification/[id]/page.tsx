"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { VendorQualification } from "@/types/vendor";
import { apiGet } from "@/lib/api";

export default function VendorQualificationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [qualification, setQualification] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      fetchQualification();
    }
  }, [id]);

  const fetchQualification = async () => {
    setIsLoading(true);
    try {
      const response = await apiGet(`/api/vendor-qualification/${id}`);
      if (response.ok) {
        const data = await response.json();
        setQualification(data);
      } else {
        setError("Failed to load qualification");
      }
    } catch (error) {
      console.error("Error fetching qualification:", error);
      setError("Error loading qualification");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      DRAFT: 'bg-slate-100 text-slate-700',
      SUBMITTED: 'bg-blue-100 text-blue-700',
      UNDER_REVIEW: 'bg-yellow-100 text-yellow-700',
      APPROVED: 'bg-green-100 text-green-700',
      REJECTED: 'bg-red-100 text-red-700'
    };
    return colors[status as keyof typeof colors] || 'bg-slate-100 text-slate-700';
  };

  const downloadDocument = async (docId: string, fileName: string) => {
    try {
      const response = await apiGet(`/api/vendor-qualification/${id}/documents/${docId}`);
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
      } else {
        alert('Failed to download document');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Error downloading document');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-slate-600">Loading qualification details...</p>
        </div>
      </div>
    );
  }

  if (error || !qualification) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Error Loading Qualification</h2>
          <p className="text-slate-600">{error}</p>
          <Link
            href="/vendor-qualification/list"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to List
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-lexend">
      {/* Header */}
      <div className="relative">
        <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 rounded-2xl blur-xl"></div>
        <div className="relative bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl shadow-xl p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700 bg-clip-text text-transparent">
                  {qualification.organizationName}
                </h1>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(qualification.status)}`}>
                  {qualification.status}
                </span>
              </div>
              <p className="text-slate-600 font-medium">{qualification.mainBusinessActivity}</p>
              <div className="w-16 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
            </div>

            <div className="flex items-center gap-3">
              {qualification.status === 'DRAFT' && (
                <Link
                  href={`/vendor-qualification?id=${id}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Edit Draft
                </Link>
              )}
              <Link
                href="/vendor-qualification/list"
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
              >
                Back to List
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* General Information */}
      <div className="bg-white/90 backdrop-blur-xl border border-white/30 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4 border-b pb-2">General Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-semibold text-slate-600">Incorporation Date</p>
            <p className="text-slate-900 mt-1">{new Date(qualification.incorporationDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-600">Email</p>
            <p className="text-slate-900 mt-1">{qualification.email}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-600">Telephone</p>
            <p className="text-slate-900 mt-1">{qualification.telephone}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-600">Company Auditors</p>
            <p className="text-slate-900 mt-1">{qualification.companyAuditors}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm font-semibold text-slate-600">Postal Address</p>
            <p className="text-slate-900 mt-1">{qualification.postalAddress}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm font-semibold text-slate-600">Registered Office Location</p>
            <p className="text-slate-900 mt-1">{qualification.registeredOfficeLocation}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm font-semibold text-slate-600">Business Description</p>
            <p className="text-slate-900 mt-1">{qualification.businessDescription}</p>
          </div>
        </div>
      </div>

      {/* Banking Details */}
      <div className="bg-white/90 backdrop-blur-xl border border-white/30 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4 border-b pb-2">Banking Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-semibold text-slate-600">Bank</p>
            <p className="text-slate-900 mt-1">{qualification.bankName}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-600">Account Number</p>
            <p className="text-slate-900 mt-1">{qualification.accountNumber}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm font-semibold text-slate-600">Branch</p>
            <p className="text-slate-900 mt-1">{qualification.branch}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm font-semibold text-slate-600">Authorized Signatories</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {qualification.authorizedSignatories?.map((signatory: string, index: number) => (
                <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  {signatory}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Directors */}
      {qualification.directors && qualification.directors.length > 0 && (
        <div className="bg-white/90 backdrop-blur-xl border border-white/30 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4 border-b pb-2">Directors ({qualification.directors.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Position</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {qualification.directors.map((director: any, index: number) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-900">{director.name}</td>
                    <td className="px-4 py-3 text-slate-600">{director.position || '-'}</td>
                    <td className="px-4 py-3 text-slate-600">{director.contact || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Contact Person */}
      <div className="bg-white/90 backdrop-blur-xl border border-white/30 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4 border-b pb-2">Contact Person</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm font-semibold text-slate-600">Name</p>
            <p className="text-slate-900 mt-1">{qualification.contactPersonName}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-600">Email</p>
            <p className="text-slate-900 mt-1">{qualification.contactPersonEmail}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-600">Phone</p>
            <p className="text-slate-900 mt-1">{qualification.contactPersonPhone}</p>
          </div>
        </div>
      </div>

      {/* References */}
      {qualification.references && qualification.references.length > 0 && (
        <div className="bg-white/90 backdrop-blur-xl border border-white/30 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4 border-b pb-2">Bank References ({qualification.references.length})</h2>
          <div className="space-y-4">
            {qualification.references.map((reference: any) => (
              <div key={reference.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-600">S.No</p>
                    <p className="text-slate-900 mt-1">{reference.serialNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-600">Bank Name</p>
                    <p className="text-slate-900 mt-1">{reference.bankName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-600">Contact Person</p>
                    <p className="text-slate-900 mt-1">{reference.contactPerson}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-600">Contact Details</p>
                    <p className="text-slate-900 mt-1 text-sm">{reference.contactDetails}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Employee Strength */}
      <div className="bg-white/90 backdrop-blur-xl border border-white/30 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4 border-b pb-2">Employee Strength</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
            <p className="text-3xl font-bold text-blue-600">{qualification.totalEmployees}</p>
            <p className="text-sm text-slate-600 mt-2">Total Employees</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
            <p className="text-3xl font-bold text-green-600">{qualification.managementTeam}</p>
            <p className="text-sm text-slate-600 mt-2">Management</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
            <p className="text-3xl font-bold text-purple-600">{qualification.technicalTeam}</p>
            <p className="text-sm text-slate-600 mt-2">Technical</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg">
            <p className="text-3xl font-bold text-orange-600">{qualification.nonTechnicalTeam}</p>
            <p className="text-sm text-slate-600 mt-2">Non-Technical</p>
          </div>
        </div>
      </div>

      {/* Key Personnel */}
      {qualification.personnel && qualification.personnel.length > 0 && (
        <div className="bg-white/90 backdrop-blur-xl border border-white/30 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4 border-b pb-2">Key Personnel ({qualification.personnel.length})</h2>
          <div className="space-y-4">
            {qualification.personnel.map((person: any, index: number) => (
              <div key={index} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-600">Name</p>
                    <p className="text-slate-900 mt-1">{person.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-600">Role</p>
                    <p className="text-slate-900 mt-1">{person.role}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-600">Qualification</p>
                    <p className="text-slate-900 mt-1">{person.qualification}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-600">Experience</p>
                    <p className="text-slate-900 mt-1">{person.experience}</p>
                  </div>
                  {person.cvContent && (
                    <div className="md:col-span-4">
                      <p className="text-sm font-semibold text-slate-600">CV Summary</p>
                      <p className="text-slate-900 mt-1 text-sm">{person.cvContent}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents */}
      {qualification.documents && qualification.documents.length > 0 && (
        <div className="bg-white/90 backdrop-blur-xl border border-white/30 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4 border-b pb-2">Uploaded Documents ({qualification.documents.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {qualification.documents.map((doc: any) => (
              <div key={doc.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 text-sm">{doc.fileName}</p>
                    <p className="text-xs text-slate-500 mt-1">{doc.documentType.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-slate-500">{(doc.fileSize / 1024).toFixed(2)} KB</p>
                    <p className="text-xs text-slate-400">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => downloadDocument(doc.id, doc.fileName)}
                    className="ml-2 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Download"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submission Info */}
      {qualification.submittedAt && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold text-green-900">Submitted Successfully</p>
              <p className="text-sm text-green-700">
                Submitted on {new Date(qualification.submittedAt).toLocaleString()} by{' '}
                {qualification.submitter?.firstName} {qualification.submitter?.lastName}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}










