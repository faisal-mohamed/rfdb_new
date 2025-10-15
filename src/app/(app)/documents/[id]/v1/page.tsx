// "use client";
// import { useState, useEffect, use } from "react";
// import { useRouter } from "next/navigation";
// import { useSession } from "next-auth/react";
// import { getSimplePermissions } from "@/lib/simplePermissions";
// import { useToast } from "@/components/ui/Toast";
// import Link from "next/link";

// interface ParsedSection {
//   title: string;
//   content: string;
//   level: number;
//   type: 'text' | 'table' | 'mixed';
//   tableData?: { headers: string[]; rows: string[][] };
//   images?: { src: string; alt?: string; style?: string }[];
// }

// export default function V1EditorPage({ params }: { params: Promise<{ id: string }> }) {
//   const { id } = use(params);
//   const router = useRouter();
//   const { data: session } = useSession();
//   const { showToast } = useToast();
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [v1Data, setV1Data] = useState<any>(null);
//   const [parsedSections, setParsedSections] = useState<ParsedSection[]>([]);
//   const [hasChanges, setHasChanges] = useState(false);
//   const permissions = getSimplePermissions(session?.user?.role || "VIEWER");

//   useEffect(() => {
//     loadV1Data();
//   }, [id]);

//   const loadV1Data = async () => {
//     try {
//       const response = await fetch(`/api/documents/${id}/v1-content`);
//       if (response.ok) {
//         const data = await response.json();
//         setV1Data(data);
//         parseGeneratedData(data);
//       } else {
//         showToast({ variant: "error", message: "Failed to load V1 data" });
//       }
//     } catch (error) {
//       console.error("Error loading V1 data:", error);
//       showToast({ variant: "error", message: "Error loading V1 data" });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const parseGeneratedData = (data: any) => {
//     const sections: ParsedSection[] = [];
    
//     // Extract generated_data from the response structure
//     const extractedContent = data?.["1"]?.extracted_content?.[0]?.fields?.[0]?.generated_data?.value;
    
//     if (!extractedContent) {
//       console.warn("No generated_data found in response");
//       return;
//     }

//     // Split content by lines and parse markdown-style headers
//     const lines = extractedContent.split('\n');
//     let currentSection: ParsedSection | null = null;
//     let inHtmlTable = false;
//     let htmlTableLines: string[] = [];
    
//     for (let i = 0; i < lines.length; i++) {
//       const line = lines[i];
//       const trimmedLine = line.trim();
      
//       if (!trimmedLine) {
//         if (inHtmlTable && htmlTableLines.length > 0) {
//           // End of HTML table
//           if (currentSection) {
//             const tableData = parseHtmlTable(htmlTableLines.join('\n'));
//             if (tableData) {
//               currentSection.type = 'table';
//               currentSection.tableData = tableData;
//             }
//           }
//           inHtmlTable = false;
//           htmlTableLines = [];
//         }
//         continue;
//       }
      
//       // Detect HTML table start
//       if (trimmedLine.includes('<table>')) {
//         inHtmlTable = true;
//         htmlTableLines = [line];
//         continue;
//       }
      
//       // Continue collecting HTML table lines
//       if (inHtmlTable) {
//         htmlTableLines.push(line);
//         if (trimmedLine.includes('</table>')) {
//           // End of HTML table
//           if (currentSection) {
//             const tableData = parseHtmlTable(htmlTableLines.join('\n'));
//             if (tableData) {
//               currentSection.type = 'table';
//               currentSection.tableData = tableData;
//             }
//           }
//           inHtmlTable = false;
//           htmlTableLines = [];
//         }
//         continue;
//       }
      
