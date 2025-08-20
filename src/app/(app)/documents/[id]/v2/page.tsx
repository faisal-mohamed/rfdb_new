

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/Toast';
import WorkflowStatusBadge from '@/components/WorkflowStatusBadge';
import { DocumentWithWorkflow, VersionType, WorkflowStatus } from '@/types/workflow';
import { getSimplePermissions } from '@/lib/simplePermissions';
import ConfirmDialog from '@/components/ui/ConfirmDialog';


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
  const [originalV2, setOriginalV2] = useState<any>(null);
  const [orderMap, setOrderMap] = useState<Record<string, string[]>>({});
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);

  const [approveOpen, setApproveOpen] = useState(false);


  const approveDocument = async () => {
    if (!document) return;
    const v2Version = document.versions?.find(v => v.versionType === VersionType.VERSION_2);
    if (!v2Version) return;
  
    setProcessing(true);
    try {
      const response = await fetch('/api/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          documentId,
          versionId: v2Version.id,
        }),
      });
  
      const result = await response.json();
      if (result.success) {
        showToast({ variant: 'success', message: 'Document approved successfully!' });
        await fetchDocument(); // refresh status to APPROVED
      } else {
        showToast({ variant: 'error', message: result.error || 'Failed to approve document' });
      }
    } catch (error) {
      console.error('Approve document error:', error);
      showToast({ variant: 'error', message: 'An error occurred while approving the document' });
    } finally {
      setProcessing(false);
      setApproveOpen(false);
    }
  };
  

  const { showToast } = useToast();

  const documentId = params.id as string;
  const generateNew = searchParams.get('generateNew') === 'true';
  const permissions = getSimplePermissions(session?.user?.role || 'VIEWER');
  const canEdit = permissions.canEdit;
  const canProcess = permissions.canProcess;
  const canApprove = permissions.canApprove;

  // Preserve top-level key order like V1
  const topLevelKeys = useMemo(() => {
    if (!v2Data) return [] as string[];
    const rootKey = '';
    return orderMap[rootKey] ?? Object.keys(v2Data);
  }, [orderMap, v2Data]);

  useEffect(() => {
    setCurrentSectionIdx(0);
  }, [documentId]);

  const currentSectionKey = useMemo(
    () => topLevelKeys[currentSectionIdx] ?? null,
    [topLevelKeys, currentSectionIdx]
  );
  const currentSectionNode = useMemo(
    () => (currentSectionKey ? v2Data?.[currentSectionKey] : null),
    [v2Data, currentSectionKey]
  );

  useEffect(() => {
    if (documentId) fetchDocument();
  }, [documentId]);

  useEffect(() => {
    // Auto-generate V2 if requested from V1 page
    if (generateNew && document && canProcess) generateV2();
  }, [generateNew, document, canProcess]);

  const fetchDocument = async () => {
    try {
      const response = await fetch(`/api/workflow?documentId=${documentId}`);
      const result = await response.json();

      if (result.success) {
        setDocument(result.data);
        const v2Version = result.data.versions?.find((v: any) => v.versionType === VersionType.VERSION_2);
        if (v2Version) {
          setV2Data(v2Version.jsonContent);
          setOriginalV2(v2Version.jsonContent);
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
          walk(v2Version.jsonContent, []);
          setOrderMap(map);
        } else {
          setV2Data(null);
          setOriginalV2(null);
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'process_v2', documentId }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchDocument(); // Refresh to get the new V2 data
        showToast({ variant: 'success', message: 'Version 2 generated successfully!' });
      } else {
        showToast({ variant: 'error', message: result.error || 'Failed to generate V2' });
      }
    } catch (error) {
      console.error('Generate V2 error:', error);
      showToast({ variant: 'error', message: 'An error occurred while generating Version 2' });
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_v2',
          documentId,
          versionId: v2Version.id,
          jsonContent: updatedData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setV2Data(updatedData);
        setHasChanges(false);
        showToast({ variant: 'success', message: 'Version 2 saved successfully!' });
        await fetchDocument();
      } else {
        showToast({ variant: 'error', message: result.error || 'Failed to save Version 2' });
      }
    } catch (error) {
      console.error('Save V2 error:', error);
      showToast({ variant: 'error', message: 'An error occurred while saving Version 2' });
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete_v2',
          documentId,
          versionId: v2Version.id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast({ variant: 'success', message: 'Version 2 submitted for approval!' });
        await fetchDocument();
      } else {
        showToast({ variant: 'error', message: result.error || 'Failed to submit for approval' });
      }
    } catch (error) {
      console.error('Request approval error:', error);
      showToast({ variant: 'error', message: 'An error occurred while requesting approval' });
    } finally {
      setProcessing(false);
    }
  };

  const goPrev = useCallback(() => {
    setCurrentSectionIdx(idx => Math.max(0, idx - 1));
  }, []);
  const goNext = useCallback(() => {
    setCurrentSectionIdx(idx => Math.min(topLevelKeys.length - 1, idx + 1));
  }, [topLevelKeys.length]);

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
      const keys = Object.keys(node);
      const out: any = {};
      for (const k of keys) out[k] = k === keyAt ? nextChild : node[k];
      return out;
    };
    setV2Data((prev: any) => updateRecursive(prev, 0));
    setHasChanges(true);
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
          <div key={toKey([...path, k])}>
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
  const v2Version = document.versions?.find(v => v.versionType === VersionType.VERSION_2);
  const hasV1 = !!v1Version;
  const hasV2 = !!v2Version;

  return (
    <div className="min-h-screen relative">
      {/* Soft gradient background (matches V1) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(59,130,246,0.12),transparent_40%),radial-gradient(ellipse_at_bottom_right,rgba(139,92,246,0.12),transparent_40%)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header (matches V1 card) */}
        <div className="relative mb-8">
          <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 rounded-2xl blur-xl"></div>
          <div className="relative bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow-xl p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
                  Version 2 · {document.fileName}
                </h1>
                <p className="text-slate-600">
                  Customer: <span className="font-semibold text-slate-900">{document.customerName}</span>
                </p>
                <div className="flex items-center gap-3">
                  <WorkflowStatusBadge status={document.workflowStatus} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Generate / Regenerate */}
                {/* {hasV1 && !hasV2 && canProcess && (
                  <button
                    onClick={generateV2}
                    disabled={processing}
                    className="px-5 py-2.5 rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    {processing ? 'Generating V2…' : 'Generate Version 2'}
                  </button>
                )}
                {hasV1 && hasV2 && canProcess && (
                  <button
                    onClick={generateV2}
                    disabled={processing}
                    className="px-5 py-2.5 rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    {processing ? 'Regenerating V2…' : 'Regenerate Version 2'}
                  </button>
                )} */}

                {/* Request Approval / Approve */}
                {hasV2 && canEdit && document.workflowStatus !== WorkflowStatus.V2_COMPLETED && (
                  <button
                    onClick={requestApproval}
                    disabled={processing}
                    className="px-5 py-2.5 rounded-xl text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    Request Approval
                  </button>
                )}

