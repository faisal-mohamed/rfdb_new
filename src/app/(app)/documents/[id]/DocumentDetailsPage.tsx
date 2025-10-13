// "use client";

// import Link from "next/link";
// import { useEffect, useState } from "react";
// import { useSession } from "next-auth/react";
// import { getSimplePermissions } from "@/lib/simplePermissions";
// import { useToast } from "@/components/ui/Toast";

// type Props = { id: string };

// export default function DocumentDetailsClient({ id }: Props) {
//   const { data: session } = useSession();
//   const { showToast } = useToast();
//   const [doc, setDoc] = useState<any>(null);
//   const [v1Data, setV1Data] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const [generatingV1, setGeneratingV1] = useState(false);
//   const [generatingV2, setGeneratingV2] = useState(false);
//   const [downloadingPDF, setDownloadingPDF] = useState(false);
//   const [isPolling, setIsPolling] = useState(false);
//   const permissions = getSimplePermissions(session?.user?.role || "VIEWER");

//   useEffect(() => {
//     loadDocumentData();
    
//     // Set up polling every 30 seconds to check document status
//     const interval = setInterval(() => {
//       setIsPolling(true);
//       loadDocumentData().finally(() => setIsPolling(false));
//     }, 30000);

//     return () => clearInterval(interval);
//   }, [id]);

//   const loadDocumentData = async () => {
//     try {
//       // Get document data from external API via our backend
//       const response = await fetch(`/api/documents/${id}`);
//       if (response.ok) {
//         const docData = await response.json();
//         setDoc(docData);
//       } else {
//         // Fallback to mock data if API fails
//         console.error("error");
//       }
      
//       // Try to load existing V1 data
//       await loadV1Data();
//     } finally {
//       setLoading(false);
//     }
//   };

  




//   const loadV1Data = async () => {
//     try {
//       const response = await fetch(`/api/documents/${id}/v1-content`);
//       if (response.ok) {
//         const data = await response.json();
//         setV1Data(data);
        
//         // Check if V1 is verified by checking the database version status
//         const versionResponse = await fetch(`/api/documents/${id}/v1-status`);
//         if (versionResponse.ok) {
//           const versionData = await versionResponse.json();
//           // V1 is verified if status is APPROVED
//           if (versionData.status === 'APPROVED') {
//             setV1Data({...data, isVerified: true});
//           }
//         }
//       }
//     } catch (error) {
//       console.error("Error loading V1 data:", error);
//     }
//   };

//   const generateV1 = async () => {
//     setGeneratingV1(true);
//     try {
//       const response = await fetch(`/api/documents/${id}/generate-v1`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//       });

//       if (response.ok) {
//         showToast({ variant: "success", message: "V1 generated successfully!" });
//         await loadV1Data(); // Reload V1 data
//       } else {
//         const error = await response.json();
//         showToast({ variant: "error", message: error.error || "Failed to generate V1" });
//       }
//     } catch (error) {
//       console.error("Error generating V1:", error);
//       showToast({ variant: "error", message: "Error generating V1" });
//     } finally {
//       setGeneratingV1(false);
//     }
//   };

//   const generateV2 = async () => {
//     setGeneratingV2(true);
//     try {
//       const response = await fetch(`/api/documents/${id}/generate-v2`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//       });

//       if (response.ok) {
//         showToast({ variant: "success", message: "V2 generated successfully!" });
//         // Navigate to V2 editor
//         window.location.href = `/documents/${id}/v2`;
//       } else {
//         const error = await response.json();
//         showToast({ variant: "error", message: error.error || "Failed to generate V2" });
//       }
//     } catch (error) {
//       console.error("Error generating V2:", error);
//       showToast({ variant: "error", message: "Error generating V2" });
//     } finally {
//       setGeneratingV2(false);
//     }
//   };

//   const downloadV1PDF = async () => {
//     setDownloadingPDF(true);
//     try {
//       const response = await fetch(`/api/documents/${id}/download-v1-pdf`);
      
