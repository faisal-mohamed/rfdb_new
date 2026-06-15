import {
  Paragraph,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  WidthType,
  BorderStyle,
  ShadingType,
  TextRun,
  ImageRun,
  convertInchesToTwip,
} from 'docx';
import { VendorQualification } from '@/types/vendor';

// Styling constants matching generateWordDocumentTemplate3.ts
const STYLES = {
  fonts: {
    body: 'Lato',              // Lato font for body text (matching main doc)
    headers: 'Open Sans',       // Open Sans font for headings (matching main doc)
  },
  sizes: {
    body: 22,      // 11pt
    h1: 32,        // 16pt (main heading like ANNEXURE)
    h2: 28,        // 14pt (section headings)
    h3: 26,        // 13pt
    table: 24,     // 12pt
  },
  colors: {
    black: '000000',
    blue: '4472C4',            // Blue color for main headings (matching main doc)
    headerBg: 'E8E8E8',
    rowEven: 'F5F5F5',
    rowOdd: 'FFFFFF',
    border: '000000',          // Black borders (matching main doc)
  },
  spacing: {
    h1Before: 0,
    h1After: 200,   // 10pt
    h2Before: 240,  // 12pt
    h2After: 160,   // 8pt
    paragraphAfter: 200, // 10pt
    bodyLineHeight: 253, // 1.15 line height (253 twips)
  },
};