//       // Detect headers - prioritize ** format for main headings
//       if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**') && trimmedLine.length > 4) {
//         // Bold text header (main sections)
//         if (currentSection) {
//           sections.push(currentSection);
//         }
//         currentSection = {
//           title: trimmedLine.replace(/\*\*/g, ''),
//           content: '',
//           level: 1,
//           type: 'text'
//         };
//       } else if (trimmedLine.startsWith('# ')) {
//         // H1 header
//         if (currentSection) {
//           sections.push(currentSection);
//         }
//         currentSection = {
//           title: trimmedLine.replace(/^# /, ''),
//           content: '',
//           level: 1,
//           type: 'text'
//         };
//       } else if (trimmedLine.startsWith('## ')) {
//         // H2 header
//         if (currentSection) {
//           sections.push(currentSection);
//         }
//         currentSection = {
//           title: trimmedLine.replace(/^## /, ''),
//           content: '',
//           level: 2,
//           type: 'text'
//         };
//       } else if (trimmedLine.startsWith('### ')) {
//         // H3 header
//         if (currentSection) {
//           sections.push(currentSection);
//         }
//         currentSection = {
//           title: trimmedLine.replace(/^### /, ''),
//           content: '',
//           level: 3,
//           type: 'text'
//         };
//       } else if (trimmedLine.startsWith('> **') && trimmedLine.includes('**')) {
//         // Quoted bold text (like Vision section)
//         if (currentSection) {
//           sections.push(currentSection);
//         }
//         currentSection = {
//           title: trimmedLine.replace(/^> \*\*/, '').replace(/\*\*.*$/, ''),
//           content: '',
//           level: 2,
//           type: 'text'
//         };
//       } else {
//         // Regular content
//         if (!currentSection) {
//           currentSection = {
//             title: 'Introduction',
//             content: '',
//             level: 1,
//             type: 'text'
//           };
//         }
//         currentSection.content += (currentSection.content ? '\n' : '') + line;
//       }
//     }
    
//     // Add the last section
//     if (currentSection) {
//       sections.push(currentSection);
//     }
    
//     // Parse images in each section
//     sections.forEach(section => {
//       const images = parseImages(section.content);
//       if (images.length > 0) {
//         section.images = images;
//         section.type = section.type === 'table' ? 'table' : 'mixed';
//       }
//     });
    
//     setParsedSections(sections);
//   };

//   const parseImages = (content: string): { src: string; alt?: string; style?: string }[] => {
//     const images: { src: string; alt?: string; style?: string }[] = [];
//     const imgRegex = /<img[^>]*src="([^"]*)"[^>]*(?:alt="([^"]*)")?[^>]*(?:style="([^"]*)")?[^>]*\/?>/gi;
//     let match;
    
//     while ((match = imgRegex.exec(content)) !== null) {
//       const src = match[1];
//       const alt = match[2] || '';
//       const style = match[3] || '';
      
//       // Convert relative path to public path
//       const publicSrc = src.startsWith('./') ? src.replace('./', '/') : src;
      
//       images.push({ src: publicSrc, alt, style });
//     }
    
//     return images;
//   };

//   const renderContentWithImages = (content: string, images?: { src: string; alt?: string; style?: string }[]) => {
//     if (!images || images.length === 0) {
//       return content;
//     }

//     let renderedContent = content;
//     const imgRegex = /<img[^>]*src="([^"]*)"[^>]*\/?>/gi;
    
//     // Replace img tags with placeholder text for editing
//     renderedContent = renderedContent.replace(imgRegex, (match, src) => {
//       const publicSrc = src.startsWith('./') ? src.replace('./', '/') : src;
//       return `[IMAGE: ${publicSrc}]`;
//     });

//     return renderedContent;
//   };

//   const reconstructContentWithImages = (content: string, originalContent: string) => {
//     // Find image placeholders and restore original img tags
//     const placeholderRegex = /\[IMAGE: ([^\]]+)\]/g;
//     const imgRegex = /<img[^>]*src="([^"]*)"[^>]*\/?>/gi;
    
//     let reconstructed = content;
//     const originalImages: string[] = [];
//     let imgMatch;
    
//     // Extract original img tags
//     while ((imgMatch = imgRegex.exec(originalContent)) !== null) {
//       originalImages.push(imgMatch[0]);
//     }
    
//     // Replace placeholders with original img tags
//     let imageIndex = 0;
//     reconstructed = reconstructed.replace(placeholderRegex, () => {
//       if (imageIndex < originalImages.length) {
//         return originalImages[imageIndex++];
//       }
//       return '[IMAGE: Not found]';
//     });
    
//     return reconstructed;
//   };
//     try {
//       // Create a temporary DOM element to parse HTML
//       const parser = new DOMParser();
//       const doc = parser.parseFromString(htmlContent, 'text/html');
//       const table = doc.querySelector('table');
      
//       if (!table) return null;
      
//       // Extract headers
//       const headerCells = table.querySelectorAll('thead th, thead td');
//       const headers = Array.from(headerCells).map(cell => 
//         cell.textContent?.trim().replace(/\n\s+/g, ' ') || ''
//       );
      
//       // Extract rows
//       const bodyRows = table.querySelectorAll('tbody tr');
//       const rows = Array.from(bodyRows).map(row => {
//         const cells = row.querySelectorAll('td, th');
//         return Array.from(cells).map(cell => 
//           cell.textContent?.trim().replace(/\n\s+/g, ' ') || ''
//         );
//       });
      
