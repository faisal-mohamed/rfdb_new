'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import JsonEditor from '@/components/JsonEditor';
import WorkflowStatusBadge from '@/components/WorkflowStatusBadge';
import { DocumentWithWorkflow, VersionType, WorkflowStatus } from '@/types/workflow';
import { getSimplePermissions } from '@/lib/simplePermissions';

export default function DocumentV1Page() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [document, setDocument] = useState<DocumentWithWorkflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [v1Data, setV1Data] = useState<any>(null);

  const documentId = params.id as string;
  const permissions = getSimplePermissions(session?.user?.role || 'VIEWER');

  useEffect(() => {
    if (documentId) {
      fetchDocument();
    }
  }, [documentId]);

  const fetchDocument = async () => {
    try {
      const response = await fetch(`/api/workflow?documentId=${documentId}`);
      const result = await response.json();
      
      if (result.success) {
        setDocument(result.data);
        const v1Version = result.data.versions?.find((v: any) => v.versionType === VersionType.VERSION_1);
        if (v1Version) {
          setV1Data(v1Version.jsonContent);
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

  const generateV1 = async () => {
    if (!document) return;
    
    setProcessing(true);
    try {
      const response = await fetch('/api/workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'process_v1',
          documentId,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        await fetchDocument(); // Refresh to get the new V1 data
        alert('Version 1 generated successfully!');
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Generate V1 error:', error);
      alert('An error occurred while generating Version 1');
    } finally {
      setProcessing(false);
    }
  };

  const saveV1Changes = async (updatedData: any) => {
    if (!document) return;
    
    const v1Version = document.versions?.find(v => v.versionType === VersionType.VERSION_1);
    if (!v1Version) return;

    setProcessing(true);
    try {
      const response = await fetch('/api/workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'save_v1',
          documentId,
          versionId: v1Version.id,
          jsonContent: updatedData
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setV1Data(updatedData);
        setHasChanges(false);
        alert('Version 1 saved successfully!');
        await fetchDocument(); // Refresh document data
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Save V1 error:', error);
      alert('An error occurred while saving Version 1');
    } finally {
      setProcessing(false);
    }
  };

  const generateV2 = () => {
    router.push(`/documents/${documentId}/v2?generateNew=true`);
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
  const hasV1 = !!v1Version;
  const canEdit = permissions.canEdit;
  const canProcess = permissions.canProcess;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Version 1 - {document.fileName}
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
              {/* Generate V1 Button */}
              {!hasV1 && canProcess && (
                <button
                  onClick={generateV1}
                  disabled={processing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {processing ? 'Generating V1...' : 'Generate Version 1'}
                </button>
              )}

              {/* Generate V2 Button */}
              {hasV1 && canProcess && (
                <button
                  onClick={generateV2}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Generate Version 2
                </button>
              )}

              {/* View V2 Button */}
              <button
                onClick={() => router.push(`/documents/${documentId}/v2`)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                View Version 2
              </button>
            </div>
          </div>
        </div>

        {/* V1 Content */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              Version 1 - Document Summary
              {hasChanges && canEdit && (
                <span className="ml-2 text-sm text-orange-600">(Unsaved changes)</span>
              )}
            </h3>
          </div>

          <div className="p-6">
            {hasV1 && v1Data ? (
              <JsonEditor
                initialData={v1Data}
                onSave={saveV1Changes}
                onCancel={() => {
                  setV1Data(v1Version?.jsonContent);
                  setHasChanges(false);
                }}
                isReadOnly={!canEdit}
              />
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No Version 1 Available</h3>
                <p className="mt-1 text-gray-500">
                  {canProcess 
                    ? 'Click "Generate Version 1" to create the initial document summary.'
                    : 'Version 1 has not been generated yet.'
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
