"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getSimplePermissions } from "@/lib/simplePermissions";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";

export default function V1EditorPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [v1Data, setV1Data] = useState<any>(null);
  const [editedData, setEditedData] = useState<any>(null);
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  
  const permissions = getSimplePermissions(session?.user?.role || "VIEWER");

  // Get all field keys from all pages
  const allFieldKeys = useMemo(() => {
    if (!editedData) return [];
    const fieldKeys: string[] = [];
    
    Object.values(editedData).forEach((pageData: any) => {
      pageData.extracted_content?.[0]?.fields?.forEach((field: any) => {
        Object.keys(field).forEach(key => {
          if (!fieldKeys.includes(key)) {
            fieldKeys.push(key);
          }
        });
      });
    });
    
    return fieldKeys;
  }, [editedData]);

  const currentFieldKey = useMemo(
    () => allFieldKeys[currentSectionIdx] ?? null,
    [allFieldKeys, currentSectionIdx]
  );

  // Find the field data for the current field key across all pages
  const currentFieldData = useMemo(() => {
    if (!currentFieldKey || !editedData) return null;
    
    for (const [pageKey, pageData] of Object.entries(editedData)) {
      const fields = (pageData as any).extracted_content?.[0]?.fields || [];
      for (let fieldIndex = 0; fieldIndex < fields.length; fieldIndex++) {
        const field = fields[fieldIndex];
        if (field[currentFieldKey]) {
          return {
            pageKey,
            fieldIndex,
            fieldData: field[currentFieldKey]
          };
        }
      }
    }
    return null;
  }, [currentFieldKey, editedData]);

  useEffect(() => {
    loadV1Data();
  }, [params.id]);

  const loadV1Data = async () => {
    try {
      const response = await fetch(`/api/documents/${params.id}/v1-content`);
      if (response.ok) {
        const data = await response.json();
        setV1Data(data);
        setEditedData(JSON.parse(JSON.stringify(data))); // Deep copy for editing
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

  const saveV1 = async () => {
    if (!editedData) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/documents/${params.id}/v1-content`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editedData }),
      });

      if (response.ok) {
        showToast({ variant: "success", message: "V1 content saved successfully" });
        setHasChanges(false);
      } else {
        const error = await response.json();
        showToast({ variant: "error", message: error.error || "Failed to save V1 content" });
      }
    } catch (error) {
      console.error("Error saving V1 content:", error);
      showToast({ variant: "error", message: "Error saving V1 content" });
    } finally {
      setSaving(false);
    }
  };

  const verifyV1 = async () => {
    // Route to preview page instead of direct verification
    router.push(`/documents/${params.id}/v1/preview`);
  };

  const updateFieldValue = useCallback((pageKey: string, fieldIndex: number, fieldKey: string, newValue: string) => {
    if (!editedData) return;
    
    const updated = { ...editedData };
    if (updated[pageKey]?.extracted_content?.[0]?.fields?.[fieldIndex]?.[fieldKey]) {
      updated[pageKey].extracted_content[0].fields[fieldIndex][fieldKey].value = newValue;
      setEditedData(updated);
      setHasChanges(true);
    }
  }, [editedData]);

  const updateCurrentField = useCallback((newValue: string) => {
    if (!currentFieldData || !currentFieldKey) return;
    updateFieldValue(currentFieldData.pageKey, currentFieldData.fieldIndex, currentFieldKey, newValue);
  }, [currentFieldData, currentFieldKey, updateFieldValue]);

  // Parse content into subsections
  const parseContentSections = useCallback((content: string) => {
    if (!content) return [];
    
    const sections = [];
    const lines = content.split('\n');
    let currentSection = { title: '', content: '' };
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check if it's a main heading (Purpose:, Scope:, etc.)
      if (trimmedLine.endsWith(':') && trimmedLine.length < 50) {
        if (currentSection.title || currentSection.content) {
          sections.push({ ...currentSection });
        }
        currentSection = { title: trimmedLine, content: '' };
      }
      // Check if it's a lettered subsection (a), b), etc.)
      else if (/^[a-z]\)\s/.test(trimmedLine)) {
        if (currentSection.content) {
          sections.push({ ...currentSection });
        }
        currentSection = { title: trimmedLine, content: '' };
      }
      // Regular content line
      else if (trimmedLine) {
        if (currentSection.content) {
          currentSection.content += '\n' + line;
        } else {
          currentSection.content = line;
        }
      }
    }
    
    // Add the last section
    if (currentSection.title || currentSection.content) {
      sections.push(currentSection);
    }
    
    return sections;
  }, []);

  const updateSectionContent = useCallback((sectionIndex: number, newContent: string) => {
    if (!currentFieldData || !currentFieldKey) return;
    
    const sections = parseContentSections(currentFieldData.fieldData.value || '');
    sections[sectionIndex] = { ...sections[sectionIndex], content: newContent };
    
    // Reconstruct the full content
    const fullContent = sections.map(section => {
      if (section.title && section.content) {
        return section.title + '\n' + section.content;
      }
      return section.title || section.content;
    }).join('\n\n');
    
    updateCurrentField(fullContent);
  }, [currentFieldData, currentFieldKey, parseContentSections, updateCurrentField]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-slate-600">Loading V1 data...</p>
        </div>
      </div>
    );
  }

  if (!v1Data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">No V1 data available for this document</p>
          <Link href={`/documents/${params.id}`} className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Back to Document
          </Link>
        </div>
      </div>
    );
  }

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
                  Version 1 Editor
                </h1>
                <p className="text-slate-600">Edit extracted document data and save as Version 2</p>
              </div>
              <div className="flex items-center gap-3">
                <Link href={`/documents/${params.id}`} className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50">
                  Back
                </Link>
                {permissions.canEdit && (
                  <>
                    <button
                      onClick={saveV1}
                      disabled={saving || !hasChanges}
                      className="px-6 py-2.5 rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save V1 Content"}
                    </button>
                    {!hasChanges && (
                      <button
                        onClick={verifyV1}
                        disabled={isVerified}
                        className="px-6 py-2.5 rounded-xl text-white bg-gradient-to-r from-green-600 to-emerald-600 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                      >
                        {isVerified ? "V1 Verified ✓" : "Preview & Verify V1"}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left sidebar: sections navigation */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">Document Info</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-slate-500">Fields</div>
                <div className="text-slate-900 font-medium">{allFieldKeys.length}</div>
                <div className="text-slate-500">Status</div>
                <div className="text-slate-900 font-medium">Extracted</div>
              </div>
            </div>

            {allFieldKeys.length > 0 && (
              <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow p-5 sticky top-6">
                <h2 className="text-sm font-semibold text-slate-900 mb-3">Fields</h2>
                <nav className="space-y-2">
                  {allFieldKeys.map((key, idx) => {
                    const active = idx === currentSectionIdx;
                    return (
                      <button
                        key={key}
                        onClick={() => setCurrentSectionIdx(idx)}
                        className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                          active 
                            ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-slate-900 border border-indigo-200' 
                            : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        {key.replace(/_/g, ' ')}
                      </button>
                    );
                  })}
                </nav>
              </div>
            )}
          </aside>

          {/* Right: editor content */}
          <section className="lg:col-span-8 space-y-6">
            {/* Editor toolbar */}
            {permissions.canEdit && (
              <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-sm text-slate-600">
                  Editing extracted content
                  {hasChanges && <span className="ml-2 text-orange-600">(Unsaved changes)</span>}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setEditedData(JSON.parse(JSON.stringify(v1Data))); setHasChanges(false); }}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Reset
                  </button>
                  <button
                    onClick={saveV1}
                    disabled={saving || !hasChanges}
                    className="px-5 py-2.5 rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save V1"}
                  </button>
                  {!hasChanges && (
                    <button
                      onClick={verifyV1}
                      disabled={isVerified}
                      className="px-5 py-2.5 rounded-xl text-white bg-gradient-to-r from-green-600 to-emerald-600 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                    >
                      {isVerified ? "Verified ✓" : "Preview & Verify"}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Content card */}
            <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl shadow">
              <div className="p-6 section-anim">
                {currentFieldData && currentFieldKey ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-semibold text-slate-900">
                        {currentFieldKey.replace(/_/g, ' ')}
                      </div>
                      <div className="text-xs text-slate-500">
                        Found in: Page {currentFieldData.pageKey}
                      </div>
                    </div>
                    
                    {(() => {
                      const sections = parseContentSections(currentFieldData.fieldData.value || '');
                      
                      if (sections.length <= 1) {
                        // Single section - show as one textarea
                        return (
                          <div className="space-y-3">
                            <textarea
                              value={currentFieldData.fieldData.value || ""}
                              onChange={(e) => updateCurrentField(e.target.value)}
                              className="w-full resize-y px-4 py-3 rounded-xl border border-white/40 bg-white/80 backdrop-blur-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 disabled:bg-gray-50 font-mono text-sm"
                              rows={Math.max(8, (currentFieldData.fieldData.value?.split('\n').length || 1) + 2)}
                              readOnly={!permissions.canEdit}
                              placeholder={`Enter ${currentFieldKey.replace(/_/g, ' ').toLowerCase()}...`}
                            />
                          </div>
                        );
                      }
                      
                      // Multiple sections - show as separate inputs
                      return (
                        <div className="space-y-4">
                          {sections.map((section, index) => (
                            <div key={index} className="bg-slate-50/50 rounded-lg p-4 border border-slate-200/50">
                              {section.title && (
                                <div className="text-sm font-semibold text-slate-800 mb-2 bg-white/60 px-3 py-1 rounded-md border">
                                  {section.title}
                                </div>
                              )}
                              <textarea
                                value={section.content || ""}
                                onChange={(e) => updateSectionContent(index, e.target.value)}
                                className="w-full resize-y px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 disabled:bg-gray-50 text-sm"
                                rows={Math.max(3, (section.content?.split('\n').length || 1) + 1)}
                                readOnly={!permissions.canEdit}
                                placeholder="Enter content..."
                              />
                            </div>
                          ))}
                          
                          {/* Full content preview */}
                          <div className="mt-6 pt-4 border-t border-slate-200">
                            <div className="text-sm font-medium text-slate-700 mb-2">Full Content Preview:</div>
                            <div className="bg-slate-100 p-3 rounded-lg text-xs font-mono max-h-40 overflow-y-auto">
                              {currentFieldData.fieldData.value}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                    
                    {currentFieldData.fieldData.boundary && (
                      <div className="text-xs text-slate-500 pt-2 border-t border-slate-200">
                        Boundary: {currentFieldData.fieldData.boundary}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-slate-900">No Field Selected</h3>
                    <p className="mt-1 text-slate-500">Select a field from the sidebar to edit its content.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Raw JSON debug view */}
            <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl shadow">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Raw JSON Data (Debug)</h2>
                <pre className="bg-slate-100 p-4 rounded-lg text-xs overflow-auto max-h-96 font-mono">
                  {JSON.stringify(v1Data, null, 2)}
                </pre>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Global styles */}
      <style jsx global>{`
        .section-anim { animation: fadeSlideIn 240ms ease-out both; }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) { .section-anim { animation: none; } }
      `}</style>
    </div>
  );
}
