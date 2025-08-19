// "use client";

// import Link from 'next/link';
// import { useEffect, useState, useCallback, useMemo } from 'react';
// import { useSession } from 'next-auth/react';
// import { getSimplePermissions } from '@/lib/simplePermissions';
// import { VersionType, WorkflowStatus } from '@/types/workflow';
// import { useRouter } from 'next/navigation';
// import { useToast } from '@/components/ui/Toast';
// import ConfirmDialog from '@/components/ui/ConfirmDialog';

// export default function DocumentDetailsPage({ params }: { params: { id: string } }) {
// 	const { data: session } = useSession();
// 	const router = useRouter();
// 	const [doc, setDoc] = useState<any>(null);
// 	const [loading, setLoading] = useState(true);
// 	const [processing, setProcessing] = useState(false);
// 	const permissions = getSimplePermissions(session?.user?.role || 'VIEWER');
//   const { showToast } = useToast();
//   const [confirmOpen, setConfirmOpen] = useState(false);

// 	const load = useCallback(async () => {
// 		try {
// 			const res = await fetch(`/api/workflow?documentId=${params.id}`);
// 			const json = await res.json();
// 			if (json.success) setDoc(json.data);
// 		} finally {
// 			setLoading(false);
// 		}
// 	}, [params.id]);

// 	useEffect(() => {
// 		load();
// 	}, [load]);

// 	const v1 = doc?.versions?.find((v: any) => v.versionType === VersionType.VERSION_1);
// 	const v2 = doc?.versions?.find((v: any) => v.versionType === VersionType.VERSION_2);

// 	const generate = async (action: 'process_v1' | 'process_v2') => {
// 		setProcessing(true);
// 		try {
// 			const res = await fetch('/api/workflow', {
// 				method: 'POST',
// 				headers: { 'Content-Type': 'application/json' },
// 				body: JSON.stringify({ action, documentId: params.id })
// 			});
// 			const json = await res.json();
// 			if (json.success) {
// 				if (action === 'process_v1') router.push(`/documents/${params.id}/v1`);
// 				else router.push(`/documents/${params.id}/v2`);
// 			} else {
// 				showToast({ variant: 'error', message: json.error || 'Failed' });
// 			}
// 		} finally {
// 			setProcessing(false);
// 		}
// 	};

// 	const generatePdf = async () => {
// 		if (!v2) return;
// 		setProcessing(true);
// 		try {
// 			const res = await fetch('/api/workflow', {
// 				method: 'POST',
// 				headers: { 'Content-Type': 'application/json' },
// 				body: JSON.stringify({ action: 'generate_document', documentId: params.id, versionId: v2.id })
// 			});
// 			const json = await res.json();
// 			if (json.success) {
// 				await load();
// 				showToast({ variant: 'success', message: 'Final document generated' });
// 			} else {
// 				showToast({ variant: 'error', message: json.error || 'Failed to generate document' });
// 			}
// 		} finally {
// 			setProcessing(false);
// 		}
// 	};

// 	const deleteDocument = async () => {
// 		setProcessing(true);
// 		try {
// 			const res = await fetch(`/api/documents/${params.id}?permanent=true`, { method: 'DELETE' });
// 			const json = await res.json();
// 			if (res.ok) {
// 				showToast({ variant: 'success', message: 'Document deleted' });
// 				router.push('/documents');
// 			} else {
// 				showToast({ variant: 'error', message: json.error || 'Failed to delete document' });
// 			}
// 		} catch (e) {
// 			showToast({ variant: 'error', message: 'Error deleting document' });
// 		} finally {
// 			setProcessing(false);
// 			setConfirmOpen(false);
// 		}
// 	};

// 	const workflowChip = useCallback((status: string) => {
// 		const cls =
// 			status === WorkflowStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700'
// 			: status === WorkflowStatus.APPROVED ? 'bg-purple-100 text-purple-700'
// 			: status.includes('EDITING') ? 'bg-yellow-100 text-yellow-800'
// 			: status.includes('READY') ? 'bg-blue-100 text-blue-700'
// 			: status.includes('PROCESSING') ? 'bg-indigo-100 text-indigo-700'
// 			: 'bg-slate-100 text-slate-700';
// 		return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>{status}</span>;
// 	}, []);

// 	if (loading) return <div className="p-8">Loading...</div>;
// 	if (!doc) return <div className="p-8">Not found</div>;

// 	return (
// 		<>
// 		<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
// 			{/* Header */}
// 			<div className="relative mb-8">
// 				<div className="absolute -inset-2 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 rounded-2xl blur-xl"></div>
// 				<div className="relative bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl shadow-xl p-6 flex items-start justify-between">
// 					<div className="space-y-2">
// 						<h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700 bg-clip-text text-transparent">{doc.fileName}</h1>
// 						<p className="text-slate-600">Customer: <span className="font-medium text-slate-800">{doc.customerName}</span></p>
// 						<div>{workflowChip(doc.workflowStatus)}</div>
// 					</div>
// 					<div className="flex items-center gap-3">
// 						{permissions.canManageUsers && (
// 							<button onClick={() => setConfirmOpen(true)} disabled={processing} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">Delete</button>
// 						)}
// 						<Link href="/documents" className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">Back</Link>
// 					</div>
// 				</div>
// 			</div>

