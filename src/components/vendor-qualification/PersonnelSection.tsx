"use client";

import { VendorQualificationFormData, VendorPersonnel } from "@/types/vendor";

interface Props {
  data: Partial<VendorQualificationFormData>;
  updateData: (data: Partial<VendorQualificationFormData>) => void;
}

export default function PersonnelSection({ data, updateData }: Props) {
  const handleEmployeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateData({ [name]: parseInt(value) || 0 });
  };

  const addPersonnel = () => {
    updateData({
      personnel: [
        ...(data.personnel || []),
        {
          name: "",
          qualification: "",
          experience: "",
          role: "",
          cvContent: ""
        }
      ]
    });
  };

  const updatePersonnel = (index: number, field: keyof VendorPersonnel, value: string) => {
    const updated = [...(data.personnel || [])];
    updated[index] = { ...updated[index], [field]: value };
    updateData({ personnel: updated });
  };

  const removePersonnel = (index: number) => {
    const updated = [...(data.personnel || [])];
    updated.splice(index, 1);
    updateData({ personnel: updated });
  };

  // Calculate totals
  const calculateTotal = () => {
    return (data.managementTeam || 0) + (data.technicalTeam || 0) + (data.nonTechnicalTeam || 0);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Personnel & Team Composition</h2>
        <p className="text-slate-600">Provide employee strength and key personnel information</p>
      </div>

      {/* Organogram Note */}
      {/* <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-purple-600 text-xl">📊</div>
          <div>
            <h3 className="font-semibold text-purple-900 mb-1">Organizational Structure</h3>
            <p className="text-sm text-purple-800">
              You will upload your Organogram and Employee Strength chart in the "Financial Documents" section.
            </p>
          </div>
        </div>
      </div> */}

      {/* Employee Strength Table */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Employee Strength Breakdown</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 border">Category</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700 border w-48">Count</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-slate-50">
                <td className="px-6 py-4 border font-medium text-slate-700">
                  Total Number of Employees
                </td>
                <td className="px-6 py-4 border">
                  <input
                    type="number"
                    name="totalEmployees"
                    value={data.totalEmployees || 0}
                    onChange={handleEmployeeChange}
                    min="0"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-semibold"
                  />
                </td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-6 py-4 border text-slate-700">
                  Management Team
                </td>
                <td className="px-6 py-4 border">
                  <input
                    type="number"
                    name="managementTeam"
                    value={data.managementTeam || 0}
                    onChange={handleEmployeeChange}
                    min="0"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                  />
                </td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-6 py-4 border text-slate-700">
                  Technical Team (Product Development, Implementation, Delivery and Support)
                </td>
                <td className="px-6 py-4 border">
                  <input
                    type="number"
                    name="technicalTeam"
                    value={data.technicalTeam || 0}
                    onChange={handleEmployeeChange}
                    min="0"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                  />
                </td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-6 py-4 border text-slate-700">
                  Non-Technical (Marketing, Sales, HR & Admin, Support Services)
                </td>
                <td className="px-6 py-4 border">
                  <input
                    type="number"
                    name="nonTechnicalTeam"
                    value={data.nonTechnicalTeam || 0}
                    onChange={handleEmployeeChange}
                    min="0"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                  />
                </td>
              </tr>
              <tr className="bg-blue-50 font-semibold">
                <td className="px-6 py-4 border text-slate-800">
                  Calculated Total (Should match Total Employees)
                </td>
                <td className="px-6 py-4 border">
                  <div className={`text-center py-2 rounded-lg ${
                    calculateTotal() === data.totalEmployees
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {calculateTotal()}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {calculateTotal() !== data.totalEmployees && data.totalEmployees > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            ⚠️ The sum of team members ({calculateTotal()}) should equal the total number of employees ({data.totalEmployees}).
          </div>
        )}
      </div>

      {/* Key Personnel / CVs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Key Personnel Qualifications</h3>
            <p className="text-sm text-slate-500 mt-1">Add CVs and qualifications of team members</p>
          </div>
          <button
            type="button"
            onClick={addPersonnel}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all text-sm font-semibold"
          >
            + Add Personnel
          </button>
        </div>

        {data.personnel && data.personnel.length > 0 ? (
          <div className="space-y-4">
            {data.personnel.map((person, index) => (
              <div key={index} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-slate-800">Personnel #{index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removePersonnel(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={person.name}
                      onChange={(e) => updatePersonnel(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Full name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Role/Position <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={person.role}
                      onChange={(e) => updatePersonnel(index, 'role', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Senior Developer, Project Manager"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Qualification <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={person.qualification}
                      onChange={(e) => updatePersonnel(index, 'qualification', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., BSc Computer Science, MBA"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Experience <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={person.experience}
                      onChange={(e) => updatePersonnel(index, 'experience', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 10 years in software development"
                      required
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      CV Summary/Content
                    </label>
                    <textarea
                      value={person.cvContent || ""}
                      onChange={(e) => updatePersonnel(index, 'cvContent', e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Brief summary of experience, key achievements, certifications..."
                    />
                    <p className="text-xs text-slate-500">
                      You can also upload CV files in the "Compliance Documents" section
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
            <p className="text-slate-500">No personnel added yet. Click "Add Personnel" to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
}





