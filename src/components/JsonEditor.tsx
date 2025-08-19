'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RfpNode, RfpLeaf } from '@/types/workflow';

interface JsonEditorProps {
  initialData: RfpNode;
  onSave: (data: RfpNode) => void;
  onCancel: () => void;
  isReadOnly?: boolean;
  className?: string;
  saveLabel?: string;
  disableWhenUnchanged?: boolean;
}

function isLeaf(node: any): node is RfpLeaf {
  return node && typeof node === 'object' && 'extracted_data' in node && 'pages' in node;
}

export default function JsonEditor({ 
  initialData, 
  onSave, 
  onCancel, 
  isReadOnly = false, 
  className = '',
  saveLabel = 'Save Changes',
  disableWhenUnchanged = true
}: JsonEditorProps) {
  const [data, setData] = useState<RfpNode>(initialData);
  const [hasChanges, setHasChanges] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [orderMap, setOrderMap] = useState<Record<string, string[]>>({});

  // Build a stable, collision-safe path key
  const toKey = useCallback((path: string[]) => path.map(seg => encodeURIComponent(seg)).join('|'), []);

  useEffect(() => {
    setHasChanges(JSON.stringify(data) !== JSON.stringify(initialData));
  }, [data, initialData]);

  // Capture the exact original key order of every node so UI always follows API order
  useEffect(() => {
    const map: Record<string, string[]> = {};
    const walk = (node: RfpNode | RfpLeaf, path: string[]) => {
      if (isLeaf(node)) return;
      const key = toKey(path);
      map[key] = Object.keys(node as RfpNode);
      for (const k of map[key]) {
        walk((node as RfpNode)[k] as any, [...path, k]);
      }
    };
    walk(initialData, []);
    setOrderMap(map);
  }, [initialData, toKey]);

  const handleSave = () => {
    onSave(data);
    setHasChanges(false);
  };

  // Immutable update only along the edited path
  const updateExtractedData = useCallback((path: string[], value: string) => {
    const updateRecursive = (node: RfpNode | RfpLeaf, depth: number): RfpNode | RfpLeaf => {
      if (isLeaf(node) && depth === path.length) {
        return { ...node, extracted_data: value };
      }
      const keyAtDepth = path[depth];
      const child = (node as RfpNode)[keyAtDepth] as any;
      if (child === undefined) return node;
      const updatedChild = updateRecursive(child, depth + 1) as any;
      if (updatedChild === child) return node;
      // Rebuild object preserving original key order
      const keys = Object.keys(node as RfpNode);
      const result: any = {};
      for (const k of keys) {
        result[k] = k === keyAtDepth ? updatedChild : (node as any)[k];
      }
      return result as RfpNode;
    };
    setData(prev => updateRecursive(prev, 0) as RfpNode);
  }, []);

  const toggleExpand = (path: string[]) => {
    const key = toKey(path);
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isExpanded = (path: string[]) => {
    const key = toKey(path);
    return expanded[key] ?? true; // default expanded
  };

  const LeafEditor = React.memo(function LeafEditor({ leaf, path }: { leaf: RfpLeaf; path: string[] }) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Extracted Data</label>
        <div className="relative">
          <textarea
            defaultValue={leaf.extracted_data}
            onChange={(e) => updateExtractedData(path, e.target.value)}
            disabled={isReadOnly}
            rows={5}
            placeholder="Type extracted summary here..."
            className="w-full resize-y px-4 py-3 rounded-lg border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
          />
        </div>
        <div className="text-xs text-gray-500">Pages: {leaf.pages.join(', ') || '-'}</div>
      </div>
    );
  });

  const SectionNode = React.memo(function SectionNode({ node, path = [] as string[] }: { node: RfpNode | RfpLeaf; path?: string[] }) {
    if (isLeaf(node)) {
      return <LeafEditor leaf={node} path={path} />;
    }
    const pathKey = toKey(path);
    const keysInOrder = orderMap[pathKey] ?? Object.keys(node as RfpNode);
    const entries = useMemo(() => keysInOrder.map(k => [k, (node as RfpNode)[k] as any] as const), [keysInOrder, node]);
    return (
      <div className="space-y-3">
        {entries.map(([key, child]) => {
          const childPath = [...path, key];
          const open = isExpanded(childPath);
          const childPathKey = toKey(childPath);
          return (
            <div key={childPathKey} className="border rounded-lg overflow-hidden">
              <div
                className="px-4 py-3 bg-gray-50 text-gray-800 font-medium flex items-center justify-between cursor-pointer hover:bg-gray-100"
                onClick={() => toggleExpand(childPath)}
              >
                <span>{key}</span>
                <span className="text-gray-500">{open ? '−' : '+'}</span>
              </div>
              {open && (
                <div className="p-4 bg-white">
                  <SectionNode node={child as any} path={childPath} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  });

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            RFP JSON Editor
            {hasChanges && !isReadOnly && (
              <span className="ml-2 text-sm text-orange-600">(Unsaved changes)</span>
            )}
          </h3>
          <div className="flex space-x-3">
            {!isReadOnly && (
              <>
                <button
                  onClick={handleSave}
                  disabled={disableWhenUnchanged ? !hasChanges : false}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saveLabel}
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

      <div className="p-6">
        <SectionNode node={data} path={[]} />
      </div>
    </div>
  );
}