// 			{/* Main grid */}
// 			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
// 				{/* Info card */}
// 				<div className="lg:col-span-1 bg-white rounded-xl shadow border p-5 space-y-4">
// 					<h2 className="text-lg font-semibold text-slate-900">Document Info</h2>
// 					<div className="grid grid-cols-2 gap-3 text-sm">
// 						<div className="text-slate-500">File Type</div><div className="text-slate-900 font-medium">{doc.fileType}</div>
// 						<div className="text-slate-500">Size</div><div className="text-slate-900 font-medium">{(doc.fileSize/1024/1024).toFixed(2)} MB</div>
// 						<div className="text-slate-500">Uploaded</div><div className="text-slate-900 font-medium">{new Date(doc.uploadedDate).toLocaleString()}</div>
// 						<div className="text-slate-500">Uploader</div><div className="text-slate-900 font-medium">{doc.uploader.firstName} {doc.uploader.lastName}</div>
// 					</div>
// 					{doc.description && (
// 						<div className="pt-2">
// 							<div className="text-sm text-slate-500 mb-1">Description</div>
// 							<div className="text-sm text-slate-800">{doc.description}</div>
// 						</div>
// 					)}
// 				</div>

// 				{/* Actions and Versions */}
// 				<div className="lg:col-span-2 space-y-6">
// 					{/* Version 1 */}
// 					<div className="bg-white rounded-xl shadow border p-5">
// 						<div className="flex items-center justify-between mb-3">
// 							<h3 className="font-semibold text-slate-900">Version 1</h3>
// 							{v1 && <div className="text-sm">{workflowChip(v1.status)}</div>}
// 						</div>
// 						{v1 ? (
// 							<div className="flex items-center gap-3">
// 								<Link href={`/documents/${doc.id}/v1`} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">{permissions.canEdit ? 'Edit V1' : 'View V1'}</Link>
// 							</div>
// 						) : (
// 							<div className="flex items-center gap-3">
// 								<p className="text-sm text-slate-600">No V1 generated</p>
// 								{permissions.canProcess && (
// 									<button onClick={() => generate('process_v1')} disabled={processing} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">Generate V1</button>
// 								)}
// 							</div>
// 						)}
// 					</div>

// 					{/* Version 2 and Final Document */}
// 					<div className="bg-white rounded-xl shadow border p-5 space-y-4">
// 						<div className="flex items-center justify-between">
// 							<h3 className="font-semibold text-slate-900">Version 2</h3>
// 							{v2 && <div className="text-sm">{workflowChip(v2.status)}</div>}
// 						</div>
// 						{v2 ? (
// 							<div className="flex flex-wrap items-center gap-3">
// 								<Link href={`/documents/${doc.id}/v2`} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">{permissions.canEdit ? 'Edit V2' : 'View V2'}</Link>
// 								{permissions.canGenerate && (
// 									<button onClick={generatePdf} disabled={processing} className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50">Generate PDF</button>
// 								)}
// 								{v2.generatedDocumentPath && (
// 									<span className="text-sm text-slate-600">Generated: {v2.generatedDocumentPath}</span>
// 								)}
// 							</div>
// 						) : (
// 							<div className="flex items-center gap-3">
// 								<p className="text-sm text-slate-600">No V2 generated</p>
// 								{permissions.canProcess && v1 && (
// 									<button onClick={() => generate('process_v2')} disabled={processing} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">Generate V2</button>
// 								)}
// 							</div>
// 						)}
// 					</div>
// 				</div>
// 			</div>
// 			<ConfirmDialog
// 				open={confirmOpen}
// 				title="Delete document?"
// 				message="This action will permanently delete the document and its versions. This cannot be undone."
// 				confirmText="Delete"
// 				cancelText="Cancel"
// 				variant="danger"
// 				onCancel={() => setConfirmOpen(false)}
// 				onConfirm={deleteDocument}
// 			/>
// 		</div>
// 		</>
// 	);
// }




"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { getSimplePermissions } from "@/lib/simplePermissions";
import { VersionType, WorkflowStatus } from "@/types/workflow";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

type Props = { id: string };

