// 'use client';

// import { useState, useEffect } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import { useSession } from 'next-auth/react';
// import WorkflowStatusBadge from '@/components/WorkflowStatusBadge';
// import WorkflowProgress from '@/components/WorkflowProgress';
// import JsonEditor from '@/components/JsonEditor';
// import { DocumentWithWorkflow, WorkflowStatus, VersionType } from '@/types/workflow';
// import { getSimplePermissions } from '@/lib/simplePermissions';

// export default function DocumentWorkflowPage() {
//   const params = useParams();
//   const router = useRouter();
//   const { data: session } = useSession();
//   const [document, setDocument] = useState<DocumentWithWorkflow | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [processing, setProcessing] = useState(false);
//   const [activeVersion, setActiveVersion] = useState<'v1' | 'v2'>('v1');
//   const [isEditing, setIsEditing] = useState(false);

//   const documentId = params.id as string;

//   useEffect(() => {
//     if (documentId) {
//       fetchDocument();
//     }
//   }, [documentId]);

//   const fetchDocument = async () => {
//     try {
//       const response = await fetch(`/api/workflow?documentId=${documentId}`);
//       const result = await response.json();
      
//       if (result.success) {
//         setDocument(result.data);
//       } else {
//         console.error('Failed to fetch document:', result.error);
//       }
//     } catch (error) {
//       console.error('Error fetching document:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const executeWorkflowAction = async (action: string, versionId?: string, jsonContent?: any) => {
//     setProcessing(true);
//     try {
//       const response = await fetch('/api/workflow', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           action,
//           documentId,
//           versionId,
//           jsonContent
//         }),
//       });

//       const result = await response.json();
      
//       if (result.success) {
//         await fetchDocument(); // Refresh document data
//         setIsEditing(false);
//       } else {
//         alert(`Error: ${result.error}`);
//       }
//     } catch (error) {
//       console.error('Workflow action error:', error);
//       alert('An error occurred while processing the action');
//     } finally {
//       setProcessing(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//       </div>
//     );
//   }

//   if (!document) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="text-center">
//           <h2 className="text-2xl font-bold text-gray-900 mb-2">Document Not Found</h2>
//           <p className="text-gray-600">The requested document could not be found.</p>
//         </div>
//       </div>
//     );
//   }

//   // Get simple permissions based on user role
//   const permissions = getSimplePermissions(session?.user?.role || 'VIEWER');
//   const v1Version = document.versions?.find(v => v.versionType === VersionType.VERSION_1);
//   const v2Version = document.versions?.find(v => v.versionType === VersionType.VERSION_2);

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {/* Header */}
//         <div className="bg-white rounded-lg shadow-sm border mb-6">
//           <div className="px-6 py-4 border-b">
//             <div className="flex items-center justify-between">
//               <div>
//                 <h1 className="text-2xl font-bold text-gray-900">{document.fileName}</h1>
//                 <p className="text-gray-600 mt-1">Customer: {document.customerName}</p>
//               </div>
//               <div className="flex items-center space-x-4">
//                 <WorkflowStatusBadge status={document.workflowStatus} />
//                 <button
//                   onClick={() => router.back()}
//                   className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
//                 >
//                   Back to Documents
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* Workflow Progress */}
//           <div className="px-6 py-6">
//             <WorkflowProgress currentStatus={document.workflowStatus} />
//           </div>
//         </div>

//         {/* Action Buttons */}
//         <div className="bg-white rounded-lg shadow-sm border mb-6">
//           <div className="px-6 py-4">
//             <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Actions</h3>
//             <div className="flex flex-wrap gap-3">
              
//               {/* Process to V1 - Only if document is uploaded and user can process */}
//               {document.workflowStatus === WorkflowStatus.UPLOADED && permissions.canProcess && (
//                 <button
//                   onClick={() => executeWorkflowAction('process_v1')}
//                   disabled={processing}
//                   className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
//                 >
//                   {processing ? 'Processing...' : 'Generate Version 1'}
//                 </button>
//               )}

//               {/* Edit V1 - Only if V1 is ready/editing and user can edit */}
//               {v1Version && [WorkflowStatus.V1_READY, WorkflowStatus.V1_EDITING].includes(document.workflowStatus) && permissions.canEdit && (
//                 <button
//                   onClick={() => {
//                     setActiveVersion('v1');
//                     setIsEditing(true);
//                     if (document.workflowStatus === WorkflowStatus.V1_READY) {
//                       executeWorkflowAction('start_edit_v1', v1Version.id);
//                     }
//                   }}
//                   className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
//                 >
//                   Edit Version 1
//                 </button>
//               )}

//               {/* Complete V1 - Only if V1 is being edited and user can edit */}
//               {document.workflowStatus === WorkflowStatus.V1_EDITING && permissions.canEdit && (
//                 <button
//                   onClick={() => executeWorkflowAction('complete_v1', v1Version?.id)}
//                   disabled={processing}
//                   className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
//                 >
//                   Complete Version 1
//                 </button>
//               )}

