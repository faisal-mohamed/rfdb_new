import { WorkflowStatus } from '@/types/workflow';

interface WorkflowStatusBadgeProps {
  status: WorkflowStatus;
  className?: string;
}

const statusConfig = {
  [WorkflowStatus.UPLOADED]: {
    label: 'Uploaded',
    color: 'bg-gray-100 text-gray-800 border-gray-200'
  },
  [WorkflowStatus.PROCESSING_V1]: {
    label: 'Processing V1',
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  [WorkflowStatus.V1_READY]: {
    label: 'V1 Ready',
    color: 'bg-green-100 text-green-800 border-green-200'
  },
  [WorkflowStatus.V1_EDITING]: {
    label: 'V1 Editing',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  [WorkflowStatus.V1_COMPLETED]: {
    label: 'V1 Completed',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  },
  [WorkflowStatus.PROCESSING_V2]: {
    label: 'Processing V2',
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  [WorkflowStatus.V2_READY]: {
    label: 'V2 Ready',
    color: 'bg-green-100 text-green-800 border-green-200'
  },
  [WorkflowStatus.V2_EDITING]: {
    label: 'V2 Editing',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  [WorkflowStatus.V2_COMPLETED]: {
    label: 'V2 Completed',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  },
  [WorkflowStatus.APPROVED]: {
    label: 'Approved',
    color: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  [WorkflowStatus.COMPLETED]: {
    label: 'Completed',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200'
  }
};

export default function WorkflowStatusBadge({ status, className = '' }: WorkflowStatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color} ${className}`}>
      {config.label}
    </span>
  );
}
