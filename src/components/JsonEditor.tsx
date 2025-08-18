'use client';

import { useState, useEffect } from 'react';
import { MockRFPSummary } from '@/types/workflow';

interface JsonEditorProps {
  initialData: MockRFPSummary;
  onSave: (data: MockRFPSummary) => void;
  onCancel: () => void;
  isReadOnly?: boolean;
  className?: string;
}

export default function JsonEditor({ 
  initialData, 
  onSave, 
  onCancel, 
  isReadOnly = false, 
  className = '' 
}: JsonEditorProps) {
  const [data, setData] = useState<MockRFPSummary>(initialData);
  const [activeTab, setActiveTab] = useState('document');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setHasChanges(JSON.stringify(data) !== JSON.stringify(initialData));
  }, [data, initialData]);

  const handleSave = () => {
    onSave(data);
    setHasChanges(false);
  };

  const updateDocumentInfo = (field: string, value: string) => {
    setData(prev => ({
      ...prev,
      documentInfo: {
        ...prev.documentInfo,
        [field]: value
      }
    }));
  };

  const updateRequirements = (type: 'technical' | 'functional' | 'compliance', requirements: string[]) => {
    setData(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        [type]: requirements
      }
    }));
  };

  const updateEvaluation = (field: string, value: any) => {
    setData(prev => ({
      ...prev,
      evaluation: {
        ...prev.evaluation,
        [field]: value
      }
    }));
  };

  const updateBudget = (field: string, value: string) => {
    setData(prev => ({
      ...prev,
      budget: {
        ...prev.budget,
        [field]: value
      }
    }));
  };

  const addRequirement = (type: 'technical' | 'functional' | 'compliance') => {
    const newReq = prompt(`Enter new ${type} requirement:`);
    if (newReq) {
      updateRequirements(type, [...data.requirements[type], newReq]);
    }
  };

  const removeRequirement = (type: 'technical' | 'functional' | 'compliance', index: number) => {
    const updated = data.requirements[type].filter((_, i) => i !== index);
    updateRequirements(type, updated);
  };

  const tabs = [
    { id: 'document', label: 'Document Info' },
    { id: 'requirements', label: 'Requirements' },
    { id: 'evaluation', label: 'Evaluation' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'budget', label: 'Budget' }
  ];

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            RFP Summary Editor
            {hasChanges && !isReadOnly && (
              <span className="ml-2 text-sm text-orange-600">(Unsaved changes)</span>
            )}
          </h3>
          <div className="flex space-x-3">
            {!isReadOnly && (
              <>
                <button
                  onClick={handleSave}
                  disabled={!hasChanges}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Changes
                </button>
                <button
                  onClick={onCancel}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'document' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={data.documentInfo.title}
                onChange={(e) => updateDocumentInfo('title', e.target.value)}
                disabled={isReadOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <input
                type="text"
                value={data.documentInfo.type}
                onChange={(e) => updateDocumentInfo('type', e.target.value)}
                disabled={isReadOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Submission Deadline</label>
              <input
                type="date"
                value={data.documentInfo.submissionDeadline}
                onChange={(e) => updateDocumentInfo('submissionDeadline', e.target.value)}
                disabled={isReadOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
              <input
                type="text"
                value={data.documentInfo.contactPerson}
                onChange={(e) => updateDocumentInfo('contactPerson', e.target.value)}
                disabled={isReadOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
              <input
                type="text"
                value={data.documentInfo.organization}
                onChange={(e) => updateDocumentInfo('organization', e.target.value)}
                disabled={isReadOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
            </div>
          </div>
        )}

        {activeTab === 'requirements' && (
          <div className="space-y-6">
            {(['technical', 'functional', 'compliance'] as const).map((type) => (
              <div key={type}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-md font-medium text-gray-900 capitalize">{type} Requirements</h4>
                  {!isReadOnly && (
                    <button
                      onClick={() => addRequirement(type)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Add Requirement
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {data.requirements[type].map((req, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={req}
                        onChange={(e) => {
                          const updated = [...data.requirements[type]];
                          updated[index] = e.target.value;
                          updateRequirements(type, updated);
                        }}
                        disabled={isReadOnly}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      />
                      {!isReadOnly && (
                        <button
                          onClick={() => removeRequirement(type, index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'budget' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Range</label>
              <input
                type="text"
                value={data.budget.estimatedRange}
                onChange={(e) => updateBudget('estimatedRange', e.target.value)}
                disabled={isReadOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
              <textarea
                value={data.budget.paymentTerms}
                onChange={(e) => updateBudget('paymentTerms', e.target.value)}
                disabled={isReadOnly}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
            </div>
          </div>
        )}

        {/* Add other tabs content as needed */}
        {activeTab === 'evaluation' && (
          <div className="text-gray-500">
            Evaluation criteria editor - Implementation pending
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="text-gray-500">
            Timeline editor - Implementation pending
          </div>
        )}
      </div>
    </div>
  );
}
