"use client";

import { useState, useRef } from "react";
import { VENDOR_DOCUMENT_TYPES, VendorDocumentType } from "@/types/vendor";
import { apiPost } from "@/lib/api";

interface Props {
  label: string;
  documentType: VendorDocumentType;
  qualificationId: string | null;
  required?: boolean;
  acceptedTypes?: string;
  maxSizeMB?: number;
}

export default function FileUploadField({
  label,
  documentType,
  qualificationId,
  required = false,
  acceptedTypes = ".pdf,.doc,.docx",
  maxSizeMB = 10
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file size
    const maxSize = maxSizeMB * 1024 * 1024; // Convert to bytes
    if (selectedFile.size > maxSize) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    setFile(selectedFile);
    setError("");
    setUploaded(false);
  };

  const handleUpload = async () => {
    if (!file || !qualificationId) return;

    setUploading(true);
    setError("");

    try {
      const base64Content = await fileToBase64(file);

      const response = await apiPost(`/api/vendor-qualification/${qualificationId}/documents`, {
        documentType,
        fileName: file.name,
        fileContent: base64Content,
        fileSize: file.size,
        mimeType: file.type
      });

      if (response.ok) {
        setUploaded(true);
        setError("");
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setUploaded(false);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>

      <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
        {!file ? (
          <div className="text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedTypes}
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
            >
              Choose File
            </button>
            <p className="text-xs text-slate-500 mt-2">
              {acceptedTypes.toUpperCase()} (Max {maxSizeMB}MB)
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📄</span>
                <div>
                  <p className="text-sm font-medium text-slate-700">{file.name}</p>
                  <p className="text-xs text-slate-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemove}
                className="text-red-500 hover:text-red-700"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {!uploaded && (
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading || !qualificationId}
                className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-semibold"
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Uploading...
                  </span>
                ) : (
                  'Upload Document'
                )}
              </button>
            )}

            {uploaded && (
              <div className="flex items-center justify-center gap-2 text-green-600 text-sm font-medium">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Uploaded Successfully
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* {!qualificationId && (
        <p className="text-xs text-amber-600">
          ⚠️ Please save your form first before uploading documents
        </p>
      )} */}
    </div>
  );
}











