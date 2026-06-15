import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { getSimplePermissions } from '@/lib/simplePermissions';
import { WorkflowStatus } from '@prisma/client';
import { promises as fs } from "fs";
import path from "path";

// Generate proposal template content based on proposal type
function generateProposalTemplate(proposalType: string, customerName: string, description?: string): string {
  // Check if proposal type matches predefined templates (for backward compatibility)
  const normalizedType = proposalType.toLowerCase().trim().replace(/\s+/g, '-');
  
  const templates: Record<string, string> = {
    "mobile-banking": `
      MOBILE BANKING SOLUTION PROPOSAL
      
      Prepared for: ${customerName}
      Date: ${new Date().toLocaleDateString()}
      
      EXECUTIVE SUMMARY
      
      This proposal outlines a comprehensive Mobile Banking Solution designed to meet the digital banking needs of ${customerName}. Our solution provides a secure, scalable, and user-friendly mobile banking platform that enables your customers to perform banking operations anytime, anywhere.
      
      SCOPE OF WORK
      
      The scope of the proposal includes:
      • Implementation of an end-to-end mobile banking solution with required software, middleware, and necessary web services/APIs
      • Composite solution of mobile banking services to Bank's customers with ability to work on all types of network/handsets and platforms
      • The proposed Mobile Banking solution will support facilities like on boarding of new and existing customers, fund transfer across Banks, Mobile recharge, Utility Bill Payments, Card/Account to Card/Account Payments
      • Integration with CBS, internet banking and other third party systems to provide smooth and efficient services
      • Support for all types of handsets/Tablets/Smart phones/operating systems/browsers
      • Compliance with banking regulations and security standards
      
      KEY FEATURES
      
      1. User Management
         - Customer registration and onboarding
         - Biometric authentication
         - Multi-factor authentication
         - Profile management
      
      2. Transaction Services
         - Account balance inquiry
         - Fund transfers (internal and external)
         - Bill payments
         - Mobile recharge
         - Transaction history
      
      3. Security Features
         - End-to-end encryption
         - Secure communication protocols (SSL/TLS)
         - Fraud detection and prevention
         - Session management
         - Role-based access control
      
      4. Integration Capabilities
         - Core Banking System (CBS) integration
         - Payment gateway integration
         - Third-party API integration
         - Real-time transaction processing
      
      TECHNICAL ARCHITECTURE
      
      • Multi-layered architecture (Application server, Operating System, Database)
      • Cloud-ready deployment
      • Scalable infrastructure
      • High availability and disaster recovery
      
      IMPLEMENTATION APPROACH
      
      Phase 1: Requirements Gathering and Planning
      Phase 2: System Design and Architecture
      Phase 3: Development and Customization
      Phase 4: Testing and Quality Assurance
      Phase 5: User Training and Documentation
      Phase 6: Deployment and Go-Live
      Phase 7: Post-Implementation Support
      
      TIMELINE
      
      Estimated implementation timeline: 4-6 months
      
      DELIVERABLES
      
      • Complete mobile banking application (iOS and Android)
      • Admin portal for bank operations
      • API documentation
      • User manuals and training materials
      • Source code and deployment packages
      
      ${description ? `\nADDITIONAL REQUIREMENTS\n\n${description}` : ''}
      
      CONCLUSION
      
      Our Mobile Banking Solution will empower ${customerName} to provide cutting-edge digital banking services to your customers, enhancing customer satisfaction and operational efficiency.
    `,
    
    "loan-management": `
      LOAN MANAGEMENT SYSTEM PROPOSAL
      
      Prepared for: ${customerName}
      Date: ${new Date().toLocaleDateString()}
      
      EXECUTIVE SUMMARY
      
      This proposal presents a comprehensive Loan Management System designed to streamline and automate the entire loan lifecycle for ${customerName}. Our solution provides end-to-end loan processing capabilities from origination to closure.
      
      SOLUTION OVERVIEW
      
      The proposed Loan Management System is a comprehensive platform that supports:
      • Loan origination and application processing
      • Credit scoring and risk assessment
      • Loan approval workflow
      • Disbursement management
      • Repayment tracking and collection
      • Portfolio management and reporting
      
      KEY MODULES
      
      1. Loan Origination System
         - Online loan application
         - Document management
         - Credit evaluation
         - Workflow automation
         - Approval matrix
      
      2. Credit Scoring Engine
         - Automated credit scoring
         - Risk assessment algorithms
         - Integration with credit bureaus
         - Customizable scoring models
      
      3. Loan Servicing
         - Amortization scheduling
         - Payment processing
         - Interest calculation
         - Account management
         - Delinquency tracking
      
      4. Collection Management
         - Automated reminders and notifications
         - Collection workflows
         - Payment plans
         - Recovery strategies
         - Legal case management
      
      5. Reporting and Analytics
         - Portfolio analytics
         - Performance dashboards
         - Regulatory reports
         - Risk reports
         - Custom report builder
      
      FEATURES AND CAPABILITIES
      
      • Multi-product support (personal loans, home loans, business loans, etc.)
      • Flexible product configuration
      • Automated workflows
      • Integration with CBS and external systems
      • Mobile accessibility
      • Real-time processing
      • Audit trail and compliance
      
      SECURITY FEATURES
      
      • Data encryption at rest and in transit
      • Role-based access control
      • Maker-checker framework
      • Comprehensive audit logs
      • Secure API integration
      • Compliance with data protection regulations
      
      INTEGRATION CAPABILITIES
      
      • Core Banking System (CBS)
      • Credit Reference Bureaus (CRB)
      • Payment gateways
      • Document management systems
      • SMS and email gateways
      • Third-party data providers
      
      ${description ? `\nSPECIFIC REQUIREMENTS\n\n${description}` : ''}
      
      IMPLEMENTATION TIMELINE
      
      Estimated Duration: 3-5 months
      
      BENEFITS
      
      • Reduced loan processing time
      • Improved credit decision accuracy
      • Enhanced portfolio quality
      • Operational efficiency
      • Better customer experience
      • Regulatory compliance
      
      CONCLUSION
      
      Our Loan Management System will enable ${customerName} to efficiently manage your loan portfolio while providing excellent service to your borrowers.
    `,
    
    "payment-gateway": `
      PAYMENT GATEWAY SOLUTION PROPOSAL
      
      Prepared for: ${customerName}
      Date: ${new Date().toLocaleDateString()}
      
      EXECUTIVE SUMMARY
      
      This proposal outlines a robust and secure Payment Gateway Solution for ${customerName}. Our solution enables seamless payment processing across multiple channels and payment methods.
      
      SOLUTION OVERVIEW
      
      A comprehensive payment gateway platform that provides:
      • Multi-channel payment processing
      • Multiple payment method support
      • Real-time transaction processing
      • Secure payment infrastructure
      • Comprehensive reporting and reconciliation
      
      SUPPORTED PAYMENT METHODS
      
      1. Card Payments
         - Credit cards (Visa, MasterCard, American Express)
         - Debit cards
         - Prepaid cards
         - International cards
      
      2. Digital Wallets
         - Mobile wallets
         - E-wallets
         - QR code payments
         - UPI payments
      
      3. Bank Transfers
         - Direct bank transfers
         - ACH payments
         - Wire transfers
         - Real-time payments
      
      4. Alternative Payment Methods
         - Buy now, pay later
         - Cryptocurrency (optional)
         - Digital currencies
      
      KEY FEATURES
      
      • Real-time payment processing
      • Multi-currency support
      • Fraud detection and prevention
      • 3D Secure authentication
      • Tokenization for card security
      • Recurring payment support
      • Split payments
      • Refund management
      
      SECURITY FEATURES
      
      • PCI DSS Level 1 compliance
      • End-to-end encryption
      • Tokenization
      • Fraud detection algorithms
      • 3D Secure 2.0
      • Risk management tools
      • Secure API communication
      
      INTEGRATION OPTIONS
      
      • RESTful APIs
      • SDKs (Web, Mobile, Server-side)
      • Payment page integration
      • Hosted payment pages
      • Webhook notifications
      • Plugins for popular platforms
      
      MERCHANT DASHBOARD
      
      • Real-time transaction monitoring
      • Payment analytics
      • Settlement reports
      • Customer management
      • Refund processing
      • Dispute management
      • Customizable alerts
      
      ${description ? `\nCUSTOM REQUIREMENTS\n\n${description}` : ''}
      
      IMPLEMENTATION
      
      • Quick integration with existing systems
      • Sandbox environment for testing
      • Comprehensive documentation
      • Technical support during integration
      • Go-live support
      
      BENEFITS
      
      • Increased payment acceptance rates
      • Enhanced security
      • Better customer experience
      • Multiple payment options
      • Real-time settlement
      • Comprehensive reporting
      
      CONCLUSION
      
      Our Payment Gateway Solution will provide ${customerName} with a reliable, secure, and feature-rich payment processing platform.
    `,
    
    "core-banking": `
      CORE BANKING SYSTEM PROPOSAL
      
      Prepared for: ${customerName}
      Date: ${new Date().toLocaleDateString()}
      
      EXECUTIVE SUMMARY
      
      This proposal presents a modern Core Banking System (CBS) solution for ${customerName}. Our solution provides a comprehensive banking platform that supports all essential banking operations.
      
      SOLUTION OVERVIEW
      
      A complete core banking platform that includes:
      • Account management
      • Transaction processing
      • Customer relationship management
      • Product management
      • Compliance and reporting
      • Multi-channel banking support
      
      KEY MODULES
      
      1. Customer Information System
         - Customer onboarding (KYC)
         - Customer profile management
         - Document management
         - Relationship management
         - Customer segmentation
      
      2. Account Management
         - Savings accounts
         - Current accounts
         - Fixed deposits
         - Recurring deposits
         - Joint accounts
         - Minor accounts
      
      3. Loan Management
         - Loan origination
         - Loan servicing
         - Collateral management
         - Collection management
         - Loan accounting
      
      4. Transaction Processing
         - Real-time transaction processing
         - Batch processing
         - Inter-branch transactions
         - ATM transactions
         - Mobile and internet banking transactions
      
      5. Payment and Collections
         - Internal fund transfers
         - External fund transfers (RTGS, NEFT, IMPS)
         - Bill payments
         - Standing instructions
         - Payment gateways
      
      6. General Ledger and Accounting
         - Multi-currency accounting
         - Branch accounting
         - Trial balance
         - Financial statements
         - Tax management
      
      7. Treasury Management
         - Foreign exchange
         - Money market operations
         - Investment management
         - Risk management
      
      8. Compliance and Regulatory Reporting
         - Regulatory reports (Central Bank)
         - AML/CFT compliance
         - FATCA/CRS reporting
         - Audit trails
      
      TECHNICAL ARCHITECTURE
      
      • Multi-tier architecture
      • Cloud-native design
      • Microservices architecture
      • API-first approach
      • Scalable infrastructure
      • High availability (99.99% uptime)
      
      INTEGRATION CAPABILITIES
      
      • Payment switches
      • Card management systems
      • Mobile banking
      • Internet banking
      • ATM networks
      • Credit bureaus
      • Government systems
      
      SECURITY FEATURES
      
      • Multi-factor authentication
      • Role-based access control
      • Data encryption
      • Audit trails
      • Maker-checker workflows
      • Fraud detection
      
      ${description ? `\nADDITIONAL SPECIFICATIONS\n\n${description}` : ''}
      
      IMPLEMENTATION APPROACH
      
      Phase 1: Assessment and Planning (1 month)
      Phase 2: System Configuration (2 months)
      Phase 3: Data Migration (1 month)
      Phase 4: Testing and UAT (2 months)
      Phase 5: Training (1 month)
      Phase 6: Go-Live and Stabilization (1 month)
      
      DELIVERABLES
      
      • Complete CBS software
      • Database and servers setup
      • Integration with existing systems
      • Data migration
      • Training programs
      • Documentation
      • Post-go-live support
      
      BENEFITS
      
      • Real-time banking operations
      • Enhanced customer experience
      • Operational efficiency
      • Regulatory compliance
      • Business scalability
      • Cost reduction
      
      CONCLUSION
      
      Our Core Banking System will modernize ${customerName}'s banking operations and provide a solid foundation for digital transformation.
    `,
    
    "custom": `
      CUSTOM BANKING SOLUTION PROPOSAL
      
      Prepared for: ${customerName}
      Date: ${new Date().toLocaleDateString()}
      
      EXECUTIVE SUMMARY
      
      This proposal outlines a customized banking solution tailored to the specific needs of ${customerName}.
      
      ${description ? `\nREQUIREMENTS\n\n${description}` : 'Please provide detailed requirements for this custom proposal.'}
      
      SOLUTION OVERVIEW
      
      We will develop a custom solution that addresses your specific business requirements and integrates seamlessly with your existing systems.
      
      OUR APPROACH
      
      1. Requirements Analysis
         - Detailed requirement gathering
         - Gap analysis
         - Solution design
      
      2. Solution Development
         - Custom feature development
         - Integration development
         - Security implementation
      
      3. Testing and Quality Assurance
         - Functional testing
         - Performance testing
         - Security testing
         - User acceptance testing
      
      4. Deployment and Support
         - Production deployment
         - User training
         - Documentation
         - Ongoing support
      
      KEY FEATURES
      
      • Tailored to your specific requirements
      • Integration with existing systems
      • Scalable architecture
      • Security best practices
      • Compliance with regulations
      
      BENEFITS
      
      • Customized to your business needs
      • Competitive advantage
      • Improved efficiency
      • Better ROI
      
      NEXT STEPS
      
      We recommend scheduling a detailed discussion to understand your requirements in depth and provide a comprehensive proposal.
      
      CONCLUSION
      
      We look forward to partnering with ${customerName} to deliver a solution that exceeds your expectations.
    `
  };

  // Check if normalized type matches a template
  if (templates[normalizedType]) {
    return templates[normalizedType];
  }
  
  // If no template matches, generate a generic proposal
  return `
    ${proposalType.toUpperCase()} PROPOSAL
    
    Prepared for: ${customerName}
    Date: ${new Date().toLocaleDateString()}
    
    EXECUTIVE SUMMARY
    
    This proposal outlines a comprehensive ${proposalType} solution designed to meet the specific needs of ${customerName}. Our solution provides a secure, scalable, and efficient platform tailored to your requirements.
    
    SOLUTION OVERVIEW
    
    The proposed ${proposalType} solution includes:
    • Customized implementation based on your business requirements
    • Scalable architecture to support growth
    • Integration with existing systems
    • Comprehensive security measures
    • Ongoing support and maintenance
    
    KEY FEATURES
    
    • Tailored to your specific business needs
    • Modern technology stack
    • User-friendly interface
    • Robust security implementation
    • Compliance with industry standards
    • Comprehensive documentation
    
    TECHNICAL APPROACH
    
    • Requirements analysis and planning
    • System design and architecture
    • Development and customization
    • Testing and quality assurance
    • Deployment and go-live support
    • Post-implementation maintenance
    
    ${description ? `\nSPECIFIC REQUIREMENTS\n\n${description}` : ''}
    
    IMPLEMENTATION TIMELINE
    
    Estimated Duration: 3-6 months (subject to requirements)
    
    DELIVERABLES
    
    • Complete solution implementation
    • System documentation
    • User training and support
    • Technical documentation
    • Ongoing maintenance and support
    
    BENEFITS
    
    • Customized solution for your needs
    • Improved operational efficiency
    • Enhanced user experience
    • Scalable for future growth
    • Competitive advantage
    
    CONCLUSION
    
    We look forward to partnering with ${customerName} to deliver a ${proposalType} solution that exceeds your expectations and drives business success.
  `;
}

