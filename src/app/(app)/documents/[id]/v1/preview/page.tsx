"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getSimplePermissions } from "@/lib/simplePermissions";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";

export default function V1PreviewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [v1Data, setV1Data] = useState<any>(null);
  const [isApproved, setIsApproved] = useState(false);
  
  const permissions = getSimplePermissions(session?.user?.role || "VIEWER");

  useEffect(() => {
    console.log("v1data: ", v1Data);
  }, [v1Data]);

  useEffect(() => {
    loadV1Data();
  }, [params.id]);

  const loadV1Data = async () => {
    try {
      const response = await fetch(`/api/documents/${params.id}/v1-content`);
      if (response.ok) {
        const data = await response.json();
        setV1Data(data);
        
        // Check if already approved
        const statusResponse = await fetch(`/api/documents/${params.id}/v1-status`);
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          setIsApproved(statusData.status === 'APPROVED');
        }
      } else {
        showToast({ variant: "error", message: "Failed to load V1 data" });
      }
    } catch (error) {
      console.error("Error loading V1 data:", error);
      showToast({ variant: "error", message: "Error loading V1 data" });
    } finally {
      setLoading(false);
    }
  };

  const approveV1 = async () => {
    setApproving(true);
    try {
      const response = await fetch(`/api/documents/${params.id}/verify-v1`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        showToast({ variant: "success", message: "V1 approved successfully!" });
        setIsApproved(true);
        // Redirect back to document details after approval
        setTimeout(() => {
          router.push(`/documents/${params.id}`);
        }, 1500);
      } else {
        const error = await response.json();
        showToast({ variant: "error", message: error.error || "Failed to approve V1" });
      }
    } catch (error) {
      console.error("Error approving V1:", error);
      showToast({ variant: "error", message: "Error approving V1" });
    } finally {
      setApproving(false);
    }
  };

  const renderFieldValue = (fieldData: any) => {
  if (!fieldData || typeof fieldData !== 'object') {
    return <span className="text-slate-400 italic">Not provided</span>;
  }

  // Handle the structure with value and boundary
  const value = fieldData.value;
  
  if (!value || value === '') {
    return <span className="text-slate-400 italic">Not provided</span>;
  }
  
  if (typeof value === 'string') {
    // Handle different types of line breaks and formatting
    let processedText = value;
    
    // Replace literal \n with actual line breaks
    processedText = processedText.replace(/\\n/g, '\n');
    
    // Split by actual newlines and filter out empty lines
    const lines = processedText.split('\n').filter(line => line.trim() !== '');
    
    return (
      <div className="space-y-3 max-w-none">
        {lines.map((line, index) => {
          const trimmedLine = line.trim();
          
          // Check if line starts with bullet point
          if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
            return (
              <div key={index} className="flex items-start gap-3 ml-4">
                <span className="text-blue-600 font-bold mt-1 flex-shrink-0 text-sm">•</span>
                <p className="text-slate-700 leading-relaxed flex-1 text-sm">
                  {trimmedLine.substring(1).trim()}
                </p>
              </div>
            );
          }
          
          // Check if line is a section header (all caps and short)
          if (trimmedLine === trimmedLine.toUpperCase() && 
              trimmedLine.length < 100 && 
              trimmedLine.length > 3 &&
              !trimmedLine.includes('•') &&
              /^[A-Z\s&]+$/.test(trimmedLine)) {
            return (
              <h4 key={index} className="text-base font-bold text-slate-900 mt-8 mb-4 first:mt-0 uppercase tracking-wide">
                {trimmedLine}
              </h4>
            );
          }
          
          // Check if it's a section header with specific keywords
          if (trimmedLine.match(/^(Assumptions|Dependencies|Deliverables|Scope|Modules|Features|Security|Key Features|Functionalities)/i)) {
            return (
              <h4 key={index} className="text-base font-semibold text-slate-800 mt-6 mb-3 first:mt-0 border-l-4 border-blue-500 pl-3 bg-blue-50 py-2 rounded-r">
                {trimmedLine}
              </h4>
            );
          }
          
          // Check if it's a numbered or lettered list item
          if (trimmedLine.match(/^[\d\w]\.\s/)) {
            return (
              <div key={index} className="ml-4">
                <p className="text-slate-700 leading-relaxed text-sm font-medium">
                  {trimmedLine}
                </p>
              </div>
            );
          }
          
          // Regular paragraph
          return (
            <p key={index} className="text-slate-700 leading-relaxed text-sm">
              {trimmedLine}
            </p>
          );
        })}
      </div>
    );
  }
  
  return <span className="text-slate-700 text-sm">{String(value)}</span>;
};

  const formatFieldName = (fieldName: string) => {
    return fieldName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-slate-600">Loading preview...</p>
        </div>
      </div>
    );
  }

  if (!v1Data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">No V1 data found</p>
          <Link href={`/documents/${params.id}/v1`} className="text-blue-600 hover:underline">
            Go back to editor
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">V1 Preview & Approval</h1>
            <p className="text-slate-600">Review extracted content before approval</p>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href={`/documents/${params.id}/v1`}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
            >
              Back to Editor
            </Link>
            {permissions.canProcess && !isApproved && (
              <button
                onClick={approveV1}
                disabled={approving}
                className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {approving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                {approving ? "Approving..." : "Approve V1"}
              </button>
            )}
            {isApproved && (
              <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium">
                ✓ Approved
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Display */}
      <div className="max-w-4xl mx-auto py-8 px-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Document Content */}
          {Object.entries(v1Data).map(([pageKey, pageData]: [string, any], pageIndex) => (
            <div key={pageKey} className="p-8 border-b border-slate-200 last:border-b-0">
              {/* Page Title */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Document Content - Page {pageIndex + 1}
                </h2>
                <div className="w-16 h-1 bg-blue-600 rounded"></div>
              </div>
              
              {/* Extracted Fields */}
              <div className="space-y-8">
                {pageData.extracted_content?.[0]?.fields?.map((fieldGroup: any, fieldIndex: number) => (
                  <div key={fieldIndex} className="space-y-6">
                    {Object.entries(fieldGroup).map(([fieldName, fieldData]) => (
                      <div key={fieldName} className="space-y-3">
                        <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">
                          {formatFieldName(fieldName)}
                        </h3>
                        <div className="pl-4">
                          {renderFieldValue(fieldData)}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="mt-8 flex justify-center">
          {permissions.canProcess && !isApproved && (
            <button
              onClick={approveV1}
              disabled={approving}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 text-lg font-medium"
            >
              {approving && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>}
              {approving ? "Approving V1..." : "Approve V1 Content"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