export async function formatVendorFields(
  vendorData: VendorQualification,
  selectedFields: string[]
): Promise<(Paragraph | Table)[]> {
  const elements: (Paragraph | Table)[] = [];

  if (!selectedFields || selectedFields.length === 0) {
    return elements;
  }

  // Add main "ANNEXURE" heading at the start of vendor section
  elements.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: {
        before: STYLES.spacing.h1Before,
        after: STYLES.spacing.h1After,
        line: Math.round(STYLES.sizes.h1 * 1.15 * 10),
      },
      children: [
        new TextRun({
          text: 'ANNEXURE',
          font: STYLES.fonts.headers, // Open Sans
          size: STYLES.sizes.h1,      // 16pt (32 half-points)
          bold: true,
          color: STYLES.colors.blue,  // Blue color like main H1 headings
        }),
      ],
    })
  );

  // Helper to format field value
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'Not provided';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    if (value instanceof Date) return value.toLocaleDateString();
    return String(value);
  };

  // Helper to create a 2-column row (label on left, colon in center, value on right) using invisible table
  const createTwoColumnRow = (label: string, value: string): Table => {
    return new Table({
      rows: [
        new TableRow({
          children: [
            // Left column - Label (38% width)
            new TableCell({
              width: { size: 38, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              },
              children: [
                new Paragraph({
                  spacing: { after: 80, line: STYLES.spacing.bodyLineHeight },
      children: [
        new TextRun({
                      text: label,
          font: STYLES.fonts.body,
          size: STYLES.sizes.body,
          bold: true,
          color: STYLES.colors.black,
        }),
                  ],
                }),
              ],
            }),
            // Center column - Colon (4% width)
            new TableCell({
              width: { size: 4, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              },
              children: [
                new Paragraph({
                  spacing: { after: 80, line: STYLES.spacing.bodyLineHeight },
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: ':',
                      font: STYLES.fonts.body,
                      size: STYLES.sizes.body,
                      bold: true,
                      color: STYLES.colors.black,
                    }),
                  ],
                }),
              ],
            }),
            // Right column - Value (58% width)
            new TableCell({
              width: { size: 58, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              },
              children: [
                new Paragraph({
                  spacing: { after: 80, line: STYLES.spacing.bodyLineHeight },
                  children: [
        new TextRun({
          text: value,
          font: STYLES.fonts.body,
          size: STYLES.sizes.body,
          color: STYLES.colors.black,
        }),
      ],
                }),
              ],
            }),
          ],
        }),
      ],
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      },
    });
  };

  // Group fields by section
  const fieldsBySection: Record<string, { path: string; label: string; value: any }[]> = {
    'General Information': [],
    'Banking Details': [],
    'Directors': [],
    'Contact Person': [],
    'References': [],
    'Employee Strength': [],
    'Personnel': [],
  };

  // Process selected fields and group by section
  selectedFields.forEach((path) => {
    // Check if this is a document field
    if (path.startsWith('documents:')) {
      // Handle document fields separately - skip for now, will process later
      return;
    }

    let label = path;
    let section = 'General Information';
    let value: any;

    // Map field paths to labels and sections
    const fieldMap: Record<string, { label: string; section: string }> = {
      organizationName: { label: 'Name of the Organization', section: 'General Information' },
      incorporationDate: { label: 'Date of Incorporation', section: 'General Information' },
      postalAddress: { label: 'Postal Address', section: 'General Information' },
      telephone: { label: 'Telephone Number', section: 'General Information' },
      email: { label: 'E-mail Address', section: 'General Information' },
      registeredOfficeLocation: { label: 'Location of Registered Office', section: 'General Information' },
      bankersInfo: { label: 'Name and Address of Bankers', section: 'General Information' },
      insurersInfo: { label: 'Name and Address of Insurers', section: 'General Information' },
      businessDescription: { label: 'Brief Description of Business', section: 'General Information' },
      companyAuditors: { label: 'Company Auditors', section: 'General Information' },
      mainBusinessActivity: { label: 'Main Business Activity', section: 'General Information' },
      bankName: { label: 'Bank Name', section: 'Banking Details' },
      accountNumber: { label: 'Account Number', section: 'Banking Details' },
      branch: { label: 'Branch', section: 'Banking Details' },
      authorizedSignatories: { label: 'Authorized Signatories', section: 'Banking Details' },
      directors: { label: 'Directors', section: 'Directors' },
      contactPersonName: { label: 'Contact Person Name', section: 'Contact Person' },
      contactPersonEmail: { label: 'Contact Person Email', section: 'Contact Person' },
      contactPersonPhone: { label: 'Contact Person Phone', section: 'Contact Person' },
      references: { label: 'Bank References', section: 'References' },
      totalEmployees: { label: 'Total Number of Employees', section: 'Employee Strength' },
      managementTeam: { label: 'Management Team', section: 'Employee Strength' },
      technicalTeam: { label: 'Technical Team', section: 'Employee Strength' },
      nonTechnicalTeam: { label: 'Non-Technical Team', section: 'Employee Strength' },
      personnel: { label: 'Key Personnel', section: 'Personnel' },
    };

    const fieldInfo = fieldMap[path];
    if (fieldInfo) {
      label = fieldInfo.label;
      section = fieldInfo.section;
      value = (vendorData as any)[path];
    }

    if (value !== undefined) {
      fieldsBySection[section].push({ path, label, value });
    }
  });

  // Process document fields
  const documentFields: { path: string; label: string; documentType: string; section: string }[] = [];
  const documentTypeLabels: Record<string, string> = {
    'business_continuity': 'Business Continuity Plan',
    'audited_accounts': '3 Years Audited Books of Accounts',
    'memorandum_articles': 'Memorandum and Articles of Association',
    'cr12_form': 'CR12 Form',
    'bank_confirmation': 'Letter of Confirmation from Bank',
    'incorporation_cert': 'Certificate of Incorporation',
    'pacra_documents': 'PACRA Documents detailing Shareholders',
    'tax_certificate': 'Valid Tax Certificate',
    'utility_bill': 'Utility Bill',
    'reference_letter_1': 'Reference Letter - 1',
    'reference_letter_2': 'Reference Letter - 2',
    'reference_letter_3': 'Reference Letter - 3',
    'vat_certificate': 'VAT Registration Certificate',
    'gst_certificate': 'Goods & Services Tax Certificate',
    'trading_license': 'Valid Trading License (2024)',
    'tax_clearance': 'Tax Clearance Certificate',
    'manufacturer_auth': 'Manufacturer Authorization or Equivalent',
    'declaration_insolvency': 'Self Declaration - Company is Not Insolvent',
    'declaration_suspension': 'Self Declaration - No Business Suspension/Conflict of Interest',
    'balance_sheet_2022': 'Balance Sheet for FY 2021-22',
    'profit_loss_2024': 'Profit & Loss Statement for FY 2023-24',
    'organogram': 'Organogram and Employee Strength Chart',
    'organizational_structure': 'Organizational Structure Diagram',
    'financial_statement_2022': 'Financial Statements FY 2021-22',
    'financial_statement_2023': 'Financial Statements FY 2022-23',
    'financial_statement_2024': 'Financial Statements FY 2023-24',
    'personnel_cv': 'Personnel CV(s)',
  };
  
  const documentSectionMap: Record<string, string> = {
    'business_continuity': 'General Documents',
    'audited_accounts': 'General Documents',
    'memorandum_articles': 'General Documents',
    'cr12_form': 'General Documents',
    'bank_confirmation': 'Vendor Documents',
    'incorporation_cert': 'Vendor Documents',
    'pacra_documents': 'Vendor Documents',
    'tax_certificate': 'Vendor Documents',
    'utility_bill': 'Vendor Documents',
    'reference_letter_1': 'Reference Letters',
    'reference_letter_2': 'Reference Letters',
    'reference_letter_3': 'Reference Letters',
    'vat_certificate': 'Compliance Certificates',
    'gst_certificate': 'Compliance Certificates',
    'trading_license': 'Compliance Certificates',
    'tax_clearance': 'Compliance Certificates',
    'manufacturer_auth': 'Compliance Certificates',
    'declaration_insolvency': 'Self Declarations',
    'declaration_suspension': 'Self Declarations',
    'balance_sheet_2022': 'Financial Documents',
    'profit_loss_2024': 'Financial Documents',
    'organogram': 'Organizational Documents',
    'organizational_structure': 'Organizational Documents',
    'financial_statement_2022': 'Financial Documents',
    'financial_statement_2023': 'Financial Documents',
    'financial_statement_2024': 'Financial Documents',
    'personnel_cv': 'Organizational Documents',
  };

  selectedFields.forEach((path) => {
    if (path.startsWith('documents:')) {
      const documentType = path.replace('documents:', '');
      const label = documentTypeLabels[documentType] || documentType;
      const section = documentSectionMap[documentType] || 'Documents';
      documentFields.push({ path, label, documentType, section });
    }
  });

  // Generate elements for regular fields
  Object.entries(fieldsBySection).forEach(([section, fields]) => {
    if (fields.length === 0) return;

    // Add section heading
    elements.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: {
          before: STYLES.spacing.h2Before,
          after: STYLES.spacing.h2After,
          line: Math.round(STYLES.sizes.h2 * 1.15 * 10),
        },
        children: [
          new TextRun({
            text: section.toUpperCase(),
            font: STYLES.fonts.headers,
            size: STYLES.sizes.h2,
            bold: true,
            color: STYLES.colors.black,
          }),
        ],
      })
    );

    // Handle special cases for arrays (directors, references, personnel)
    if (section === 'Directors' && fields[0].path === 'directors' && vendorData.directors) {
      const directorsTable = createDirectorsTable(vendorData.directors);
      if (directorsTable) elements.push(directorsTable);
    } else if (section === 'References' && fields[0].path === 'references' && vendorData.references) {
      const referencesTable = createReferencesTable(vendorData.references);
      if (referencesTable) elements.push(referencesTable);
    } else if (section === 'Personnel' && fields[0].path === 'personnel' && vendorData.personnel) {
      const personnelTable = createPersonnelTable(vendorData.personnel);
      if (personnelTable) elements.push(personnelTable);
    } else {
      // Regular fields - display in 2-column layout
      fields.forEach(({ label, value }) => {
        elements.push(createTwoColumnRow(label, formatValue(value)));
      });
    }

    // Add spacing after section
    elements.push(
      new Paragraph({
        spacing: {
          after: STYLES.spacing.paragraphAfter,
        },
        children: [],
      })
    );
  });

  // Generate elements for document fields (grouped by section)
  if (documentFields.length > 0 && vendorData.documents) {
    const documentsBySection: Record<string, typeof documentFields> = {};
    
    documentFields.forEach(docField => {
      const section = docField.section;
      if (!documentsBySection[section]) {
        documentsBySection[section] = [];
      }
      documentsBySection[section].push(docField);
    });

    for (const [section, docFields] of Object.entries(documentsBySection)) {
      // Add section heading
      elements.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: {
            before: STYLES.spacing.h2Before,
            after: STYLES.spacing.h2After,
            line: Math.round(STYLES.sizes.h2 * 1.15 * 10),
          },
          children: [
            new TextRun({
              text: section.toUpperCase(),
              font: STYLES.fonts.headers,
              size: STYLES.sizes.h2,
              bold: true,
              color: STYLES.colors.black,
            }),
          ],
        })
      );

      // Embed actual document files as images (NO TABLE - just the PDF pages)
      console.log(`\n📎 Calling embedVendorDocuments for section: ${section}`);
      console.log(`  Document types in this section: ${docFields.map(f => f.documentType).join(', ')}`);
      console.log(`  Total vendor documents available: ${vendorData.documents?.length || 0}`);
      
      const documentElements = await embedVendorDocuments(
        vendorData.documents!,
        docFields.map(f => f.documentType)
      );
      
      console.log(`  Received ${documentElements.length} elements from embedVendorDocuments`);
      
      if (documentElements.length > 0) {
        elements.push(...documentElements);
        console.log(`  ✅ Added ${documentElements.length} document elements to Word doc`);
      } else {
        console.log(`  ⚠️ No document elements returned (documents may be missing fileContent)`);
      }

      // Add spacing after section
      elements.push(
        new Paragraph({
          spacing: {
            after: STYLES.spacing.paragraphAfter,
          },
          children: [],
        })
      );
    }
  }

  return elements;
}

