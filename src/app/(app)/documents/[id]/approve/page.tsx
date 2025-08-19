'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import JsonEditor from '@/components/JsonEditor';
import WorkflowStatusBadge from '@/components/WorkflowStatusBadge';
import { DocumentWithWorkflow, VersionType, WorkflowStatus } from '@/types/workflow';
import { getSimplePermissions } from '@/lib/simplePermissions';

export default function DocumentApprovePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [document, setDocument] = useState<DocumentWithWorkflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const { showToast } = useToast();

  const documentId = params.id as string;
  const permissions = getSimplePermissions(session?.user?.role || 'VIEWER');

  useEffect(() => {
    if (documentId) {
      fetchDocument();
    }
  }, [documentId]);

  useEffect(() => {
    // Redirect if user doesn't have approval permissions
    if (!loading && !permissions.canApprove) {
      router.push(`/documents/${documentId}/v2`);
    }
  }, [loading, permissions.canApprove, router, documentId]);

  const fetchDocument = async () => {
    try {
      const response = await fetch(`/api/workflow?documentId=${documentId}`);
      const result = await response.json();
      
      if (result.success) {
        setDocument(result.data);
      } else {
        console.error('Failed to fetch document:', result.error);
      }
    } catch (error) {
      console.error('Error fetching document:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveDocument = async () => {
    if (!document) return;
    
    const v2Version = document.versions?.find(v => v.versionType === VersionType.VERSION_2);
    if (!v2Version) return;

    setProcessing(true);
    try {
      const response = await fetch('/api/workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'approve',
          documentId,
          versionId: v2Version.id,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        showToast({ variant: 'success', message: 'Document approved successfully!' });
        await fetchDocument(); // Refresh document data
      } else {
        showToast({ variant: 'error', message: result.error || 'Failed to approve document' });
      }
    } catch (error) {
      console.error('Approve document error:', error);
      showToast({ variant: 'error', message: 'An error occurred while approving the document' });
    } finally {
      setProcessing(false);
    }
  };

  const generateWordDocument = async () => {
    if (!document) return;
    
    const v2Version = document.versions?.find(v => v.versionType === VersionType.VERSION_2);
    if (!v2Version) return;

    setProcessing(true);
    try {
      const response = await fetch('/api/workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate_document',
          documentId,
          versionId: v2Version.id,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        showToast({ variant: 'success', message: 'Word document generated successfully!' });
        await fetchDocument(); // Refresh document data
      } else {
        showToast({ variant: 'error', message: result.error || 'Failed to generate Word document' });
      }
    } catch (error) {
      console.error('Generate document error:', error);
      showToast({ variant: 'error', message: 'An error occurred while generating the Word document' });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Document Not Found</h2>
          <p className="text-gray-600">The requested document could not be found.</p>
        </div>
      </div>
    );
  }

  if (!permissions.canApprove) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You do not have permission to approve documents.</p>
        </div>
      </div>
    );
  }

  const v1Version = document.versions?.find(v => v.versionType === VersionType.VERSION_1);
  const v2Version = document.versions?.find(v => v.versionType === VersionType.VERSION_2);
  const canApprove = document.workflowStatus === WorkflowStatus.V2_COMPLETED;
  const isApproved = document.workflowStatus === WorkflowStatus.APPROVED;
  const isCompleted = document.workflowStatus === WorkflowStatus.COMPLETED;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Document Approval - {document.fileName}
                </h1>
                <p className="text-gray-600 mt-1">Customer: {document.customerName}</p>
              </div>
              <div className="flex items-center space-x-4">
                <WorkflowStatusBadge status={document.workflowStatus} />
                <button
                  onClick={() => router.push('/documents')}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Back to Documents
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-6 py-4">
            <div className="flex flex-wrap gap-3">
              {/* Approve Button */}
              {canApprove && (
                <button
                  onClick={approveDocument}
                  disabled={processing}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {processing ? 'Approving...' : 'Approve Document'}
                </button>
              )}

              {/* Generate Word Document Button */}
              {isApproved && (
                <button
                  onClick={generateWordDocument}
                  disabled={processing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {processing ? 'Generating...' : 'Generate Word Document'}
                </button>
              )}

              {/* View Buttons */}
              <button
                onClick={() => router.push(`/documents/${documentId}/v1`)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                View Version 1
              </button>
              
              <button
                onClick={() => router.push(`/documents/${documentId}/v2`)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                View Version 2
              </button>
            </div>
          </div>
        </div>

        {/* Status Information */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Approval Status</h3>
            
            {!canApprove && !isApproved && !isCompleted && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Document Not Ready for Approval
                    </h3>
                    <p className="mt-1 text-sm text-yellow-700">
                      Version 2 must be completed before the document can be approved.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {canApprove && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Ready for Approval
                    </h3>
                    <p className="mt-1 text-sm text-blue-700">
                      Version 2 has been completed and is ready for your approval.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isApproved && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Document Approved
                    </h3>
                    <p className="mt-1 text-sm text-green-700">
                      This document has been approved and is ready for Word document generation.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isCompleted && (
              <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
                <div className="flex">
                  <svg className="h-5 w-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-purple-800">
                      Process Completed
                    </h3>
                    <p className="mt-1 text-sm text-purple-700">
                      The document has been approved and the Word document has been generated.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Document Versions Review */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Version 1 */}
          {v1Version && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Version 1 Review</h3>
              </div>
              <div className="p-6">
                <JsonEditor
                  initialData={v1Version.jsonContent}
                  onSave={() => {}}
                  onCancel={() => {}}
                  isReadOnly={true}
                />
              </div>
            </div>
          )}

          {/* Version 2 */}
          {v2Version && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Version 2 Review</h3>
              </div>
              <div className="p-6">
                <JsonEditor
                  initialData={v2Version.jsonContent}
                  onSave={() => {}}
                  onCancel={() => {}}
                  isReadOnly={true}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
