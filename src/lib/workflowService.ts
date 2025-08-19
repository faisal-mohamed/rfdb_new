import { prisma } from '@/lib/prisma';
import { WorkflowStatus, VersionType, VersionStatus, WorkflowAction, validateRfpTree } from '@/types/workflow';
import { MockExternalApiService } from './mockExternalApi';

// Use shared Prisma client to avoid multiple instances in dev

export class WorkflowService {
  
  // Process document to Version 1
  static async processToV1(documentId: string, userId: string) {
    try {
      // Update document status to processing
      await prisma.document.update({
        where: { id: documentId },
        data: { workflowStatus: WorkflowStatus.PROCESSING_V1 }
      });

      // Get document for processing
      const document = await prisma.document.findUnique({
        where: { id: documentId }
      });

      if (!document) {
        throw new Error('Document not found');
      }

      // Call external API (mock for now)
      const apiResponse = await MockExternalApiService.processDocumentV1({
        documentId,
        fileContent: document.fileContent,
        fileName: document.fileName,
        versionType: VersionType.VERSION_1
      });

      if (!apiResponse.success) {
        throw new Error(apiResponse.error || 'External API processing failed');
      }

      // Upsert single Version 1 record (no additional versions)
      const existingV1 = await prisma.documentVersion.findFirst({
        where: { documentId, versionType: VersionType.VERSION_1 }
      });

      const version = existingV1
        ? await prisma.documentVersion.update({
            where: { id: existingV1.id },
            data: {
              status: VersionStatus.GENERATED,
              jsonContent: apiResponse.jsonData as any,
              externalApiRequestId: apiResponse.requestId,
              externalApiResponse: apiResponse as any,
            }
          })
        : await prisma.documentVersion.create({
            data: {
              documentId,
              versionType: VersionType.VERSION_1,
              versionNumber: 1,
              status: VersionStatus.GENERATED,
              jsonContent: apiResponse.jsonData as any,
              externalApiRequestId: apiResponse.requestId,
              externalApiResponse: apiResponse as any,
              createdBy: userId
            }
          });

      // Update document status
      await prisma.document.update({
        where: { id: documentId },
        data: { workflowStatus: WorkflowStatus.V1_READY }
      });

      return version;
    } catch (error) {
      // Revert document status on error
      await prisma.document.update({
        where: { id: documentId },
        data: { workflowStatus: WorkflowStatus.UPLOADED }
      });
      throw error;
    }
  }

  // Start editing Version 1
  static async startEditingV1(documentId: string, versionId: string, userId: string) {
    const version = await prisma.documentVersion.update({
      where: { id: versionId },
      data: {
        status: VersionStatus.EDITING,
        editedBy: userId,
        editedAt: new Date()
      }
    });

    await prisma.document.update({
      where: { id: documentId },
      data: { workflowStatus: WorkflowStatus.V1_EDITING }
    });

    return version;
  }

  // Save Version 1 edits
  static async saveV1Edits(versionId: string, jsonContent: any, userId: string) {
    const { isValid, errors } = validateRfpTree(jsonContent);
    if (!isValid) {
      throw new Error(`Invalid V1 JSON: ${errors.join(', ')}`);
    }
    const version = await prisma.documentVersion.update({
      where: { id: versionId },
      data: {
        jsonContent: jsonContent as any,
        editedBy: userId,
        editedAt: new Date()
      }
    });

    return version;
  }

  // Complete Version 1 editing
  static async completeV1Editing(documentId: string, versionId: string, userId: string) {
    const version = await prisma.documentVersion.update({
      where: { id: versionId },
      data: {
        status: VersionStatus.COMPLETED,
        editedBy: userId,
        editedAt: new Date()
      }
    });

    await prisma.document.update({
      where: { id: documentId },
      data: { workflowStatus: WorkflowStatus.V1_COMPLETED }
    });

    return version;
  }