//       if (response.ok) {
//         const blob = await response.blob();
//         const url = window.URL.createObjectURL(blob);
//         const a = document.createElement('a');
//         a.href = url;
//         a.download = `V1-Document-${id}.pdf`;
//         document.body.appendChild(a);
//         a.click();
//         window.URL.revokeObjectURL(url);
//         document.body.removeChild(a);
//         showToast({ variant: "success", message: "PDF downloaded successfully!" });
//       } else {
//         const error = await response.json();
//         showToast({ variant: "error", message: error.error || "Failed to download PDF" });
//       }
//     } catch (error) {
//       console.error("Error downloading PDF:", error);
//       showToast({ variant: "error", message: "Error downloading PDF" });
//     } finally {
//       setDownloadingPDF(false);
//     }
//   };

//   const workflowChip = (status: string) => {
//     const cls =
//       status === "COMPLETED" ? "bg-emerald-100 text-emerald-700"
//       : status === "APPROVED" ? "bg-purple-100 text-purple-700"
//       : status.includes("EDITING") ? "bg-yellow-100 text-yellow-800"
//       : status.includes("READY") ? "bg-blue-100 text-blue-700"
//       : status.includes("PROCESSING") ? "bg-indigo-100 text-indigo-700"
//       : "bg-slate-100 text-slate-700";
//     return (
//       <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
//         {status}
//       </span>
//     );
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

//   if (!doc) return <div className="p-8">Not found</div>;

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
//       {/* Animated Background Elements */}
//       <div className="fixed inset-0 overflow-hidden pointer-events-none">
//         <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-600/20 rounded-full blur-3xl animate-pulse"></div>
//         <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
//       </div>

//       <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {/* Enhanced Header */}
//         <div className="mb-8">
//           <div className="relative overflow-hidden rounded-3xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl">
//             <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10"></div>
//             <div className="relative p-8">
//               <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
//                 <div className="space-y-4">
//                   <div className="flex items-center gap-3">
//                     <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
//                       <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//                       </svg>
//                     </div>
//                     <div>
//                       <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700 bg-clip-text text-transparent">
//                         {doc.fileName}
//                       </h1>
//                       <div className="flex items-center gap-2 mt-1">
//                         <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
//                         </svg>
//                         <span className="text-slate-600 font-medium">{doc.customerName}</span>
//                       </div>
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-3">
//                     {workflowChip(doc.status)}
//                     <div className="flex items-center gap-2 text-sm text-slate-500">
//                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
//                       </svg>
//                       {new Date(doc.uploadedDate).toLocaleDateString()}
//                     </div>
//                     {isPolling && (
//                       <div className="flex items-center gap-1 text-xs text-blue-600">
//                         <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent"></div>
//                         <span>Checking status...</span>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//                 <div className="flex items-center gap-3">
//                   <Link 
//                     href="/documents" 
//                     className="group px-6 py-3 bg-white/80 backdrop-blur-sm border border-white/50 text-slate-700 rounded-xl hover:bg-white/90 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
//                   >
//                     <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
//                     </svg>
//                     Back to Documents
//                   </Link>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Enhanced Main Grid */}
//         <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
//           {/* Enhanced Info Card */}
//           <div className="xl:col-span-1">
//             <div className="relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-xl">
//               <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-blue-50/50"></div>
//               <div className="relative p-6">
//                 <div className="flex items-center gap-3 mb-6">
//                   <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center">
//                     <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                     </svg>
//                   </div>
//                   <h2 className="text-xl font-bold text-slate-900">Document Info</h2>
//                 </div>
//                 <div className="space-y-4">
//                   {[
//                     { label: "Layout ID", value: doc.layoutId, icon: "📄" },
//                     { label: "WorkFlow Status", value: doc.workflowStatus, icon: "✅" },
//                     { label: "Uploaded Date", value: new Date(doc.uploadedDate).toLocaleDateString(), icon: "📅" },
//                     { label: "Uploader", value: `${doc.uploader.firstName} ${doc.uploader.lastName}`, icon: "👤" }
//                   ].map((item, index) => (
//                     <div key={index} className="p-4 rounded-xl bg-white/50 border border-white/30">
//                       <div className="flex items-center gap-2 mb-2">
//                         <span className="text-lg">{item.icon}</span>
//                         <span className="text-sm font-medium text-slate-600">{item.label}</span>
//                       </div>
//                       <div className="text-sm font-semibold text-slate-900">{item.value}</div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Enhanced Actions and Versions */}
//           <div className="xl:col-span-2 space-y-6">
//             {/* Version 1 Enhanced Card */}
//             <div className="relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-xl">
//               <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>
//               <div className="relative p-8">
//                 <div className="flex items-center justify-between mb-6">
//                   <div className="flex items-center gap-4">
//                     <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
//                       <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//                       </svg>
//                     </div>
//                     <div>
//                       <h3 className="text-2xl font-bold text-slate-900">Version 1</h3>
//                       <p className="text-slate-600">Extracted Document Data</p>
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-3">
//                     {generatingV1 && (
//                       <div className="flex items-center gap-2">
//                         <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
//                         <span className="text-sm text-blue-600 font-medium">Processing...</span>
//                       </div>
//                     )}
//                     <div className="text-sm">
//                       {workflowChip(v1Data ? (v1Data.isVerified ? "VERIFIED" : "READY") : generatingV1 ? "PROCESSING" : "PENDING")}
//                     </div>
//                   </div>
//                 </div>
                
