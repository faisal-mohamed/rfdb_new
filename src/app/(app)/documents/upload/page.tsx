"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getSimplePermissions } from "@/lib/simplePermissions";
import { getFileIcon } from "@/lib/file-utils";
import { apiPost } from "@/lib/api";
import VendorFieldsSelection from "@/components/document/VendorFieldsSelection";

type UploadMode = "document" | "quick-proposal";

export default function DocumentUploadPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadMode, setUploadMode] = useState<UploadMode>("document");
  const [proposalType, setProposalType] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [useRfpAi, setUseRfpAi] = useState(false); // Checkbox state for layout_id
  const [selectedVendorFields, setSelectedVendorFields] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    customerName: "",
    uploadedDate: new Date().toISOString().split('T')[0], // Today's date
    description: "",
    tags: "",
    contactName: "",
    designation: "",
    emailAddress: "",
    mobileNumber: "",
    validUntil: "",
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingV1, setIsGeneratingV1] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  // Check permissions
  const permissions = getSimplePermissions(session?.user?.role || 'VIEWER');

  if (!permissions.canEdit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-600">You don't have permission to upload documents.</p>
        </div>
      </div>
    );
  }

  const validateFile = (file: File) => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png'
    ];

    if (file.size > maxSize) {
      return { isValid: false, error: 'File size must be less than 50MB' };
    }

    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'File type not supported. Please upload PDF, Word, Text, or Image files.' };
    }

    return { isValid: true };
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = (file: File) => {
    const validation = validateFile(file);
    if (!validation.isValid) {
      setError(validation.error || "Invalid file");
      return;
    }

    setSelectedFile(file);
    setError("");
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateV1AfterUpload = async (documentId: string) => {
    setIsGeneratingV1(true);
    try {
      const response = await apiPost('/api/workflow', { action: 'process_v1', documentId });
      const result = await response.json();
      // Redirect to details page regardless; V1 generation runs in background
      router.push(`/documents/${documentId}`);
      if (!result.success) {
        console.error('Failed to generate V1:', result.error);
      }
    } catch (error) {
      console.error('Error generating V1:', error);
      router.push(`/documents/${documentId}`);
    } finally {
      setIsGeneratingV1(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerName.trim()) {
      setError("Customer name is required");
      return;
    }

    // Validate required contact fields
    if (!formData.contactName.trim()) {
      setError("Contact name is required");
      return;
    }

    if (!formData.designation.trim()) {
      setError("Designation is required");
      return;
    }

    if (!formData.emailAddress.trim()) {
      setError("Email address is required");
      return;
    }

    if (!formData.mobileNumber.trim()) {
      setError("Mobile number is required");
      return;
    }

    if (!formData.validUntil) {
      setError("Valid until date is required");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.emailAddress.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    // Validate proposal type for quick proposal mode
    if (uploadMode === "quick-proposal" && !proposalType.trim()) {
      setError("Proposal type is required");
      return;
    }

    if (uploadMode === "document" && !selectedFile) {
      setError("Please select a file to upload");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      if (uploadMode === "quick-proposal") {
        // Quick Proposal Generation Mode
        const proposalData = {
          customerName: formData.customerName.trim(),
          proposalType,
          description: formData.description.trim(),
          tags: formData.tags.trim(),
          contactName: formData.contactName.trim(),
          designation: formData.designation.trim(),
          emailAddress: formData.emailAddress.trim(),
          mobileNumber: formData.mobileNumber.trim(),
          validUntil: formData.validUntil,
          selectedVendorFields: selectedVendorFields,
        };

        const response = await apiPost('/api/documents/quick-proposal', proposalData);
        const result = await response.json();

        if (response.ok) {
          router.push(`/documents/${result.document.id}?generated=true`);
        } else {
          setError(result.error || 'Proposal generation failed');
        }
      } else {
        // Document Upload Mode
        if (!selectedFile) {
          setError("Please select a file to upload");
          return;
        }

        const base64Content = await fileToBase64(selectedFile);
        
        const uploadData = {
          fileName: selectedFile.name,
          fileContent: base64Content,
          customerName: formData.customerName.trim(),
          contactName: formData.contactName.trim(),
          designation: formData.designation.trim(),
          emailAddress: formData.emailAddress.trim(),
          mobileNumber: formData.mobileNumber.trim(),
          validUntil: formData.validUntil,
          layoutId: useRfpAi ? "RFP_AI" : "RFP",
          selectedVendorFields: selectedVendorFields,
        };

        const response = await apiPost('/api/documents', uploadData);
        const result = await response.json();

        if (response.ok) {
          router.push('/documents?uploaded=true');
        } else {
          setError(result.error || 'Upload failed');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setError('An error occurred during processing');
    } finally {
      setIsUploading(false);
    }
  };

//   return (
//     <div className="min-h-screen bg-gray-50 py-8">
//       <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
//         {/* Header */}
//         <div className="mb-8">
//           <h1 className="text-3xl font-bold text-gray-900">Upload Document</h1>
//           <p className="mt-2 text-gray-600">
//             Upload a document to start the RFP processing workflow. Version 1 will be automatically generated.
//           </p>
//         </div>

//         {/* Upload Form */}
//         <form onSubmit={handleSubmit} className="space-y-6">
//           {/* File Upload Area */}
//           <div className="bg-white rounded-lg shadow-sm border p-6">
//             <label className="block text-sm font-medium text-gray-700 mb-4">
//               Document File *
//             </label>
            
//             <div
//               className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
//                 dragActive 
//                   ? 'border-blue-400 bg-blue-50' 
//                   : 'border-gray-300 hover:border-gray-400'
//               }`}
//               onDragEnter={handleDrag}
//               onDragLeave={handleDrag}
//               onDragOver={handleDrag}
//               onDrop={handleDrop}
//             >
//               {selectedFile ? (
//                 <div className="space-y-2">
//                   <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
//                   </svg>
//                   <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
//                   <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
//                   <button
//                     type="button"
//                     onClick={() => setSelectedFile(null)}
//                     className="text-sm text-red-600 hover:text-red-800"
//                   >
//                     Remove file
//                   </button>
//                 </div>
//               ) : (
//                 <div className="space-y-2">
//                   <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
//                     <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
//                   </svg>
//                   <div>
//                     <button
//                       type="button"
//                       onClick={() => fileInputRef.current?.click()}
//                       className="text-blue-600 hover:text-blue-800 font-medium"
//                     >
//                       Click to upload
//                     </button>
//                     <span className="text-gray-500"> or drag and drop</span>
//                   </div>
//                   <p className="text-xs text-gray-500">
//                     PDF, Word, Text, or Image files up to 50MB
//                   </p>
//                 </div>
//               )}
//             </div>

//             <input
//               ref={fileInputRef}
//               type="file"
//               className="hidden"
//               accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
//               onChange={(e) => {
//                 if (e.target.files && e.target.files[0]) {
//                   handleFileSelect(e.target.files[0]);
//                 }
//               }}
//             />
//           </div>

//           {/* Form Fields */}
//           <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
//             <div>
//               <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
//                 Customer Name *
//               </label>
//               <input
//                 type="text"
//                 id="customerName"
//                 name="customerName"
//                 value={formData.customerName}
//                 onChange={handleInputChange}
//                 required
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 placeholder="Enter customer name"
//               />
//             </div>

//             <div>
//               <label htmlFor="uploadedDate" className="block text-sm font-medium text-gray-700 mb-1">
//                 Upload Date
//               </label>
//               <input
//                 type="date"
//                 id="uploadedDate"
//                 name="uploadedDate"
//                 value={formData.uploadedDate}
//                 onChange={handleInputChange}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//             </div>

//             <div>
//               <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
//                 Description
//               </label>
//               <textarea
//                 id="description"
//                 name="description"
//                 value={formData.description}
//                 onChange={handleInputChange}
//                 rows={3}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 placeholder="Optional description"
//               />
//             </div>

//             <div>
//               <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
//                 Tags
//               </label>
//               <input
//                 type="text"
//                 id="tags"
//                 name="tags"
//                 value={formData.tags}
//                 onChange={handleInputChange}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 placeholder="Enter tags separated by commas"
//               />
//             </div>
//           </div>

//           {/* Error Message */}
//           {error && (
//             <div className="bg-red-50 border border-red-200 rounded-md p-4">
//               <div className="flex">
//                 <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
//                   <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
//                 </svg>
//                 <div className="ml-3">
//                   <p className="text-sm text-red-800">{error}</p>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Submit Button */}
//           <div className="flex justify-end space-x-3">
//             <button
//               type="button"
//               onClick={() => router.push('/documents')}
//               className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               disabled={isUploading || isGeneratingV1}
//               className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               {isUploading ? 'Uploading...' : isGeneratingV1 ? 'Generating V1...' : 'Upload & Generate V1'}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }
//     setError("");
//   };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // const handleDrag = (e: React.DragEvent) => {
  //   e.preventDefault();
  //   e.stopPropagation();
  //   if (e.type === "dragenter" || e.type === "dragover") {
  //     setDragActive(true);
  //   } else if (e.type === "dragleave") {
  //     setDragActive(false);
  //   }
  // };

  // const handleDrop = (e: React.DragEvent) => {
  //   e.preventDefault();
  //   e.stopPropagation();
  //   setDragActive(false);

  //   const file = e.dataTransfer.files?.[0];
  //   if (file) {
  //     handleFileSelect(file);
  //   }
  // };

  // const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  //   const { name, value } = e.target;
  //   setFormData(prev => ({
  //     ...prev,
  //     [name]: value
  //   }));
  // };

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
    
  //   if (!selectedFile) {
  //     setError("Please select a file to upload");
  //     return;
  //   }

  //   if (!formData.customerName.trim()) {
  //     setError("Customer name is required");
  //     return;
  //   }

  //   if (!formData.uploadedDate) {
  //     setError("Upload date is required");
  //     return;
  //   }

  //   setIsUploading(true);
  //   setError("");

  //   try {
  //     // Convert file to base64
  //     const fileContent = await fileToBase64(selectedFile);
      
  //     // Prepare upload data
  //     const uploadData = {
  //       fileName: selectedFile.name,
  //       fileType: selectedFile.name.split('.').pop()?.toLowerCase() || '',
  //       mimeType: selectedFile.type,
  //       fileSize: selectedFile.size,
  //       fileContent,
  //       customerName: formData.customerName.trim(),
  //       uploadedDate: formData.uploadedDate,
  //       description: formData.description.trim() || undefined,
  //       tags: formData.tags.trim() ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
  //     };

  //     const response = await fetch('/api/documents', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(uploadData),
  //     });

  //     if (response.ok) {
  //       router.push('/documents?uploaded=true');
  //     } else {
  //       const errorData = await response.json();
  //       setError(errorData.error || 'Failed to upload document');
  //     }
  //   } catch (error) {
  //     console.error('Upload error:', error);
  //     setError('Failed to upload document. Please try again.');
  //   } finally {
  //     setIsUploading(false);
  //   }
  // };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };


  return (
    <div className="space-y-8 font-lexend">
      {/* Header */}
      <div className="relative">
        <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 rounded-2xl blur-xl"></div>
        <div className="relative bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl shadow-xl p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700 bg-clip-text text-transparent">
                {uploadMode === "quick-proposal" ? "Quick Proposal Generation" : "Upload Document"}
              </h1>
              <p className="text-slate-600 font-medium">
                {uploadMode === "quick-proposal" 
                  ? "Generate proposals instantly by entering customer details" 
                  : "Upload and manage your documents with customer information"}
              </p>
              <div className="w-16 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
            </div>
            
            <button
              onClick={() => router.back()}
              className="group relative rounded-xl bg-gradient-to-r from-slate-600 to-slate-700 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:from-slate-700 hover:to-slate-800 hover:shadow-xl hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-slate-500/40"
            >
              <span className="relative flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Documents</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      

      {/* Mode Toggle */}
      <div className="bg-white/90 backdrop-blur-xl border border-white/30 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-center">
          <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50">
            <button
              type="button"
              onClick={() => {
                setUploadMode("document");
                setError("");
              }}
              className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                uploadMode === "document"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>Upload Document</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setUploadMode("quick-proposal");
                setSelectedFile(null);
                setProposalType("");
                setError("");
              }}
              className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                uploadMode === "quick-proposal"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Quick Proposal</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Upload Form */}
      <div className="bg-white/90 backdrop-blur-xl border border-white/30 rounded-xl shadow-lg">
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Proposal Type Input - Only for Quick Proposal Mode */}
          {uploadMode === "quick-proposal" && (
            <div className="space-y-2">
              <label htmlFor="proposalType" className="block text-sm font-semibold text-slate-700">
                Proposal Type <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="proposalType"
                name="proposalType"
                value={proposalType}
                onChange={(e) => setProposalType(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter proposal type (e.g., Mobile Banking Solution, Loan Management System)"
                required
              />
            </div>
          )}

          {/* File Upload Section - Only for Document Upload Mode */}
          {uploadMode === "document" && (
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700">
                Document File <span className="text-red-500">*</span>
              </label>
            
            {!selectedFile ? (
              <div
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileInputChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept=".pdf,.doc,.docx,.xlsx,.zip"
                />
                
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  
                  <div>
                    <p className="text-lg font-medium text-slate-700">
                      Drop your file here, or <span className="text-blue-600">browse</span>
                    </p>
                    <p className="text-sm text-slate-500 mt-2">
                      Supports: PDF, Word Documents (DOC/DOCX), Excel (XLSX), ZIP Archives
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl p-6 bg-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">
                      {getFileIcon(selectedFile.name.split('.').pop() || '')}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{selectedFile.name}</p>
                      <p className="text-sm text-slate-500">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={removeFile}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            
            {/* Layout ID Checkbox - Only shown when file is selected */}
            {selectedFile && (
              <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  id="useRfpAi"
                  checked={useRfpAi}
                  onChange={(e) => setUseRfpAi(e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                />
                <label
                  htmlFor="useRfpAi"
                  className="text-sm font-medium text-slate-700 cursor-pointer flex-1"
                >
                  Use RFP AI Layout
                </label>
                
              </div>
            )}
            </div>
          )}

          {/* Customer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="customerName" className="block text-sm font-semibold text-slate-700">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="customerName"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter customer name"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="uploadedDate" className="block text-sm font-semibold text-slate-700">
                Upload Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="uploadedDate"
                name="uploadedDate"
                value={formData.uploadedDate}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              />
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h3 className="text-lg font-semibold text-slate-800">Bidder Contact Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="contactName" className="block text-sm font-semibold text-slate-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="contactName"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter name"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="designation" className="block text-sm font-semibold text-slate-700">
                  Designation <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="designation"
                  name="designation"
                  value={formData.designation}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter designation"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="emailAddress" className="block text-sm font-semibold text-slate-700">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="emailAddress"
                  name="emailAddress"
                  value={formData.emailAddress}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="mobileNumber" className="block text-sm font-semibold text-slate-700">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="mobileNumber"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter mobile number"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="validUntil" className="block text-sm font-semibold text-slate-700">
                  Valid Until <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="validUntil"
                  name="validUntil"
                  value={formData.validUntil}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Select validity date"
                  required
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-semibold text-slate-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              placeholder="Enter document description (optional)"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label htmlFor="tags" className="block text-sm font-semibold text-slate-700">
              Tags
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter tags separated by commas (e.g., contract, proposal, legal)"
            />
            <p className="text-xs text-slate-500">Separate multiple tags with commas</p>
          </div>

          {/* Vendor Fields Selection */}
          <div className="bg-white/90 backdrop-blur-xl border border-white/30 rounded-xl shadow-lg p-6">
            <VendorFieldsSelection
              selectedFields={selectedVendorFields}
              onSelectionChange={setSelectedVendorFields}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-red-700 font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              disabled={isUploading}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={isUploading || (uploadMode === "document" && !selectedFile)}
              className="group relative rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isUploading ? (
                <span className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{uploadMode === "quick-proposal" ? "Generating..." : "Uploading..."}</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  {uploadMode === "quick-proposal" ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Generate Proposal</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span>Upload Document</span>
                    </>
                  )}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
