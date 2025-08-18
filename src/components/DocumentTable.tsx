'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Document } from '@/types/document';
import { getSimplePermissions } from '@/lib/simplePermissions';
import WorkflowStatusBadge from './WorkflowStatusBadge';

interface DocumentTableProps {
  documents: Document[];
  onRefresh: () => void;
}

export default function DocumentTable({ documents, onRefresh }: DocumentTableProps) {
  const { data: session } = useSession();
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);

  // Get user permissions
  const permissions = getSimplePermissions(session?.user?.role || 'VIEWER');

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDocuments(documents.map(doc => doc.id));
    } else {
      setSelectedDocuments([]);
    }
  };

  const handleSelectDocument = (documentId: string, checked: boolean) => {
    if (checked) {
      setSelectedDocuments(prev => [...prev, documentId]);
    } else {
      setSelectedDocuments(prev => prev.filter(id => id !== documentId));
    }
  };

  const downloadDocument = async (documentId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to download document');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Error downloading document');
    }
  };

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by uploading your first document.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="relative w-12 px-6 sm:w-16 sm:px-8">
                <input
                  type="checkbox"
                  className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={selectedDocuments.length === documents.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Document
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Workflow Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Size
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Uploaded
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Uploader
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {documents.map((document) => (
              <tr key={document.id} className="hover:bg-gray-50">
                <td className="relative w-12 px-6 sm:w-16 sm:px-8">
                  <input
                    type="checkbox"
                    className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={selectedDocuments.includes(document.id)}
                    onChange={(e) => handleSelectDocument(document.id, e.target.checked)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {document.fileName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {document.fileType.toUpperCase()}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{document.customerName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <WorkflowStatusBadge status={document.workflowStatus} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatFileSize(document.fileSize)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(document.uploadedDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {document.uploader.firstName} {document.uploader.lastName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {document.uploader.email}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    {/* V1 Button */}
                    <Link
                      href={`/documents/${document.id}/v1`}
                      className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                    >
                      V1
                    </Link>
                    
                    {/* V2 Button */}
                    <Link
                      href={`/documents/${document.id}/v2`}
                      className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200"
                    >
                      V2
                    </Link>
                    
                    {/* Download Button */}
                    <button
                      onClick={() => downloadDocument(document.id, document.fileName)}
                      className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
                    >
                      Download
                    </button>
                    
                    {/* Approve Button - Only for Approvers when V2 is completed */}
                    {permissions.canApprove && document.workflowStatus === 'V2_COMPLETED' && (
                      <Link
                        href={`/documents/${document.id}/approve`}
                        className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800 hover:bg-purple-200"
                      >
                        Approve
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Bulk Actions */}
      {selectedDocuments.length > 0 && (
        <div className="bg-gray-50 px-6 py-3 border-t">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              {selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''} selected
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  // Implement bulk download
                }}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Download Selected
              </button>
              {permissions.canEdit && (
                <button
                  onClick={() => {
                    // Implement bulk archive
                  }}
                  className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Archive Selected
              </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
