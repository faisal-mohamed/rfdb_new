import { WorkflowStatus } from '@/types/workflow';

interface WorkflowProgressProps {
  currentStatus: WorkflowStatus;
  className?: string;
}

const workflowSteps = [
  {
    key: WorkflowStatus.UPLOADED,
    label: 'Uploaded',
    description: 'Document uploaded'
  },
  {
    key: WorkflowStatus.PROCESSING_V1,
    label: 'Processing V1',
    description: 'Generating initial summary'
  },
  {
    key: WorkflowStatus.V1_READY,
    label: 'V1 Ready',
    description: 'Ready for editing'
  },
  {
    key: WorkflowStatus.V1_EDITING,
    label: 'V1 Editing',
    description: 'Being edited'
  },
  {
    key: WorkflowStatus.V1_COMPLETED,
    label: 'V1 Complete',
    description: 'V1 editing completed'
  },
  {
    key: WorkflowStatus.PROCESSING_V2,
    label: 'Processing V2',
    description: 'Generating refined summary'
  },
  {
    key: WorkflowStatus.V2_READY,
    label: 'V2 Ready',
    description: 'Ready for final editing'
  },
  {
    key: WorkflowStatus.V2_EDITING,
    label: 'V2 Editing',
    description: 'Final editing in progress'
  },
  {
    key: WorkflowStatus.V2_COMPLETED,
    label: 'V2 Complete',
    description: 'Ready for approval'
  },
  {
    key: WorkflowStatus.APPROVED,
    label: 'Approved',
    description: 'Document approved'
  },
  {
    key: WorkflowStatus.COMPLETED,
    label: 'Completed',
    description: 'Word document generated'
  }
];

export default function WorkflowProgress({ currentStatus, className = '' }: WorkflowProgressProps) {
  const currentStepIndex = workflowSteps.findIndex(step => step.key === currentStatus);
  
  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between">
        {workflowSteps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isUpcoming = index > currentStepIndex;
          
          return (
            <div key={step.key} className="flex flex-col items-center flex-1">
              {/* Step Circle */}
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${isCompleted ? 'bg-green-500 text-white' : ''}
                ${isCurrent ? 'bg-blue-500 text-white' : ''}
                ${isUpcoming ? 'bg-gray-200 text-gray-500' : ''}
              `}>
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              
              {/* Step Label */}
              <div className="mt-2 text-center">
                <div className={`text-xs font-medium ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                  {step.label}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {step.description}
                </div>
              </div>
              
              {/* Connector Line */}
              {index < workflowSteps.length - 1 && (
                <div className={`
                  absolute top-4 left-1/2 w-full h-0.5 -z-10
                  ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}
                `} style={{ 
                  transform: 'translateX(50%)',
                  width: `calc(100% / ${workflowSteps.length} - 2rem)`
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