  // Process to Version 2
  static async processToV2(documentId: string, userId: string) {
    try {
      // Update document status
      await prisma.document.update({
        where: { id: documentId },
        data: { workflowStatus: WorkflowStatus.PROCESSING_V2 }
      });

      // Get the completed V1 version
      const v1Version = await prisma.documentVersion.findFirst({
        where: {
          documentId,
          versionType: VersionType.VERSION_1,
          status: VersionStatus.COMPLETED
        },
        include: { document: true }
      });

      if (!v1Version) {
        throw new Error('Version 1 not found or not completed');
      }

      // Call external API for V2 processing
      const apiResponse = await MockExternalApiService.processDocumentV2({
        documentId,
        fileContent: v1Version.document.fileContent,
        fileName: v1Version.document.fileName,
        versionType: VersionType.VERSION_2,
        v1Json: v1Version.jsonContent as any
      });

      if (!apiResponse.success) {
        throw new Error(apiResponse.error || 'External API processing failed');
      }

      // Upsert single Version 2 record (no additional versions)
      const existingV2 = await prisma.documentVersion.findFirst({
        where: { documentId, versionType: VersionType.VERSION_2 }
      });

      const version = existingV2
        ? await prisma.documentVersion.update({
            where: { id: existingV2.id },
            data: {
              status: VersionStatus.GENERATED,
              jsonContent: apiResponse.jsonData as any,
              externalApiRequestId: apiResponse.requestId,
              externalApiResponse: apiResponse as any,
            }
          })
        : await prisma.documentVersion.create({
            data: {
              documentId,
              versionType: VersionType.VERSION_2,
              versionNumber: 1,
              status: VersionStatus.GENERATED,
              jsonContent: apiResponse.jsonData as any,
              externalApiRequestId: apiResponse.requestId,
              externalApiResponse: apiResponse as any,
              createdBy: userId
            }
          });

      // Update document status
      await prisma.document.update({
        where: { id: documentId },
        data: { workflowStatus: WorkflowStatus.V2_READY }
      });

      return version;
    } catch (error) {
      // Revert document status on error
      await prisma.document.update({
        where: { id: documentId },
        data: { workflowStatus: WorkflowStatus.V1_COMPLETED }
      });
      throw error;
    }
  }

  // Start editing Version 2
  static async startEditingV2(documentId: string, versionId: string, userId: string) {
    const version = await prisma.documentVersion.update({
      where: { id: versionId },
      data: {
        status: VersionStatus.EDITING,
        editedBy: userId,
        editedAt: new Date()
      }
    });

    await prisma.document.update({
      where: { id: documentId },
      data: { workflowStatus: WorkflowStatus.V2_EDITING }
    });

    return version;
  }

  // Save Version 2 edits
  static async saveV2Edits(versionId: string, jsonContent: any, userId: string) {
    const { isValid, errors } = validateRfpTree(jsonContent);
    if (!isValid) {
      throw new Error(`Invalid V2 JSON: ${errors.join(', ')}`);
    }
    const version = await prisma.documentVersion.update({
      where: { id: versionId },
      data: {
        jsonContent: jsonContent as any,
        editedBy: userId,
        editedAt: new Date()
      }
    });

    return version;
  }

  // Complete Version 2 editing
  static async completeV2Editing(documentId: string, versionId: string, userId: string) {
    const version = await prisma.documentVersion.update({
      where: { id: versionId },
      data: {
        status: VersionStatus.COMPLETED,
        editedBy: userId,
        editedAt: new Date()
      }
    });

    await prisma.document.update({
      where: { id: documentId },
      data: { workflowStatus: WorkflowStatus.V2_COMPLETED }
    });

    return version;
  }

  // Approve final version
  static async approveDocument(documentId: string, versionId: string, userId: string) {
    const version = await prisma.documentVersion.update({
      where: { id: versionId },
      data: {
        status: VersionStatus.APPROVED,
        approvedBy: userId,
        approvedAt: new Date()
      }
    });

    await prisma.document.update({
      where: { id: documentId },
      data: { workflowStatus: WorkflowStatus.APPROVED }
    });

    return version;
  }

  // Generate Word document (placeholder for now)
  static async generateWordDocument(documentId: string, versionId: string, userId: string) {
    // This will be implemented later with actual Word generation
    const documentPath = `/generated/documents/${documentId}_${versionId}_${Date.now()}.docx`;
    
    const version = await prisma.documentVersion.update({
      where: { id: versionId },
      data: {
        generatedDocumentPath: documentPath
      }
    });

    await prisma.document.update({
      where: { id: documentId },
      data: { workflowStatus: WorkflowStatus.COMPLETED }
    });

    return { version, documentPath };
  }

  // Get document with all versions
  static async getDocumentWithVersions(documentId: string) {
    return await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        uploader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        versions: {
          include: {
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            editor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            approver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: [
            { versionType: 'asc' },
            { versionNumber: 'desc' }
          ]
        }
      }
    });
  }

  // Get latest version of specific type
  static async getLatestVersion(documentId: string, versionType: VersionType) {
    return await prisma.documentVersion.findFirst({
      where: {
        documentId,
        versionType
      },
      orderBy: { versionNumber: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        editor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
  }

  // Get workflow statistics
  static async getWorkflowStats() {
    const totalDocuments = await prisma.document.count();
    
    const statusCounts = await prisma.document.groupBy({
      by: ['workflowStatus'],
      _count: true
    });

    const pendingApprovals = await prisma.document.count({
      where: { workflowStatus: WorkflowStatus.V2_COMPLETED }
    });

    return {
      totalDocuments,
      statusBreakdown: statusCounts.reduce((acc, item) => {
        acc[item.workflowStatus] = item._count;
        return acc;
      }, {} as Record<string, number>),
      pendingApprovals
    };
  }
}
