import { PrismaClient } from '@prisma/client';
import { WorkflowStatus } from '@/types/workflow';

const prisma = new PrismaClient();

/**
 * Utility function to update existing documents with workflow status
 * Run this after migration to set default workflow status for existing documents
 */
export async function updateExistingDocuments() {
  try {
    console.log('Updating existing documents with workflow status...');
    
    // Update all documents that don't have a workflow status
    const result = await prisma.document.updateMany({
      where: {
        workflowStatus: {
          equals: undefined
        }
      },
      data: {
        workflowStatus: WorkflowStatus.UPLOADED
      }
    });
    
    console.log(`Updated ${result.count} documents with UPLOADED workflow status`);
    
    return result;
  } catch (error) {
    console.error('Error updating existing documents:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// If running this file directly
if (require.main === module) {
  updateExistingDocuments()
    .then(() => {
      console.log('Update completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Update failed:', error);
      process.exit(1);
    });
}