// Convert text content to base64 PDF-like format
function generateProposalPDF(content: string): string {
  // In a real implementation, you would use a PDF library to create an actual PDF
  // For now, we'll create a simple text-based representation
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
>>
endobj

4 0 obj
<<
/Length ${content.length}
>>
stream
${content}
endstream
endobj

xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000274 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
${content.length + 400}
%%EOF`;

  return Buffer.from(pdfContent).toString('base64');
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permissions = getSimplePermissions(session.user.role);
    if (!permissions.canEdit) {
      return NextResponse.json(
        { error: 'You do not have permission to generate proposals' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      customerName,
      proposalType,
      description,
      tags,
      contactName,
      designation,
      emailAddress,
      mobileNumber,
      validUntil,
      selectedVendorFields
    } = body;

    if (!customerName) {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    }

    // Validate proposal type
    if (!proposalType || !proposalType.trim()) {
      return NextResponse.json({ error: 'Proposal type is required' }, { status: 400 });
    }

    // Validate required contact fields
    if (!contactName || !contactName.trim()) {
      return NextResponse.json({ error: 'Contact name is required' }, { status: 400 });
    }

    if (!designation || !designation.trim()) {
      return NextResponse.json({ error: 'Designation is required' }, { status: 400 });
    }

    if (!emailAddress || !emailAddress.trim()) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    if (!mobileNumber || !mobileNumber.trim()) {
      return NextResponse.json({ error: 'Mobile number is required' }, { status: 400 });
    }

    if (!validUntil || !validUntil.trim()) {
      return NextResponse.json({ error: 'Valid until date is required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailAddress.trim())) {
      return NextResponse.json({ error: 'Invalid email address format' }, { status: 400 });
    }

    // Build payload for external API
    // Quick Proposal sends ONLY metadata - backend will generate the PDF
    const uploadPayload = {
      // Quick Proposal metadata only
      customer_name: customerName.trim(),
      proposal_type: proposalType.trim(),
      description: description?.trim() || "",
      tags: tags ? tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      is_quick_proposal: true,
    };

    // Save payload to file for debugging
    const logsDir = path.join(process.cwd(), "upload_payloads"); 
    await fs.mkdir(logsDir, { recursive: true });
    
    const payloadFile = path.join(
      logsDir,
      `quick-proposal-${Date.now()}-${customerName.replace(/\s+/g, "_")}.json`
    );

    await fs.writeFile(payloadFile, JSON.stringify(uploadPayload, null, 2), "utf-8");
    console.log("Quick proposal payload written to file:", payloadFile);

    // Call external API
    const response = await fetch(
      `${process.env.AI_URL}/document_extraction/manual_upload_rfp`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(uploadPayload),
      }
    );

    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }

    const uploadResult = await response.json();

    // Parse validUntil date (required)
    const parsedValidUntil = new Date(validUntil);
    if (isNaN(parsedValidUntil.getTime())) {
      return NextResponse.json({ error: 'Invalid valid until date format' }, { status: 400 });
    }

    // Create filename for database record
    // Use proposalType directly (it's now a free-form text field)
    const proposalTypeLabel = proposalType.trim().replace(/[^a-zA-Z0-9\s]/g, '_').replace(/\s+/g, '_');
    const fileName = `${customerName}_${proposalTypeLabel}_Proposal_${Date.now()}.pdf`;

    // Save document to DB
    // Note: fileContent will be empty/null since backend generates the PDF
    const document = await prisma.document.create({
      data: {
        id: uploadResult.process_id || uploadResult.id,
        fileName,
        fileType: "pdf",
        mimeType: "application/pdf",
        fileSize: 0, // Will be updated when PDF is generated
        fileContent: "", // Backend generates the PDF, not stored here initially
        customerName,
        uploadedDate: new Date(),
        uploadedBy: session.user.id,
        workflowStatus: WorkflowStatus.UPLOADED,
        description: `Quick Proposal: ${proposalType.trim()}${description ? ` - ${description}` : ''}`,
        tags: tags ? tags.split(',').map((t: string) => t.trim()).filter(Boolean) : ['quick-proposal', proposalType],
        contactName: contactName.trim(),
        designation: designation.trim(),
        emailAddress: emailAddress.trim(),
        mobileNumber: mobileNumber.trim(),
        validUntil: parsedValidUntil,
        selectedVendorFields: selectedVendorFields && Array.isArray(selectedVendorFields) ? selectedVendorFields : [],
      } as any, // Type assertion until Prisma Client regenerates
    });

    // Kick off V1 generation
    try {
      const v1Response = await fetch(
        `${request.nextUrl.origin}/api/documents/${document.id}/generate-v1`,
        { method: "POST", headers: { "Content-Type": "application/json" } }
      );

      if (!v1Response.ok) {
        console.error("Failed to auto-generate V1 for quick proposal");
      }
    } catch (v1Error) {
      console.error("Error auto-generating V1 for quick proposal:", v1Error);
    }

    return NextResponse.json({
      message: "Quick proposal generated successfully",
      document: {
        id: document.id,
        fileName: document.fileName,
        customerName: document.customerName,
        workflowStatus: document.workflowStatus,
        proposalType,
      },
    });
  } catch (error) {
    console.error("Error generating quick proposal:", error);
    return NextResponse.json({ error: "Proposal generation failed" }, { status: 500 });
  }
}



