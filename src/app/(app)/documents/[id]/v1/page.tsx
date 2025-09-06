"use client";
import { useState, useEffect, useMemo, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getSimplePermissions } from "@/lib/simplePermissions";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";

export default function V1EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); // Unwrap the params Promise here

  const router = useRouter();
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [v1Data, setV1Data] = useState<any>(null);
  const [editedData, setEditedData] = useState<any>(null);
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const permissions = getSimplePermissions(session?.user?.role || "VIEWER");

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

  const currentFieldData = useMemo(() => {
    if (!currentFieldKey || !editedData) return null;

    for (const [pageKey, pageData] of Object.entries(editedData)) {
      const fields = (pageData as any).extracted_content?.[0]?.fields || [];
      for (const field of fields) {
        if (field[currentFieldKey]) {
          return field[currentFieldKey];
        }
      }
    }
    return null;
  }, [currentFieldKey, editedData]);

  const parseFieldContent = useCallback((fieldData: any) => {
    if (!fieldData?.value) return [];

    const content = fieldData.value;
    const sections = [];
    const lines = content.split('\n');
    let currentSection = { title: 'Introduction', content: [], subsections: [] };
    let currentSubsection : any = null;

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine && (
        trimmedLine === 'SCOPE OF WORK' ||
        trimmedLine === 'Assumptions and Dependencies' ||
        trimmedLine === 'Dependencies' ||
        trimmedLine.includes('Credit Score Evaluation') ||
        trimmedLine.includes('Security Features') ||
        trimmedLine.includes('Key Features') ||
        trimmedLine.includes('Functionalities') ||
        /^\d+\.\d+/.test(trimmedLine)
      )) {
        if (currentSection.content.length > 0 || currentSection.subsections.length > 0) {
          if (currentSubsection) {
            currentSection.subsections.push(currentSubsection);
            currentSubsection = null;
          }
          sections.push(currentSection);
        }
        currentSection = { title: trimmedLine, content: [], subsections: [] };
      }
      else if (trimmedLine && (
        trimmedLine === 'Data Protection' ||
        trimmedLine === 'Secure Communication' ||
        trimmedLine === 'Access Control' ||
        trimmedLine === 'Monitoring & Alerts' ||
        trimmedLine === 'Compliance & Documentation' ||
        trimmedLine === 'Non-Credit Parameters' ||
        trimmedLine === 'Credit Parameters' ||
        trimmedLine === 'Loan Origination System' ||
        trimmedLine === 'Loan Servicing' ||
        trimmedLine === 'Collection Management' ||
        (trimmedLine.length > 5 && trimmedLine === trimmedLine.replace(/[a-z]/g, (match : any) => match.toUpperCase()) && !trimmedLine.startsWith('•'))
      )) {
        if (currentSubsection) {
          currentSection.subsections.push(currentSubsection);
        }
        currentSubsection = { title: trimmedLine, content: [] };
      }
      else if (trimmedLine) {
        if (currentSubsection) {
          currentSubsection.content.push(trimmedLine);
        } else {
          currentSection.content.push(trimmedLine);
        }
      }
    }

    if (currentSubsection) {
      currentSection.subsections.push(currentSubsection);
    }
    if (currentSection.content.length > 0 || currentSection.subsections.length > 0) {
      sections.push(currentSection);
    }

    return sections.length > 0 ? sections : [{ title: 'Content', content: [content], subsections: [] }];
  }, []);

  const updateSubsectionContent = useCallback((sectionIndex: number, subsectionIndex: number, newContent: string) => {
    if (!editedData || !currentFieldKey) return;

    const sections : any = parseFieldContent(currentFieldData);
    if (subsectionIndex === -1) {
      sections[sectionIndex].content = newContent.split('\n');
    } else {
      sections[sectionIndex].subsections[subsectionIndex].content = newContent.split('\n');
    }

    const fullContent = sections.map((section : any) => {
      let sectionContent = '';

      if (section.title !== 'Introduction' && section.title !== 'Content') {
        sectionContent += section.title + '\n';
      }

      if (section.content.length > 0) {
        sectionContent += section.content.join('\n') + '\n';
      }

      section.subsections.forEach((subsection : any) => {
        sectionContent += subsection.title + '\n';
        sectionContent += subsection.content.join('\n') + '\n';
      });

      return sectionContent.trim();
    }).join('\n\n');

    const newEditedData = JSON.parse(JSON.stringify(editedData));
    Object.values(newEditedData).forEach((pageData: any) => {
      pageData.extracted_content?.[0]?.fields?.forEach((fieldGroup: any) => {
        if (fieldGroup[currentFieldKey]) {
          fieldGroup[currentFieldKey].value = fullContent;
        }
      });
    });

    setEditedData(newEditedData);
    setHasChanges(true);
  }, [editedData, currentFieldKey, currentFieldData, parseFieldContent]);

  useEffect(() => {
    loadV1Data();
  }, [id]);

  const loadV1Data = async () => {
    try {
      const response = await fetch(`/api/documents/${id}/v1-content`);
      if (response.ok) {
        const data = await response.json();
        setV1Data(data);
        setEditedData(JSON.parse(JSON.stringify(data)));
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
      const response = await fetch(`/api/documents/${id}/v1-content`, {
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
    router.push(`/documents/${id}/v1/preview`);
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

  if (!v1Data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">No V1 data found</p>
          <Link href={`/documents/${id}`} className="text-blue-600 hover:underline">
            Go back to document
          </Link>
        </div>
      </div>
    );
  }

  const currentFieldSections = parseFieldContent(currentFieldData);


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="relative overflow-hidden rounded-3xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10"></div>
            <div className="relative p-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700 bg-clip-text text-transparent">
                        Version 1 Editor
                      </h1>
                      <p className="text-slate-600 mt-1">Edit extracted document data with precision</p>
                    </div>
                  </div>
                  {hasChanges && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      Unsaved changes
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Link 
                    href={`/documents/${params.id}`} 
                    className="group px-6 py-3 bg-white/80 backdrop-blur-sm border border-white/50 text-slate-700 rounded-xl hover:bg-white/90 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Document
                  </Link>
                  {permissions.canEdit && (
                    <>
                      <button
                        onClick={saveV1}
                        disabled={saving || !hasChanges}
                        className="group px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2"
                      >
                        {saving ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        )}
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                      {!hasChanges && (
                        <button
                          onClick={verifyV1}
                          disabled={isVerified}
                          className="group px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2"
                        >
                          {isVerified ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                          {isVerified ? "V1 Verified ✓" : "Preview & Verify"}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Enhanced Left Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            {/* Document Info Card */}
            <div className="relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-blue-50/50"></div>
              <div className="relative p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">Document Info</h2>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-white/50">
                    <span className="text-sm text-slate-600">Total Fields</span>
                    <span className="text-sm font-bold text-slate-900">{allFieldKeys.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-white/50">
                    <span className="text-sm text-slate-600">Status</span>
                    <span className="text-sm font-bold text-blue-600">Editing</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Field Navigation */}
            {allFieldKeys.length > 0 && (
              <div className="relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-xl sticky top-6">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>
                <div className="relative p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">Field Navigation</h2>
                  </div>
                  <nav className="space-y-2 max-h-96 overflow-y-auto">
                    {allFieldKeys.map((key, idx) => {
                      const active = idx === currentSectionIdx;
                      return (
                        <button
                          key={key}
                          onClick={() => setCurrentSectionIdx(idx)}
                          className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${
                            active 
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg' 
                              : 'bg-white/50 text-slate-700 hover:bg-white/80 hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm truncate">
                              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                            {active && (
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </div>
            )}
          </aside>

          {/* Enhanced Main Content Area */}
          <section className="lg:col-span-3 space-y-6">
            {/* Enhanced Main Content Editor */}
            <div className="relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-blue-50/30"></div>
              <div className="relative">
                {currentFieldData && currentFieldKey ? (
                  <div>
                    {/* Content Header */}
                    <div className="p-6 border-b border-white/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">
                            {currentFieldKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </h3>
                          <p className="text-slate-600 text-sm">
                            {currentFieldSections.length} section{currentFieldSections.length !== 1 ? 's' : ''} found
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Hierarchical Subsection Editors */}
                    <div className="p-6 space-y-8">
                      {currentFieldSections.map((section, sectionIndex) => (
                        <div key={sectionIndex} className="space-y-4">
                          {/* Main Section Header */}
                          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200/50">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                              {sectionIndex + 1}
                            </div>
                            <h4 className="text-lg font-bold text-slate-800">
                              {section.title}
                            </h4>
                            <div className="ml-auto text-xs text-slate-500">
                              {section.subsections.length > 0 ? `${section.subsections.length} subsections` : 'Main content'}
                            </div>
                          </div>

                          {/* Main Section Content Editor (if has content) */}
                          {section.content.length > 0 && (
                            <div className="ml-4 space-y-2">
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Main Content
                              </div>
                              <div className="relative">
                                <textarea
                                  value={section.content.join('\\n').replace(/\\n/g, '\n')}
                                  onChange={(e) => updateSubsectionContent(sectionIndex, -1, e.target.value.replace(/\n/g, '\\n'))}
                                  className="w-full resize-y px-4 py-3 rounded-xl border border-slate-200/50 bg-white/90 backdrop-blur-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 disabled:bg-gray-50 text-sm leading-relaxed"
                                  rows={Math.max(3, section.content.join('\\n').split('\\n').length)}
                                  readOnly={!permissions.canEdit}
                                  placeholder={`Enter main content for ${section.title.toLowerCase()}...`}
                                />
                                {permissions.canEdit && (
                                  <div className="absolute top-2 right-2">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Subsections */}
                          {section.subsections.map((subsection : any, subsectionIndex : any) => (
                            <div key={subsectionIndex} className="ml-8 space-y-3">
                              {/* Subsection Header */}
                              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200/50">
                                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white text-xs font-bold">
                                  {subsectionIndex + 1}
                                </div>
                                <h5 className="font-semibold text-slate-700">
                                  {subsection.title}
                                </h5>
                                <div className="ml-auto text-xs text-slate-500">
                                  {subsection.content.length} lines
                                </div>
                              </div>

                              {/* Subsection Editor */}
                              <div className="relative">
                                <textarea
                                  value={subsection.content.join('\\n').replace(/\\n/g, '\n')}
                                  onChange={(e) => updateSubsectionContent(sectionIndex, subsectionIndex, e.target.value.replace(/\n/g, '\\n'))}
                                  className="w-full resize-y px-4 py-3 rounded-xl border border-slate-200/50 bg-white/80 backdrop-blur-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 disabled:bg-gray-50 text-sm leading-relaxed"
                                  rows={Math.max(3, subsection.content.length + 1)}
                                  readOnly={!permissions.canEdit}
                                  placeholder={`Enter content for ${subsection.title.toLowerCase()}...`}
                                />
                                {permissions.canEdit && (
                                  <div className="absolute top-2 right-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}

                      {/* Field Boundary Info */}
                      {currentFieldData.boundary && (
                        <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200/50">
                          <div className="text-sm font-medium text-slate-600 mb-2">Boundary Information:</div>
                          <div className="text-sm text-slate-500">{currentFieldData.boundary}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Select a Field to Edit</h3>
                    <p className="text-slate-600">Choose a field from the navigation to start editing its content.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
