"use client";

import { VendorQualificationFormData } from "@/types/vendor";

interface Props {
  data: Partial<VendorQualificationFormData>;
  updateData: (data: Partial<VendorQualificationFormData>) => void;
}

export default function GeneralInfoSection({ data, updateData }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updateData({ [name]: value });
  };

  // Check if date field is touched but empty
  const isDateEmpty = !data.incorporationDate || data.incorporationDate.trim() === '';

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">General Information</h2>
        <p className="text-slate-600">Provide your organization's basic details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Organization Name */}
        <div className="md:col-span-2 space-y-2">
          <label htmlFor="organizationName" className="block text-sm font-semibold text-slate-700">
            Name of the Organization <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="organizationName"
            name="organizationName"
            value={data.organizationName || ""}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Enter organization name"
            required
          />
        </div>

        {/* Date of Incorporation */}
        <div className="space-y-2">
          <label htmlFor="incorporationDate" className="block text-sm font-semibold text-slate-700">
            Date of Incorporation <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="incorporationDate"
            name="incorporationDate"
            value={data.incorporationDate || ""}
            onChange={handleChange}
            max={new Date().toISOString().split('T')[0]}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
              isDateEmpty 
                ? 'border-slate-300 focus:ring-blue-500 focus:border-blue-500' 
                : 'border-green-300 bg-green-50 focus:ring-green-500 focus:border-green-500'
            }`}
            placeholder="YYYY-MM-DD"
            aria-label="Select date of incorporation"
          />
          {isDateEmpty ? (
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Please select the date when your organization was incorporated
            </p>
          ) : (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Date selected
            </p>
          )}
        </div>

        {/* Telephone */}
        <div className="space-y-2">
          <label htmlFor="telephone" className="block text-sm font-semibold text-slate-700">
            Telephone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            id="telephone"
            name="telephone"
            value={data.telephone || ""}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="+260 XXX XXXXXX"
            required
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
            E-mail Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={data.email || ""}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="company@example.com"
            required
          />
        </div>

        {/* Main Business Activity */}
        <div className="space-y-2">
          <label htmlFor="mainBusinessActivity" className="block text-sm font-semibold text-slate-700">
            Main Business Activity <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="mainBusinessActivity"
            name="mainBusinessActivity"
            value={data.mainBusinessActivity || ""}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="e.g., Software Development, Banking Services"
            required
          />
        </div>

        {/* Postal Address */}
        <div className="md:col-span-2 space-y-2">
          <label htmlFor="postalAddress" className="block text-sm font-semibold text-slate-700">
            Postal Address <span className="text-red-500">*</span>
          </label>
          <textarea
            id="postalAddress"
            name="postalAddress"
            value={data.postalAddress || ""}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
            placeholder="Enter complete postal address"
            required
          />
        </div>

        {/* Registered Office Location */}
        <div className="md:col-span-2 space-y-2">
          <label htmlFor="registeredOfficeLocation" className="block text-sm font-semibold text-slate-700">
            Location of Registered Office (including street/road) <span className="text-red-500">*</span>
          </label>
          <textarea
            id="registeredOfficeLocation"
            name="registeredOfficeLocation"
            value={data.registeredOfficeLocation || ""}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
            placeholder="Enter complete office location with street/road details"
            required
          />
        </div>

        {/* Business Description */}
        <div className="md:col-span-2 space-y-2">
          <label htmlFor="businessDescription" className="block text-sm font-semibold text-slate-700">
            Brief Description of Business <span className="text-red-500">*</span>
          </label>
          <textarea
            id="businessDescription"
            name="businessDescription"
            value={data.businessDescription || ""}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
            placeholder="Describe your business, services, and areas of expertise"
            required
          />
        </div>

        {/* Name and Address of Bankers */}
        <div className="space-y-2">
          <label htmlFor="bankersInfo" className="block text-sm font-semibold text-slate-700">
            Name and Address of Bankers <span className="text-red-500">*</span>
          </label>
          <textarea
            id="bankersInfo"
            name="bankersInfo"
            value={data.bankersInfo || ""}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
            placeholder="Enter bank name and address"
            required
          />
        </div>

        {/* Name and Address of Insurers */}
        <div className="space-y-2">
          <label htmlFor="insurersInfo" className="block text-sm font-semibold text-slate-700">
            Name and Address of Insurers <span className="text-red-500">*</span>
          </label>
          <textarea
            id="insurersInfo"
            name="insurersInfo"
            value={data.insurersInfo || ""}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
            placeholder="Enter insurer name and address"
            required
          />
        </div>

        {/* Company Auditors */}
        <div className="md:col-span-2 space-y-2">
          <label htmlFor="companyAuditors" className="block text-sm font-semibold text-slate-700">
            Company Auditors <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="companyAuditors"
            name="companyAuditors"
            value={data.companyAuditors || ""}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Enter auditing firm name"
            required
          />
        </div>
      </div>

      {/* Info Box */}
      {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-blue-600 text-xl">ℹ️</div>
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Required Documents</h3>
            <p className="text-sm text-blue-800">
              Please ensure you have the following documents ready for upload in later steps:
            </p>
            <ul className="text-sm text-blue-800 list-disc list-inside mt-2 space-y-1">
              <li>Business Continuity Plan</li>
              <li>3 Years Audited Books of Accounts</li>
              <li>Memorandum and Articles of Association</li>
              <li>CR12 Form</li>
            </ul>
          </div>
        </div>
      </div> */}
    </div>
  );
}