function createDirectorsTable(directors: any[]): Table | null {
  if (!directors || directors.length === 0) return null;

  // Table styling constants
  const headerBgColor = STYLES.colors.blue; // Blue header
  const headerTextColor = 'FFFFFF'; // White text for header
  const borderColor = 'CCCCCC'; // Light gray borders
  const cellPadding = 120; // Cell padding in twips

  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        children: [
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 60, after: 60 },
            children: [
              new TextRun({
                text: 'Name',
                font: STYLES.fonts.headers,
                size: STYLES.sizes.body,
                bold: true,
                color: headerTextColor,
              }),
            ],
          }),
        ],
        shading: { fill: headerBgColor, type: ShadingType.SOLID, color: headerBgColor },
        margins: { top: cellPadding, bottom: cellPadding, left: cellPadding, right: cellPadding },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 8, color: headerBgColor },
          bottom: { style: BorderStyle.SINGLE, size: 8, color: headerBgColor },
          left: { style: BorderStyle.SINGLE, size: 8, color: headerBgColor },
          right: { style: BorderStyle.SINGLE, size: 4, color: 'FFFFFF' },
        },
        width: { size: 35, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 60, after: 60 },
            children: [
              new TextRun({
                text: 'Position',
                font: STYLES.fonts.headers,
                size: STYLES.sizes.body,
                bold: true,
                color: headerTextColor,
              }),
            ],
          }),
        ],
        shading: { fill: headerBgColor, type: ShadingType.SOLID, color: headerBgColor },
        margins: { top: cellPadding, bottom: cellPadding, left: cellPadding, right: cellPadding },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 8, color: headerBgColor },
          bottom: { style: BorderStyle.SINGLE, size: 8, color: headerBgColor },
          left: { style: BorderStyle.SINGLE, size: 4, color: 'FFFFFF' },
          right: { style: BorderStyle.SINGLE, size: 4, color: 'FFFFFF' },
        },
        width: { size: 30, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 60, after: 60 },
            children: [
              new TextRun({
                text: 'Contact',
                font: STYLES.fonts.headers,
                size: STYLES.sizes.body,
                bold: true,
                color: headerTextColor,
              }),
            ],
          }),
        ],
        shading: { fill: headerBgColor, type: ShadingType.SOLID, color: headerBgColor },
        margins: { top: cellPadding, bottom: cellPadding, left: cellPadding, right: cellPadding },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 8, color: headerBgColor },
          bottom: { style: BorderStyle.SINGLE, size: 8, color: headerBgColor },
          left: { style: BorderStyle.SINGLE, size: 4, color: 'FFFFFF' },
          right: { style: BorderStyle.SINGLE, size: 8, color: headerBgColor },
        },
        width: { size: 35, type: WidthType.PERCENTAGE },
      }),
    ],
  });

  const dataRows = directors.map((director, index) => {
    const fillColor = index % 2 === 0 ? 'FFFFFF' : 'F8F9FA'; // White and very light gray
    return new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              spacing: { before: 40, after: 40 },
              children: [
                new TextRun({
                  text: director.name || 'Not provided',
                  font: STYLES.fonts.body,
                  size: STYLES.sizes.body,
                  color: STYLES.colors.black,
                }),
              ],
            }),
          ],
          shading: { fill: fillColor, type: ShadingType.CLEAR },
          margins: { top: cellPadding, bottom: cellPadding, left: cellPadding, right: cellPadding },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
            left: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
            right: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
          },
        }),
        new TableCell({
          children: [
            new Paragraph({
              spacing: { before: 40, after: 40 },
              children: [
                new TextRun({
                  text: director.position || 'Not provided',
                  font: STYLES.fonts.body,
                  size: STYLES.sizes.body,
                  color: STYLES.colors.black,
                }),
              ],
            }),
          ],
          shading: { fill: fillColor, type: ShadingType.CLEAR },
          margins: { top: cellPadding, bottom: cellPadding, left: cellPadding, right: cellPadding },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
            left: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
            right: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
          },
        }),
        new TableCell({
          children: [
            new Paragraph({
              spacing: { before: 40, after: 40 },
              children: [
                new TextRun({
                  text: director.contact || 'Not provided',
                  font: STYLES.fonts.body,
                  size: STYLES.sizes.body,
                  color: STYLES.colors.black,
                }),
              ],
            }),
          ],
          shading: { fill: fillColor, type: ShadingType.CLEAR },
          margins: { top: cellPadding, bottom: cellPadding, left: cellPadding, right: cellPadding },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
            left: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
            right: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
          },
        }),
      ],
    });
  });

  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    },
  });
}

