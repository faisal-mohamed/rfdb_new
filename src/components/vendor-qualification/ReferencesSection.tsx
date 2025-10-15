"use client";

import { VendorQualificationFormData, VendorReference } from "@/types/vendor";

interface Props {
  data: Partial<VendorQualificationFormData>;
  updateData: (data: Partial<VendorQualificationFormData>) => void;
}

export default function ReferencesSection({ data, updateData }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateData({ [name]: value });
  };

  const addReference = () => {
    const nextSerialNumber = (data.references?.length || 0) + 1;
    updateData({
      references: [
        ...(data.references || []),
        {
          serialNumber: nextSerialNumber,
          bankName: "",
          contactPerson: "",
          contactDetails: ""
        }
      ]
    });
  };

  const updateReference = (index: number, field: keyof VendorReference, value: string | number) => {
    const updated = [...(data.references || [])];
    updated[index] = { ...updated[index], [field]: value };
    updateData({ references: updated });
  };

  const removeReference = (index: number) => {
    const updated = [...(data.references || [])];
    updated.splice(index, 1);
    // Update serial numbers
    updated.forEach((ref, idx) => {
      ref.serialNumber = idx + 1;
    });
    updateData({ references: updated });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">References & Contact Person</h2>
        <p className="text-slate-600">Provide bank references and contact person details</p>
      </div>

      {/* Contact Person Details */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Contact Person for Proof of Payment</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label htmlFor="contactPersonName" className="block text-sm font-semibold text-slate-700">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="contactPersonName"
              name="contactPersonName"
              value={data.contactPersonName || ""}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="e.g., John Doe"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="contactPersonEmail" className="block text-sm font-semibold text-slate-700">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="contactPersonEmail"
              name="contactPersonEmail"
              value={data.contactPersonEmail || ""}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="john.doe@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="contactPersonPhone" className="block text-sm font-semibold text-slate-700">
              Contact Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="contactPersonPhone"
              name="contactPersonPhone"
              value={data.contactPersonPhone || ""}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="+91 XXXXX XXXXX"
              required
            />
          </div>
        </div>
      </div>

      {/* Bank References */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Bank References (Section 9.4)</h3>
            <p className="text-sm text-slate-500 mt-1">Provide at least 3 bank references</p>
          </div>
          <button
            type="button"
            onClick={addReference}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all text-sm font-semibold"
          >
            + Add Reference
          </button>
        </div>

        {data.references && data.references.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 border w-20">S.No</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 border">Name of the Bank <span className="text-red-500">*</span></th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 border">Contact Person <span className="text-red-500">*</span></th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 border">Contact Details <span className="text-red-500">*</span></th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700 border w-20">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.references.map((reference, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="px-4 py-3 border text-center font-semibold text-slate-600">
                      {reference.serialNumber}
                    </td>
                    <td className="px-4 py-3 border">
                      <input
                        type="text"
                        value={reference.bankName}
                        onChange={(e) => updateReference(index, 'bankName', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., ZICB Bank"
                        required
                      />
                    </td>
                    <td className="px-4 py-3 border">
                      <input
                        type="text"
                        value={reference.contactPerson}
                        onChange={(e) => updateReference(index, 'contactPerson', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Contact person name"
                        required
                      />
                    </td>
                    <td className="px-4 py-3 border">
                      <textarea
                        value={reference.contactDetails}
                        onChange={(e) => updateReference(index, 'contactDetails', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        rows={2}
                        placeholder="Phone, email, position, etc."
                        required
                      />
                    </td>
                    <td className="px-4 py-3 border text-center">
                      <button
                        type="button"
                        onClick={() => removeReference(index)}
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
            <p className="text-slate-500">No references added yet. Click "Add Reference" to begin.</p>
          </div>
        )}

        {/* Sample Reference Data */}
        {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Sample Reference Format:</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p><strong>1. ZICB Bank</strong> - Samuel Mwanachiwena, Digital Banking Channels and Products Manager, Cell: +260 977 420 974</p>
            <p><strong>2. NFC Bank</strong> - Lawrence, Email: Lawrence.Ebaneck@nfcbanksa.com</p>
            <p><strong>3. Azania Bank</strong> - Vinesh Davda - Manager Digital Banking, Mobile: 0714222722, Email: vdavda@azaniabank.co.tz</p>
          </div>
        </div> */}
      </div>

      {/* Info Box for Reference Letters */}
      {/* <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-amber-600 text-xl">📝</div>
          <div>
            <h3 className="font-semibold text-amber-900 mb-1">Reference Letters Required</h3>
            <p className="text-sm text-amber-800">
              Please prepare 3 reference letters from the banks mentioned above. You will upload these documents in the "Compliance Documents" section.
            </p>
          </div>
        </div>
      </div> */}
    </div>
  );
}











