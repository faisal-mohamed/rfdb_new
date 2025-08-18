import { ExternalApiRequest, ExternalApiResponse, MockRFPSummary, VersionType } from '@/types/workflow';

// Mock delay to simulate API call
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generate mock Version 1 JSON (Initial document summary)
const generateMockV1Json = (fileName: string): MockRFPSummary => {
  return {
    documentInfo: {
      title: `RFP Analysis - ${fileName.replace(/\.[^/.]+$/, "")}`,
      type: "Request for Proposal",
      submissionDeadline: "2024-12-31",
      contactPerson: "John Smith",
      organization: "Sample Corporation"
    },
    requirements: {
      technical: [
        "Cloud-based solution required",
        "API integration capabilities",
        "Mobile responsive design",
        "Data encryption and security"
      ],
      functional: [
        "User management system",
        "Document processing workflow",
        "Real-time notifications",
        "Reporting and analytics"
      ],
      compliance: [
        "GDPR compliance required",
        "SOC 2 Type II certification",
        "ISO 27001 standards",
        "Regular security audits"
      ]
    },
    evaluation: {
      criteria: [
        "Technical capability",
        "Cost effectiveness",
        "Implementation timeline",
        "Support and maintenance"
      ],
      weightage: {
        "Technical capability": 30,
        "Cost effectiveness": 25,
        "Implementation timeline": 25,
        "Support and maintenance": 20
      }
    },
    timeline: {
      phases: [
        {
          name: "Planning and Analysis",
          duration: "4 weeks",
          deliverables: ["Requirements document", "Technical specifications", "Project plan"]
        },
        {
          name: "Development",
          duration: "12 weeks",
          deliverables: ["Core system", "API integrations", "Testing documentation"]
        },
        {
          name: "Testing and Deployment",
          duration: "4 weeks",
          deliverables: ["System testing", "User training", "Go-live support"]
        }
      ]
    },
    budget: {
      estimatedRange: "$50,000 - $100,000",
      paymentTerms: "30% upfront, 40% at milestone, 30% on completion"
    }
  };
};

// Generate mock Version 2 JSON (Refined summary)
const generateMockV2Json = (v1Json: MockRFPSummary): MockRFPSummary => {
  return {
    ...v1Json,
    documentInfo: {
      ...v1Json.documentInfo,
      title: `${v1Json.documentInfo.title} - Refined Analysis`,
      type: "Comprehensive RFP Analysis"
    },
    requirements: {
      technical: [
        ...v1Json.requirements.technical,
        "Scalability for 10,000+ users",
        "99.9% uptime SLA requirement",
        "Multi-language support"
      ],
      functional: [
        ...v1Json.requirements.functional,
        "Advanced search capabilities",
        "Workflow automation",
        "Integration with existing systems"
      ],
      compliance: [
        ...v1Json.requirements.compliance,
        "Industry-specific regulations",
        "Data retention policies"
      ]
    },
    evaluation: {
      criteria: [
        ...v1Json.evaluation.criteria,
        "Vendor reputation",
        "Innovation and future roadmap"
      ],
      weightage: {
        "Technical capability": 25,
        "Cost effectiveness": 20,
        "Implementation timeline": 20,
        "Support and maintenance": 15,
        "Vendor reputation": 10,
        "Innovation and future roadmap": 10
      }
    },
    timeline: {
      phases: [
        {
          name: "Discovery and Planning",
          duration: "6 weeks",
          deliverables: [
            "Detailed requirements analysis",
            "Technical architecture document",
            "Risk assessment",
            "Detailed project plan"
          ]
        },
        {
          name: "Development and Integration",
          duration: "16 weeks",
          deliverables: [
            "Core platform development",
            "Third-party integrations",
            "Security implementation",
            "Performance optimization"
          ]
        },
        {
          name: "Testing and Deployment",
          duration: "6 weeks",
          deliverables: [
            "Comprehensive testing",
            "User acceptance testing",
            "Training materials",
            "Production deployment",
            "Post-launch support"
          ]
        }
      ]
    },
    budget: {
      estimatedRange: "$75,000 - $150,000",
      paymentTerms: "25% upfront, 35% at development milestone, 25% at testing completion, 15% post go-live"
    }
  };
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
  static async processDocumentV2(request: ExternalApiRequest & { v1Json: MockRFPSummary }): Promise<ExternalApiResponse> {
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