function createReferencesTable(references: any[]): Table | null {
  if (!references || references.length === 0) return null;

  // Table styling constants
  const headerBgColor = STYLES.colors.blue; // Blue header
  const headerTextColor = 'FFFFFF'; // White text for header
  const borderColor = 'CCCCCC'; // Light gray borders
  const cellPadding = 120; // Cell padding in twips

  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 60, after: 60 },
            children: [
              new TextRun({
                text: 'S.No',
                font: STYLES.fonts.headers,
                size: STYLES.sizes.body,
                bold: true,
                color: headerTextColor,
              }),
            ],
          }),
        ],
        shading: { fill: headerBgColor, type: ShadingType.SOLID, color: headerBgColor },
        margins: { top: cellPadding, bottom: cellPadding, left: cellPadding, right: cellPadding },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 8, color: headerBgColor },
          bottom: { style: BorderStyle.SINGLE, size: 8, color: headerBgColor },
          left: { style: BorderStyle.SINGLE, size: 8, color: headerBgColor },
          right: { style: BorderStyle.SINGLE, size: 4, color: 'FFFFFF' },
        },
        width: { size: 10, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 60, after: 60 },
            children: [
              new TextRun({
                text: 'Bank Name',
                font: STYLES.fonts.headers,
                size: STYLES.sizes.body,
                bold: true,
                color: headerTextColor,
              }),
            ],
          }),
        ],
        shading: { fill: headerBgColor, type: ShadingType.SOLID, color: headerBgColor },
        margins: { top: cellPadding, bottom: cellPadding, left: cellPadding, right: cellPadding },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 8, color: headerBgColor },
          bottom: { style: BorderStyle.SINGLE, size: 8, color: headerBgColor },
          left: { style: BorderStyle.SINGLE, size: 4, color: 'FFFFFF' },
          right: { style: BorderStyle.SINGLE, size: 4, color: 'FFFFFF' },
        },
        width: { size: 25, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 60, after: 60 },
            children: [
              new TextRun({
                text: 'Contact Person',
                font: STYLES.fonts.headers,
                size: STYLES.sizes.body,
                bold: true,
                color: headerTextColor,
              }),
            ],
          }),
        ],
        shading: { fill: headerBgColor, type: ShadingType.SOLID, color: headerBgColor },
        margins: { top: cellPadding, bottom: cellPadding, left: cellPadding, right: cellPadding },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 8, color: headerBgColor },
          bottom: { style: BorderStyle.SINGLE, size: 8, color: headerBgColor },
          left: { style: BorderStyle.SINGLE, size: 4, color: 'FFFFFF' },
          right: { style: BorderStyle.SINGLE, size: 4, color: 'FFFFFF' },
        },
        width: { size: 25, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 60, after: 60 },
            children: [
              new TextRun({
                text: 'Contact Details',
                font: STYLES.fonts.headers,
                size: STYLES.sizes.body,
                bold: true,
                color: headerTextColor,
              }),
            ],
          }),
        ],
        shading: { fill: headerBgColor, type: ShadingType.SOLID, color: headerBgColor },
        margins: { top: cellPadding, bottom: cellPadding, left: cellPadding, right: cellPadding },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 8, color: headerBgColor },
          bottom: { style: BorderStyle.SINGLE, size: 8, color: headerBgColor },
          left: { style: BorderStyle.SINGLE, size: 4, color: 'FFFFFF' },
          right: { style: BorderStyle.SINGLE, size: 8, color: headerBgColor },
        },
        width: { size: 40, type: WidthType.PERCENTAGE },
      }),
    ],
  });

  const dataRows = references.map((ref, index) => {
    const fillColor = index % 2 === 0 ? 'FFFFFF' : 'F8F9FA'; // White and very light gray
    return new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 40, after: 40 },
              children: [
                new TextRun({
                  text: String(ref.serialNumber || index + 1),
                  font: STYLES.fonts.body,
                  size: STYLES.sizes.body,
                  color: STYLES.colors.black,
                }),
              ],
            }),
          ],
          shading: { fill: fillColor, type: ShadingType.CLEAR },
          margins: { top: cellPadding, bottom: cellPadding, left: cellPadding, right: cellPadding },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
            left: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
            right: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
          },
        }),
        new TableCell({
          children: [
            new Paragraph({
              spacing: { before: 40, after: 40 },
              children: [
                new TextRun({
                  text: ref.bankName || 'Not provided',
                  font: STYLES.fonts.body,
                  size: STYLES.sizes.body,
                  color: STYLES.colors.black,
                }),
              ],
            }),
          ],
          shading: { fill: fillColor, type: ShadingType.CLEAR },
          margins: { top: cellPadding, bottom: cellPadding, left: cellPadding, right: cellPadding },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
            left: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
            right: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
          },
        }),
        new TableCell({
          children: [
            new Paragraph({
              spacing: { before: 40, after: 40 },
              children: [
                new TextRun({
                  text: ref.contactPerson || 'Not provided',
                  font: STYLES.fonts.body,
                  size: STYLES.sizes.body,
                  color: STYLES.colors.black,
                }),
              ],
            }),
          ],
          shading: { fill: fillColor, type: ShadingType.CLEAR },
          margins: { top: cellPadding, bottom: cellPadding, left: cellPadding, right: cellPadding },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
            left: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
            right: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
          },
        }),
        new TableCell({
          children: [
            new Paragraph({
              spacing: { before: 40, after: 40 },
              children: [
                new TextRun({
                  text: ref.contactDetails || 'Not provided',
                  font: STYLES.fonts.body,
                  size: STYLES.sizes.body,
                  color: STYLES.colors.black,
                }),
              ],
            }),
          ],
          shading: { fill: fillColor, type: ShadingType.CLEAR },
          margins: { top: cellPadding, bottom: cellPadding, left: cellPadding, right: cellPadding },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
            left: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
            right: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
          },
        }),
      ],
    });
  });

  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    },
  });
}

