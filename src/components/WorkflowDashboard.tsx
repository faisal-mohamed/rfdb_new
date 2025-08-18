'use client';

import { useState, useEffect } from 'react';
import { WorkflowStatus } from '@/types/workflow';
import WorkflowStatusBadge from './WorkflowStatusBadge';

interface WorkflowStats {
  totalDocuments: number;
  statusBreakdown: Record<string, number>;
  pendingApprovals: number;
}

export default function WorkflowDashboard() {
  const [stats, setStats] = useState<WorkflowStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/workflow/stats');
      const result = await response.json();
      
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error fetching workflow stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <p className="text-gray-500">Unable to load workflow statistics.</p>
      </div>
    );
  }

  const statusCards = [
    {
      title: 'Total Documents',
      value: stats.totalDocuments,
      icon: '📄',
      color: 'text-blue-600'
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingApprovals,
      icon: '⏳',
      color: 'text-orange-600'
    },
    {
      title: 'In Processing',
      value: (stats.statusBreakdown[WorkflowStatus.PROCESSING_V1] || 0) + 
             (stats.statusBreakdown[WorkflowStatus.PROCESSING_V2] || 0),
      icon: '⚙️',
      color: 'text-purple-600'
    },
    {
      title: 'Completed',
      value: stats.statusBreakdown[WorkflowStatus.COMPLETED] || 0,
      icon: '✅',
      color: 'text-green-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statusCards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">{card.icon}</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{card.title}</p>
                <p className={`text-2xl font-semibold ${card.color}`}>
                  {card.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Status Breakdown */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Workflow Status Breakdown</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(stats.statusBreakdown).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <WorkflowStatusBadge status={status as WorkflowStatus} />
                </div>
                <span className="text-lg font-semibold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📋</span>
                <div>
                  <p className="font-medium text-gray-900">View All Documents</p>
                  <p className="text-sm text-gray-500">See all documents in the system</p>
                </div>
              </div>
            </button>
            
            <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">⏰</span>
                <div>
                  <p className="font-medium text-gray-900">Pending Approvals</p>
                  <p className="text-sm text-gray-500">Review documents awaiting approval</p>
                </div>
              </div>
            </button>
            
            <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📊</span>
                <div>
                  <p className="font-medium text-gray-900">Analytics</p>
                  <p className="text-sm text-gray-500">View detailed workflow analytics</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
