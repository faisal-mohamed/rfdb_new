import { ExternalApiRequest, ExternalApiResponse, VersionType, RfpNode, RfpLeaf } from '@/types/workflow';

// Mock delay to simulate API call
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generate mock Version 1 JSON (dynamic tree matching required shape)
const generateMockV1Json = (fileName: string): RfpNode => {
  const leaf = (text: string, pages: number[]): RfpLeaf => ({ extracted_data: text, pages });
  return {
    "Project Objective and Scope Requirements": {
      "Project Objective and Scope Requirements": leaf("", [])
    },
    "Functional / System Requirements": {
      "Account Management": leaf("", []),
      "Payments & Transfers": leaf("", []),
      "Onboarding": leaf("", []),
      "Lending & Credit Services": leaf("Digital Loan & Mortgage Application: End-to-end, guided application processes with AI-enhanced credit scoring, instant pre-qualification, and flexible repayment options. Credit & Card Management: Digital issuance and management of physical, virtual, and BNPL credit products, including dynamic spending controls and rewards. Personalized Financial Offers: AI-driven risk assessment delivering customized credit lines, micro-loans, and refinancing options based on real-time data.", [7]),
      "Card Management": leaf("Credit & Card Management: Digital issuance and management of physical, virtual, and BNPL credit products, including dynamic spending controls and rewards.", [7]),
      "Back Office / Admin Module": leaf("", []),
      "Reconciliation": leaf("", [])
    },
    "Technical Requirements": {
      "System Architecture": leaf("", []),
      "Integration Capabilities": leaf("Seamless integration with fintech partners, data sharing frameworks, and support for regulatory open banking initiatives.", [11]),
      "Database Requirements": leaf("", []),
      "Hosting & Deployment": leaf("", []),
      "Operating System Compatibility": leaf("", [])
    },
    "Non-Functional Requirements": {
      "Scalability and Performance": leaf("", []),
      "Availability and Reliability": leaf("", []),
      "Disaster Recovery": leaf("", [])
    },
    "Security Requirements": {
      "Authentication": leaf("Comprehensive MFA including biometrics, OTPs, and hardware tokens, plus behavioral analytics for anomaly detection.", [9]),
      "Access Control": leaf("", []),
      "Data Encryption": leaf("Advanced encryption (in transit and at rest), device fingerprinting, geo-location restrictions, and session management safeguards.", [9]),
      "Audit Trails and Logging": leaf("", []),
      "Compliance": leaf("iii) Be Kenya Revenue Authority (KRA) compliant and up to date with income tax and VAT returns. Attach a copy of VAT, PIN certificates and valid Tax Compliance certificates.\nxi) Copy of relevant Licenses/Permits from the Local government.\nxii) Any other information considered necessary in support of the solution. Data anonymization for compliance with GDPR/CCPA. Comprehensive Compliance & Reporting: Detailed audit trails, regulatory reporting (KYC/AML), data retention policies, and real-time operational analytics for enhanced governance.", [4,9,12])
    },
    "Bidder / Vendor / Supplier Requirements": {
      "Company Profile and Registration": leaf("i) Name of the firm and company profile.\nii) Certificate of registration and CR 12 and profiles of the Directors.\niii) Be Kenya Revenue Authority (KRA) compliant and up to date with income tax and VAT returns. Attach a copy of VAT, PIN certificates and valid Tax Compliance certificates.\niv) Memorandum and articles of association for a registered Company.\nv) The firm must have successfully offered Chatbot interaction management solution to financial institutions staff of similar nature with Family Bank Limited.\nvi) Names, qualifications, experience, and detailed CVs for each trainer and the number of professional staff to be involved in the project.\nvii) Physical and postal address of the registered office.\nviii) Details of the consultants in charge of the solution.\nix) Details of the firm’s experience in Internet Banking and Mobile App interaction management solution, including a list of major assignments with financial institutions in Kenya over the last three (3) years.\nx) Copy of the valid annual license of the firm from the relevant professional bodies.\nxi) Copy of relevant Licenses/Permits from the Local government.\nxii) Any other information considered necessary in support of the solution.\nxiii) If selected, must have an account with Family Bank", [4]),
      "Experience and Track Record": leaf("", []),
      "Financial Stability": leaf("", []),
      "Key Personnel and Team Structure": leaf("", [])
    },
    "Proposal / Bid Submission Requirements": {
      "Technical Proposal": leaf("", []),
      "Financial / Cost Proposal": leaf("7.0 SUBMISSION OF REQUEST FOR PROPOSAL\n        i. Technical Proposal containing all the requirements enumerated above.\n        ii. The financial proposal should clearly indicate the proposed fees. Vendors should submit their proposals in two distinct parts, namely Technical proposal and Financial proposal on or before COB 19th March 2025. The technical proposal should be addressed to: Duncan N. Nduhiu, Family Bank Limited, Head of Procurement, Logistics and Facilities, FBL Tenders, Email: tenders@familybank.co.ke. The Financial proposal is to be submitted only to Duncan N. Ndegwa, Email: dnduhiu@familybank.co.ke. The bidder should submit the technical and financial proposal in two separate files, with the technical and financial proposals being password protected. The bidders will be requested to provide the passwords for the proposals on the technical and financial opening stages. Late submissions will be disqualified. All bid responses to this RFP should be expressed in Kenya Shillings or US Dollars only. Prevailing exchange rates shall apply at all times. Quoted prices should be inclusive of ALL taxes and any other incidental costs. Proposals without an explicit indication of all the applicable taxes will be assumed to be in gross figures.", [5,19]),
      "Submission Deadline and Method": leaf("Vendors should submit their proposals in two distinct parts, namely Technical proposal and Financial proposal on or before COB 19th March 2025. The technical proposal should be addressed to: Duncan N. Nduhiu, Family Bank Limited, Head of Procurement, Logistics and Facilities, FBL Tenders, Email: tenders@familybank.co.ke. The Financial proposal is to be submitted only to Duncan N. Ndegwa, Email: dnduhiu@familybank.co.ke. The bidder should submit the technical and financial proposal in two separate files, with the technical and financial proposals being password protected. The bidders will be requested to provide the passwords for the proposals on the technical and financial opening stages. Late submissions will be disqualified.", [19]),
      "Proposal Validity Period": leaf("", [])
    },
    "Costing / Financial Requirements": {
      "Pricing Breakdown": leaf("", []),
      "Payment Terms / Milestones": leaf("", [])
    },
    "Support, Maintenance, & Training": {
      "Post-Implementation Support & SLAs": leaf("", []),
      "System Maintenance and Updates": leaf("", []),
      "User and Technical Training": leaf("", [])
    },
    "Reporting and Analytics": {
      "Management Information Systems (MIS) Reports": leaf("", []),
      "Real-time Dashboards": leaf("API analytics, rate limiting, and orchestration middleware to ensure smooth communication across services, including blockchain networks if applicable.", [11]),
      "Custom Reporting Capabilities": leaf("", [])
    }
  };
};

