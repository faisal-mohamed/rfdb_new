"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getSimplePermissions } from "@/lib/simplePermissions";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";
import { apiGet, apiPost } from "@/lib/api";

interface ParsedSection {
  title: string;
  content: string;
  level: number;
  type: 'text' | 'table' | 'mixed';
  tableData?: { headers: string[]; rows: string[][] };
  images?: { src: string; alt?: string; style?: string }[];
}

export default function V1PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [v1Data, setV1Data] = useState<any>(null);
  const [parsedSections, setParsedSections] = useState<ParsedSection[]>([]);
  const [isApproved, setIsApproved] = useState(false);
  
  const permissions = getSimplePermissions(session?.user?.role || "VIEWER");

  useEffect(() => {
    loadV1Data();
  }, [id]);

  const loadV1Data = async () => {
    try {
      const response = await apiGet(`/api/documents/${id}/v1-content`);
      if (response.ok) {
        const data = await response.json();
        setV1Data(data);
        parseGeneratedData(data);
        
        // Check if already approved
        const statusResponse = await apiGet(`/api/documents/${id}/v1-status`);
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

  const parseGeneratedData = (data: any) => {
    const sections: ParsedSection[] = [];
    
    // Extract generated_data from the response structure
    const extractedContent = data?.["1"]?.extracted_content?.[0]?.fields?.[0]?.generated_data?.value;
    
    if (!extractedContent) {
      console.warn("No generated_data found in response");
      return;
    }

    // Split content by lines and parse
    const lines = extractedContent.split('\n');
    let currentSection: ParsedSection | null = null;
    let inHtmlTable = false;
    let htmlTableLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        if (inHtmlTable && htmlTableLines.length > 0) {
          // End of HTML table
          if (currentSection) {
            const tableData = parseHtmlTable(htmlTableLines.join('\n'));
            if (tableData) {
              currentSection.type = 'table';
              currentSection.tableData = tableData;
            }
          }
          inHtmlTable = false;
          htmlTableLines = [];
        }
        continue;
      }
      
      // Detect HTML table start
      if (trimmedLine.includes('<table>')) {
        inHtmlTable = true;
        htmlTableLines = [line];
        continue;
      }
      
      // Continue collecting HTML table lines
      if (inHtmlTable) {
        htmlTableLines.push(line);
        if (trimmedLine.includes('</table>')) {
          // End of HTML table
          if (currentSection) {
            const tableData = parseHtmlTable(htmlTableLines.join('\n'));
            if (tableData) {
              currentSection.type = 'table';
              currentSection.tableData = tableData;
            }
          }
          inHtmlTable = false;
          htmlTableLines = [];
        }
        continue;
      }
      
      // Detect headers
      if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**') && trimmedLine.length > 4) {
        // Bold text header (main sections)
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: trimmedLine.replace(/\*\*/g, ''),
          content: '',
          level: 1,
          type: 'text'
        };
      } else if (trimmedLine.startsWith('# ')) {
        // H1 header
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: trimmedLine.replace(/^# /, ''),
          content: '',
          level: 1,
          type: 'text'
        };
      } else if (trimmedLine.startsWith('## ')) {
        // H2 header
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: trimmedLine.replace(/^## /, ''),
          content: '',
          level: 2,
          type: 'text'
        };
      } else if (trimmedLine.startsWith('### ')) {
        // H3 header
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: trimmedLine.replace(/^### /, ''),
          content: '',
          level: 3,
          type: 'text'
        };
      } else if (trimmedLine.startsWith('> **') && trimmedLine.includes('**')) {
        // Quoted bold text
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: trimmedLine.replace(/^> \*\*/, '').replace(/\*\*.*$/, ''),
          content: '',
          level: 2,
          type: 'text'
        };
      } else {
        // Regular content
        if (!currentSection) {
          currentSection = {
            title: 'Introduction',
            content: '',
            level: 1,
            type: 'text'
          };
        }
        currentSection.content += (currentSection.content ? '\n' : '') + line;
      }
    }
    
    // Add the last section
    if (currentSection) {
      sections.push(currentSection);
    }
    
    // Parse images in each section
    sections.forEach(section => {
      const images = parseImages(section.content);
      if (images.length > 0) {
        section.images = images;
        section.type = section.type === 'table' ? 'table' : 'mixed';
      }
    });
    
    setParsedSections(sections);
  };

  const parseHtmlTable = (htmlContent: string): { headers: string[]; rows: string[][] } | null => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      const table = doc.querySelector('table');
      
      if (!table) return null;
      
      // Extract headers
      const headerCells = table.querySelectorAll('thead th, thead td');
      const headers = Array.from(headerCells).map(cell => 
        cell.textContent?.trim().replace(/\n\s+/g, ' ') || ''
      );
      
      // Extract rows
      const bodyRows = table.querySelectorAll('tbody tr');
      const rows = Array.from(bodyRows).map(row => {
        const cells = row.querySelectorAll('td, th');
        return Array.from(cells).map(cell => 
          cell.textContent?.trim().replace(/\n\s+/g, ' ') || ''
        );
      });
      
      return { headers, rows };
    } catch (error) {
      console.error('Error parsing HTML table:', error);
      return null;
    }
  };

  const parseImages = (content: string): { src: string; alt?: string; style?: string }[] => {
    const images: { src: string; alt?: string; style?: string }[] = [];
    const imgRegex = /<img[^>]*src="([^"]*)"[^>]*(?:alt="([^"]*)")?[^>]*(?:style="([^"]*)")?[^>]*\/?>/gi;
    let match;
    
    while ((match = imgRegex.exec(content)) !== null) {
      const src = match[1];
      const alt = match[2] || '';
      const style = match[3] || '';
      
      // Convert relative path to public path with basePath
      const publicSrc = src.startsWith('./') ? `/rfp${src.replace('./', '/')}` : `/rfp${src}`;
      
      images.push({ src: publicSrc, alt, style });
    }
    
    return images;
  };

  const renderContent = (content: string) => {
    // Remove img tags for display
    const cleanContent = content.replace(/<img[^>]*\/?>/gi, '');
    
    // Split by lines and render
    const lines = cleanContent.split('\n').filter(line => line.trim());
    
    return lines.map((line, index) => {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
        return (
          <li key={index} className="text-slate-700 leading-relaxed ml-4">
            {trimmedLine.substring(1).trim()}
          </li>
        );
      }
      
      return (
        <p key={index} className="text-slate-700 leading-relaxed mb-2">
          {trimmedLine}
        </p>
      );
    });
  };

  const approveV1 = async () => {
    setApproving(true);
    try {
      const response = await apiPost(`/api/documents/${id}/verify-v1`);

      if (response.ok) {
        showToast({ variant: "success", message: "V1 approved successfully!" });
        setIsApproved(true);
        setTimeout(() => {
          router.push(`/documents/${id}`);
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

  if (!v1Data || !parsedSections.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">No V1 data found</p>
          <Link href={`/documents/${id}/v1`} className="text-blue-600 hover:underline">
            Go back to editor
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-xl rounded-2xl p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">V1 Preview & Approval</h1>
                <p className="text-slate-600 mt-1">Review extracted content before approval</p>
                {isApproved && (
                  <div className="flex items-center gap-2 mt-2 px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    V1 Approved
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Link 
                  href={`/documents/${id}/v1`}
                  className="px-4 py-2 bg-white/80 border border-white/50 text-slate-700 rounded-lg hover:bg-white/90 transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Editor
                </Link>
                {permissions.canProcess && !isApproved && (
                  <button
                    onClick={approveV1}
                    disabled={approving}
                    className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {approving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {approving ? "Approving..." : "Approve V1"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          {parsedSections.map((section, index) => (
            <div key={index} className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-xl rounded-2xl overflow-hidden">
              {/* Section Header */}
              <div className={`p-4 border-b border-white/50 ${
                section.level === 1 ? 'bg-gradient-to-r from-blue-50 to-indigo-50' :
                section.level === 2 ? 'bg-gradient-to-r from-green-50 to-emerald-50' :
                'bg-gradient-to-r from-purple-50 to-pink-50'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold ${
                    section.level === 1 ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
                    section.level === 2 ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                    'bg-gradient-to-br from-purple-500 to-pink-600'
                  }`}>
                    {section.level}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{section.title}</h3>
                  <div className="ml-auto text-xs text-slate-500">
                    {section.type === 'table' ? 'Table' : section.images?.length ? `${section.images.length} images` : 'Text'}
                  </div>
                </div>
              </div>

              {/* Section Content */}
              <div className="p-6">
                {/* Display images if present */}
                {section.images && section.images.length > 0 && (
                  <div className="mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {section.images.map((image, imgIndex) => {
                        const needsBlackBg = /image(97|98|101|102|105|106)\.png/i.test(image.src);
                        
                        return (
                          <div
                            key={imgIndex}
                            className={`border border-slate-200 rounded-lg p-3 ${needsBlackBg ? 'bg-black' : 'bg-slate-50'}`}
                          >
                            <img
                              src={image.src}
                              alt={image.alt || "Document image"}
                              className="w-full h-auto rounded border"
                              style={{ maxHeight: "200px", objectFit: "contain" }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                            <div className="hidden text-center text-slate-500 text-sm mt-2">
                              Image not found: {image.src}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Display table if present */}
                {section.type === 'table' && section.tableData ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border border-slate-200 rounded-lg">
                      <thead>
                        <tr className="bg-slate-50">
                          {section.tableData.headers.map((header, headerIndex) => (
                            <th key={headerIndex} className="border border-slate-200 p-3 text-left font-semibold text-slate-800">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {section.tableData.rows.map((row, rowIndex) => (
                          <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-25'}>
                            {row.map((cell, cellIndex) => (
                              <td key={cellIndex} className="border border-slate-200 p-3 text-slate-700">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* Display text content */
                  <div className="prose max-w-none">
                    {renderContent(section.content)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Actions */}
        {permissions.canProcess && !isApproved && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={approveV1}
              disabled={approving}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 text-lg font-medium shadow-lg"
            >
              {approving ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {approving ? "Approving V1..." : "Approve V1 Content"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
