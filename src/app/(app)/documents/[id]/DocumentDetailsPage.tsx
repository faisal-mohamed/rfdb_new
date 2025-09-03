"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getSimplePermissions } from "@/lib/simplePermissions";
import { useToast } from "@/components/ui/Toast";

type Props = { id: string };

export default function DocumentDetailsClient({ id }: Props) {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [doc, setDoc] = useState<any>(null);
  const [v1Data, setV1Data] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generatingV1, setGeneratingV1] = useState(false);
  const [generatingV2, setGeneratingV2] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [canGenerateV1, setCanGenerateV1] = useState(false);
  const permissions = getSimplePermissions(session?.user?.role || "VIEWER");

  useEffect(() => {
    loadDocumentData();
  }, [id]);

  useEffect(() => {
    // Start 30-second countdown when component mounts
    if (countdown > 0 && !v1Data) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanGenerateV1(true);
    }
  }, [countdown, v1Data]);

  const loadDocumentData = async () => {
    try {
      // Get document data from external API via our backend
      const response = await fetch(`/api/documents/${id}`);
      if (response.ok) {
        const docData = await response.json();
        setDoc(docData);
      } else {
        // Fallback to mock data if API fails
        const mockDoc = {
          id,
          fileName: "Sample Document.docx",
          customerName: "Sample Customer",
          status: "UPLOADED",
          uploadedDate: new Date().toISOString(),
          fileType: "docx",
          fileSize: 1024000,
          uploader: {
            firstName: session?.user?.firstName || "User",
            lastName: session?.user?.lastName || "",
          }
        };
        setDoc(mockDoc);
      }
      
      // Try to load existing V1 data
      await loadV1Data();
    } finally {
      setLoading(false);
    }
  };

  const loadV1Data = async () => {
    try {
      const response = await fetch(`/api/documents/${id}/v1-content`);
      if (response.ok) {
        const data = await response.json();
        setV1Data(data);
        
        // Check if V1 is verified by checking the database version status
        const versionResponse = await fetch(`/api/documents/${id}/v1-status`);
        if (versionResponse.ok) {
          const versionData = await versionResponse.json();
          // V1 is verified if status is APPROVED
          if (versionData.status === 'APPROVED') {
            setV1Data({...data, isVerified: true});
          }
        }
      }
    } catch (error) {
      console.error("Error loading V1 data:", error);
    }
  };

  const generateV1 = async () => {
    setGeneratingV1(true);
    try {
      const response = await fetch(`/api/documents/${id}/generate-v1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        showToast({ variant: "success", message: "V1 generated successfully!" });
        await loadV1Data(); // Reload V1 data
      } else {
        const error = await response.json();
        showToast({ variant: "error", message: error.error || "Failed to generate V1" });
      }
    } catch (error) {
      console.error("Error generating V1:", error);
      showToast({ variant: "error", message: "Error generating V1" });
    } finally {
      setGeneratingV1(false);
    }
  };

  const generateV2 = async () => {
    setGeneratingV2(true);
    try {
      const response = await fetch(`/api/documents/${id}/generate-v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        showToast({ variant: "success", message: "V2 generated successfully!" });
        // Navigate to V2 editor
        window.location.href = `/documents/${id}/v2`;
      } else {
        const error = await response.json();
        showToast({ variant: "error", message: error.error || "Failed to generate V2" });
      }
    } catch (error) {
      console.error("Error generating V2:", error);
      showToast({ variant: "error", message: "Error generating V2" });
    } finally {
      setGeneratingV2(false);
    }
  };

  const downloadV1PDF = async () => {
    setDownloadingPDF(true);
    try {
      const response = await fetch(`/api/documents/${id}/download-v1-pdf`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `V1-Document-${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showToast({ variant: "success", message: "PDF downloaded successfully!" });
      } else {
        const error = await response.json();
        showToast({ variant: "error", message: error.error || "Failed to download PDF" });
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      showToast({ variant: "error", message: "Error downloading PDF" });
    } finally {
      setDownloadingPDF(false);
    }
  };

  const workflowChip = (status: string) => {
    const cls =
      status === "COMPLETED" ? "bg-emerald-100 text-emerald-700"
      : status === "APPROVED" ? "bg-purple-100 text-purple-700"
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!doc) return <div className="p-8">Not found</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="relative mb-8">
        <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 rounded-2xl blur-xl"></div>
        <div className="relative bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl shadow-xl p-6 flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700 bg-clip-text text-transparent">
              {doc.fileName}
            </h1>
            <p className="text-slate-600">
              Customer: <span className="font-medium text-slate-800">{doc.customerName}</span>
            </p>
            <div>{workflowChip(doc.status)}</div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/documents" className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">
              Back
            </Link>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info card */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow border p-5 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Document Info</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="text-slate-500">File Type</div>
            <div className="text-slate-900 font-medium">{doc.fileType}</div>
            <div className="text-slate-500">Size</div>
            <div className="text-slate-900 font-medium">{(doc.fileSize/1024/1024).toFixed(2)} MB</div>
            <div className="text-slate-500">Uploaded</div>
            <div className="text-slate-900 font-medium">{new Date(doc.uploadedDate).toLocaleString()}</div>
            <div className="text-slate-500">Uploader</div>
            <div className="text-slate-900 font-medium">{doc.uploader.firstName} {doc.uploader.lastName}</div>
          </div>
        </div>

        {/* Actions and Versions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Version 1 */}
          <div className="bg-white rounded-xl shadow border p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900">Version 1 (Extracted Data)</h3>
              <div className="flex items-center gap-2">
                {generatingV1 && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>}
                <div className="text-sm">
                  {workflowChip(v1Data ? "READY" : generatingV1 ? "PROCESSING" : "PENDING")}
                </div>
              </div>
            </div>
            
            {v1Data ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Link 
                    href={`/documents/${id}/v1`} 
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {permissions.canEdit ? "Edit V1" : "View V1"}
                  </Link>
                  {v1Data.isVerified && (
                    <>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        ✓ Verified
                      </span>
                      <button
                        onClick={downloadV1PDF}
                        disabled={downloadingPDF}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        {downloadingPDF && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                        {downloadingPDF ? "Downloading..." : "Download PDF"}
                      </button>
                    </>
                  )}
                  <p className="text-sm text-slate-600">
                    {v1Data.isVerified ? "V1 data verified and ready" : "V1 data extracted and ready for editing"}
                  </p>
                </div>
                
                {/* V1 Data Preview */}
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-2">Data Preview:</p>
                  <div className="text-sm text-slate-700">
                    Extracted content available for editing
                    {v1Data.isVerified && <span className="ml-2 text-green-600 font-medium">(Verified)</span>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {!canGenerateV1 && countdown > 0 ? (
                  <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed flex items-center gap-2">
                      <div className="animate-pulse rounded-full h-4 w-4 bg-gray-400"></div>
                      Generate V1 ({countdown}s)
                    </div>
                    
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    {permissions.canProcess && (
                      <button
                        onClick={generateV1}
                        disabled={generatingV1}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        {generatingV1 && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                        {generatingV1 ? "Generating V1..." : "Generate V1"}
                      </button>
                    )}
                    <p className="text-sm text-slate-600">
                      {generatingV1 ? "Extracting data from document..." : "Click to extract data from document"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Version 2 */}
          <div className="bg-white rounded-xl shadow border p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900">Version 2 (Verified Data)</h3>
              <div className="flex items-center gap-2">
                {generatingV2 && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>}
                <div className="text-sm">
                  {workflowChip(generatingV2 ? "PROCESSING" : "PENDING")}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {v1Data && permissions.canProcess ? (
                <button
                  onClick={generateV2}
                  disabled={generatingV2}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {generatingV2 && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                  {generatingV2 ? "Generating V2..." : "Generate V2"}
                </button>
              ) : (
                <p className="text-sm text-slate-600">
                  {v1Data ? "V1 data ready for V2 generation" : "V1 data must be generated first"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