// Generate mock Version 2 JSON (Refined summary)
const generateMockV2Json = (v1Json: RfpNode): RfpNode => {
  const transform = (node: RfpNode | RfpLeaf): RfpNode | RfpLeaf => {
    if ((node as any) && typeof node === 'object' && 'extracted_data' in (node as any) && 'pages' in (node as any)) {
      const leaf = node as RfpLeaf;
      return { extracted_data: leaf.extracted_data ? `${leaf.extracted_data} (Refined)` : '', pages: [...leaf.pages] };
    }
    const result: RfpNode = {};
    for (const [k, v] of Object.entries(node as RfpNode)) {
      result[k] = transform(v as any) as any;
    }
    return result;
  };
  return transform(v1Json) as RfpNode;
};

// Mock External API Service
export class MockExternalApiService {
  
  // Simulate Version 1 API call
  static async processDocumentV1(request: ExternalApiRequest): Promise<ExternalApiResponse> {
    console.log('Processing document for Version 1...', request.fileName);
    
    // Simulate API processing time
    await delay(2000 + Math.random() * 3000); // 2-5 seconds
    
    try {
      const jsonData = generateMockV1Json(request.fileName);

      
      
      return {
        success: true,
        requestId: `v1_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        jsonData,
        message: 'Document successfully processed for Version 1'
      };
    } catch (error) {
      return {
        success: false,
        requestId: `v1_error_${Date.now()}`,
        jsonData: null,
        error: 'Failed to process document for Version 1'
      };
    }
  }
  
  // Simulate Version 2 API call
  static async processDocumentV2(request: ExternalApiRequest & { v1Json: RfpNode }): Promise<ExternalApiResponse> {
    console.log('Processing document for Version 2...', request.fileName);
    
    // Simulate API processing time
    await delay(3000 + Math.random() * 4000); // 3-7 seconds
    
    try {
      const jsonData = generateMockV2Json(request.v1Json);
      
      return {
        success: true,
        requestId: `v2_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        jsonData,
        message: 'Document successfully processed for Version 2'
      };
    } catch (error) {
      return {
        success: false,
        requestId: `v2_error_${Date.now()}`,
        jsonData: null,
        error: 'Failed to process document for Version 2'
      };
    }
  }
  
  // Check processing status (for future use with real APIs)
  static async checkProcessingStatus(requestId: string): Promise<{
    status: 'processing' | 'completed' | 'failed';
    progress?: number;
    result?: any;
  }> {
    await delay(500);
    
    // Mock status check
    return {
      status: 'completed',
      progress: 100,
      result: null
    };
  }
}

// Utility function to validate JSON structure
export const validateRFPJson = (json: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!json.documentInfo) {
    errors.push('Missing documentInfo section');
  } else {
    if (!json.documentInfo.title) errors.push('Missing document title');
    if (!json.documentInfo.type) errors.push('Missing document type');
  }
  
  if (!json.requirements) {
    errors.push('Missing requirements section');
  } else {
    if (!Array.isArray(json.requirements.technical)) errors.push('Technical requirements must be an array');
    if (!Array.isArray(json.requirements.functional)) errors.push('Functional requirements must be an array');
    if (!Array.isArray(json.requirements.compliance)) errors.push('Compliance requirements must be an array');
  }
  
  if (!json.evaluation) {
    errors.push('Missing evaluation section');
  }
  
  if (!json.timeline) {
    errors.push('Missing timeline section');
  }
  
  if (!json.budget) {
    errors.push('Missing budget section');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