function createPersonnelTable(personnel: any[]): Table | null {
  if (!personnel || personnel.length === 0) return null;

  // Table styling constants
  const headerBgColor = STYLES.colors.blue; // Blue header
  const headerTextColor = 'FFFFFF'; // White text for header
  const borderColor = 'CCCCCC'; // Light gray borders
  const cellPadding = 120; // Cell padding in twips

  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        children: [
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 60, after: 60 },
            children: [
              new TextRun({
                text: 'Name',
                font: STYLES.fonts.headers,
                size: STYLES.sizes.body,
                bold: true,
                color: headerTextColor,
              }),
            ],
          }),
        ],
        shading: { fill: headerBgColor, type: ShadingType.SOLID, color: headerBgColor },
        margins: { top: cellPadding, bottom: cellPadding, left: cellPadding, right: cellPadding },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 8, color: headerBgColor },
          bottom: { style: BorderStyle.SINGLE, size: 8, color: headerBgColor },
          left: { style: BorderStyle.SINGLE, size: 8, color: headerBgColor },
          right: { style: BorderStyle.SINGLE, size: 4, color: 'FFFFFF' },
        },
        width: { size: 25, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 60, after: 60 },
            children: [
              new TextRun({
                text: 'Role/Position',
                font: STYLES.fonts.headers,
                size: STYLES.sizes.body,
                bold: true,
                color: headerTextColor,
              }),
            ],
          }),
        ],
        shading: { fill: headerBgColor, type: ShadingType.SOLID, color: headerBgColor },
        margins: { top: cellPadding, bottom: cellPadding, left: cellPadding, right: cellPadding },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 8, color: headerBgColor },
          bottom: { style: BorderStyle.SINGLE, size: 8, color: headerBgColor },
          left: { style: BorderStyle.SINGLE, size: 4, color: 'FFFFFF' },
          right: { style: BorderStyle.SINGLE, size: 4, color: 'FFFFFF' },
        },
        width: { size: 25, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 60, after: 60 },
            children: [
              new TextRun({
                text: 'Qualification',
                font: STYLES.fonts.headers,
                size: STYLES.sizes.body,
                bold: true,
                color: headerTextColor,
              }),
            ],
          }),
        ],
        shading: { fill: headerBgColor, type: ShadingType.SOLID, color: headerBgColor },
        margins: { top: cellPadding, bottom: cellPadding, left: cellPadding, right: cellPadding },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 8, color: headerBgColor },
          bottom: { style: BorderStyle.SINGLE, size: 8, color: headerBgColor },
          left: { style: BorderStyle.SINGLE, size: 4, color: 'FFFFFF' },
          right: { style: BorderStyle.SINGLE, size: 4, color: 'FFFFFF' },
        },
        width: { size: 25, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 60, after: 60 },
            children: [
              new TextRun({
                text: 'Experience',
                font: STYLES.fonts.headers,
                size: STYLES.sizes.body,
                bold: true,
                color: headerTextColor,
              }),
            ],
          }),
        ],
        shading: { fill: headerBgColor, type: ShadingType.SOLID, color: headerBgColor },
        margins: { top: cellPadding, bottom: cellPadding, left: cellPadding, right: cellPadding },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 8, color: headerBgColor },
          bottom: { style: BorderStyle.SINGLE, size: 8, color: headerBgColor },
          left: { style: BorderStyle.SINGLE, size: 4, color: 'FFFFFF' },
          right: { style: BorderStyle.SINGLE, size: 8, color: headerBgColor },
        },
        width: { size: 25, type: WidthType.PERCENTAGE },
      }),
    ],
  });

  const dataRows = personnel.map((person, index) => {
    const fillColor = index % 2 === 0 ? 'FFFFFF' : 'F8F9FA'; // White and very light gray
    return new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              spacing: { before: 40, after: 40 },
              children: [
                new TextRun({
                  text: person.name || 'Not provided',
                  font: STYLES.fonts.body,
                  size: STYLES.sizes.body,
                  color: STYLES.colors.black,
                }),
              ],
            }),
          ],
          shading: { fill: fillColor, type: ShadingType.CLEAR },
          margins: { top: cellPadding, bottom: cellPadding, left: cellPadding, right: cellPadding },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
            left: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
            right: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
          },
        }),
        new TableCell({
          children: [
            new Paragraph({
              spacing: { before: 40, after: 40 },
              children: [
                new TextRun({
                  text: person.role || 'Not provided',
                  font: STYLES.fonts.body,
                  size: STYLES.sizes.body,
                  color: STYLES.colors.black,
                }),
              ],
            }),
          ],
          shading: { fill: fillColor, type: ShadingType.CLEAR },
          margins: { top: cellPadding, bottom: cellPadding, left: cellPadding, right: cellPadding },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
            left: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
            right: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
          },
        }),
        new TableCell({
          children: [
            new Paragraph({
              spacing: { before: 40, after: 40 },
              children: [
                new TextRun({
                  text: person.qualification || 'Not provided',
                  font: STYLES.fonts.body,
                  size: STYLES.sizes.body,
                  color: STYLES.colors.black,
                }),
              ],
            }),
          ],
          shading: { fill: fillColor, type: ShadingType.CLEAR },
          margins: { top: cellPadding, bottom: cellPadding, left: cellPadding, right: cellPadding },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
            left: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
            right: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
          },
        }),
        new TableCell({
          children: [
            new Paragraph({
              spacing: { before: 40, after: 40 },
              children: [
                new TextRun({
                  text: person.experience || 'Not provided',
                  font: STYLES.fonts.body,
                  size: STYLES.sizes.body,
                  color: STYLES.colors.black,
                }),
              ],
            }),
          ],
          shading: { fill: fillColor, type: ShadingType.CLEAR },
          margins: { top: cellPadding, bottom: cellPadding, left: cellPadding, right: cellPadding },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
            left: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
            right: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
          },
        }),
      ],
    });
  });

  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    },
  });
}