//               {/* Process to V2 - Only if V1 is completed and user can process */}
//               {document.workflowStatus === WorkflowStatus.V1_COMPLETED && permissions.canProcess && (
//                 <button
//                   onClick={() => executeWorkflowAction('process_v2')}
//                   disabled={processing}
//                   className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
//                 >
//                   {processing ? 'Processing...' : 'Generate Version 2'}
//                 </button>
//               )}

//               {/* Edit V2 - Only if V2 is ready/editing and user can edit */}
//               {v2Version && [WorkflowStatus.V2_READY, WorkflowStatus.V2_EDITING].includes(document.workflowStatus) && permissions.canEdit && (
//                 <button
//                   onClick={() => {
//                     setActiveVersion('v2');
//                     setIsEditing(true);
//                     if (document.workflowStatus === WorkflowStatus.V2_READY) {
//                       executeWorkflowAction('start_edit_v2', v2Version.id);
//                     }
//                   }}
//                   className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
//                 >
//                   Edit Version 2
//                 </button>
//               )}

//               {/* Complete V2 - Only if V2 is being edited and user can edit */}
//               {document.workflowStatus === WorkflowStatus.V2_EDITING && permissions.canEdit && (
//                 <button
//                   onClick={() => executeWorkflowAction('complete_v2', v2Version?.id)}
//                   disabled={processing}
//                   className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
//                 >
//                   Complete Version 2
//                 </button>
//               )}

//               {/* Approve - Only if V2 is completed and user can approve */}
//               {document.workflowStatus === WorkflowStatus.V2_COMPLETED && permissions.canApprove && (
//                 <button
//                   onClick={() => executeWorkflowAction('approve', v2Version?.id)}
//                   disabled={processing}
//                   className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
//                 >
//                   Approve Document
//                 </button>
//               )}

//               {/* Generate Word Document - Only if approved and user can generate */}
//               {document.workflowStatus === WorkflowStatus.APPROVED && permissions.canGenerate && (
//                 <button
//                   onClick={() => executeWorkflowAction('generate_document', v2Version?.id)}
//                   disabled={processing}
//                   className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
//                 >
//                   Generate Word Document
//                 </button>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Version Tabs */}
//         <div className="bg-white rounded-lg shadow-sm border">
//           <div className="border-b">
//             <nav className="flex space-x-8 px-6">
//               {v1Version && (
//                 <button
//                   onClick={() => setActiveVersion('v1')}
//                   className={`py-4 px-1 border-b-2 font-medium text-sm ${
//                     activeVersion === 'v1'
//                       ? 'border-blue-500 text-blue-600'
//                       : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//                   }`}
//                 >
//                   Version 1 {v1Version.status === 'EDITING' && '(Editing)'}
//                 </button>
//               )}
//               {v2Version && (
//                 <button
//                   onClick={() => setActiveVersion('v2')}
//                   className={`py-4 px-1 border-b-2 font-medium text-sm ${
//                     activeVersion === 'v2'
//                       ? 'border-blue-500 text-blue-600'
//                       : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//                   }`}
//                 >
//                   Version 2 {v2Version.status === 'EDITING' && '(Editing)'}
//                 </button>
//               )}
//             </nav>
//           </div>

//           {/* Version Content */}
//           <div className="p-6">
//             {activeVersion === 'v1' && v1Version && (
//               <div>
//                 {isEditing && activeVersion === 'v1' && permissions.canEdit ? (
//                   <JsonEditor
//                     initialData={v1Version.jsonContent}
//                     onSave={(data) => executeWorkflowAction('save_v1', v1Version.id, data)}
//                     onCancel={() => setIsEditing(false)}
//                   />
//                 ) : (
//                   <JsonEditor
//                     initialData={v1Version.jsonContent}
//                     onSave={() => {}}
//                     onCancel={() => {}}
//                     isReadOnly={true}
//                   />
//                 )}
//               </div>
//             )}

//             {activeVersion === 'v2' && v2Version && (
//               <div>
//                 {isEditing && activeVersion === 'v2' && permissions.canEdit ? (
//                   <JsonEditor
//                     initialData={v2Version.jsonContent}
//                     onSave={(data) => executeWorkflowAction('save_v2', v2Version.id, data)}
//                     onCancel={() => setIsEditing(false)}
//                   />
//                 ) : (
//                   <JsonEditor
//                     initialData={v2Version.jsonContent}
//                     onSave={() => {}}
//                     onCancel={() => {}}
//                     isReadOnly={true}
//                   />
//                 )}
//               </div>
//             )}

//             {!v1Version && !v2Version && (
//               <div className="text-center py-12">
//                 <p className="text-gray-500">No versions available yet. Start by generating Version 1.</p>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


import React from 'react'

const page = () => {
  return (
    <div>page</div>
  )
}

export default page