//                 {v1Data ? (
//                   <div className="space-y-6">
//                     <div className="flex flex-wrap items-center gap-4">
//                       <Link 
//                         href={`/documents/${id}/v1`} 
//                         className="group px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
//                       >
//                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
//                         </svg>
//                         {permissions.canEdit ? "Edit V1" : "View V1"}
//                       </Link>
                      
//                       {v1Data.isVerified && (
//                         <>
//                           <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-xl border border-green-200">
//                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
//                             </svg>
//                             <span className="font-semibold">Verified</span>
//                           </div>
//                           <button
//                             onClick={downloadV1PDF}
//                             disabled={downloadingPDF}
//                             className="group px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2"
//                           >
//                             {downloadingPDF ? (
//                               <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
//                             ) : (
//                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//                               </svg>
//                             )}
//                             {downloadingPDF ? "Downloading..." : "Download PDF"}
//                           </button>
//                         </>
//                       )}
//                     </div>
                    
//                     {/* Enhanced V1 Data Preview */}
//                     <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200/50 p-6">
//                       <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-indigo-600/10 rounded-full blur-2xl"></div>
//                       <div className="relative">
//                         <div className="flex items-center gap-2 mb-3">
//                           <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
//                           </svg>
//                           <h4 className="font-semibold text-slate-800">Content Preview</h4>
//                         </div>
//                         <p className="text-slate-700">
//                           V1 content available for editing
//                           {v1Data.isVerified && <span className="ml-2 text-green-600 font-semibold">(✓ Verified)</span>}
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="space-y-4">
//                     {doc?.workflowStatus === 'READY_FOR_EV' ? (
//                       <div className="flex items-center gap-3">
//                         {permissions.canProcess && (
//                           <button
//                             onClick={generateV1}
//                             disabled={generatingV1}
//                             className="group px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2"
//                           >
//                             {generatingV1 ? (
//                               <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
//                             ) : (
//                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
//                               </svg>
//                             )}
//                             {generatingV1 ? "Generating V1..." : "Generate V1"}
//                           </button>
//                         )}
//                         <p className="text-sm text-slate-600">
//                           {generatingV1 ? "Extracting data from document..." : "Document is ready for V1 generation"}
//                         </p>
//                       </div>
//                     ) : (
//                       <div className="flex items-center justify-center p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200/50">
//                         <div className="text-center space-y-3">
//                           <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
//                             <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
//                             </svg>
//                           </div>
//                           <div>
//                             <h4 className="font-semibold text-amber-800">Processing Document</h4>
//                             <p className="text-sm text-amber-700">Status: {doc?.workflowStatus || 'Loading...'}</p>
//                             <p className="text-xs text-amber-600 mt-1">Waiting for document to be ready...</p>
//                           </div>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 )}
//           </div>