function createDocumentsTable(documents: any[], selectedDocumentTypes: string[]): Table | null {
  // Filter documents by selected types
  const filteredDocs = documents.filter(doc => selectedDocumentTypes.includes(doc.documentType));
  
  if (!filteredDocs || filteredDocs.length === 0) return null;

  // Map document types to labels
  const documentTypeLabels: Record<string, string> = {
    'business_continuity': 'Business Continuity Plan',
    'audited_accounts': '3 Years Audited Books of Accounts',
    'memorandum_articles': 'Memorandum and Articles of Association',
    'cr12_form': 'CR12 Form',
    'bank_confirmation': 'Letter of Confirmation from Bank',
    'incorporation_cert': 'Certificate of Incorporation',
    'pacra_documents': 'PACRA Documents detailing Shareholders',
    'tax_certificate': 'Valid Tax Certificate',
    'utility_bill': 'Utility Bill',
    'reference_letter_1': 'Reference Letter - 1',
    'reference_letter_2': 'Reference Letter - 2',
    'reference_letter_3': 'Reference Letter - 3',
    'vat_certificate': 'VAT Registration Certificate',
    'gst_certificate': 'Goods & Services Tax Certificate',
    'trading_license': 'Valid Trading License (2024)',
    'tax_clearance': 'Tax Clearance Certificate',
    'manufacturer_auth': 'Manufacturer Authorization or Equivalent',
    'declaration_insolvency': 'Self Declaration - Company is Not Insolvent',
    'declaration_suspension': 'Self Declaration - No Business Suspension/Conflict of Interest',
    'balance_sheet_2022': 'Balance Sheet for FY 2021-22',
    'profit_loss_2024': 'Profit & Loss Statement for FY 2023-24',
    'organogram': 'Organogram and Employee Strength Chart',
    'organizational_structure': 'Organizational Structure Diagram',
    'financial_statement_2022': 'Financial Statements FY 2021-22',
    'financial_statement_2023': 'Financial Statements FY 2022-23',
    'financial_statement_2024': 'Financial Statements FY 2023-24',
    'personnel_cv': 'Personnel CV(s)',
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const headerRow = new TableRow({
    children: [
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: 'Document Type',
                font: STYLES.fonts.body,
                size: STYLES.sizes.body,
                bold: true,
              }),
            ],
          }),
        ],
        shading: { fill: STYLES.colors.headerBg, type: ShadingType.CLEAR },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: STYLES.colors.border },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: STYLES.colors.border },
          left: { style: BorderStyle.SINGLE, size: 4, color: STYLES.colors.border },
          right: { style: BorderStyle.SINGLE, size: 4, color: STYLES.colors.border },
        },
        width: { size: 50, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: 'File Name',
                font: STYLES.fonts.body,
                size: STYLES.sizes.body,
                bold: true,
              }),
            ],
          }),
        ],
        shading: { fill: STYLES.colors.headerBg, type: ShadingType.CLEAR },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: STYLES.colors.border },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: STYLES.colors.border },
          left: { style: BorderStyle.SINGLE, size: 4, color: STYLES.colors.border },
          right: { style: BorderStyle.SINGLE, size: 4, color: STYLES.colors.border },
        },
        width: { size: 30, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: 'File Size',
                font: STYLES.fonts.body,
                size: STYLES.sizes.body,
                bold: true,
              }),
            ],
          }),
        ],
        shading: { fill: STYLES.colors.headerBg, type: ShadingType.CLEAR },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: STYLES.colors.border },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: STYLES.colors.border },
          left: { style: BorderStyle.SINGLE, size: 4, color: STYLES.colors.border },
          right: { style: BorderStyle.SINGLE, size: 4, color: STYLES.colors.border },
        },
        width: { size: 20, type: WidthType.PERCENTAGE },
      }),
    ],
  });

  const dataRows = filteredDocs.map((doc, index) => {
    const fillColor = index % 2 === 0 ? STYLES.colors.rowOdd : STYLES.colors.rowEven;
    return new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: documentTypeLabels[doc.documentType] || doc.documentType,
                  font: STYLES.fonts.body,
                  size: STYLES.sizes.body,
                }),
              ],
            }),
          ],
          shading: { fill: fillColor, type: ShadingType.CLEAR },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: STYLES.colors.border },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: STYLES.colors.border },
            left: { style: BorderStyle.SINGLE, size: 4, color: STYLES.colors.border },
            right: { style: BorderStyle.SINGLE, size: 4, color: STYLES.colors.border },
          },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: doc.fileName || 'Not provided',
                  font: STYLES.fonts.body,
                  size: STYLES.sizes.body,
                }),
              ],
            }),
          ],
          shading: { fill: fillColor, type: ShadingType.CLEAR },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: STYLES.colors.border },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: STYLES.colors.border },
            left: { style: BorderStyle.SINGLE, size: 4, color: STYLES.colors.border },
            right: { style: BorderStyle.SINGLE, size: 4, color: STYLES.colors.border },
          },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: formatFileSize(doc.fileSize || 0),
                  font: STYLES.fonts.body,
                  size: STYLES.sizes.body,
                }),
              ],
            }),
          ],
          shading: { fill: fillColor, type: ShadingType.CLEAR },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: STYLES.colors.border },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: STYLES.colors.border },
            left: { style: BorderStyle.SINGLE, size: 4, color: STYLES.colors.border },
            right: { style: BorderStyle.SINGLE, size: 4, color: STYLES.colors.border },
          },
        }),
      ],
    });
  });

  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: STYLES.colors.border },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: STYLES.colors.border },
      left: { style: BorderStyle.SINGLE, size: 4, color: STYLES.colors.border },
      right: { style: BorderStyle.SINGLE, size: 4, color: STYLES.colors.border },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: STYLES.colors.border },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: STYLES.colors.border },
    },
  });
}

/**
 * Embeds vendor documents as images in the Word document
 * Handles PDFs (converts to images) and image files directly
 */
