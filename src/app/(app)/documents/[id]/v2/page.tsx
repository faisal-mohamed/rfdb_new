'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import JsonEditor from '@/components/JsonEditor';
import WorkflowStatusBadge from '@/components/WorkflowStatusBadge';
import { DocumentWithWorkflow, VersionType, WorkflowStatus } from '@/types/workflow';
import { getSimplePermissions } from '@/lib/simplePermissions';

export default function DocumentV2Page() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [document, setDocument] = useState<DocumentWithWorkflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [v2Data, setV2Data] = useState<any>(null);

  const documentId = params.id as string;
  const generateNew = searchParams.get('generateNew') === 'true';
  const permissions = getSimplePermissions(session?.user?.role || 'VIEWER');

  useEffect(() => {
    if (documentId) {
      fetchDocument();
    }
  }, [documentId]);

  useEffect(() => {
    // Auto-generate V2 if requested from V1 page
    if (generateNew && document && permissions.canProcess) {
      generateV2();
    }
  }, [generateNew, document, permissions.canProcess]);

  const fetchDocument = async () => {
    try {
      const response = await fetch(`/api/workflow?documentId=${documentId}`);
      const result = await response.json();
      
      if (result.success) {
        setDocument(result.data);
        const v2Version = result.data.versions?.find((v: any) => v.versionType === VersionType.VERSION_2);
        if (v2Version) {
          setV2Data(v2Version.jsonContent);
        }
      } else {
        console.error('Failed to fetch document:', result.error);
      }
    } catch (error) {
      console.error('Error fetching document:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateV2 = async () => {
    if (!document) return;
    
    setProcessing(true);
    try {
      const response = await fetch('/api/workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'process_v2',
          documentId,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        await fetchDocument(); // Refresh to get the new V2 data
        alert('Version 2 generated successfully!');
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Generate V2 error:', error);
      alert('An error occurred while generating Version 2');
    } finally {
      setProcessing(false);
    }
  };

  const saveV2Changes = async (updatedData: any) => {
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
          action: 'save_v2',
          documentId,
          versionId: v2Version.id,
          jsonContent: updatedData
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setV2Data(updatedData);
        setHasChanges(false);
        alert('Version 2 saved successfully!');
        await fetchDocument(); // Refresh document data
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Save V2 error:', error);
      alert('An error occurred while saving Version 2');
    } finally {
      setProcessing(false);
    }
  };

  const requestApproval = async () => {
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
          action: 'complete_v2',
          documentId,
          versionId: v2Version.id,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Version 2 submitted for approval!');
        await fetchDocument(); // Refresh document data
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Request approval error:', error);
      alert('An error occurred while requesting approval');
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

  const v1Version = document.versions?.find(v => v.versionType === VersionType.VERSION_1);
  const v2Version = document.versions?.find(v => v.versionType === VersionType.VERSION_2);
  const hasV1 = !!v1Version;
  const hasV2 = !!v2Version;
  const canEdit = permissions.canEdit;
  const canProcess = permissions.canProcess;
  const canApprove = permissions.canApprove;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Version 2 - {document.fileName}
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
              {/* Generate V2 Button */}
              {hasV1 && !hasV2 && canProcess && (
                <button
                  onClick={generateV2}
                  disabled={processing}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {processing ? 'Generating V2...' : 'Generate Version 2'}
                </button>
              )}

              {/* Regenerate V2 Button */}
              {hasV1 && hasV2 && canProcess && (
                <button
                  onClick={generateV2}
                  disabled={processing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {processing ? 'Regenerating V2...' : 'Regenerate Version 2'}
                </button>
              )}

              {/* Request Approval Button */}
              {hasV2 && canEdit && document.workflowStatus !== WorkflowStatus.V2_COMPLETED && (
                <button
                  onClick={requestApproval}
                  disabled={processing}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  Request Approval
                </button>
              )}

              {/* Approve Button */}
              {hasV2 && canApprove && document.workflowStatus === WorkflowStatus.V2_COMPLETED && (
                <button
                  onClick={() => router.push(`/documents/${documentId}/approve`)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                >
                  Approve Document
                </button>
              )}

              {/* View V1 Button */}
              <button
                onClick={() => router.push(`/documents/${documentId}/v1`)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                View Version 1
              </button>
            </div>
          </div>
        </div>

        {/* V2 Content */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              Version 2 - Refined Document Summary
              {hasChanges && canEdit && (
                <span className="ml-2 text-sm text-orange-600">(Unsaved changes)</span>
              )}
            </h3>
          </div>

          <div className="p-6">
            {!hasV1 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">Version 1 Required</h3>
                <p className="mt-1 text-gray-500">
                  Version 1 must be generated before creating Version 2.
                </p>
                <button
                  onClick={() => router.push(`/documents/${documentId}/v1`)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Go to Version 1
                </button>
              </div>
            ) : hasV2 && v2Data ? (
              <JsonEditor
                initialData={v2Data}
                onSave={saveV2Changes}
                onCancel={() => {
                  setV2Data(v2Version?.jsonContent);
                  setHasChanges(false);
                }}
                isReadOnly={!canEdit}
              />
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No Version 2 Available</h3>
                <p className="mt-1 text-gray-500">
                  {canProcess 
                    ? 'Click "Generate Version 2" to create the refined document summary.'
                    : 'Version 2 has not been generated yet.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
