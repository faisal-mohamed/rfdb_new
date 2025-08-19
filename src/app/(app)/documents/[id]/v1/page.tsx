'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
// Raw JSON textarea editor (no component)
import WorkflowStatusBadge from '@/components/WorkflowStatusBadge';
import { useToast } from '@/components/ui/Toast';
import { DocumentWithWorkflow, VersionType, WorkflowStatus } from '@/types/workflow';
import { getSimplePermissions } from '@/lib/simplePermissions';

export default function DocumentV1Page() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [document, setDocument] = useState<DocumentWithWorkflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [v1Data, setV1Data] = useState<any>(null);
  const [originalV1, setOriginalV1] = useState<any>(null);
  const [orderMap, setOrderMap] = useState<Record<string, string[]>>({});

  const documentId = params.id as string;
  const permissions = getSimplePermissions(session?.user?.role || 'VIEWER');
  const { showToast } = useToast();
  const canEdit = permissions.canEdit;
  const canProcess = permissions.canProcess;

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
          setOriginalV1(v1Version.jsonContent);
          // Capture original key order for all nodes
          const map: Record<string, string[]> = {};
          const toKey = (path: string[]) => path.map(seg => encodeURIComponent(seg)).join('|');
          const walk = (node: any, path: string[]) => {
            if (node && typeof node === 'object' && !Array.isArray(node) && !('extracted_data' in node && 'pages' in node)) {
              const k = toKey(path);
              map[k] = Object.keys(node);
              for (const childKey of map[k]) {
                walk(node[childKey], [...path, childKey]);
              }
            }
          };
          walk(v1Version.jsonContent, []);
          setOrderMap(map);
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
        showToast({ variant: 'success', message: 'Version 1 generated successfully!' });
      } else {
        showToast({ variant: 'error', message: result.error || 'Failed to generate V1' });
      }
    } catch (error) {
      console.error('Generate V1 error:', error);
      showToast({ variant: 'error', message: 'An error occurred while generating Version 1' });
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
        // Mark V1 as completed on submit
        await completeV1Inline(v1Version.id);
        // If V2 exists already, do nothing here (no regenerate prompt from V1)
        const v2Exists = document.versions?.some(v => v.versionType === VersionType.VERSION_2);
        if (!v2Exists && permissions.canProcess) {
          await generateV2Inline();
        }
        // Navigate to details page after submit
        router.push(`/documents/${documentId}`);
      } else {
        showToast({ variant: 'error', message: result.error || 'Failed to save V1' });
      }
    } catch (error) {
      console.error('Save V1 error:', error);
      showToast({ variant: 'error', message: 'An error occurred while saving Version 1' });
    } finally {
      setProcessing(false);
    }
  };

  const generateV2 = () => {
    router.push(`/documents/${documentId}/v2?generateNew=true`);
  };

  const generateV2Inline = async () => {
    setProcessing(true);
    try {
      const response = await fetch('/api/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'process_v2', documentId }),
      });
      const result = await response.json();
      if (result.success) {
        showToast({ variant: 'success', message: 'Version 2 generated successfully!' });
      } else {
        showToast({ variant: 'error', message: result.error || 'Failed to generate V2' });
      }
    } catch (e) {
      console.error('Generate V2 inline error:', e);
      showToast({ variant: 'error', message: 'An error occurred while generating Version 2' });
    } finally {
      setProcessing(false);
    }
  };

  const completeV1Inline = async (versionId: string) => {
    try {
      const response = await fetch('/api/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete_v1', documentId, versionId }),
      });
      const result = await response.json();
      if (!result.success) {
        console.error('Complete V1 error:', result.error);
        showToast({ variant: 'error', message: 'An error occurred while submitting V1' });
      }
    } catch (e) {
      console.error('Complete V1 request error:', e);
      showToast({ variant: 'error', message: 'An error occurred while submitting V1' });
    }
  };

  const toKey = useCallback((path: string[]) => path.map(seg => encodeURIComponent(seg)).join('|'), []);
  const isLeaf = (node: any) => node && typeof node === 'object' && 'extracted_data' in node && 'pages' in node;
  const updateExtractedData = useCallback((path: string[], value: string) => {
    const updateRecursive = (node: any, depth: number): any => {
      if (isLeaf(node) && depth === path.length) {
        return { ...node, extracted_data: value };
      }
      const keyAt = path[depth];
      const child = node?.[keyAt];
      if (child === undefined) return node;
      const nextChild = updateRecursive(child, depth + 1);
      if (nextChild === child) return node;
      // rebuild preserving original order
      const keys = Object.keys(node);
      const out: any = {};
      for (const k of keys) out[k] = k === keyAt ? nextChild : node[k];
      return out;
    };
    setV1Data((prev: any) => updateRecursive(prev, 0));
  }, []);

  const renderNode = useCallback((node: any, path: string[] = []): React.ReactElement => {
    if (isLeaf(node)) {
      const pagesText = (node.pages as number[]).join(', ');
      return (
        <div className="space-y-2">
          <textarea
            value={node.extracted_data}
            onChange={(e) => updateExtractedData(path, e.target.value)}
            disabled={!canEdit}
            rows={5}
            className="w-full resize-y px-4 py-3 rounded-lg border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
          />
          <div className="text-xs text-gray-500">Pages: {pagesText || '-'}</div>
        </div>
      );
    }
    const pathKey = toKey(path);
    const keysInOrder = orderMap[pathKey] ?? Object.keys(node ?? {});
    return (
      <div className="space-y-6">
        {keysInOrder.map((k) => (
          <div key={toKey([...path, k])} className="">
            <div className="text-sm font-semibold text-gray-800 mb-2">{k}</div>
            {renderNode(node[k], [...path, k])}
          </div>
        ))}
      </div>
    );
  }, [canEdit, orderMap, toKey, updateExtractedData]);

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

              {/* Intentionally no V2 actions here per requested flow */}
            </div>
          </div>
        </div>

        {/* V1 Content - Per-field textareas based on incoming order */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Version 1 - Edit Extracted Data</h3>
            {hasV1 && canEdit && (
              <div className="flex gap-3">
                <button
                  onClick={() => setV1Data(originalV1)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Reset
                </button>
                <button
                  onClick={async () => {
                    await saveV1Changes(v1Data);
                  }}
                  disabled={processing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Submit
                </button>
              </div>
            )}
          </div>

          <div className="p-6">
            {hasV1 && v1Data ? (
              <div className="space-y-6">
                {renderNode(v1Data, [])}
              </div>
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