export default function DocumentDetailsClient({ id }: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const permissions = getSimplePermissions(session?.user?.role || "VIEWER");
  const { showToast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/workflow?documentId=${id}`);
      const json = await res.json();
      console.log("json", json);
      if (json.success) setDoc(json.data);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) load();
  }, [id, load]);

  const v1 = doc?.versions?.find((v: any) => v.versionType === VersionType.VERSION_1);
  const v2 = doc?.versions?.find((v: any) => v.versionType === VersionType.VERSION_2);

  const generate = async (action: "process_v1" | "process_v2") => {
    setProcessing(true);
    try {
      const res = await fetch("/api/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, documentId: id }),
      });
      const json = await res.json();
      if (json.success) {
        router.push(action === "process_v1" ? `/documents/${id}/v1` : `/documents/${id}/v2`);
      } else {
        showToast({ variant: "error", message: json.error || "Failed" });
      }
    } finally {
      setProcessing(false);
    }
  };

  const generatePdf = async () => {
    if (!v2) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate_document", documentId: id, versionId: v2.id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast({ variant: "error", message: err.error || "Failed to generate document" });
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.fileName.replace(/\.[^.]+$/, '')}_v2.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast({ variant: "success", message: "PDF downloaded" });
    } finally {
      setProcessing(false);
    }
  };

  const deleteDocument = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/documents/${id}?permanent=true`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok) {
        showToast({ variant: "success", message: "Document deleted" });
        router.push("/documents");
      } else {
        showToast({ variant: "error", message: json.error || "Failed to delete document" });
      }
    } catch {
      showToast({ variant: "error", message: "Error deleting document" });
    } finally {
      setProcessing(false);
      setConfirmOpen(false);
    }
  };

  const workflowChip = (status: string) => {
    const cls =
      status === WorkflowStatus.COMPLETED ? "bg-emerald-100 text-emerald-700"
      : status === WorkflowStatus.APPROVED ? "bg-purple-100 text-purple-700"
      : status.includes("EDITING") ? "bg-yellow-100 text-yellow-800"
      : status.includes("READY") ? "bg-blue-100 text-blue-700"
      : status.includes("PROCESSING") ? "bg-indigo-100 text-indigo-700"
      : "bg-slate-100 text-slate-700";
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
        {status}
      </span>
    );
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!doc) return <div className="p-8">Not found</div>;

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="relative mb-8">
          <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 rounded-2xl blur-xl"></div>
          <div className="relative bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl shadow-xl p-6 flex items-start justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700 bg-clip-text text-transparent">{doc.fileName}</h1>
              <p className="text-slate-600">Customer: <span className="font-medium text-slate-800">{doc.customerName}</span></p>
              <div>{workflowChip(doc.workflowStatus)}</div>
            </div>
            <div className="flex items-center gap-3">
              {permissions.canManageUsers && (
                <button onClick={() => setConfirmOpen(true)} disabled={processing} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">Delete</button>
              )}
              <Link href="/documents" className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">Back</Link>
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Info card */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow border p-5 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Document Info</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-slate-500">File Type</div><div className="text-slate-900 font-medium">{doc.fileType}</div>
              <div className="text-slate-500">Size</div><div className="text-slate-900 font-medium">{(doc.fileSize/1024/1024).toFixed(2)} MB</div>
              <div className="text-slate-500">Uploaded</div><div className="text-slate-900 font-medium">{new Date(doc.uploadedDate).toLocaleString()}</div>
              <div className="text-slate-500">Uploader</div><div className="text-slate-900 font-medium">{doc.uploader.firstName} {doc.uploader.lastName}</div>
            </div>
            {doc.description && (
              <div className="pt-2">
                <div className="text-sm text-slate-500 mb-1">Description</div>
                <div className="text-sm text-slate-800">{doc.description}</div>
              </div>
            )}
          </div>

          {/* Actions and Versions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Version 1 */}
            <div className="bg-white rounded-xl shadow border p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900">Version 1</h3>
                {v1 && <div className="text-sm">{workflowChip(v1.status)}</div>}
              </div>
              {v1 ? (
                <div className="flex items-center gap-3">
                  <Link href={`/documents/${doc.id}/v1`} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    {permissions.canEdit ? "Edit V1" : "View V1"}
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <p className="text-sm text-slate-600">No V1 generated</p>
                  {permissions.canProcess && (
                    <button onClick={() => generate("process_v1")} disabled={processing} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                      Generate V1
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Version 2 and Final Document */}
            <div className="bg-white rounded-xl shadow border p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Version 2</h3>
                {v2 && <div className="text-sm">{workflowChip(v2.status)}</div>}
              </div>
              {v2 ? (
                <div className="flex flex-wrap items-center gap-3">
                  <Link href={`/documents/${doc.id}/v2`} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                    {permissions.canEdit ? "Edit V2" : "View V2"}
                  </Link>
                  {permissions.canGenerate && (
                    <button onClick={generatePdf} disabled={processing} className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50">
                      Generate PDF
                    </button>
                  )}
                  {v2.generatedDocumentPath && (
                    <span className="text-sm text-slate-600">Generated: {v2.generatedDocumentPath}</span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <p className="text-sm text-slate-600">No V2 generated</p>
                  {permissions.canProcess && v1 && (
                    <button onClick={() => generate("process_v2")} disabled={processing} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
                      Generate V2
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <ConfirmDialog
          open={confirmOpen}
          title="Delete document?"
          message="This action will permanently delete the document and its versions. This cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={deleteDocument}
        />
      </div>
    </>
  );
}
