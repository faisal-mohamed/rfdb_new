"use client";

import { VendorQualificationFormData } from "@/types/vendor";

interface Props {
  data: Partial<VendorQualificationFormData>;
  qualificationId: string | null;
}

export default function ReviewSubmitSection({ data, qualificationId }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Review & Submit</h2>
        <p className="text-slate-600">Review all information before final submission</p>
      </div>

      {/* General Information Review */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">General Information</h3>
        <div className="bg-slate-50 rounded-lg p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-slate-600">Organization Name</p>
            <p className="font-semibold text-slate-900">{data.organizationName || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Incorporation Date</p>
            <p className="font-semibold text-slate-900">{data.incorporationDate || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Email</p>
            <p className="font-semibold text-slate-900">{data.email || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Telephone</p>
            <p className="font-semibold text-slate-900">{data.telephone || '-'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-slate-600">Main Business Activity</p>
            <p className="font-semibold text-slate-900">{data.mainBusinessActivity || '-'}</p>
          </div>
        </div>
      </div>

      {/* Banking Details Review */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Banking Details</h3>
        <div className="bg-slate-50 rounded-lg p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-slate-600">Bank Name</p>
            <p className="font-semibold text-slate-900">{data.bankName || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Account Number</p>
            <p className="font-semibold text-slate-900">{data.accountNumber || '-'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-slate-600">Branch</p>
            <p className="font-semibold text-slate-900">{data.branch || '-'}</p>
          </div>
        </div>
      </div>

      {/* Directors Review */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">
          Directors ({data.directors?.length || 0})
        </h3>
        {data.directors && data.directors.length > 0 ? (
          <div className="space-y-3">
            {data.directors.map((director, index) => (
              <div key={index} className="bg-slate-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Name</p>
                    <p className="font-semibold text-slate-900">{director.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Position</p>
                    <p className="font-semibold text-slate-900">{director.position || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Contact</p>
                    <p className="font-semibold text-slate-900">{director.contact || '-'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">No directors added</p>
        )}
      </div>

      {/* Contact Person Review */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Contact Person</h3>
        <div className="bg-slate-50 rounded-lg p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-slate-600">Name</p>
            <p className="font-semibold text-slate-900">{data.contactPersonName || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Email</p>
            <p className="font-semibold text-slate-900">{data.contactPersonEmail || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Phone</p>
            <p className="font-semibold text-slate-900">{data.contactPersonPhone || '-'}</p>
          </div>
        </div>
      </div>

      {/* References Review */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">
          Bank References ({data.references?.length || 0})
        </h3>
        {data.references && data.references.length > 0 ? (
          <div className="space-y-3">
            {data.references.map((reference, index) => (
              <div key={index} className="bg-slate-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">S.No</p>
                    <p className="font-semibold text-slate-900">{reference.serialNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Bank Name</p>
                    <p className="font-semibold text-slate-900">{reference.bankName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Contact Person</p>
                    <p className="font-semibold text-slate-900">{reference.contactPerson}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Details</p>
                    <p className="font-semibold text-slate-900 text-sm">{reference.contactDetails}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">No references added</p>
        )}
      </div>

      {/* Employee Strength Review */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Employee Strength</h3>
        <div className="bg-slate-50 rounded-lg p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{data.totalEmployees || 0}</p>
              <p className="text-sm text-slate-600 mt-1">Total Employees</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{data.managementTeam || 0}</p>
              <p className="text-sm text-slate-600 mt-1">Management</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">{data.technicalTeam || 0}</p>
              <p className="text-sm text-slate-600 mt-1">Technical</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">{data.nonTechnicalTeam || 0}</p>
              <p className="text-sm text-slate-600 mt-1">Non-Technical</p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Personnel Review */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">
          Key Personnel ({data.personnel?.length || 0})
        </h3>
        {data.personnel && data.personnel.length > 0 ? (
          <div className="space-y-3">
            {data.personnel.map((person, index) => (
              <div key={index} className="bg-slate-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Name</p>
                    <p className="font-semibold text-slate-900">{person.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Role</p>
                    <p className="font-semibold text-slate-900">{person.role}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Qualification</p>
                    <p className="font-semibold text-slate-900">{person.qualification}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Experience</p>
                    <p className="font-semibold text-slate-900">{person.experience}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">No personnel added</p>
        )}
      </div>

      {/* Submission Checklist */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">📋 Submission Checklist</h3>
        <div className="space-y-2">
          {[
            { label: 'General information completed', checked: !!data.organizationName },
            { label: 'Banking details provided', checked: !!data.bankName },
            { label: 'At least one director added', checked: (data.directors?.length || 0) > 0 },
            { label: 'Contact person details filled', checked: !!data.contactPersonName },
            { label: 'At least 3 references provided', checked: (data.references?.length || 0) >= 3 },
            { label: 'Employee strength filled', checked: !!data.totalEmployees },
            { label: 'Documents uploaded', checked: !!qualificationId }
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                item.checked ? 'bg-green-500 text-white' : 'bg-slate-300 text-slate-500'
              }`}>
                {item.checked ? '✓' : '○'}
              </div>
              <span className={item.checked ? 'text-slate-700' : 'text-slate-500'}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Final Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-amber-600 text-xl">⚠️</div>
          <div>
            <h3 className="font-semibold text-amber-900 mb-1">Before Submission</h3>
            <p className="text-sm text-amber-800">
              Please ensure all information is accurate and all required documents are uploaded. 
              Once submitted, you will not be able to edit the qualification form.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}