{hasV2 && canApprove && document.workflowStatus === WorkflowStatus.V2_COMPLETED && (
  <button
    onClick={() => setApproveOpen(true)}
    disabled={processing}
    className="px-5 py-2.5 rounded-xl text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
  >
    {processing ? 'Approving…' : 'Approve Document'}
  </button>
)}


                {/* <button
                  onClick={() => router.push(`/documents/${documentId}/v1`)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  View Version 1
                </button> */}

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

        {/* Main grid (matches V1 structure) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: info + sections (sticky) */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">Document Info</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-slate-500">Customer</div><div className="text-slate-900 font-medium">{document.customerName}</div>
                <div className="text-slate-500">Status</div><div className="text-slate-900 font-medium">{document.workflowStatus}</div>
              </div>
            </div>

            {hasV2 && v2Data && (
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
                        aria-current={active ? 'page' : undefined}
                      >
                        {key}
                      </button>
                    );
                  })}
                </nav>
              </div>
            )}
          </aside>

          {/* Right: editor */}
          <section className="lg:col-span-8 space-y-6">
            {/* Editor toolbar (Save/Reset + Prev/Next) */}
            {hasV2 && v2Data && canEdit && (
              <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-sm text-slate-600">
                  
                  {hasChanges && <span className="ml-2 text-orange-600">(Unsaved changes)</span>}
                </div>
                <div className="flex flex-wrap gap-3">
                  {/* <button
                    onClick={() => { setV2Data(originalV2); setHasChanges(false); }}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Reset
                  </button> */}
                  <button
                    onClick={async () => { await saveV2Changes(v2Data); }}
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

            {/* Content card */}
            <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl shadow">
              <div className="p-6 section-anim">
                {!hasV1 ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-slate-900">Version 1 Required</h3>
                    <p className="mt-1 text-slate-500">Version 1 must be generated before creating Version 2.</p>
                    <button
                      onClick={() => router.push(`/documents/${documentId}/v1`)}
                      className="mt-4 px-5 py-2.5 rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg hover:shadow-xl transition-all"
                    >
                      Go to Version 1
                    </button>
                  </div>
                ) : hasV2 && v2Data && currentSectionKey ? (
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
                    <h3 className="mt-2 text-lg font-medium text-slate-900">No Version 2 Available</h3>
                    <p className="mt-1 text-slate-500">
                      {canProcess ? 'Click "Generate Version 2" to create the refined document summary.' : 'Version 2 has not been generated yet.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
        <ConfirmDialog
  open={approveOpen}
  title="Approve Document?"
  message={`This will mark Version 2 as APPROVED.\nYou won't be able to edit V2 after approval.`}
  confirmText={processing ? 'Approving…' : 'Approve'}
  cancelText="Cancel"
  variant="warning"
  onConfirm={approveDocument}
  onCancel={() => setApproveOpen(false)}
/>

      </div>

      {/* Global helpers to match V1 */}
      <style jsx global>{`
        .section-anim { animation: fadeSlideIn 240ms ease-out both; }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) { .section-anim { animation: none; } }
        .modern-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .modern-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .modern-scrollbar::-webkit-scrollbar-thumb { background: linear-gradient(180deg, rgba(99,102,241,0.6), rgba(168,85,247,0.6)); border-radius: 9999px; }
        .modern-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(99,102,241,0.6) transparent; }
      `}</style>
    </div>
  );
}