async function embedVendorDocuments(
  documents: any[],
  selectedDocumentTypes: string[]
): Promise<(Paragraph | Table)[]> {
  const elements: (Paragraph | Table)[] = [];
  
  console.log(`\n=== EMBEDDING VENDOR DOCUMENTS ===`);
  console.log(`Total documents received: ${documents?.length || 0}`);
  console.log(`Selected document types: ${selectedDocumentTypes.join(', ')}`);
  
  // Filter documents by selected types
  const filteredDocs = documents.filter(doc => 
    selectedDocumentTypes.includes(doc.documentType) && 
    doc.fileContent // Only include documents with file content
  );
  
  console.log(`Filtered documents (with fileContent): ${filteredDocs.length}`);
  filteredDocs.forEach(doc => {
    console.log(`  - ${doc.documentType}: ${doc.fileName} (${doc.mimeType}), fileContent length: ${doc.fileContent?.length || 0}`);
  });
  
  if (!filteredDocs || filteredDocs.length === 0) {
    console.log(`⚠️ No documents to embed (filteredDocs is empty)`);
    return elements;
  }

  // Map document types to labels
  const documentTypeLabels: Record<string, string> = {
    'business_continuity': 'Business Continuity Plan',
    'audited_accounts': '3 Years Audited Books of Accounts',
    'memorandum_articles': 'Memorandum and Articles of Association',
    'cr12_form': 'CR12 Form',
    'bank_confirmation': 'Letter of Confirmation from Bank',
    'incorporation_cert': 'Certificate of Incorporation',
    'pacra_documents': 'PACRA Documents detailing Shareholders',
    'tax_certificate': 'Valid Tax Certificate',
    'utility_bill': 'Utility Bill',
    'reference_letter_1': 'Reference Letter - 1',
    'reference_letter_2': 'Reference Letter - 2',
    'reference_letter_3': 'Reference Letter - 3',
    'vat_certificate': 'VAT Registration Certificate',
    'gst_certificate': 'Goods & Services Tax Certificate',
    'trading_license': 'Valid Trading License (2024)',
    'tax_clearance': 'Tax Clearance Certificate',
    'manufacturer_auth': 'Manufacturer Authorization or Equivalent',
    'declaration_insolvency': 'Self Declaration - Company is Not Insolvent',
    'declaration_suspension': 'Self Declaration - No Business Suspension/Conflict of Interest',
    'balance_sheet_2022': 'Balance Sheet for FY 2021-22',
    'profit_loss_2024': 'Profit & Loss Statement for FY 2023-24',
    'organogram': 'Organogram and Employee Strength Chart',
    'organizational_structure': 'Organizational Structure Diagram',
    'financial_statement_2022': 'Financial Statements FY 2021-22',
    'financial_statement_2023': 'Financial Statements FY 2022-23',
    'financial_statement_2024': 'Financial Statements FY 2023-24',
    'personnel_cv': 'Personnel CV(s)',
  };

  for (const doc of filteredDocs) {
    try {
      console.log(`\nProcessing document: ${doc.fileName} (${doc.documentType})`);
      const docLabel = documentTypeLabels[doc.documentType] || doc.fileName;
      
      // Add document title/heading
      elements.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          spacing: {
            before: 320, // 16pt before
            after: 160,  // 8pt after
            line: Math.round(STYLES.sizes.h2 * 1.15 * 10),
          },
          children: [
            new TextRun({
              text: docLabel,
              font: STYLES.fonts.headers,
              size: 24, // 12pt
              bold: true,
              color: STYLES.colors.black,
            }),
          ],
        })
      );

      // Decode base64 file content
      if (!doc.fileContent) {
        console.error(`⚠️ Document ${doc.fileName} has no fileContent`);
        continue;
      }
      
      // Validate base64 string
      let fileBuffer: Buffer;
      try {
        // Remove data URL prefix if present (e.g., "data:application/pdf;base64,")
        let base64Content = doc.fileContent;
        if (base64Content.includes(',')) {
          base64Content = base64Content.split(',')[1];
        }
        
        fileBuffer = Buffer.from(base64Content, 'base64');
        console.log(`Decoded file buffer size: ${fileBuffer.length} bytes`);
        
        // Validate buffer is not empty
        if (fileBuffer.length === 0) {
          throw new Error('Decoded buffer is empty');
        }
      } catch (decodeError) {
        console.error(`❌ Error decoding base64 for ${doc.fileName}:`, decodeError);
        throw new Error(`Failed to decode file content: ${decodeError instanceof Error ? decodeError.message : 'Unknown error'}`);
      }
      
      // Determine file type from mimeType or file extension
      const mimeType = doc.mimeType?.toLowerCase() || '';
      const fileName = doc.fileName?.toLowerCase() || '';
      
      console.log(`File type detection: mimeType="${mimeType}", fileName="${fileName}"`);
      
      if (mimeType.includes('pdf') || fileName.endsWith('.pdf')) {
        console.log(`📄 Processing PDF: ${doc.fileName}`);
        // Convert PDF to images and embed each page
        const pdfImages = await convertPdfToImages(fileBuffer);
        console.log(`✅ Converted PDF to ${pdfImages.length} image(s)`);
        for (let i = 0; i < pdfImages.length; i++) {
          const imageBuffer = pdfImages[i];
          console.log(`  Embedding page ${i + 1}/${pdfImages.length} (${imageBuffer.length} bytes)`);
          const imagePara = await createDocumentImage(imageBuffer, 'png');
          if (imagePara) {
            elements.push(imagePara);
            console.log(`  ✅ Page ${i + 1} embedded successfully`);
          } else {
            console.error(`  ❌ Failed to create image paragraph for page ${i + 1}`);
          }
        }
      } else if (
        mimeType.includes('image/') || 
        fileName.match(/\.(jpg|jpeg|png|gif|bmp)$/i)
      ) {
        console.log(`🖼️ Processing image: ${doc.fileName}`);
        // Handle image files directly
        const imageType = getImageType(mimeType, fileName);
        console.log(`  Image type: ${imageType}`);
        const imagePara = await createDocumentImage(fileBuffer, imageType);
        if (imagePara) {
          elements.push(imagePara);
          console.log(`  ✅ Image embedded successfully`);
        } else {
          console.error(`  ❌ Failed to create image paragraph`);
        }
      } else {
        // For other file types, add a note
        elements.push(
          new Paragraph({
            spacing: {
              after: STYLES.spacing.paragraphAfter,
            },
            children: [
              new TextRun({
                text: `[Document: ${doc.fileName} - File type not supported for embedding]`,
                font: STYLES.fonts.body,
                size: STYLES.sizes.body,
                color: STYLES.colors.black,
                italics: true,
              }),
            ],
          })
        );
      }
      
      // Add spacing after each document
      elements.push(
        new Paragraph({
          spacing: {
            after: 240, // 12pt spacing between documents
          },
          children: [],
        })
      );
    } catch (error) {
      console.error(`❌ Error embedding document ${doc.fileName}:`, error);
      if (error instanceof Error) {
        console.error(`  Error message: ${error.message}`);
        console.error(`  Error stack: ${error.stack}`);
      }
      
      // Don't add error message to document - just skip it
      // The document table already shows the file exists
      // Adding error messages clutters the document
      console.log(`  ⚠️ Skipping document ${doc.fileName} due to embedding error`);
    }
  }

  console.log(`\n=== EMBEDDING COMPLETE ===`);
  console.log(`Total elements created: ${elements.length}`);
  return elements;
}

/**
 * Converts PDF buffer to array of image buffers (one per page)
 * Uses pdf-lib + canvas for rendering (pure JavaScript, no external dependencies)
 */