//       return { headers, rows };
//     } catch (error) {
//       console.error('Error parsing HTML table:', error);
//       return null;
//     }
//   };

//   const updateSectionContent = (index: number, newContent: string, tableData?: { headers: string[]; rows: string[][] }) => {
//     const updatedSections = [...parsedSections];
//     if (tableData) {
//       updatedSections[index].tableData = tableData;
//       updatedSections[index].type = 'table';
//     } else {
//       updatedSections[index].content = newContent;
//     }
//     setParsedSections(updatedSections);
//     setHasChanges(true);
//   };

//   const saveV1 = async () => {
//     if (!v1Data || !parsedSections.length) return;

//     setSaving(true);
//     try {
//       // Reconstruct the generated_data content from parsed sections
//       const reconstructedContent = parsedSections.map(section => {
//         let header = '';
//         if (section.level === 1) {
//           header = `**${section.title}**`;
//         } else if (section.level === 2) {
//           header = `## ${section.title}`;
//         } else {
//           header = `### ${section.title}`;
//         }
        
//         let content = '';
//         if (section.type === 'table' && section.tableData) {
//           // Reconstruct HTML table
//           const { headers, rows } = section.tableData;
//           content = `<table>\n<thead>\n<tr class="header">\n`;
//           headers.forEach(header => {
//             content += `<th>${header}</th>\n`;
//           });
//           content += `</tr>\n</thead>\n<tbody>\n`;
//           rows.forEach((row, index) => {
//             const className = index % 2 === 0 ? 'odd' : 'even';
//             content += `<tr class="${className}">\n`;
//             row.forEach(cell => {
//               content += `<td>${cell}</td>\n`;
//             });
//             content += `</tr>\n`;
//           });
//           content += `</tbody>\n</table>`;
//         } else {
//           content = section.content;
//         }
        
//         return `${header}\n\n${content}`;
//       }).join('\n\n');

//       // Update the original data structure
//       const updatedData = JSON.parse(JSON.stringify(v1Data));
//       if (updatedData?.["1"]?.extracted_content?.[0]?.fields?.[0]?.generated_data) {
//         updatedData["1"].extracted_content[0].fields[0].generated_data.value = reconstructedContent;
//       }

//       const response = await fetch(`/api/documents/${id}/v1-content`, {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ content: updatedData }),
//       });

//       if (response.ok) {
//         showToast({ variant: "success", message: "V1 content saved successfully" });
//         setHasChanges(false);
//         setV1Data(updatedData);
//       } else {
//         const error = await response.json();
//         showToast({ variant: "error", message: error.error || "Failed to save V1 content" });
//       }
//     } catch (error) {
//       console.error("Error saving V1 content:", error);
//       showToast({ variant: "error", message: "Error saving V1 content" });
//     } finally {
//       setSaving(false);
//     }
//   };

//   const verifyV1 = async () => {
//     router.push(`/documents/${id}/v1/preview`);
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
//           <p className="mt-2 text-slate-600">Loading...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!v1Data || !parsedSections.length) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="text-center">
//           <p className="text-slate-600">No V1 data found</p>
//           <Link href={`/documents/${id}`} className="text-blue-600 hover:underline">
//             Go back to document
//           </Link>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
//       <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {/* Header */}
//         <div className="mb-8">
//           <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-xl rounded-2xl p-6">
//             <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
//               <div>
//                 <h1 className="text-3xl font-bold text-slate-900">Version 1 Editor</h1>
//                 <p className="text-slate-600 mt-1">Edit extracted document data</p>
//                 {hasChanges && (
//                   <div className="flex items-center gap-2 mt-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-sm">
//                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
//                     </svg>
//                     Unsaved changes
//                   </div>
//                 )}
//               </div>
//               <div className="flex items-center gap-3">
//                 <Link 
//                   href={`/documents/${id}`} 
//                   className="px-4 py-2 bg-white/80 border border-white/50 text-slate-700 rounded-lg hover:bg-white/90 transition-all flex items-center gap-2"
//                 >
//                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
//                   </svg>
//                   Back
//                 </Link>
//                 {permissions.canEdit && (
//                   <>
//                     <button
//                       onClick={saveV1}
//                       disabled={saving || !hasChanges}
//                       className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
//                     >
//                       {saving ? (
//                         <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
//                       ) : (
//                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
//                         </svg>
//                       )}
//                       {saving ? "Saving..." : "Save"}
//                     </button>
//                     {!hasChanges && (
//                       <button
//                         onClick={verifyV1}
//                         className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
//                       >
//                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
//                         </svg>
//                         Preview & Verify
//                       </button>
//                     )}
//                   </>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Content Sections */}
//         <div className="space-y-6">
//           {parsedSections.map((section, index) => (
//             <div key={index} className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-xl rounded-2xl overflow-hidden">
//               {/* Section Header */}
//               <div className={`p-4 border-b border-white/50 ${
//                 section.level === 1 ? 'bg-gradient-to-r from-blue-50 to-indigo-50' :
//                 section.level === 2 ? 'bg-gradient-to-r from-green-50 to-emerald-50' :
//                 'bg-gradient-to-r from-purple-50 to-pink-50'
//               }`}>
//                 <div className="flex items-center gap-3">
//                   <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold ${
//                     section.level === 1 ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
//                     section.level === 2 ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
//                     'bg-gradient-to-br from-purple-500 to-pink-600'
//                   }`}>
//                     {section.level}
//                   </div>
//                   <h3 className="text-lg font-bold text-slate-900">{section.title}</h3>
//                   <div className="ml-auto text-xs text-slate-500">
//                     {section.content.split('\n').length} lines
//                   </div>
//                 </div>
//               </div>