//           {/* Version 2 */}
//           <div className="bg-white rounded-xl shadow border p-5">
//             <div className="flex items-center justify-between mb-3">
//               <h3 className="font-semibold text-slate-900">Version 2 (Verified Data)</h3>
//               <div className="flex items-center gap-2">
//                 {generatingV2 && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>}
//                 <div className="text-sm">
//                   {workflowChip(generatingV2 ? "PROCESSING" : "PENDING")}
//                 </div>
//               </div>
//             </div>
//           </div>

//             {/* Version 2 Enhanced Card */}
//             <div className="relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-xl">
//               <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-emerald-50/50"></div>
//               <div className="relative p-8">
//                 <div className="flex items-center justify-between mb-6">
//                   <div className="flex items-center gap-4">
//                     <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
//                       <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
//                       </svg>
//                     </div>
//                     <div>
//                       <h3 className="text-2xl font-bold text-slate-900">Version 2</h3>
//                       <p className="text-slate-600">Verified & Enhanced Data</p>
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-3">
//                     {generatingV2 && (
//                       <div className="flex items-center gap-2">
//                         <div className="animate-spin rounded-full h-5 w-5 border-2 border-green-600 border-t-transparent"></div>
//                         <span className="text-sm text-green-600 font-medium">Processing...</span>
//                       </div>
//                     )}
//                     <div className="text-sm">
//                       {workflowChip(generatingV2 ? "PROCESSING" : "PENDING")}
//                     </div>
//                   </div>
//                 </div>
                
