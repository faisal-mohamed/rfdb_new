"use client";

import { useState } from "react";
import { VendorQualificationFormData, VendorDirector } from "@/types/vendor";

interface Props {
  data: Partial<VendorQualificationFormData>;
  updateData: (data: Partial<VendorQualificationFormData>) => void;
}

export default function BankingDirectorsSection({ data, updateData }: Props) {
  const [newSignatory, setNewSignatory] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateData({ [name]: value });
  };

  const addSignatory = () => {
    if (newSignatory.trim()) {
      updateData({
        authorizedSignatories: [...(data.authorizedSignatories || []), newSignatory.trim()]
      });
      setNewSignatory("");
    }
  };

  const removeSignatory = (index: number) => {
    const updated = [...(data.authorizedSignatories || [])];
    updated.splice(index, 1);
    updateData({ authorizedSignatories: updated });
  };

  const addDirector = () => {
    updateData({
      directors: [
        ...(data.directors || []),
        { name: "", position: "", contact: "" }
      ]
    });
  };

  const updateDirector = (index: number, field: keyof VendorDirector, value: string) => {
    const updated = [...(data.directors || [])];
    updated[index] = { ...updated[index], [field]: value };
    updateData({ directors: updated });
  };

  const removeDirector = (index: number) => {
    const updated = [...(data.directors || [])];
    updated.splice(index, 1);
    updateData({ directors: updated });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Banking Details & Directors</h2>
        <p className="text-slate-600">Provide banking information and directors details</p>
      </div>

      {/* Banking Details */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Banking Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="bankName" className="block text-sm font-semibold text-slate-700">
              Bank <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="bankName"
              name="bankName"
              value={data.bankName || ""}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter bank name"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="accountNumber" className="block text-sm font-semibold text-slate-700">
              Account Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="accountNumber"
              name="accountNumber"
              value={data.accountNumber || ""}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter account number"
              required
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label htmlFor="branch" className="block text-sm font-semibold text-slate-700">
              Branch <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="branch"
              name="branch"
              value={data.branch || ""}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter branch name/location"
              required
            />
          </div>
        </div>

        {/* Authorized Signatories */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-700">
            Name(s) of Authorized Signatory <span className="text-red-500">*</span>
          </label>
          
          {/* List of Signatories */}
          {data.authorizedSignatories && data.authorizedSignatories.length > 0 && (
            <div className="space-y-2">
              {data.authorizedSignatories.map((signatory, index) => (
                <div key={index} className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg">
                  <span className="flex-1 text-slate-700">{signatory}</span>
                  <button
                    type="button"
                    onClick={() => removeSignatory(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add New Signatory */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newSignatory}
              onChange={(e) => setNewSignatory(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSignatory())}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter signatory name"
            />
            <button
              type="button"
              onClick={addSignatory}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Directors Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Directors</h3>
          <button
            type="button"
            onClick={addDirector}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all text-sm font-semibold"
          >
            + Add Director
          </button>
        </div>

        {data.directors && data.directors.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 border">Name <span className="text-red-500">*</span></th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 border">Position</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 border">Contact</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700 border w-20">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.directors.map((director, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="px-4 py-3 border">
                      <input
                        type="text"
                        value={director.name}
                        onChange={(e) => updateDirector(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Director name"
                        required
                      />
                    </td>
                    <td className="px-4 py-3 border">
                      <input
                        type="text"
                        value={director.position || ""}
                        onChange={(e) => updateDirector(index, 'position', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Position/Role"
                      />
                    </td>
                    <td className="px-4 py-3 border">
                      <input
                        type="text"
                        value={director.contact || ""}
                        onChange={(e) => updateDirector(index, 'contact', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Contact number/email"
                      />
                    </td>
                    <td className="px-4 py-3 border text-center">
                      <button
                        type="button"
                        onClick={() => removeDirector(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
            <p className="text-slate-500">No directors added yet. Click "Add Director" to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
}