async function convertPdfToImages(pdfBuffer: Buffer): Promise<Buffer[]> {
  try {
    console.log(`  📄 Starting PDF conversion, buffer size: ${pdfBuffer.length} bytes`);
    
    // Validate PDF buffer
    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error('PDF buffer is empty or invalid');
    }
    
    // Check if it's a valid PDF (starts with %PDF)
    const pdfHeader = pdfBuffer.slice(0, 4).toString();
    if (pdfHeader !== '%PDF') {
      throw new Error(`Invalid PDF format. Expected PDF header, got: ${pdfHeader}`);
    }
    
    // Try pdf-to-img first (pure JS, works everywhere)
    try {
      console.log(`  🔄 Trying pdf-to-img for PDF conversion...`);
      // @ts-ignore
      const { pdf } = await import('pdf-to-img');
      
      const images: Buffer[] = [];
      let pageNum = 0;
      
      for await (const image of await pdf(pdfBuffer, { scale: 2 })) {
        pageNum++;
        images.push(Buffer.from(image));
        console.log(`  ✅ Converted page ${pageNum} (${image.length} bytes)`);
      }
      
      console.log(`  ✅ pdf-to-img converted ${images.length} page(s)`);
      return images;
    } catch (pdfToImgError) {
      console.log(`  ⚠️ pdf-to-img failed:`, pdfToImgError instanceof Error ? pdfToImgError.message : pdfToImgError);
    }
    
    // Fallback: Try system Poppler (pdftocairo) directly
    try {
      console.log(`  🔄 Trying system pdftocairo for PDF conversion...`);
      const { execSync } = await import('child_process');
      const fs = await import('fs');
      const path = await import('path');
      const os = await import('os');
      
      // Create temp directory for PDF and output images
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-convert-'));
      const tempPdfPath = path.join(tempDir, 'input.pdf');
      const outputPrefix = path.join(tempDir, 'page');
      
      // Write PDF buffer to temp file
      fs.writeFileSync(tempPdfPath, pdfBuffer);
      
      // Convert PDF to PNG images using system pdftocairo
      // -png = output PNG, -r 150 = 150 DPI for good quality
      execSync(`pdftocairo -png -r 150 "${tempPdfPath}" "${outputPrefix}"`, {
        encoding: 'utf-8',
        timeout: 60000, // 60 second timeout
      });
      
      // Read the generated images
      const images: Buffer[] = [];
      const files = fs.readdirSync(tempDir)
        .filter((f: string) => f.startsWith('page') && f.endsWith('.png'))
        .sort();
      
      for (const file of files) {
        const imagePath = path.join(tempDir, file);
        const imageBuffer = fs.readFileSync(imagePath);
        images.push(imageBuffer);
        console.log(`  ✅ Converted page: ${file} (${imageBuffer.length} bytes)`);
      }
      
      // Cleanup temp files
      for (const file of fs.readdirSync(tempDir)) {
        fs.unlinkSync(path.join(tempDir, file));
      }
      fs.rmdirSync(tempDir);
      
      console.log(`  ✅ pdftocairo converted ${images.length} page(s)`);
      return images;
    } catch (popplerError) {
      console.log(`  ⚠️ pdftocairo failed, falling back to placeholder:`, popplerError instanceof Error ? popplerError.message : popplerError);
    }
    
    // Fallback: Use pdf-lib + canvas for placeholder images
    console.log(`  🔄 Using pdf-lib + canvas for placeholder images...`);
    // @ts-ignore - pdf-lib types may not be installed
    const { PDFDocument } = await import('pdf-lib');
    // @ts-ignore - canvas types may not be installed
    const { createCanvas } = await import('canvas');
    
    // Load the PDF
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();
    console.log(`  📄 PDF has ${pageCount} page(s)`);
  
  const images: Buffer[] = [];
  
    for (let i = 0; i < pageCount; i++) {
      const page = pdfDoc.getPage(i);
      const { width, height } = page.getSize();
      
      // Scale for better quality (2x)
      const scale = 2;
      const canvasWidth = Math.round(width * scale);
      const canvasHeight = Math.round(height * scale);
      
      const canvas = createCanvas(canvasWidth, canvasHeight);
      const ctx = canvas.getContext('2d');
      
      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      
      // Add border
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, canvasWidth - 2, canvasHeight - 2);
      
      // Add page info text
      ctx.fillStyle = '#666666';
      ctx.font = `${24 * scale}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(`PDF Document - Page ${i + 1} of ${pageCount}`, canvasWidth / 2, canvasHeight / 2 - 20 * scale);
      ctx.font = `${14 * scale}px Arial`;
      ctx.fillText(`(Original size: ${Math.round(width)} x ${Math.round(height)} pts)`, canvasWidth / 2, canvasHeight / 2 + 20 * scale);
      ctx.fillText(`PDF rendering placeholder - Install Poppler for full rendering`, canvasWidth / 2, canvasHeight / 2 + 50 * scale);
      
      const imageBuffer = canvas.toBuffer('image/png');
      images.push(imageBuffer);
      console.log(`  ✅ Created placeholder for page ${i + 1}`);
    }
    
    console.log(`  ✅ Created ${images.length} placeholder image(s)`);
    return images;
  } catch (error) {
    console.error('❌ Error converting PDF to images:', error);
    if (error instanceof Error) {
      console.error(`  Error message: ${error.message}`);
      console.error(`  Error stack: ${error.stack}`);
    }
    throw new Error(`Failed to convert PDF to images: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Creates a Word document paragraph with embedded image
 */
async function createDocumentImage(
  imageBuffer: Buffer,
  imageType: 'png' | 'jpg' | 'gif' | 'bmp'
): Promise<Paragraph | null> {
  try {
    // Get image dimensions using sharp
    const sharp = await import('sharp');
    const metadata = await sharp.default(imageBuffer).metadata();
    const imageWidth = metadata.width || 600;
    const imageHeight = metadata.height || 800;
    
    // Scale down to fit page width (max 500 pixels wide for Word doc)
    // This provides a good balance between quality and document size
    const maxWidthPx = 500;
    const aspectRatio = imageHeight / imageWidth;
    let finalWidth = Math.min(imageWidth, maxWidthPx);
    let finalHeight = Math.round(finalWidth * aspectRatio);
    
    const imageRun = new ImageRun({
      type: imageType,
      data: imageBuffer,
      transformation: {
        width: finalWidth,
        height: finalHeight,
      },
    });
    
    return new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: {
        before: 160, // 8pt
        after: 160,  // 8pt
      },
      children: [imageRun],
    });
  } catch (error) {
    console.error('Error creating document image:', error);
    return null;
  }
}

/**
 * Determines image type from mimeType or filename
 */
function getImageType(mimeType: string, fileName: string): 'png' | 'jpg' | 'gif' | 'bmp' {
  if (mimeType.includes('jpeg') || mimeType.includes('jpg') || fileName.match(/\.(jpg|jpeg)$/i)) {
    return 'jpg';
  } else if (mimeType.includes('png') || fileName.endsWith('.png')) {
    return 'png';
  } else if (mimeType.includes('gif') || fileName.endsWith('.gif')) {
    return 'gif';
  } else if (mimeType.includes('bmp') || fileName.endsWith('.bmp')) {
    return 'bmp';
  }
  // Default to PNG
  return 'png';
}
