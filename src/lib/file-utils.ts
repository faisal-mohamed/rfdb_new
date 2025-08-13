// File utility functions for document management

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export interface FileInfo {
  name: string;
  type: string;
  size: number;
  extension: string;
  mimeType: string;
}

// Allowed file types and their MIME types
export const ALLOWED_FILE_TYPES = {
  // Documents
  pdf: ['application/pdf'],
  doc: ['application/msword'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  txt: ['text/plain'],
  rtf: ['application/rtf', 'text/rtf'],
  
  // Images
  png: ['image/png'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  gif: ['image/gif'],
  bmp: ['image/bmp'],
  svg: ['image/svg+xml'],
  
  // Spreadsheets
  xls: ['application/vnd.ms-excel'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  csv: ['text/csv'],
  
  // Presentations
  ppt: ['application/vnd.ms-powerpoint'],
  pptx: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  
  // Archives
  zip: ['application/zip'],
  rar: ['application/x-rar-compressed'],
  '7z': ['application/x-7z-compressed'],
};

// Maximum file size (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Extract file information from a File object
 */
export function getFileInfo(file: File): FileInfo {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  
  return {
    name: file.name,
    type: file.type,
    size: file.size,
    extension,
    mimeType: file.type,
  };
}

/**
 * Validate file type and size
 */
export function validateFile(file: File): FileValidationResult {
  const fileInfo = getFileInfo(file);
  
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size exceeds ${formatFileSize(MAX_FILE_SIZE)} limit`,
    };
  }
  
  // Check if file has extension
  if (!fileInfo.extension) {
    return {
      isValid: false,
      error: 'File must have a valid extension',
    };
  }
  
  // Check if file type is allowed
  const allowedMimeTypes = ALLOWED_FILE_TYPES[fileInfo.extension as keyof typeof ALLOWED_FILE_TYPES];
  if (!allowedMimeTypes) {
    return {
      isValid: false,
      error: `File type .${fileInfo.extension} is not allowed`,
    };
  }
  
  // Check MIME type
  if (!allowedMimeTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Invalid MIME type for .${fileInfo.extension} file`,
    };
  }
  
  return { isValid: true };
}

/**
 * Convert file to base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove data URL prefix (e.g., "data:image/png;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get file type category for display
 */
export function getFileTypeCategory(extension: string): string {
  const ext = extension.toLowerCase();
  
  if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(ext)) {
    return 'Document';
  }
  
  if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg'].includes(ext)) {
    return 'Image';
  }
  
  if (['xls', 'xlsx', 'csv'].includes(ext)) {
    return 'Spreadsheet';
  }
  
  if (['ppt', 'pptx'].includes(ext)) {
    return 'Presentation';
  }
  
  if (['zip', 'rar', '7z'].includes(ext)) {
    return 'Archive';
  }
  
  return 'Other';
}

/**
 * Get file icon based on extension
 */
export function getFileIcon(extension: string): string {
  const ext = extension.toLowerCase();
  
  switch (ext) {
    case 'pdf':
      return '📄';
    case 'doc':
    case 'docx':
      return '📝';
    case 'txt':
      return '📃';
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'bmp':
      return '🖼️';
    case 'svg':
      return '🎨';
    case 'xls':
    case 'xlsx':
    case 'csv':
      return '📊';
    case 'ppt':
    case 'pptx':
      return '📽️';
    case 'zip':
    case 'rar':
    case '7z':
      return '🗜️';
    default:
      return '📁';
  }
}
