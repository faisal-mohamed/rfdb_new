"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { VendorQualificationFormData, VendorQualificationStatus } from "@/types/vendor";
import { apiPost, apiPut } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

// Import form sections (we'll create these next)
import GeneralInfoSection from "@/components/vendor-qualification/GeneralInfoSection";
import BankingDirectorsSection from "@/components/vendor-qualification/BankingDirectorsSection";
import ReferencesSection from "@/components/vendor-qualification/ReferencesSection";
import PersonnelSection from "@/components/vendor-qualification/PersonnelSection";
import ComplianceDocsSection from "@/components/vendor-qualification/ComplianceDocsSection";
import FinancialDocsSection from "@/components/vendor-qualification/FinancialDocsSection";
import ReviewSubmitSection from "@/components/vendor-qualification/ReviewSubmitSection";

const STEPS = [
  { id: 1, name: "General Information", icon: "📋" },
  { id: 2, name: "Banking & Directors", icon: "🏦" },
  { id: 3, name: "References", icon: "✅" },
  { id: 4, name: "Personnel & Team", icon: "👥" },
  { id: 5, name: "Compliance Documents", icon: "📄" },
  { id: 6, name: "Financial Documents", icon: "💰" },
  { id: 7, name: "Review & Submit", icon: "🚀" },
];

export default function VendorQualificationPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<VendorQualificationFormData>>({
    organizationName: "",
    incorporationDate: "", // Will be validated before submit
    postalAddress: "",
    telephone: "",
    email: "",
    registeredOfficeLocation: "",
    bankersInfo: "",
    insurersInfo: "",
    businessDescription: "",
    companyAuditors: "",
    mainBusinessActivity: "",
    bankName: "",
    accountNumber: "",
    branch: "",
    authorizedSignatories: [],
    directors: [],
    contactPersonName: "",
    contactPersonEmail: "",
    contactPersonPhone: "",
    references: [],
    totalEmployees: 0,
    managementTeam: 0,
    technicalTeam: 0,
    nonTechnicalTeam: 0,
    personnel: [],
  });
  const [qualificationId, setQualificationId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-save functionality
  useEffect(() => {
    const autoSave = setInterval(() => {
      if (qualificationId && formData.organizationName) {
        saveDraft(false);
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSave);
  }, [qualificationId, formData]);

  const saveDraft = async (showToast = true) => {
    if (!session?.user?.id) return;

    setIsSaving(true);
    try {
      const url = qualificationId
        ? `/api/vendor-qualification/${qualificationId}`
        : '/api/vendor-qualification';
      
      const method = qualificationId ? 'PUT' : 'POST';

      const response = qualificationId 
        ? await apiPut(`/api/vendor-qualification/${qualificationId}`, formData)
        : await apiPost('/api/vendor-qualification', formData);

      if (response.ok) {
        const data = await response.json();
        if (!qualificationId) {
          setQualificationId(data.qualification.id);
        }
        if (showToast) {
          // Show success message
          console.log('Draft saved successfully');
        }
      }
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      saveDraft(false);
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepId: number) => {
    setCurrentStep(stepId);
  };

  const updateFormData = (data: Partial<VendorQualificationFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleSubmit = async () => {
    if (!qualificationId) {
      showToast({ variant: "error", message: "Please save your draft first" });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiPost(`/api/vendor-qualification/${qualificationId}/submit`);

      if (response.ok) {
        showToast({ variant: "success", message: "Vendor qualification submitted successfully" });
        router.push('/vendor-qualification/list');
      } else {
        const error = await response.json();
        showToast({ variant: "error", message: error.error || "Failed to submit" });
      }
    } catch (error) {
      console.error('Error submitting:', error);
      showToast({ variant: "error", message: "Failed to submit qualification" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <GeneralInfoSection data={formData} updateData={updateFormData} />;
      case 2:
        return <BankingDirectorsSection data={formData} updateData={updateFormData} />;
      case 3:
        return <ReferencesSection data={formData} updateData={updateFormData} />;
      case 4:
        return <PersonnelSection data={formData} updateData={updateFormData} />;
      case 5:
        return <ComplianceDocsSection qualificationId={qualificationId} />;
      case 6:
        return <FinancialDocsSection qualificationId={qualificationId} />;
      case 7:
        return <ReviewSubmitSection data={formData} qualificationId={qualificationId} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 font-lexend">
      {/* Header */}
      <div className="relative">
        <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 rounded-2xl blur-xl"></div>
        <div className="relative bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl shadow-xl p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700 bg-clip-text text-transparent">
              Vendor Details
              </h1>
              <p className="text-slate-600 font-medium">
                Complete all sections to submit your vendor details
              </p>
              <div className="w-16 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
            </div>

            <div className="flex items-center gap-4">
              {isSaving && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                  <span>Saving...</span>
                </div>
              )}
              <button
                onClick={() => saveDraft(true)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Save Draft
              </button>
              <Link
                href="/vendor-qualification/list"
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
              >
                View All
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white/90 backdrop-blur-xl border border-white/30 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <button
                onClick={() => handleStepClick(step.id)}
                className={`flex items-center gap-3 ${
                  currentStep === step.id
                    ? 'text-blue-600'
                    : currentStep > step.id
                    ? 'text-green-600'
                    : 'text-slate-400'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all ${
                    currentStep === step.id
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white scale-110'
                      : currentStep > step.id
                      ? 'bg-green-100 text-green-600'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {currentStep > step.id ? '✓' : step.icon}
                </div>
                <div className="text-left hidden lg:block">
                  <div className="text-xs text-slate-500">Step {step.id}</div>
                  <div className="text-sm font-semibold">{step.name}</div>
                </div>
              </button>
              {index < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    currentStep > step.id ? 'bg-green-500' : 'bg-slate-200'
                  }`}
                ></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white/90 backdrop-blur-xl border border-white/30 rounded-xl shadow-lg p-8">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          ← Previous
        </button>

        <div className="text-sm text-slate-500">
          Step {currentStep} of {STEPS.length}
        </div>

        {currentStep < STEPS.length ? (
          <button
            onClick={handleNext}
            className="group relative rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:scale-105 active:scale-95"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="group relative rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:from-green-700 hover:to-emerald-700 hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Submitting...
              </span>
            ) : (
              'Submit Qualification 🚀'
            )}
          </button>
        )}
      </div>
    </div>
  );
}