//               {/* Section Content Editor */}
//               <div className="p-6">
//                 {section.type === 'table' && section.tableData ? (
//                   <div className="space-y-4">
//                     <div className="text-sm text-slate-600 mb-2">Table Editor</div>
//                     <div className="overflow-x-auto">
//                       <table className="w-full border border-slate-200 rounded-lg">
//                         <thead>
//                           <tr className="bg-slate-50">
//                             {section.tableData.headers.map((header, headerIndex) => (
//                               <th key={headerIndex} className="border border-slate-200 p-2">
//                                 <input
//                                   type="text"
//                                   value={header}
//                                   onChange={(e) => {
//                                     const newTableData = { ...section.tableData! };
//                                     newTableData.headers[headerIndex] = e.target.value;
//                                     updateSectionContent(index, section.content, newTableData);
//                                   }}
//                                   className="w-full p-1 text-sm border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
//                                   readOnly={!permissions.canEdit}
//                                 />
//                               </th>
//                             ))}
//                             {permissions.canEdit && (
//                               <th className="border border-slate-200 p-2 w-10">
//                                 <button
//                                   onClick={() => {
//                                     const newTableData = { ...section.tableData! };
//                                     newTableData.headers.push('New Column');
//                                     newTableData.rows = newTableData.rows.map(row => [...row, '']);
//                                     updateSectionContent(index, section.content, newTableData);
//                                   }}
//                                   className="text-green-600 hover:text-green-700"
//                                 >
//                                   +
//                                 </button>
//                               </th>
//                             )}
//                           </tr>
//                         </thead>
//                         <tbody>
//                           {section.tableData.rows.map((row, rowIndex) => (
//                             <tr key={rowIndex}>
//                               {row.map((cell, cellIndex) => (
//                                 <td key={cellIndex} className="border border-slate-200 p-2">
//                                   <textarea
//                                     value={cell}
//                                     onChange={(e) => {
//                                       const newTableData = { ...section.tableData! };
//                                       newTableData.rows[rowIndex][cellIndex] = e.target.value;
//                                       updateSectionContent(index, section.content, newTableData);
//                                     }}
//                                     className="w-full p-1 text-sm border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded resize-none"
//                                     rows={Math.max(1, Math.ceil(cell.length / 30))}
//                                     readOnly={!permissions.canEdit}
//                                   />
//                                 </td>
//                               ))}
//                               {permissions.canEdit && (
//                                 <td className="border border-slate-200 p-2 w-10">
//                                   <button
//                                     onClick={() => {
//                                       const newTableData = { ...section.tableData! };
//                                       newTableData.rows.splice(rowIndex, 1);
//                                       updateSectionContent(index, section.content, newTableData);
//                                     }}
//                                     className="text-red-600 hover:text-red-700"
//                                   >
//                                     ×
//                                   </button>
//                                 </td>
//                               )}
//                             </tr>
//                           ))}
//                           {permissions.canEdit && (
//                             <tr>
//                               <td colSpan={section.tableData.headers.length + 1} className="border border-slate-200 p-2 text-center">
//                                 <button
//                                   onClick={() => {
//                                     const newTableData = { ...section.tableData! };
//                                     newTableData.rows.push(new Array(newTableData.headers.length).fill(''));
//                                     updateSectionContent(index, section.content, newTableData);
//                                   }}
//                                   className="text-green-600 hover:text-green-700 text-sm"
//                                 >
//                                   + Add Row
//                                 </button>
//                               </td>
//                             </tr>
//                           )}
//                         </tbody>
//                       </table>
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="space-y-4">
//                     {/* Display images if present */}
//                     {section.images && section.images.length > 0 && (
//                       <div className="space-y-3">
//                         <div className="text-sm text-slate-600 mb-2">Images in this section:</div>
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                           {section.images.map((image, imgIndex) => (
//                             <div key={imgIndex} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
//                               <img
//                                 src={image.src}
//                                 alt={image.alt || 'Document image'}
//                                 className="w-full h-auto rounded border"
//                                 style={{ maxHeight: '200px', objectFit: 'contain' }}
//                                 onError={(e) => {
//                                   const target = e.target as HTMLImageElement;
//                                   target.style.display = 'none';
//                                   target.nextElementSibling?.classList.remove('hidden');
//                                 }}
//                               />
//                               <div className="hidden text-center text-slate-500 text-sm mt-2">
//                                 Image not found: {image.src}
//                               </div>
//                               <div className="text-xs text-slate-500 mt-2">
//                                 Path: {image.src}
//                               </div>
//                             </div>
//                           ))}
//                         </div>
//                       </div>
//                     )}
                    
//                     {/* Text content editor */}
//                     <textarea
//                       value={renderContentWithImages(section.content, section.images)}
//                       onChange={(e) => {
//                         const reconstructed = reconstructContentWithImages(e.target.value, section.content);
//                         updateSectionContent(index, reconstructed);
//                       }}
//                       className="w-full min-h-[200px] p-4 rounded-lg border border-slate-200 bg-white/90 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 text-sm leading-relaxed resize-y"
//                       readOnly={!permissions.canEdit}
//                       placeholder={`Enter content for ${section.title.toLowerCase()}...`}
//                     />
                    
//                     {section.images && section.images.length > 0 && (
//                       <div className="text-xs text-slate-500">
//                         Note: Images are displayed above. In the text editor, they appear as [IMAGE: path] placeholders.
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getSimplePermissions } from "@/lib/simplePermissions";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";
import { apiGet, apiPut } from "@/lib/api";

interface ParsedSection {
  title: string;
  content: string;
  level: number;
  type: "text" | "table" | "mixed";
  tableData?: { headers: string[]; rows: string[][] };
  images?: { src: string; alt?: string; style?: string }[];
}

export default function V1EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [v1Data, setV1Data] = useState<any>(null);
  const [parsedSections, setParsedSections] = useState<ParsedSection[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
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

  const parseHtmlTable = (
    htmlContent: string
  ): { headers: string[]; rows: string[][] } | null => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, "text/html");
      const table = doc.querySelector("table");

      if (!table) return null;

      const headerCells = table.querySelectorAll("thead th, thead td");
      const headers = Array.from(headerCells).map(
        (cell) => cell.textContent?.trim().replace(/\n\s+/g, " ") || ""
      );

      const bodyRows = table.querySelectorAll("tbody tr");
      const rows = Array.from(bodyRows).map((row) => {
        const cells = row.querySelectorAll("td, th");
        return Array.from(cells).map(
          (cell) => cell.textContent?.trim().replace(/\n\s+/g, " ") || ""
        );
      });

      return { headers, rows };
    } catch (error) {
      console.error("Error parsing HTML table:", error);
      return null;
    }
  };

  const parseGeneratedData = (data: any) => {
    const sections: ParsedSection[] = [];

    const extractedContent =
      data?.["1"]?.extracted_content?.[0]?.fields?.[0]?.generated_data?.value;

    if (!extractedContent) {
      console.warn("No generated_data found in response");
      return;
    }

    const lines = extractedContent.split("\n");
    let currentSection: ParsedSection | null = null;
    let inHtmlTable = false;
    let htmlTableLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        if (inHtmlTable && htmlTableLines.length > 0) {
          if (currentSection) {
            const tableData = parseHtmlTable(htmlTableLines.join("\n"));
            if (tableData) {
              currentSection.type = "table";
              currentSection.tableData = tableData;
            }
          }
          inHtmlTable = false;
          htmlTableLines = [];
        }
        continue;
      }

      if (trimmedLine.includes("<table>")) {
        inHtmlTable = true;
        htmlTableLines = [line];
        continue;
      }

      if (inHtmlTable) {
        htmlTableLines.push(line);
        if (trimmedLine.includes("</table>")) {
          if (currentSection) {
            const tableData = parseHtmlTable(htmlTableLines.join("\n"));
            if (tableData) {
              currentSection.type = "table";
              currentSection.tableData = tableData;
            }
          }
          inHtmlTable = false;
          htmlTableLines = [];
        }
        continue;
      }

      if (
        trimmedLine.startsWith("**") &&
        trimmedLine.endsWith("**") &&
        trimmedLine.length > 4
      ) {
        if (currentSection) sections.push(currentSection);
        currentSection = {
          title: trimmedLine.replace(/\*\*/g, ""),
          content: "",
          level: 1,
          type: "text",
        };
      } else if (trimmedLine.startsWith("# ")) {
        if (currentSection) sections.push(currentSection);
        currentSection = {
          title: trimmedLine.replace(/^# /, ""),
          content: "",
          level: 1,
          type: "text",
        };
      } else if (trimmedLine.startsWith("## ")) {
        if (currentSection) sections.push(currentSection);
        currentSection = {
          title: trimmedLine.replace(/^## /, ""),
          content: "",
          level: 2,
          type: "text",
        };
      } else if (trimmedLine.startsWith("### ")) {
        if (currentSection) sections.push(currentSection);
        currentSection = {
          title: trimmedLine.replace(/^### /, ""),
          content: "",
          level: 3,
          type: "text",
        };
      } else if (
        trimmedLine.startsWith("> **") &&
        trimmedLine.includes("**")
      ) {
        if (currentSection) sections.push(currentSection);
        currentSection = {
          title: trimmedLine
            .replace(/^> \*\*/, "")
            .replace(/\*\*.*$/, ""),
          content: "",
          level: 2,
          type: "text",
        };
      } else {
        if (!currentSection) {
          currentSection = {
            title: "Introduction",
            content: "",
            level: 1,
            type: "text",
          };
        }
        currentSection.content +=
          (currentSection.content ? "\n" : "") + line;
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    sections.forEach((section) => {
      const images = parseImages(section.content);
      if (images.length > 0) {
        section.images = images;
        section.type = section.type === "table" ? "table" : "mixed";
      }
    });

    setParsedSections(sections);
  };

  const parseImages = (
    content: string
  ): { src: string; alt?: string; style?: string }[] => {
    const images: { src: string; alt?: string; style?: string }[] = [];
    const imgRegex =
      /<img[^>]*src="([^"]*)"[^>]*(?:alt="([^"]*)")?[^>]*(?:style="([^"]*)")?[^>]*\/?>/gi;
    let match;

    while ((match = imgRegex.exec(content)) !== null) {
      const src = match[1];
      const alt = match[2] || "";
      const style = match[3] || "";

      const publicSrc = src.startsWith("./") ? `/rfp${src.replace("./", "/")}` : `/rfp${src}`;

      images.push({ src: publicSrc, alt, style });
    }

    return images;
  };

  const renderContentWithImages = (
    content: string,
    images?: { src: string; alt?: string; style?: string }[]
  ) => {
    if (!images || images.length === 0) return content;

    let renderedContent = content;
    const imgRegex = /<img[^>]*src="([^"]*)"[^>]*\/?>/gi;

    // Remove img tags completely from text editor
    renderedContent = renderedContent.replace(imgRegex, '');
    
    // Clean up extra empty lines
    renderedContent = renderedContent.replace(/\n\s*\n\s*\n/g, '\n\n');

    return renderedContent.trim();
  };

  const reconstructContentWithImages = (
    content: string,
    originalContent: string
  ) => {
    // Since we removed img tags from the editor, we need to reinsert them
    // at their original positions in the content
    const imgRegex = /<img[^>]*src="([^"]*)"[^>]*\/?>/gi;
    const originalImages: string[] = [];
    let imgMatch;

    // Extract all original img tags
    while ((imgMatch = imgRegex.exec(originalContent)) !== null) {
      originalImages.push(imgMatch[0]);
    }

    // If no images, return content as is
    if (originalImages.length === 0) return content;

    // For now, append images at the end of content
    // This is a simple approach - could be enhanced to maintain original positions
    let reconstructed = content;
    originalImages.forEach(imgTag => {
      reconstructed += '\n\n' + imgTag;
    });

    return reconstructed;
  };

  const updateSectionContent = (
    index: number,
    newContent: string,
    tableData?: { headers: string[]; rows: string[][] }
  ) => {
    const updatedSections = [...parsedSections];
    if (tableData) {
      updatedSections[index].tableData = tableData;
      updatedSections[index].type = "table";
    } else {
      updatedSections[index].content = newContent;
    }
    setParsedSections(updatedSections);
    setHasChanges(true);
  };

  const saveV1 = async () => {
    if (!v1Data || !parsedSections.length) return;

    setSaving(true);
    try {
      const reconstructedContent = parsedSections
        .map((section) => {
          let header = "";
          if (section.level === 1) header = `**${section.title}**`;
          else if (section.level === 2) header = `## ${section.title}`;
          else header = `### ${section.title}`;

          let content = "";
          if (section.type === "table" && section.tableData) {
            const { headers, rows } = section.tableData;
            content = `<table>\n<thead>\n<tr class="header">\n`;
            headers.forEach((header) => {
              content += `<th>${header}</th>\n`;
            });
            content += `</tr>\n</thead>\n<tbody>\n`;
            rows.forEach((row, index) => {
              const className = index % 2 === 0 ? "odd" : "even";
              content += `<tr class="${className}">\n`;
              row.forEach((cell) => {
                content += `<td>${cell}</td>\n`;
              });
              content += `</tr>\n`;
            });
            content += `</tbody>\n</table>`;
          } else {
            content = section.content;
          }

          return `${header}\n\n${content}`;
        })
        .join("\n\n");

      const updatedData = JSON.parse(JSON.stringify(v1Data));
      if (
        updatedData?.["1"]?.extracted_content?.[0]?.fields?.[0]
          ?.generated_data
      ) {
        updatedData["1"].extracted_content[0].fields[0].generated_data.value =
          reconstructedContent;
      }

      const response = await apiPut(`/api/documents/${id}/v1-content`, { content: updatedData });

      if (response.ok) {
        showToast({
          variant: "success",
          message: "V1 content saved successfully",
        });
        setHasChanges(false);
        setV1Data(updatedData);
      } else {
        const error = await response.json();
        showToast({
          variant: "error",
          message: error.error || "Failed to save V1 content",
        });
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

  if (!v1Data || !parsedSections.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">No V1 data found</p>
          <Link
            href={`/documents/${id}`}
            className="text-blue-600 hover:underline"
          >
            Go back to document
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
                <h1 className="text-3xl font-bold text-slate-900">
                  Version 1 Editor
                </h1>
                <p className="text-slate-600 mt-1">
                  Edit extracted document data
                </p>
                {hasChanges && (
                  <div className="flex items-center gap-2 mt-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-sm">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    Unsaved changes
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/documents/${id}`}
                  className="px-4 py-2 bg-white/80 border border-white/50 text-slate-700 rounded-lg hover:bg-white/90 transition-all flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Back
                </Link>
                {permissions.canEdit && (
                  <>
                    <button
                      onClick={saveV1}
                      disabled={saving || !hasChanges}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {saving ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      ) : (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                      )}
                      {saving ? "Saving..." : "Save"}
                    </button>
                    {!hasChanges && (
                      <button
                        onClick={verifyV1}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        Preview & Verify
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        {/* Content Sections */}
<div className="space-y-6">
  {parsedSections.map((section, index) => (
    <div
      key={index}
      className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-xl rounded-2xl overflow-hidden"
    >
      {/* Section Header */}
      <div
        className={`p-4 border-b border-white/50 ${
          section.level === 1
            ? "bg-gradient-to-r from-blue-50 to-indigo-50"
            : section.level === 2
            ? "bg-gradient-to-r from-green-50 to-emerald-50"
            : "bg-gradient-to-r from-purple-50 to-pink-50"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold ${
              section.level === 1
                ? "bg-gradient-to-br from-blue-500 to-indigo-600"
                : section.level === 2
                ? "bg-gradient-to-br from-green-500 to-emerald-600"
                : "bg-gradient-to-br from-purple-500 to-pink-600"
            }`}
          >
            {section.level}
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            {section.title}
          </h3>
          <div className="ml-auto text-xs text-slate-500">
            {section.content.split("\n").length} lines
          </div>
        </div>
      </div>

      {/* Section Content */}
      <div className="p-6">
        {section.type === "table" && section.tableData ? (
          // === TABLE BRANCH ===
          <div className="space-y-4">
            <div className="text-sm text-slate-600 mb-2">Table Editor</div>
            <div className="overflow-x-auto">
              <table className="w-full border border-slate-200 rounded-lg">
                <thead>
                  <tr className="bg-slate-50">
                    {section.tableData.headers.map((header, headerIndex) => (
                      <th
                        key={headerIndex}
                        className="border border-slate-200 p-2"
                      >
                        <input
                          type="text"
                          value={header}
                          onChange={(e) => {
                            const newTableData = { ...section.tableData! };
                            newTableData.headers[headerIndex] = e.target.value;
                            updateSectionContent(
                              index,
                              section.content,
                              newTableData
                            );
                          }}
                          className="w-full p-1 text-sm border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                          readOnly={!permissions.canEdit}
                        />
                      </th>
                    ))}
                    {permissions.canEdit && (
                      <th className="border border-slate-200 p-2 w-10">
                        <button
                          onClick={() => {
                            const newTableData = { ...section.tableData! };
                            newTableData.headers.push("New Column");
                            newTableData.rows = newTableData.rows.map((row) => [
                              ...row,
                              "",
                            ]);
                            updateSectionContent(
                              index,
                              section.content,
                              newTableData
                            );
                          }}
                          className="text-green-600 hover:text-green-700"
                        >
                          +
                        </button>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {section.tableData.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="border border-slate-200 p-2"
                        >
                          <textarea
                            value={cell}
                            onChange={(e) => {
                              const newTableData = { ...section.tableData! };
                              newTableData.rows[rowIndex][cellIndex] =
                                e.target.value;
                              updateSectionContent(
                                index,
                                section.content,
                                newTableData
                              );
                            }}
                            className="w-full p-1 text-sm border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded resize-none"
                            rows={Math.max(1, Math.ceil(cell.length / 30))}
                            readOnly={!permissions.canEdit}
                          />
                        </td>
                      ))}
                      {permissions.canEdit && (
                        <td className="border border-slate-200 p-2 w-10">
                          <button
                            onClick={() => {
                              const newTableData = { ...section.tableData! };
                              newTableData.rows.splice(rowIndex, 1);
                              updateSectionContent(
                                index,
                                section.content,
                                newTableData
                              );
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            ×
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {permissions.canEdit && (
                    <tr>
                      <td
                        colSpan={section.tableData.headers.length + 1}
                        className="border border-slate-200 p-2 text-center"
                      >
                        <button
                          onClick={() => {
                            const newTableData = { ...section.tableData! };
                            newTableData.rows.push(
                              new Array(newTableData.headers.length).fill("")
                            );
                            updateSectionContent(
                              index,
                              section.content,
                              newTableData
                            );
                          }}
                          className="text-green-600 hover:text-green-700 text-sm"
                        >
                          + Add Row
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          // === NON-TABLE BRANCH ===
          <div className="space-y-4">
            {section.images && section.images.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm text-slate-600 mb-2">
                  Images in this section:
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.images.map((image, imgIndex) => {
                    const needsBlackBg = /image(97|98|101|102|105|106)\.png/i.test(
                      image.src
                    );
                    return (
                      <div
                        key={imgIndex}
                        className={`border border-slate-200 rounded-lg p-3 ${
                          needsBlackBg ? "bg-black" : "bg-slate-50"
                        }`}
                      >
                        <img
                          src={image.src}
                          alt={image.alt || "Document image"}
                          className="w-full h-auto rounded border"
                          style={{ maxHeight: "200px", objectFit: "contain" }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            target.nextElementSibling?.classList.remove(
                              "hidden"
                            );
                          }}
                        />
                        <div className="hidden text-center text-slate-500 text-sm mt-2">
                          Image not found: {image.src}
                        </div>
                        <div
                          className={`text-xs mt-2 ${
                            needsBlackBg
                              ? "text-gray-300"
                              : "text-slate-500"
                          }`}
                        >
                          Path: {image.src}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <textarea
              value={renderContentWithImages(section.content, section.images)}
              onChange={(e) => {
                const reconstructed = reconstructContentWithImages(
                  e.target.value,
                  section.content
                );
                updateSectionContent(index, reconstructed);
              }}
              className="w-full min-h-[200px] p-4 rounded-lg border border-slate-200 bg-white/90 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 text-sm leading-relaxed resize-y"
              readOnly={!permissions.canEdit}
              placeholder={`Enter content for ${section.title.toLowerCase()}...`}
            />

            {section.images && section.images.length > 0 && (
              <div className="text-xs text-slate-500">
                Note: Images are displayed above and automatically preserved
                when saving.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  ))}
</div>


</div></div>
  )
}
