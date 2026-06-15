// Utility function to process Word document templates with dynamic content
// Uses docxtemplater to replace placeholders in template files

import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

export interface TemplateData {
  // Contact Information
  contactName?: string;
  designation?: string;
  emailAddress?: string;
  mobileNumber?: string;
  validUntil?: string | Date | null;
  
  // Document Information
  customerName?: string;
  preparedFor?: string; // Extracted from V1 JSON response
  uploadedDate?: string | Date | null;
  documentId?: string;
  
  // Additional fields
  [key: string]: any;
}

/**
 * Process a Word document template by replacing placeholders with actual data
 * @param templatePath Path to the template .docx file
 * @param data Data object with values to replace placeholders
 * @returns Buffer containing the processed Word document
 */
export async function processTemplate(
  templatePath: string,
  data: TemplateData
): Promise<Buffer> {
  try {
    // Check if template exists
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templatePath}`);
    }

    // Read template file
    const templateBuffer = fs.readFileSync(templatePath);

    // Load template into PizZip
    const zip = new PizZip(templateBuffer);

    // Create docxtemplater instance
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Prepare data for template
    // Format dates if needed
    const templateData: Record<string, any> = {
      ...data,
    };

    // Format validUntil date
    if (templateData.validUntil != null) {
      const validUntilDate = templateData.validUntil instanceof Date 
        ? templateData.validUntil 
        : new Date(templateData.validUntil);
      templateData.validUntil = validUntilDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } else {
      templateData.validUntil = '';
    }

    // Format uploadedDate
    if (templateData.uploadedDate != null) {
      const uploadedDate = templateData.uploadedDate instanceof Date 
        ? templateData.uploadedDate 
        : new Date(templateData.uploadedDate);
      templateData.uploadedDate = uploadedDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } else {
      templateData.uploadedDate = '';
    }

    // Set default values for empty fields
    templateData.contactName = templateData.contactName || '';
    templateData.designation = templateData.designation || '';
    templateData.emailAddress = templateData.emailAddress || '';
    templateData.mobileNumber = templateData.mobileNumber || '';
    templateData.customerName = templateData.customerName || '';
    templateData.preparedFor = templateData.preparedFor || templateData.customerName || '';

    // Render document (replace placeholders)
    doc.render(templateData);

    // Get the generated document as buffer
    const buffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    return buffer;
  } catch (error) {
    console.error('Error processing template:', error);
    if (error instanceof Error) {
      // Handle docxtemplater specific errors
      if (error.message.includes('Unclosed tag')) {
        throw new Error(`Template syntax error: ${error.message}`);
      }
      if (error.message.includes('Unimplemented type')) {
        throw new Error(`Template contains unsupported elements: ${error.message}`);
      }
    }
    throw new Error(`Failed to process template: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