//                 <div className="flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-green-50 rounded-xl border border-slate-200/50">
//                   <div className="text-center space-y-4">
//                     {v1Data && v1Data.isVerified && permissions.canProcess ? (
//                       <button
//                         onClick={generateV2}
//                         disabled={generatingV2}
//                         className="group px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-3 mx-auto"
//                       >
//                         {generatingV2 ? (
//                           <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
//                         ) : (
//                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
//                           </svg>
//                         )}
//                         <span className="font-semibold">
//                           {generatingV2 ? "Generating V2..." : "Generate V2"}
//                         </span>
//                       </button>
//                     ) : (
//                       <div className="space-y-3">
//                         <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center">
//                           <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
//                           </svg>
//                         </div>
//                         <p className="text-slate-600 font-medium">
//                           {v1Data ? (v1Data.isVerified ? "V1 verified - Ready for V2" : "V1 must be verified first") : "V1 data must be generated first"}
//                         </p>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

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
  const [downloadingWord, setDownloadingWord] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const permissions = getSimplePermissions(session?.user?.role || "VIEWER");

  useEffect(() => {
    loadDocumentData();

    // Poll every 30 seconds
    const interval = setInterval(() => {
      setIsPolling(true);
      loadDocumentData().finally(() => setIsPolling(false));
    }, 30000);

    return () => clearInterval(interval);
  }, [id]);

  const loadDocumentData = async () => {
    try {
      const response = await fetch(`/api/documents/${id}`);
      if (response.ok) {
        const docData = await response.json();
        setDoc(docData);
      } else {
        console.error("Error fetching document");
      }
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

        const versionResponse = await fetch(`/api/documents/${id}/v1-status`);
        if (versionResponse.ok) {
          const versionData = await versionResponse.json();
          if (versionData.status === "APPROVED") {
            setV1Data({ ...data, isVerified: true });
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        showToast({ variant: "success", message: "V1 generated successfully!" });
        await loadV1Data();
      } else {
        const error = await response.json();
        showToast({
          variant: "error",
          message: error.error || "Failed to generate V1",
        });
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        showToast({ variant: "success", message: "V2 generated successfully!" });
        window.location.href = `/documents/${id}/v2`;
      } else {
        const error = await response.json();
        showToast({
          variant: "error",
          message: error.error || "Failed to generate V2",
        });
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
        const a = document.createElement("a");
        a.href = url;
        a.download = `V1-Document-${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showToast({ variant: "success", message: "PDF downloaded successfully!" });
      } else {
        const error = await response.json();
        showToast({
          variant: "error",
          message: error.error || "Failed to download PDF",
        });
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      showToast({ variant: "error", message: "Error downloading PDF" });
    } finally {
      setDownloadingPDF(false);
    }
  };

  const downloadV1Word = async () => {
    setDownloadingWord(true);
    try {
      const response = await fetch(`/api/documents/${id}/download-v1-docx`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `V1-Document-${id}.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showToast({ variant: "success", message: "Word document downloaded successfully!" });
      } else {
        const error = await response.json();
        showToast({
          variant: "error",
          message: error.error || "Failed to download Word document",
        });
      }
    } catch (error) {
      console.error("Error downloading Word:", error);
      showToast({ variant: "error", message: "Error downloading Word document" });
    } finally {
      setDownloadingWord(false);
    }
  };

  const workflowChip = (status: string) => {
    const cls =
      status === "COMPLETED"
        ? "bg-emerald-100 text-emerald-700"
        : status === "APPROVED"
        ? "bg-purple-100 text-purple-700"
        : status === "VERIFIED"
        ? "bg-green-100 text-green-700"
        : status.includes("EDITING")
        ? "bg-yellow-100 text-yellow-800"
        : status.includes("READY")
        ? "bg-blue-100 text-blue-700"
        : status.includes("PROCESSING")
        ? "bg-indigo-100 text-indigo-700"
        : "bg-slate-100 text-slate-700";
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}
      >
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="relative overflow-hidden rounded-3xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10"></div>
            <div className="relative p-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700 bg-clip-text text-transparent">
                        {doc.fileName}
                      </h1>
                      <div className="flex items-center gap-2 mt-1">
                        <svg
                          className="w-4 h-4 text-slate-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                        <span className="text-slate-600 font-medium">
                          {doc.customerName}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {workflowChip(doc.status)}
                    <div className="flex items-center gap-2 text-sm text-slate-500">
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
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {new Date(doc.uploadedDate).toLocaleDateString()}
                    </div>
                    {isPolling && (
                      <div className="flex items-center gap-1 text-xs text-blue-600">
                        <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent"></div>
                        <span>Checking status...</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href="/documents"
                    className="group px-6 py-3 bg-white/80 backdrop-blur-sm border border-white/50 text-slate-700 rounded-xl hover:bg-white/90 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4 group-hover:-translate-x-1 transition-transform"
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
                    Back to Documents
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Info card */}
          <div className="xl:col-span-1">
            <div className="relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-blue-50/50"></div>
              <div className="relative p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Document Info
                  </h2>
                </div>
                <div className="space-y-4">
                  {[
                    { label: "Layout ID", value: doc.layoutId, icon: "📄" },
                    {
                      label: "WorkFlow Status",
                      value: doc.workflowStatus,
                      icon: "✅",
                    },
                    {
                      label: "Uploaded Date",
                      value: new Date(doc.uploadedDate).toLocaleDateString(),
                      icon: "📅",
                    },
                    {
                      label: "Uploader",
                      value: `${doc.uploader.firstName} ${doc.uploader.lastName}`,
                      icon: "👤",
                    },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-xl bg-white/50 border border-white/30"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{item.icon}</span>
                        <span className="text-sm font-medium text-slate-600">
                          {item.label}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-slate-900">
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Versions */}
          <div className="xl:col-span-2 space-y-6">
            {/* Version 1 */}
            <div className="relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>
              <div className="relative p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">
                        Version 1
                      </h3>
                      <p className="text-slate-600">Extracted Document Data</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {generatingV1 && (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                        <span className="text-sm text-blue-600 font-medium">
                          Processing...
                        </span>
                      </div>
                    )}
                    <div className="text-sm">
                      {workflowChip(
                        v1Data
                          ? v1Data.isVerified
                            ? "VERIFIED"
                            : "READY"
                          : generatingV1
                          ? "PROCESSING"
                          : "PENDING"
                      )}
                    </div>
                  </div>
                </div>

                {v1Data ? (
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center gap-4">
                      <Link
                        href={`/documents/${id}/v1`}
                        className="group px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
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
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        {permissions.canEdit ? "Edit V1" : "View V1"}
                      </Link>

                      {v1Data.isVerified && (
                        <>
                          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-xl border border-green-200">
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
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span className="font-semibold">Verified</span>
                          </div>
                          <button
                            onClick={downloadV1PDF}
                            disabled={downloadingPDF}
                            className="group px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2"
                          >
                            {downloadingPDF ? (
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
                                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                            )}
                            {downloadingPDF ? "Downloading..." : "Download PDF"}
                          </button>
                          <button
                            onClick={downloadV1Word}
                            disabled={downloadingWord}
                            className="group px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2"
                          >
                            {downloadingWord ? (
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
                                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                            )}
                            {downloadingWord ? "Downloading..." : "Download Word"}
                          </button>
                        </>
                      )}
                    </div>

                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200/50 p-6">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-indigo-600/10 rounded-full blur-2xl"></div>
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-3">
                          <svg
                            className="w-5 h-5 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                          </svg>
                          <h4 className="font-semibold text-slate-800">
                            Content Preview
                          </h4>
                        </div>
                        <p className="text-slate-700">
                          V1 content available for editing
                          {v1Data.isVerified && (
                            <span className="ml-2 text-green-600 font-semibold">
                              (✓ Verified)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {doc?.workflowStatus === "READY_FOR_EV" ? (
                      <div className="flex items-center gap-3">
                        {permissions.canProcess && (
                          <button
                            onClick={generateV1}
                            disabled={generatingV1}
                            className="group px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2"
                          >
                            {generatingV1 ? (
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
                                  d="M13 10V3L4 14h7v7l9-11h-7z"
                                />
                              </svg>
                            )}
                            {generatingV1
                              ? "Generating V1..."
                              : "Generate V1"}
                          </button>
                        )}
                        <p className="text-sm text-slate-600">
                          {generatingV1
                            ? "Extracting data from document..."
                            : "Document is ready for V1 generation"}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200/50">
                        <div className="text-center space-y-3">
                          <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                            <svg
                              className="w-6 h-6 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-semibold text-amber-800">
                              Processing Document
                            </h4>
                            <p className="text-sm text-amber-700">
                              Status: {doc?.workflowStatus || "Loading..."}
                            </p>
                            <p className="text-xs text-amber-600 mt-1">
                              Waiting for document to be ready...
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Version 2 */}
            <div className="relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-emerald-50/50"></div>
              <div className="relative p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">
                        Version 2
                      </h3>
                      <p className="text-slate-600">Verified & Enhanced Data</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {generatingV2 && (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-green-600 border-t-transparent"></div>
                        <span className="text-sm text-green-600 font-medium">
                          Processing...
                        </span>
                      </div>
                    )}
                    <div className="text-sm">
                      {workflowChip(generatingV2 ? "PROCESSING" : "PENDING")}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-green-50 rounded-xl border border-slate-200/50">
                  <div className="text-center space-y-4">
                    {v1Data && v1Data.isVerified && permissions.canProcess ? (
                      <button
                        onClick={generateV2}
                        disabled={generatingV2}
                        className="group px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-3 mx-auto"
                      >
                        {generatingV2 ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        ) : (
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                        )}
                        <span className="font-semibold">
                          {generatingV2 ? "Generating V2..." : "Generate V2"}
                        </span>
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                          </svg>
                        </div>
                        <p className="text-slate-600 font-medium">
                          {v1Data
                            ? v1Data.isVerified
                              ? "V1 verified - Ready for V2"
                              : "V1 must be verified first"
                            : "V1 data must be generated first"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* End Version 2 */}
          </div>
        </div>
      </div>
    </div>
  );
}
