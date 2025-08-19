import { WorkflowService } from './workflowService';
import { VersionType } from '@/types/workflow';

export class EnhancedWorkflowService extends WorkflowService {
  
  // Enhanced V2 generation that ensures V1 dependency
  static async processToV2WithValidation(documentId: string, userId: string) {
    // Ensure V1 exists and is completed
    const v1Version = await this.getLatestVersion(documentId, VersionType.VERSION_1);
    
    if (!v1Version) {
      throw new Error('Version 1 must be generated before creating Version 2');
    }
    
    if (v1Version.status !== 'COMPLETED') {
      throw new Error('Version 1 must be completed before generating Version 2');
    }
    
    // Check if V1 was edited after last V2 generation
    const existingV2 = await this.getLatestVersion(documentId, VersionType.VERSION_2);
    
    if (existingV2 && v1Version.editedAt && existingV2.createdAt < v1Version.editedAt) {
      console.log('V1 was modified after V2 creation - V2 will be regenerated');
    }
    
    // Proceed with V2 generation
    return await this.processToV2(documentId, userId);
  }
  
  // Validate JSON structure before saving
  static async saveV1EditsWithValidation(versionId: string, jsonContent: any, userId: string) {
    // Add your JSON validation logic here
    const validationResult = this.validateV1Json(jsonContent);
    
    if (!validationResult.isValid) {
      throw new Error(`Invalid V1 JSON: ${validationResult.errors.join(', ')}`);
    }
    
    return await this.saveV1Edits(versionId, jsonContent, userId);
  }
  
  static async saveV2EditsWithValidation(versionId: string, jsonContent: any, userId: string) {
    // Add your JSON validation logic here
    const validationResult = this.validateV2Json(jsonContent);
    
    if (!validationResult.isValid) {
      throw new Error(`Invalid V2 JSON: ${validationResult.errors.join(', ')}`);
    }
    
    return await this.saveV2Edits(versionId, jsonContent, userId);
  }
  
  // JSON validation methods (customize based on your actual API response)
  private static validateV1Json(json: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Add validation rules based on your V1 API response structure
    if (!json.documentSummary) {
      errors.push('Missing documentSummary section');
    }
    
    if (!json.metadata) {
      errors.push('Missing metadata section');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  private static validateV2Json(json: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Add validation rules based on your V2 API response structure
    if (!json.enhancedContent) {
      errors.push('Missing enhancedContent section');
    }
    
    if (!json.layoutDetails) {
      errors.push('Missing layoutDetails section');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  // Word document generation with V2 layout details
  static async generateWordDocumentWithLayout(documentId: string, versionId: string, userId: string) {
    const v2Version = await this.getLatestVersion(documentId, VersionType.VERSION_2);
    
    if (!v2Version || v2Version.status !== 'APPROVED') {
      throw new Error('Version 2 must be approved before generating Word document');
    }
    
    // Here you'll use the layoutDetails from V2 to create a properly formatted Word document
    const v2Data = v2Version.jsonContent as any;
    
    // Use v2Data.layoutDetails for Word document formatting
    // Use v2Data.enhancedContent for the actual content
    
    const documentPath = `/generated/documents/${documentId}_${versionId}_${Date.now()}.docx`;
    
    // TODO: Implement actual Word generation using the layout details
    // This is where you'll use libraries like docx or mammoth.js
    
    return await this.generateWordDocument(documentId, versionId, userId);
  }
}
