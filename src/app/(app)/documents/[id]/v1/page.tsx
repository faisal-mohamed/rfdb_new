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
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);

  const documentId = params.id as string;
  const permissions = getSimplePermissions(session?.user?.role || 'VIEWER');
  const { showToast } = useToast();
  const canEdit = permissions.canEdit;
  const canProcess = permissions.canProcess;

  // Top-level section keys for left-side index (preserve original order)
  const topLevelKeys = useMemo(() => {
    if (!v1Data) return [] as string[];
    const rootKey = '';
    return orderMap[rootKey] ?? Object.keys(v1Data);
  }, [orderMap, v1Data]);

  useEffect(() => {
    setCurrentSectionIdx(0);
  }, [documentId]);

  const currentSectionKey = useMemo(() => topLevelKeys[currentSectionIdx] ?? null, [topLevelKeys, currentSectionIdx]);
  const currentSectionNode = useMemo(() => (currentSectionKey ? v1Data?.[currentSectionKey] : null), [v1Data, currentSectionKey]);

  const goPrev = useCallback(() => {
    setCurrentSectionIdx((idx) => Math.max(0, idx - 1));
  }, []);

  const goNext = useCallback(() => {
    setCurrentSectionIdx((idx) => Math.min(topLevelKeys.length - 1, idx + 1));
  }, [topLevelKeys.length]);

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
            className="w-full resize-y px-4 py-3 rounded-xl border border-white/40 bg-white/80 backdrop-blur-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 disabled:bg-gray-50"
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
            <div className={path.length === 0 ? 'text-base font-semibold text-slate-900 mb-3 tracking-wide' : 'text-sm font-semibold text-slate-800 mb-2 tracking-wide'}>
              {k}
            </div>
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
    <div className="min-h-screen relative">
      {/* Soft gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(59,130,246,0.12),transparent_40%),radial-gradient(ellipse_at_bottom_right,rgba(139,92,246,0.12),transparent_40%)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="relative mb-8">
          <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 rounded-2xl blur-xl"></div>
          <div className="relative bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow-xl p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
                  Version 1 · {document.fileName}
                </h1>
                <p className="text-slate-600">Customer: <span className="font-semibold text-slate-900">{document.customerName}</span></p>
                <div className="flex items-center gap-3">
                  <WorkflowStatusBadge status={document.workflowStatus} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                {!hasV1 && canProcess && (
                  <button
                    onClick={generateV1}
                    disabled={processing}
                    className="px-5 py-2.5 rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    {processing ? 'Generating V1…' : 'Generate Version 1'}
                  </button>
                )}
                <button
                  onClick={() => router.push('/documents')}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left sticky info / section index */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">Document Info</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-slate-500">Customer</div><div className="text-slate-900 font-medium">{document.customerName}</div>
                <div className="text-slate-500">Status</div><div className="text-slate-900 font-medium">{document.workflowStatus}</div>
              </div>
            </div>
            {hasV1 && v1Data && (
              <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow p-5 sticky top-6">
                <h2 className="text-sm font-semibold text-slate-900 mb-3">Sections</h2>
                <nav className="space-y-2">
                  {topLevelKeys.map((key, idx) => {
                    const active = idx === currentSectionIdx;
                    return (
                      <button
                        key={key}
                        onClick={() => setCurrentSectionIdx(idx)}
                        className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${active ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-slate-900 border border-indigo-200' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'}`}
                      >
                        {key}
                      </button>
                    );
                  })}
                </nav>
              </div>
            )}
          </aside>

          {/* Right editor */}
          <section className="lg:col-span-8 space-y-6">
            {/* Editor toolbar */}
            {hasV1 && canEdit && (
              <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow p-4 flex items-center justify-between">
                <div className="text-sm text-slate-600"></div>
                <div className="flex gap-3">
                  {/* <button
                    onClick={() => setV1Data(originalV1)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Reset
                  </button> */}
                  <button
                    onClick={async () => { await saveV1Changes(v1Data); }}
                    disabled={processing}
                    className="px-5 py-2.5 rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    Submit
                  </button>
                  <div className="w-px h-6 bg-slate-200" />
                  {/* <button
                    onClick={goPrev}
                    disabled={currentSectionIdx === 0}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={goNext}
                    disabled={currentSectionIdx >= topLevelKeys.length - 1}
                    className="px-5 py-2.5 rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    Next
                  </button> */}
                </div>
              </div>
            )}

            <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl shadow">
              <div className="p-6 section-anim">
                {hasV1 && v1Data && currentSectionKey ? (
                  <div className="space-y-4">
                    <div className="text-lg font-semibold text-slate-900">{currentSectionKey}</div>
                    <div className="space-y-6 modern-scrollbar">
                      {renderNode(currentSectionNode, [currentSectionKey as string])}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-slate-900">No Version 1 Available</h3>
                    <p className="mt-1 text-slate-500">
                      {canProcess 
                        ? 'Click "Generate Version 1" to create the initial document summary.'
                        : 'Version 1 has not been generated yet.'
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
      <style jsx global>{`
        .section-anim { animation: fadeSlideIn 240ms ease-out both; }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .modern-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .modern-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .modern-scrollbar::-webkit-scrollbar-thumb { background: linear-gradient(180deg, rgba(99,102,241,0.6), rgba(168,85,247,0.6)); border-radius: 9999px; }
      `}</style>
    </div>
  );
}
