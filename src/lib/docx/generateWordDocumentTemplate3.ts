// Word Document Generator with Exact PDF Styling
// Mirrors the styling from download-v1-pdf route

import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  WidthType,
  BorderStyle,
  ShadingType,
  ImageRun,
  PageNumber,
  Footer,
  Header,
  convertInchesToTwip,
  ITableCellOptions,
  TabStopType,
  TabStopPosition,
  HorizontalPositionRelativeFrom,
  VerticalPositionRelativeFrom,
  TextWrappingType,
  PageBreak,
  TableOfContents,
} from 'docx';
import { parseV1Content, ParsedSection, extractV1Content, parseInlineFormatting, TextPart, CellData } from '../v1-content-parser';
import { formatVendorFields } from './vendorFieldsFormatter';
import { VendorQualification } from '@/types/vendor';
import fs from 'fs';
import path from 'path';

// Cover page data interface
export interface CoverPageData {
  proposalOn?: string;
  preparedFor?: string;
  contactName?: string;
  designation?: string;
  emailAddress?: string;
  mobileNumber?: string;
  submittedOn?: Date | string;
  validUntil?: Date | string;
}

// Styling constants matching screenshots
const STYLES = {
  // Margins (in twips: 1 inch = 1440 twips, 1 cm ≈ 567 twips)
  margins: {
    top: convertInchesToTwip(0.5),
    right: convertInchesToTwip(1.0), // Increased right margin to 1 inch
    bottom: convertInchesToTwip(0.75),
    left: convertInchesToTwip(1.0), // Increased left margin to 1 inch
    header: 0, // Header from top: 0 (starts at absolute top of page)
    footer: 1021, // Footer from bottom: 1.8 cm (fixed) - 1.8 * 567 = 1020.6 ≈ 1021 twips
  },
  
  // Fonts - Updated to match requirements
  fonts: {
    body: 'Lato',              // Lato font for body text
    headers: 'Open Sans',       // Open Sans font for headings
    code: 'Courier New',
  },
  
  // Font sizes (in half-points: 11pt = 22, 14pt = 28, 16pt = 32)
  sizes: {
    body: 22,      // 11pt (Lato)
    h1: 32,        // 16pt (Open Sans, bold, uppercase, blue)
    h2: 28,        // 14pt (Open Sans, bold, uppercase)
    h3: 26,        // 13pt
    h4: 24,        // 12pt
    table: 24,     // 12pt
    code: 22,      // 11pt
  },
  
  // Colors
  colors: {
    black: '000000',
    blue: '4472C4',            // Blue color for main headings (matching footer line)
    headerBg: '4472C4',       // Blue background for table headers (matching screenshot)
    headerText: 'FFFFFF',     // White text for table headers
    rowBg: 'F1F8FF',          // Light blue background for all data rows (matching screenshot exactly)
    border: '000000',
  },
  
  // Spacing (in twips) - Reduced header heights
  spacing: {
    lineHeight: 1.15, // Exact line height for body text (11pt font)
    bodyLineHeight: Math.round(22 * 1.15 * 10), // Exactly 1.15: 11pt (22 half-points) * 1.15 * 10 = 253 twips
    h1Before: 0,
    h1After: 200,   // 10pt (reduced from 14pt)
    h2Before: 240,  // 12pt (reduced from 16pt)
    h2After: 160,   // 8pt (reduced from 12pt)
    h3Before: 160,  // 8pt (reduced from 12pt)
    h3After: 120,   // 6pt (reduced from 8pt)
    paragraphAfter: 200, // 10pt
  },
};

export async function generateV1WordDocument(
  v1Data: any,
  vendorData?: VendorQualification | null,
  selectedVendorFields?: string[]
): Promise<Buffer> {
  try {
    console.log(`\n=== STARTING WORD GENERATION ===`);
    console.log('V1 Data structure check:', {
      hasV1Data: !!v1Data,
      has1Key: !!v1Data?.["1"],
      hasExtractedContent: !!v1Data?.["1"]?.extracted_content,
      hasFields: !!v1Data?.["1"]?.extracted_content?.[0]?.fields,
      hasGeneratedData: !!v1Data?.["1"]?.extracted_content?.[0]?.fields?.[0]?.generated_data,
    });
    
    const content = extractV1Content(v1Data);
    console.log('Extracted content length:', content?.length || 0);
    console.log('Content has <table> tags:', content?.includes('<table>') || false);
    
    if (!content) {
      throw new Error('No V1 content found in data structure');
    }

    const sections = parseV1Content(content);
    console.log(`\n=== PARSING COMPLETE ===`);
    console.log(`Total sections parsed: ${sections.length}`);
    
    // Count section types
    const sectionTypes = sections.reduce((acc, s) => {
      acc[s.type] = (acc[s.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log('Section types:', sectionTypes);
    
    const tableSections = sections.filter(s => s.type === 'table');
    console.log(`\nTables found: ${tableSections.length}`);
    
    // Log detailed table info
    tableSections.forEach((table, idx) => {
      if (table.tableData) {
        console.log(`  Table ${idx + 1}: ${table.tableData.headerRows?.length || 0} header rows, ${table.tableData.rows.length} data rows`);
      }
    });
    
    console.log(`\n=== CONVERTING TO WORD ===`);
    const documentChildren = await convertSectionsToDocx(sections);
    console.log(`Generated ${documentChildren.length} document elements`);
    
    // Filter out any null or undefined elements
    let validChildren = documentChildren.filter(child => child !== null && child !== undefined);
    
    // Append vendor fields if provided
    if (vendorData && selectedVendorFields && selectedVendorFields.length > 0) {
      console.log(`\n=== ADDING VENDOR FIELDS ===`);
      console.log(`Selected vendor fields: ${selectedVendorFields.length}`);
      const vendorElements = await formatVendorFields(vendorData, selectedVendorFields);
      if (vendorElements.length > 0) {
        validChildren.push(...vendorElements);
        console.log(`Added ${vendorElements.length} vendor field elements`);
      }
    }
    
    if (validChildren.length === 0) {
      throw new Error('No valid document elements generated');
    }

    // Count element types
    const elementTypes = validChildren.reduce((acc, el) => {
      const type = el.constructor.name;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log('Element types:', elementTypes);

    console.log(`\n=== CREATING WORD DOCUMENT ===`);
    
    // Create header with logo
    const headerLogo = await createHeaderLogo();
    
    // Create footer with website and page numbers
    const footerContent = createFooterContent();
    
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: STYLES.margins,
            },
          },
          headers: {
            default: new Header({
              children: headerLogo ? [headerLogo] : [],
            }),
          },
          footers: {
            default: new Footer({
              children: footerContent,
            }),
          },
          children: validChildren,
        },
      ],
    });

    console.log(`\n=== PACKING DOCUMENT ===`);
    const { Packer } = await import('docx');
    const buffer = await Packer.toBuffer(doc);
    
    console.log(`\n=== WORD GENERATION COMPLETE ===`);
    console.log(`Generated buffer size: ${buffer.length} bytes`);
    
    return buffer;
  } catch (error) {
    console.error('\n=== WORD GENERATION ERROR ===');
    console.error('Error details:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw new Error(`Failed to generate Word document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate Word document with cover pages (2 pages) + body content in single document
 */
export async function generateV1WordDocumentWithCover(
  v1Data: any,
  coverData: CoverPageData,
  vendorData?: VendorQualification | null,
  selectedVendorFields?: string[]
): Promise<Buffer> {
  try {
    console.log(`\n=== STARTING WORD GENERATION WITH COVER ===`);
    
    const content = extractV1Content(v1Data);
    if (!content) {
      throw new Error('No V1 content found in data structure');
    }

    const sections = parseV1Content(content);
    const documentChildren = await convertSectionsToDocx(sections);
    let validChildren = documentChildren.filter(child => child !== null && child !== undefined);
    
    // Append vendor fields if provided
    if (vendorData && selectedVendorFields && selectedVendorFields.length > 0) {
      const vendorElements = await formatVendorFields(vendorData, selectedVendorFields);
      if (vendorElements.length > 0) {
        validChildren.push(...vendorElements);
      }
    }

    // Create header with logo for body pages
    const headerLogo = await createHeaderLogo();
    const footerContent = createFooterContent();

    // Load background images for cover pages
    const page1BgPath = path.join(process.cwd(), 'public', 'Images', 'page1.png');
    const page2BgPath = path.join(process.cwd(), 'public', 'Images', 'page2.png');
    const headerImgPath = path.join(process.cwd(), 'public', 'media', 'media', 'header_img3.png');

    let page1BgBuffer: Buffer | null = null;
    let page2BgBuffer: Buffer | null = null;
    let headerImgBuffer: Buffer | null = null;

    if (fs.existsSync(page1BgPath)) {
      page1BgBuffer = fs.readFileSync(page1BgPath);
    }
    if (fs.existsSync(page2BgPath)) {
      page2BgBuffer = fs.readFileSync(page2BgPath);
    }
    if (fs.existsSync(headerImgPath)) {
      headerImgBuffer = fs.readFileSync(headerImgPath);
    }

    // Get image dimensions
    const sharp = await import('sharp');
    let page1Width = 794, page1Height = 1122;
    let page2Width = 792, page2Height = 847;
    let headerWidth = 794, headerHeight = 100;

    if (page1BgBuffer) {
      const meta1 = await sharp.default(page1BgBuffer).metadata();
      page1Width = meta1.width || 794;
      page1Height = meta1.height || 1122;
    }
    if (page2BgBuffer) {
      const meta2 = await sharp.default(page2BgBuffer).metadata();
      page2Width = meta2.width || 792;
      page2Height = meta2.height || 847;
    }
    if (headerImgBuffer) {
      const metaH = await sharp.default(headerImgBuffer).metadata();
      headerWidth = metaH.width || 794;
      headerHeight = metaH.height || 100;
    }

    // Format dates
    const formatDate = (date: Date | string | undefined): string => {
      if (!date) return '';
      const d = date instanceof Date ? date : new Date(date);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
    };

    const submittedOnStr = formatDate(coverData.submittedOn || new Date());
    const validUntilStr = formatDate(coverData.validUntil);

    // Helper to create spacer paragraphs
    const createSpacers = (count: number): Paragraph[] => 
      Array(count).fill(null).map(() => new Paragraph({ spacing: { after: 200 }, children: [] }));

    // Create document with 3 sections: Cover Page 1, Cover Page 2, Body
    const doc = new Document({
      sections: [
        // ===== SECTION 1: Cover Page 1 =====
        {
          properties: {
            page: { margin: { top: 0, right: 0, bottom: 0, left: 0 } },
          },
          children: [
            // Background image
            ...(page1BgBuffer ? [
              new Paragraph({
                children: [
                  new ImageRun({
                    type: 'png',
                    data: page1BgBuffer,
                    transformation: { width: page1Width, height: page1Height },
                    floating: {
                      horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: 0 },
                      verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, offset: 0 },
                      behindDocument: true,
                      wrap: { type: TextWrappingType.NONE },
                    },
                  }),
                ],
              }),
            ] : []),

            // Spacers to position proposal text
            ...createSpacers(11),

            // Proposal Title - white text, Lato 16pt
            new Paragraph({
              indent: { left: convertInchesToTwip(0.3), right: convertInchesToTwip(4.0) },
              children: [
                new TextRun({
                  text: coverData.proposalOn || 'Proposal for the implementation of Agency and Wallet Banking Solution',
                  font: 'Lato',
                  size: 32,
                  color: 'FFFFFF',
                }),
              ],
            }),

            // Spacers for "Technical" text - positioned to the right
            ...createSpacers(5),

            // "Technical" text - aligned right
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              indent: { right: convertInchesToTwip(0.8) },
              children: [
                new TextRun({
                  text: 'Technical',
                  font: 'Georgia',
                  size: 72,
                  color: 'FFFFFF',
                  bold: true,
                }),
              ],
            }),

            // "Proposal" text - aligned right
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              indent: { right: convertInchesToTwip(0.8) },
              spacing: { before: 100 },
              children: [
                new TextRun({
                  text: 'Proposal',
                  font: 'Georgia',
                  size: 72,
                  color: '90EE90',
                  italics: true,
                }),
              ],
            }),

            // Spacers to bottom
            ...createSpacers(14),

            // "Submitted To" label - positioned like screenshot
            new Paragraph({
              alignment: AlignmentType.LEFT,
              indent: { left: convertInchesToTwip(3.5) },
              spacing: { after: 40 },
              children: [
                new TextRun({
                  text: 'Submitted To',
                  font: 'Inter',
                  size: 24,
                  color: '666666',
                }),
              ],
            }),

            // Customer name with yellow left border
            new Paragraph({
              alignment: AlignmentType.LEFT,
              indent: { left: convertInchesToTwip(3.5) },
              border: {
                left: { color: 'DAA520', space: 4, style: BorderStyle.SINGLE, size: 18 },
              },
              children: [
                new TextRun({
                  text: coverData.preparedFor || 'Customer Name',
                  font: 'Montserrat Medium',
                  size: 32,
                  color: '4472C4',
                  bold: true,
                }),
              ],
            }),
          ],
        },

        // ===== SECTION 2: Cover Page 2 =====
        {
          properties: {
            page: { margin: { top: 0, right: 0, bottom: 0, left: 0 } },
          },
          children: [
            // Header image at top
            ...(headerImgBuffer ? [
              new Paragraph({
                children: [
                  new ImageRun({
                    type: 'png',
                    data: headerImgBuffer,
                    transformation: { width: headerWidth, height: headerHeight },
                    floating: {
                      horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: 0 },
                      verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, offset: 0 },
                      behindDocument: true,
                      wrap: { type: TextWrappingType.NONE },
                    },
                  }),
                ],
              }),
            ] : []),

            // Background image - positioned at BOTTOM of page
            ...(page2BgBuffer ? [
              new Paragraph({
                children: [
                  new ImageRun({
                    type: 'png',
                    data: page2BgBuffer,
                    transformation: { width: page2Width, height: page2Height },
                    floating: {
                      horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: 0 },
                      verticalPosition: { 
                        relative: VerticalPositionRelativeFrom.PAGE, 
                        offset: (1122 - page2Height) * 9525, // Position at bottom
                      },
                      behindDocument: true,
                      wrap: { type: TextWrappingType.NONE },
                    },
                  }),
                ],
              }),
            ] : []),

            // Spacers at top for contact details area
            ...createSpacers(4),

            // "Submitted by" - centered (16pt, bold, black)
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: 'Submitted by', font: 'Inter Semi Bold', size: 32, bold: true, color: '000000' }),
              ],
            }),

            // Spacer
            ...createSpacers(1),

            // Two-column layout - all 14pt Inter Semi Bold
            // Row 1: Contact Name (16pt) | Email
            new Paragraph({
              indent: { left: convertInchesToTwip(0.8) },
              spacing: { before: 100 },
              tabStops: [{ type: TabStopType.LEFT, position: convertInchesToTwip(4.0) }],
              children: [
                new TextRun({ text: coverData.contactName || 'Contact Name', font: 'Inter Semi Bold', size: 32, bold: true }),
                new TextRun({ text: '\t' }),
                new TextRun({ text: '✉  ', font: 'Segoe UI Symbol', size: 28, color: '666666' }),
                new TextRun({ text: coverData.emailAddress || 'email@example.com', font: 'Inter Semi Bold', size: 28, color: '333333' }),
              ],
            }),

            // Row 2: Designation | Phone
            new Paragraph({
              indent: { left: convertInchesToTwip(0.8) },
              spacing: { before: 100 },
              tabStops: [{ type: TabStopType.LEFT, position: convertInchesToTwip(4.0) }],
              children: [
                new TextRun({ text: coverData.designation || 'Designation', font: 'Inter Semi Bold', size: 28, color: '333333' }),
                new TextRun({ text: '\t' }),
                new TextRun({ text: '📞  ', font: 'Segoe UI Symbol', size: 28, color: '333333' }),
                new TextRun({ text: coverData.mobileNumber || '+91 0000000000', font: 'Inter Semi Bold', size: 28, color: '333333' }),
              ],
            }),

            // Row 3: Submitted On | Valid Until
            new Paragraph({
              indent: { left: convertInchesToTwip(0.8) },
              spacing: { before: 100 },
              tabStops: [{ type: TabStopType.LEFT, position: convertInchesToTwip(4.0) }],
              children: [
                new TextRun({ text: 'Submitted On: ', font: 'Inter Semi Bold', size: 28, color: '333333', bold: true }),
                new TextRun({ text: submittedOnStr, font: 'Inter Semi Bold', size: 28, color: '333333' }),
                new TextRun({ text: '\t' }),
                new TextRun({ text: 'Valid Until: ', font: 'Inter Semi Bold', size: 28, color: '333333', bold: true }),
                new TextRun({ text: validUntilStr, font: 'Inter Semi Bold', size: 28, color: '333333' }),
              ],
            }),
          ],
        },

        // ===== SECTION 3: Body Content =====
        {
          properties: {
            page: { margin: STYLES.margins },
          },
          headers: {
            default: new Header({ children: headerLogo ? [headerLogo] : [] }),
          },
          footers: {
            default: new Footer({ children: footerContent }),
          },
          children: validChildren,
        },
      ],
    });

    const { Packer } = await import('docx');
    const buffer = await Packer.toBuffer(doc);
    
    console.log(`\n=== WORD GENERATION WITH COVER COMPLETE ===`);
    return buffer;
  } catch (error) {
    console.error('Error generating Word document with cover:', error);
    throw new Error(`Failed to generate Word document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function convertSectionsToDocx(sections: ParsedSection[]): Promise<(Paragraph | Table)[]> {
  const elements: (Paragraph | Table)[] = [];
  // Heading counters for dynamic numbering (per level)
  const headingCounters = [0, 0, 0, 0, 0, 0];
  let tocInserted = false;

  for (const section of sections) {
    switch (section.type) {
      case 'header':
        // Increment current level counter and reset deeper levels
        {
          const level = Math.max(1, Math.min(section.level || 1, headingCounters.length));
          headingCounters[level - 1] += 1;
          for (let i = level; i < headingCounters.length; i++) {
            headingCounters[i] = 0;
          }
          const numberingParts = headingCounters
            .slice(0, level)
            .filter((val) => val > 0);
          const numberingLabel = numberingParts.join('.') + '.';
          const headingPara = createHeader(section, numberingLabel);

          // Start new page for each H1 (including the first)
          if (level === 1) {
            elements.push(new Paragraph({ children: [new PageBreak()] }));
          }

          elements.push(headingPara);

          // If this heading is "TABLE OF CONTENTS", insert the TOC field right after it
          const headingText = (section.content || '').trim().toUpperCase();
          if (!tocInserted && headingText === 'TABLE OF CONTENTS') {
            elements.push(...createTableOfContentsElements());
            tocInserted = true;
          }
        }
        break;
      
      case 'paragraph':
        const paragraphResult = createParagraph(section);
        if (Array.isArray(paragraphResult)) {
          elements.push(...paragraphResult);
        } else {
          elements.push(paragraphResult);
        }
        break;
      
      case 'list':
        elements.push(...createList(section));
        break;
      
      case 'table':
        if (section.tableData) {
          console.log(`Processing table section...`);
          const tableElements = await createTable(section.tableData);
          console.log(`  Table created ${tableElements.length} elements`);
          elements.push(...tableElements);
        } else {
          console.log(`Table section has no tableData!`);
        }
        break;
      
      case 'image':
        if (section.imageData) {
          const imagePara = await createImage(section.imageData);
          if (imagePara) {
            elements.push(imagePara);
          }
        }
        break;
      
      case 'blockquote':
        elements.push(createBlockquote(section));
        break;
      
      case 'pre':
        elements.push(createPreformatted(section));
        break;
    }
  }

  return elements;
}

function createHeader(section: ParsedSection, numberingLabel?: string): Paragraph {
  const level = section.level || 1;
  
  let headingLevel: typeof HeadingLevel[keyof typeof HeadingLevel];
  let fontSize: number;
  let spacingBefore: number;
  let spacingAfter: number;
  let upperCase = false;
  let letterSpacing = 0;
  let hasBorder = false;
  let borderSize = 0;
  
  switch (level) {
    case 1:
      headingLevel = HeadingLevel.HEADING_1;
      fontSize = STYLES.sizes.h1;
      spacingBefore = STYLES.spacing.h1Before;
      spacingAfter = STYLES.spacing.h1After;
      upperCase = false; // Preserve original case
      letterSpacing = 0; // No letter spacing for Open Sans
      hasBorder = false; // No border for headings
      borderSize = 0;
      break;
    case 2:
      headingLevel = HeadingLevel.HEADING_2;
      fontSize = STYLES.sizes.h2;
      spacingBefore = STYLES.spacing.h2Before;
      spacingAfter = STYLES.spacing.h2After;
      upperCase = false; // Preserve original case
      letterSpacing = 0; // No letter spacing for Open Sans
      hasBorder = false; // No border for headings
      borderSize = 0;
      break;
    case 3:
      headingLevel = HeadingLevel.HEADING_3;
      fontSize = STYLES.sizes.h3;
      spacingBefore = STYLES.spacing.h3Before;
      spacingAfter = STYLES.spacing.h3After;
      upperCase = false;
      letterSpacing = 0;
      hasBorder = false;
      break;
    default:
      headingLevel = HeadingLevel.HEADING_4;
      fontSize = STYLES.sizes.h4;
      spacingBefore = 200;
      spacingAfter = 120;
      upperCase = false;
      letterSpacing = 0;
      hasBorder = false;
  }

  const rawContent = upperCase ? section.content.toUpperCase() : section.content;
  const numberedContent = numberingLabel ? `${numberingLabel} ${rawContent}` : rawContent;

  return new Paragraph({
    heading: headingLevel,
    spacing: {
      before: spacingBefore,
      after: spacingAfter,
      line: Math.round(fontSize * 1.15 * 10), // 1.15 line height matching body text
    },
    // Explicitly no indents - text content respects page margins
    indent: {
      left: 0,
      right: 0,
    },
    // Keep heading with following content to avoid orphan headers at page bottom
    keepNext: true,
    border: hasBorder ? {
      bottom: {
        color: STYLES.colors.black,
        space: 1,
        style: BorderStyle.SINGLE,
        size: borderSize,
      },
    } : undefined,
    children: [
      new TextRun({
        text: numberedContent,
        font: STYLES.fonts.headers, // Open Sans font
        size: fontSize,
        bold: true,
        color: level === 1 ? STYLES.colors.blue : STYLES.colors.black, // Main heading (H1) in blue, others in black
        characterSpacing: letterSpacing,
      }),
    ],
  });
}

/**
 * Check if a line appears to be a country name or address-ending line
 * Detects lines like "United Arab Emirates", "Bengaluru, India", "City Center, Dar-Es-Salaam", etc.
 */
function isCountryNameLine(line: string): boolean {
  const trimmed = line.trim();
  
  // Common country names (case-insensitive matching)
  const countries = [
    'united arab emirates', 'uae', 'india', 'south africa', 'zimbabwe', 
    'tanzania', 'kenya', 'uganda', 'ghana', 'nigeria', 'egypt', 'morocco',
    'algeria', 'tunisia', 'libya', 'sudan', 'ethiopia', 'somalia', 'djibouti',
    'eritrea', 'mauritania', 'mali', 'niger', 'chad', 'burkina faso', 'senegal',
    'guinea', 'sierra leone', 'liberia', 'ivory coast', 'togo', 'benin',
    'cameroon', 'central african republic', 'equatorial guinea', 'gabon',
    'republic of the congo', 'democratic republic of the congo', 'angola',
    'zambia', 'malawi', 'mozambique', 'madagascar', 'mauritius', 'seychelles',
    'comoros', 'cape verde', 'são tomé and príncipe', 'guinea-bissau', 'gambia',
    'rwanda', 'burundi', 'lesotho', 'swaziland', 'eswatini', 'botswana', 'namibia'
  ];
  
  const lowerTrimmed = trimmed.toLowerCase();
  
  // Check if line is a standalone country name
  if (countries.some(country => lowerTrimmed === country)) {
    return true;
  }
  
  // Check if line ends with ", Country" pattern
  // Match: "City, Country" or "Location, City" or "City, Country"
  const commaPattern = /,\s*([A-Z][a-zA-Z\s-]+)$/;
  const match = trimmed.match(commaPattern);
  if (match) {
    const afterComma = match[1].trim().toLowerCase();
    // Check if it's a known country
    if (countries.some(country => afterComma === country)) {
      return true;
    }
    // Check for common city names that appear at end of addresses
    const commonEndCities = ['dar-es-salaam', 'harare', 'bengaluru', 'bangalore'];
    if (commonEndCities.some(city => afterComma === city)) {
      return true;
    }
  }
  
  // Check for patterns like "City, Country" where we recognize the country part
  // This catches cases like "Bengaluru, India", "Midrand, South Africa", "Harare, Zimbabwe"
  const countryInLine = countries.some(country => {
    const regex = new RegExp(`,\\s*${country.replace(/\s+/g, '\\s+')}$`, 'i');
    return regex.test(trimmed);
  });
  
  if (countryInLine) {
    return true;
  }
  
  return false;
}

/**
 * Check if a line is an office section heading (e.g., "GLOBAL HEADQUARTERS", "INDIA OFFICE", "ZIMBABWE")
 */
function isOfficeSectionHeading(line: string): boolean {
  const trimmed = line.trim();
  
  // Check if line is wrapped in bold markers (typical for office headings)
  const isBold = trimmed.startsWith('**') && trimmed.endsWith('**');
  
  // Remove markdown bold markers if present
  const cleanLine = trimmed.replace(/\*\*/g, '').trim();
  
  // Check if it's all uppercase (typical for office headings)
  const isAllUppercase = cleanLine === cleanLine.toUpperCase() && cleanLine.length > 2;
  
  // Check for common office heading patterns
  const officePatterns = [
    /^(GLOBAL HEADQUARTERS|INDIA OFFICE|TANZANIA OFFICE|SOUTH AFRICA OFFICE|ZIMBABWE)$/i,
    /\s+OFFICE$/i, // Ends with "OFFICE"
  ];
  
  const matchesOfficePattern = officePatterns.some(pattern => pattern.test(cleanLine));
  
  // Also check if it's a standalone country name that's all uppercase (like "ZIMBABWE")
  const isStandaloneCountry = isAllUppercase && isCountryNameLine(cleanLine);
  
  // Office headings are typically bold and all uppercase, or match known patterns
  return (isBold && isAllUppercase) || matchesOfficePattern || (isAllUppercase && cleanLine.length > 3 && !cleanLine.includes(','));
}

function createParagraph(section: ParsedSection): Paragraph | Paragraph[] {
  // Check if content has multiple lines (like Contact Us section)
  if (section.content.includes('\n')) {
    const lines = section.content.split('\n').filter(line => line.trim());
    
    return lines.map((line, index) => {
      const formattedParts = parseInlineFormatting(line);
      const isCountryLine = isCountryNameLine(line);
      
      // Check if current line is "Contact No:" or similar contact info
      const isContactInfoLine = /^(Contact No|Phone|Email|Website):/i.test(line.trim());
      
      // Check if next line is "Contact No:" or similar contact info
      const nextLine = index < lines.length - 1 ? lines[index + 1].trim() : '';
      const isNextLineContactInfo = /^(Contact No|Phone|Email|Website):/i.test(nextLine);
      
      // Check if next line is an office section heading
      const isNextLineOfficeHeading = isOfficeSectionHeading(nextLine);
      
      // Determine spacing:
      // 1. Country lines: add spacing if NOT followed by contact info
      // 2. Contact info lines: add spacing if followed by office heading
      // 3. Otherwise: use default spacing
      let spacingAfter: number;
      if (isCountryLine && !isNextLineContactInfo) {
        spacingAfter = 360; // 18pt spacing after country names (when not followed by contact info)
      } else if (isContactInfoLine && isNextLineOfficeHeading) {
        spacingAfter = 360; // 18pt spacing after contact info when followed by new office section
      } else if (index === lines.length - 1) {
        spacingAfter = STYLES.spacing.paragraphAfter; // Last line uses paragraph spacing
      } else {
        spacingAfter = 80; // Smaller gap between lines
      }
      
      return new Paragraph({
        spacing: {
        after: spacingAfter,
        line: STYLES.spacing.bodyLineHeight, // Exactly 1.15 line height (253 twips)
        },
        alignment: AlignmentType.LEFT, // Left align for structured content like Contact Us
        // Explicitly no indents - text content respects page margins
        indent: {
          left: 0,
          right: 0,
        },
        children: formattedParts.map(part => 
          new TextRun({
            text: part.text,
            font: STYLES.fonts.body,
            size: STYLES.sizes.body,
            color: STYLES.colors.black,
            bold: part.bold,
            italics: part.italic,
            underline: part.underline ? {} : undefined,
          })
        ),
      });
    });
  }
  
  // Single line paragraph
  const formattedParts = parseInlineFormatting(section.content);
  
  return new Paragraph({
    spacing: {
      after: STYLES.spacing.paragraphAfter,
      line: STYLES.spacing.bodyLineHeight, // Exactly 1.15 line height (253 twips)
    },
    alignment: AlignmentType.JUSTIFIED,
    // Explicitly no indents - text content respects page margins
    indent: {
      left: 0,
      right: 0,
    },
    children: formattedParts.map(part => 
      new TextRun({
        text: part.text,
        font: STYLES.fonts.body,
        size: STYLES.sizes.body,
        color: STYLES.colors.black,
        bold: part.bold,
        italics: part.italic,
        underline: part.underline ? {} : undefined,
      })
    ),
  });
}

// Table of Contents (uses heading styles 1-3)
function createTableOfContentsElements(): Paragraph[] {
  return [
    new Paragraph({
      children: [
        new TableOfContents(' ', {
          hyperlink: true,
          headingStyleRange: '1-3',
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 320 },
      children: [],
    }),
  ];
}

function createList(section: ParsedSection): Paragraph[] {
  if (!section.listItems) return [];

  return section.listItems.map((item) => {
    // Parse inline formatting for each list item
    const formattedParts = parseInlineFormatting(item);
    
    // Create bullet character as first text run
    const bulletRun = new TextRun({
      text: '• ',
      font: STYLES.fonts.body,
      size: STYLES.sizes.body,
      color: STYLES.colors.black,
    });
    
    // Create text runs from formatted parts
    const textRuns = formattedParts.map(part => 
      new TextRun({
        text: part.text,
        font: STYLES.fonts.body,
        size: STYLES.sizes.body,
        color: STYLES.colors.black,
        bold: part.bold,
        italics: part.italic,
        underline: part.underline ? {} : undefined,
      })
    );
    
    return new Paragraph({
      spacing: {
        after: 120, // 6pt
        line: STYLES.spacing.bodyLineHeight, // Exactly 1.15 line height (253 twips)
      },
      alignment: AlignmentType.JUSTIFIED, // Justify bullet point content to match regular paragraphs
      indent: {
        left: convertInchesToTwip(0.25), // Indent for bullet
        hanging: convertInchesToTwip(0.25), // Hanging indent
      },
      children: [bulletRun, ...textRuns],
    });
  });
}

async function createTable(tableData: { headerRows?: CellData[][]; headers?: string[]; rows: CellData[][]; columnWidths?: number[]; tableStyle?: { fontFamily?: string; fontSize?: string; borderColor?: string } }): Promise<(Paragraph | Table)[]> {
  const { headerRows, headers, rows, columnWidths, tableStyle } = tableData;
  
  // Extract table-level styles with defaults matching find_query.json
  const tableFontFamily = tableStyle?.fontFamily || STYLES.fonts.body; // Use Lato for tables
  const tableFontSize = tableStyle?.fontSize ? parseFloat(tableStyle.fontSize) : 12; // Default 12pt
  const tableFontSizeHalfPoints = 24; // 12pt = 24 half-points (consistent with STYLES.sizes.table)
  const tableBorderColor = tableStyle?.borderColor || 'CCCCCC'; // Default #cccccc from JSON
  
  console.log(`createTable called with:`, {
    headerRowsCount: headerRows?.length || 0,
    headersCount: headers?.length || 0,
    rowsCount: rows.length,
    columnWidths: columnWidths?.length || 0
  });
  
  // Detect image-only tables (e.g., Our Clientele logos) to strip borders/shading/margins
  const isImageOnlyTable = (() => {
    const checkCells = (cells: CellData[]) =>
      cells.every(
        (c) =>
          ((c.images && c.images.length > 0) || (c.image && c.image.src)) &&
          (!c.text || c.text.trim() === '')
      );
    const allRows = [
      ...(headerRows || []),
      ...(rows || []),
    ];
    if (allRows.length === 0) return false;
    return allRows.every(checkCells);
  })();

  // Border definition for removing borders
  const borderNone = {
    style: BorderStyle.NONE,
    size: 0,
    color: 'FFFFFF',
  };

  if ((!headerRows || headerRows.length === 0) && (!headers || headers.length === 0) && rows.length === 0) {
    console.log('  Table is empty, returning []');
    return [];
  }

  // Calculate column count from the longest row
  const allRowLengths = [
    ...(headerRows || []).map(hr => hr.length),
    ...(headers ? [headers.length] : []),
    ...rows.map(r => r.length)
  ];
  const columnCount = Math.max(...allRowLengths, 1);
  
  // Use provided column widths if available, otherwise calculate equal widths
  const effectiveColumnWidths: number[] = columnWidths && columnWidths.length > 0 && columnWidths.length === columnCount
    ? columnWidths
    : Array(columnCount).fill(100 / columnCount);
  
  console.log(`  Column widths:`, effectiveColumnWidths);

  console.log(`  Creating table: ${columnCount} columns, ${headerRows?.length || (headers ? 1 : 0)} header rows, ${rows.length} data rows`);

  const tableRows: TableRow[] = [];

  // Add all header rows (supporting multi-row headers)
  const headerRowsToProcess = headerRows && headerRows.length > 0 ? headerRows : (headers && headers.length > 0 ? [headers.map(h => ({ text: h }))] : []);
  
  // Only process header rows if we have any
  if (headerRowsToProcess.length > 0) {
    // Pad all header rows to match column count
    const paddedHeaderRows = headerRowsToProcess.map(headerRow => {
      const padded: CellData[] = [...headerRow];
      while (padded.length < columnCount) {
        padded.push({ text: '' } as CellData);
      }
      return padded;
    });
    
    for (const headerRow of paddedHeaderRows) {
    const headerCells: TableCell[] = [];
    let skipNext = 0;
    
    for (let i = 0; i < headerRow.length; i++) {
      if (skipNext > 0) {
        skipNext--;
        continue;
      }
      
      const cellData: CellData = headerRow[i];
      
      // Check if next cells are empty (indicating colspan)
      // BUT: Only apply colspan if the CURRENT cell has content
      // If current cell is empty, it should be rendered as an individual empty cell
      let colspan = 1;
      const hasContent = cellData.text || (cellData.images && cellData.images.length > 0) || ('image' in cellData && cellData.image);
      
      if (hasContent) {
        // Current cell has content, check for empty cells after it (colspan pattern)
        while (i + colspan < headerRow.length) {
          const nextCell: CellData = headerRow[i + colspan];
          // Skip empty cells (no text and no images)
          if (nextCell && (!nextCell.text || nextCell.text.trim() === '') && !(nextCell.images && nextCell.images.length > 0) && !('image' in nextCell && nextCell.image)) {
            colspan++;
          } else {
            break;
          }
        }
      }
      // If current cell is empty, colspan stays 1 (render as single empty cell)
      
      skipNext = colspan - 1;
      
      console.log(`  Header cell ${i}: "${cellData.text || ''}" (colspan=${colspan})`);
      
      // Calculate column width for this cell (sum of widths for spanned columns)
      let cellWidth = 0;
      for (let j = 0; j < colspan; j++) {
        const colIndex = Math.min(i + j, effectiveColumnWidths.length - 1);
        cellWidth += effectiveColumnWidths[colIndex] || (100 / columnCount);
      }
      
      // Extract cell styles
      const cellStyle = cellData.style || {};
      const textAlign = cellStyle.textAlign || 'left';
      const verticalAlign = cellStyle.verticalAlign || 'top';
      const cellPadding = isImageOnlyTable ? 0 : (cellStyle.padding || 160); // No padding for image-only grid
      const cellBorderColor = tableBorderColor; // Use table-level border color (ignored if image-only)
      
      // Create cell children (can have multiple images and/or text)
      const cellChildren: Paragraph[] = [];
      
      // Handle images (can be multiple)
      const hasImages = (cellData.images && cellData.images.length > 0) || ('image' in cellData && cellData.image);
      
      // For image-only tables, always center images
      const imageAlignment = isImageOnlyTable ? 'center' : textAlign;
      
      if (cellData.images && cellData.images.length > 0) {
        for (const img of cellData.images) {
          const imagePara = await createTableImage(img, imageAlignment, isImageOnlyTable);
          if (imagePara) {
            cellChildren.push(imagePara);
          }
        }
      } else if ('image' in cellData && cellData.image) {
        // Legacy support for single image
        const imagePara = await createTableImage(cellData.image, imageAlignment, isImageOnlyTable);
        if (imagePara) {
          cellChildren.push(imagePara);
        }
      }
      
      // Handle text (can coexist with images)
      if (cellData.text !== undefined && cellData.text !== '') {
        const text = cellData.text;
        
        // Determine alignment for paragraphs
        let paragraphAlignment: typeof AlignmentType[keyof typeof AlignmentType] = AlignmentType.LEFT;
        if (textAlign === 'center') paragraphAlignment = AlignmentType.CENTER;
        else if (textAlign === 'right') paragraphAlignment = AlignmentType.RIGHT;
        else if (textAlign === 'justify') paragraphAlignment = AlignmentType.JUSTIFIED;
        
        // Check if text has multiple lines
        if (text.includes('\n')) {
          // Split into lines and create separate paragraphs
          const lines = text.split('\n').filter(line => line.trim());
          lines.forEach((line, lineIndex) => {
            // Check if line starts with bullet marker (• )
            const isBulletItem = line.trim().startsWith('• ');
            
            if (isBulletItem) {
              // Remove bullet marker and parse formatting
              const textWithoutBullet = line.trim().substring(2).trim();
              const formattedParts = parseInlineFormatting(textWithoutBullet);
              
              // Create bullet character as first text run
              const bulletRun = new TextRun({
                text: '• ',
                font: tableFontFamily,
                size: tableFontSizeHalfPoints,
                color: STYLES.colors.headerText, // White text for headers
              });
              
              // Create text runs from formatted parts
              const textRuns = formattedParts.map(part => 
                new TextRun({
                  text: part.text,
                  font: tableFontFamily,
                  size: tableFontSizeHalfPoints,
                  color: STYLES.colors.headerText, // White text for headers
                  bold: part.bold || cellStyle.fontWeight === 'bold',
                  italics: part.italic,
                  underline: part.underline ? {} : undefined,
                })
              );
              
              cellChildren.push(
                new Paragraph({
                  alignment: paragraphAlignment,
                  spacing: {
                    after: lineIndex === lines.length - 1 ? 0 : 80, // Small gap between lines
                    line: 372, // 1.55 line height
                  },
                  indent: {
                    left: convertInchesToTwip(0.15), // Indent for bullet
                    hanging: convertInchesToTwip(0.15), // Hanging indent
                  },
                  children: [bulletRun, ...textRuns],
                })
              );
            } else {
              // Regular line - parse formatting
              const formattedParts = parseInlineFormatting(line);
              const textRuns = formattedParts.map(part => 
                new TextRun({
                  text: part.text,
                  font: tableFontFamily,
                  size: tableFontSizeHalfPoints,
                  color: STYLES.colors.headerText, // White text for headers
                  bold: part.bold || cellStyle.fontWeight === 'bold',
                  italics: part.italic,
                  underline: part.underline ? {} : undefined,
                })
              );
              
              cellChildren.push(
                new Paragraph({
                  alignment: paragraphAlignment,
                  spacing: {
                    after: lineIndex === lines.length - 1 ? 0 : 80, // Small gap between lines
                  },
                  children: textRuns,
                })
              );
            }
          });
        } else {
          // Single line text
          cellChildren.push(
            new Paragraph({
              alignment: paragraphAlignment,
              spacing: {
                before: hasImages ? 40 : 100, // Less space if images above
                after: 100,  // 5pt
                line: 240,   // 12pt line height
              },
              children: [
                new TextRun({
                  text: text,
                  font: tableFontFamily,
                  size: tableFontSizeHalfPoints,
                  bold: cellStyle.fontWeight === 'bold' || true, // Headers are usually bold
                  color: STYLES.colors.headerText, // White text for headers
                }),
              ],
            })
          );
        }
      } else if (!hasImages) {
        // Empty cell - add space to ensure borders render
        cellChildren.push(
          new Paragraph({
            alignment: textAlign === 'center' ? AlignmentType.CENTER : (textAlign === 'right' ? AlignmentType.RIGHT : AlignmentType.LEFT),
            spacing: {
              before: 100, // 5pt
              after: 100,  // 5pt
              line: 240,   // 12pt line height
            },
            children: [
              new TextRun({
                text: ' ', // Regular space for empty cells to ensure borders render
                font: tableFontFamily,
                size: tableFontSizeHalfPoints,
                bold: true, // Headers are always bold
                color: STYLES.colors.headerText, // White text for headers
              }),
            ],
          })
        );
      }
      
      // Determine vertical alignment - force center for image-only tables
      let verticalAlignment: 'top' | 'center' | 'bottom' = isImageOnlyTable ? 'center' : 'top';
      if (!isImageOnlyTable) {
        if (verticalAlign === 'middle') verticalAlignment = 'center';
        else if (verticalAlign === 'bottom') verticalAlignment = 'bottom';
      }
      
      headerCells.push(
        new TableCell({
          columnSpan: colspan,
          verticalAlign: verticalAlignment,
          shading: isImageOnlyTable ? undefined : {
            fill: STYLES.colors.headerBg,
            type: ShadingType.CLEAR,
          },
          borders: isImageOnlyTable ? {
            top: borderNone,
            bottom: borderNone,
            left: borderNone,
            right: borderNone,
          } : {
            top: { style: BorderStyle.SINGLE, size: 4, color: cellBorderColor },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: cellBorderColor },
            left: { style: BorderStyle.SINGLE, size: 4, color: cellBorderColor },
            right: { style: BorderStyle.SINGLE, size: 4, color: cellBorderColor },
          },
          margins: isImageOnlyTable ? undefined : {
            top: cellPadding,
            bottom: cellPadding,
            left: cellPadding,
            right: cellPadding,
          },
          width: {
            size: cellWidth,
            type: WidthType.PERCENTAGE,
          },
          children: cellChildren,
        })
      );
    }
    
    tableRows.push(new TableRow({ children: headerCells }));
    }
  }

  // Add data rows with same background color for all rows
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    const fillColor = STYLES.colors.rowBg; // Same color for all data rows
    const rowCells: TableCell[] = [];
    let skipNext = 0;
    
    // Pad row to match column count if needed
    const paddedRow: CellData[] = [...row];
    while (paddedRow.length < columnCount) {
      paddedRow.push({ text: '' } as CellData);
    }
    
    for (let i = 0; i < paddedRow.length; i++) {
      if (skipNext > 0) {
        skipNext--;
        continue;
      }
      
      const cellData: CellData = paddedRow[i];
      
      // Debug: Log empty cells
      if (!cellData.text || cellData.text.trim() === '') {
        console.log(`  Creating empty cell at position ${i} in data row ${rowIndex}`);
      }
      
      // For data rows, NEVER apply colspan - every cell should be individual
      // This ensures all empty cells in week columns render with borders
      const colspan = 1;
      skipNext = 0;
      
      console.log(`  Processing cell ${i}: "${cellData.text || ''}" (colspan=${colspan})`);
      
      // Calculate column width for this cell
      const cellWidth = effectiveColumnWidths[Math.min(i, effectiveColumnWidths.length - 1)] || (100 / columnCount);
      
      // Extract cell styles
      const cellStyle = cellData.style || {};
      const textAlign = cellStyle.textAlign || 'left';
      const verticalAlign = cellStyle.verticalAlign || 'top';
      const cellPadding = isImageOnlyTable ? 0 : (cellStyle.padding || 160); // No padding for image-only grid
      const cellBorderColor = tableBorderColor; // Use table-level border color (ignored if image-only)
      
      // Create cell children (can have multiple images and/or text)
      const cellChildren: Paragraph[] = [];
      
      // Handle images (can be multiple)
      const hasImages = (cellData.images && cellData.images.length > 0) || ('image' in cellData && cellData.image);
      
      // For image-only tables, always center images
      const imageAlignment = isImageOnlyTable ? 'center' : textAlign;
      
      if (cellData.images && cellData.images.length > 0) {
        for (const img of cellData.images) {
          const imagePara = await createTableImage(img, imageAlignment, isImageOnlyTable);
          if (imagePara) {
            cellChildren.push(imagePara);
          }
        }
      } else if ('image' in cellData && cellData.image) {
        // Legacy support for single image
        const imagePara = await createTableImage(cellData.image, imageAlignment, isImageOnlyTable);
        if (imagePara) {
          cellChildren.push(imagePara);
        }
      }
      
      // Handle text (can coexist with images)
      if (cellData.text !== undefined && cellData.text !== '') {
        const text = cellData.text;
        
        // Determine alignment for paragraphs
        let paragraphAlignment: typeof AlignmentType[keyof typeof AlignmentType] = AlignmentType.LEFT;
        if (textAlign === 'center') paragraphAlignment = AlignmentType.CENTER;
        else if (textAlign === 'right') paragraphAlignment = AlignmentType.RIGHT;
        else if (textAlign === 'justify') paragraphAlignment = AlignmentType.JUSTIFIED;
        
        // Check if text has multiple lines
        if (text.includes('\n')) {
          // Split into lines and create separate paragraphs
          const lines = text.split('\n').filter(line => line.trim());
          lines.forEach((line, lineIndex) => {
            cellChildren.push(
              new Paragraph({
                alignment: paragraphAlignment,
                spacing: {
                  after: lineIndex === lines.length - 1 ? 0 : 80, // Small gap between lines
                },
                children: parseInlineFormatting(line).map(part => 
                  new TextRun({
                    text: part.text,
                    font: tableFontFamily,
                    size: tableFontSizeHalfPoints,
                    color: STYLES.colors.black,
                    bold: part.bold || cellStyle.fontWeight === 'bold',
                    italics: part.italic,
                    underline: part.underline ? {} : undefined,
                  })
                ),
              })
            );
          });
        } else {
          // Single line text
          const formattedParts = parseInlineFormatting(text);
          cellChildren.push(
            new Paragraph({
              alignment: paragraphAlignment,
              spacing: {
                before: hasImages ? 40 : 100, // Less space if images above
                after: 100,  // 5pt
                line: 240,   // 12pt line height
              },
              children: formattedParts.length > 0
                ? formattedParts.map(part => 
                    new TextRun({
                      text: part.text,
                      font: tableFontFamily,
                      size: tableFontSizeHalfPoints,
                      color: STYLES.colors.black,
                      bold: part.bold || cellStyle.fontWeight === 'bold',
                      italics: part.italic,
                      underline: part.underline ? {} : undefined,
                    })
                  )
                : [
                    new TextRun({
                      text: ' ', // Regular space for empty cells to ensure borders render
                      font: tableFontFamily,
                      size: tableFontSizeHalfPoints,
                      color: STYLES.colors.black,
                    })
                  ],
            })
          );
        }
      } else if (!hasImages) {
        // Empty cell - add space to ensure borders render
        cellChildren.push(
          new Paragraph({
            alignment: textAlign === 'center' ? AlignmentType.CENTER : (textAlign === 'right' ? AlignmentType.RIGHT : AlignmentType.LEFT),
            spacing: {
              before: 100, // 5pt
              after: 100,  // 5pt
              line: 240,   // 12pt line height
            },
            children: [
              new TextRun({
                text: ' ', // Regular space for empty cells to ensure borders render
                font: tableFontFamily,
                size: tableFontSizeHalfPoints,
                color: STYLES.colors.black,
              })
            ],
          })
        );
      }
      
      // Determine vertical alignment - force center for image-only tables
      let verticalAlignment: 'top' | 'center' | 'bottom' = isImageOnlyTable ? 'center' : 'top';
      if (!isImageOnlyTable) {
        if (verticalAlign === 'middle') verticalAlignment = 'center';
        else if (verticalAlign === 'bottom') verticalAlignment = 'bottom';
      }
      
      rowCells.push(
        new TableCell({
          columnSpan: colspan,
          verticalAlign: verticalAlignment,
          shading: isImageOnlyTable ? undefined : {
            fill: fillColor,
            type: ShadingType.CLEAR,
          },
          borders: isImageOnlyTable ? {
            top: borderNone,
            bottom: borderNone,
            left: borderNone,
            right: borderNone,
          } : {
            top: { style: BorderStyle.SINGLE, size: 4, color: cellBorderColor },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: cellBorderColor },
            left: { style: BorderStyle.SINGLE, size: 4, color: cellBorderColor },
            right: { style: BorderStyle.SINGLE, size: 4, color: cellBorderColor },
          },
          margins: isImageOnlyTable ? undefined : {
            top: cellPadding,
            bottom: cellPadding,
            left: cellPadding,
            right: cellPadding,
          },
          width: {
            size: cellWidth,
            type: WidthType.PERCENTAGE,
          },
          children: cellChildren,
        })
      );
    }
    
    tableRows.push(new TableRow({ children: rowCells }));
  }

  if (tableRows.length === 0) {
    console.log('  No table rows created, returning empty array');
    return [];
  }

  const table = new Table({
    rows: tableRows,
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    borders: isImageOnlyTable ? {
      top: borderNone,
      bottom: borderNone,
      left: borderNone,
      right: borderNone,
      insideHorizontal: borderNone,
      insideVertical: borderNone,
    } : {
      top: { style: BorderStyle.SINGLE, size: 4, color: tableBorderColor },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: tableBorderColor },
      left: { style: BorderStyle.SINGLE, size: 4, color: tableBorderColor },
      right: { style: BorderStyle.SINGLE, size: 4, color: tableBorderColor },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: tableBorderColor },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: tableBorderColor },
    },
  });

  console.log(`  Table object created with ${tableRows.length} rows, returning [Paragraph, Table, Paragraph]`);

  // Return table with spacing paragraphs
  // Minimal spacing before table (60 twips = 3pt)
  return [
    new Paragraph({
      spacing: {
        before: 60, // Minimal spacing (3pt) before table
        after: 0,    // No spacing after the spacer paragraph
      },
      children: [],
    }),
    table,
    new Paragraph({
      spacing: {
        after: 160,
      },
      children: [],
    }),
  ];
}

// Helper function to parse style attributes and calculate dimensions
// Uses exact values from markdown style attribute without any constraints
function parseImageDimensions(style?: string, alt?: string, isTableImage: boolean = false): { width: number; height: number } {
  // Default dimensions (only used if no style provided)
  // For table images, use smaller defaults to fit in cells
  let width = isTableImage ? 100 : 600; // pixels (default for table images vs standalone images)
  let height = isTableImage ? 100 : 400;
  
  if (!style) {
    console.log(`  [PARSE DIMENSIONS] No style provided, using defaults:`, { width, height, isTableImage });
    return { width, height };
  }
  
  console.log(`  [PARSE DIMENSIONS] Parsing style:`, { style, isTableImage });
  
  // Parse width from style attribute
  const widthMatch = style.match(/width:\s*([\d.]+)(in|px|pt|cm|mm)?/i);
  const heightMatch = style.match(/height:\s*([\d.]+)(in|px|pt|cm|mm)?/i);
  
  console.log(`  [PARSE DIMENSIONS] Matches:`, {
    widthMatch: widthMatch ? `${widthMatch[1]}${widthMatch[2] || 'in'}` : 'none',
    heightMatch: heightMatch ? `${heightMatch[1]}${heightMatch[2] || 'in'}` : 'none',
  });
  
  // Convert width to pixels (assuming 96 DPI for Word)
  if (widthMatch) {
    const widthValue = parseFloat(widthMatch[1]);
    const unit = widthMatch[2]?.toLowerCase() || 'in';
    
    console.log(`  [PARSE DIMENSIONS] Converting width:`, { widthValue, unit });
    
    if (unit === 'in' || unit === '') {
      width = widthValue * 96; // 1 inch = 96 pixels
    } else if (unit === 'px') {
      width = widthValue;
    } else if (unit === 'pt') {
      width = (widthValue / 72) * 96; // 1 pt = 1/72 inch
    } else if (unit === 'cm') {
      width = (widthValue / 2.54) * 96; // 1 cm = 1/2.54 inch
    } else if (unit === 'mm') {
      width = (widthValue / 25.4) * 96; // 1 mm = 1/25.4 inch
    }
    
    console.log(`  [PARSE DIMENSIONS] Width converted:`, { original: `${widthValue}${unit}`, pixels: width });
  }
  
  // Convert height to pixels
  if (heightMatch) {
    const heightValue = parseFloat(heightMatch[1]);
    const unit = heightMatch[2]?.toLowerCase() || 'in';
    
    console.log(`  [PARSE DIMENSIONS] Converting height:`, { heightValue, unit });
    
    if (unit === 'in' || unit === '') {
      height = heightValue * 96;
    } else if (unit === 'px') {
      height = heightValue;
    } else if (unit === 'pt') {
      height = (heightValue / 72) * 96;
    } else if (unit === 'cm') {
      height = (heightValue / 2.54) * 96;
    } else if (unit === 'mm') {
      height = (heightValue / 25.4) * 96;
    }
    
    console.log(`  [PARSE DIMENSIONS] Height converted:`, { original: `${heightValue}${unit}`, pixels: height });
  } else if (widthMatch) {
    // If only width specified, maintain aspect ratio (default 4:3)
    height = width * 0.75;
    console.log(`  [PARSE DIMENSIONS] No height found, using aspect ratio:`, { height });
  }
  
  const result = { width: Math.round(width), height: Math.round(height) };
  console.log(`  [PARSE DIMENSIONS] Final result:`, result);
  return result;
}

async function createTableImage(imageData: { src: string; alt?: string; style?: string }, cellAlignment?: 'left' | 'center' | 'right' | 'justify', isLogoTable: boolean = false): Promise<Paragraph | null> {
  try {
    let imageBuffer: Buffer;
    let imageType: 'png' | 'jpg' | 'gif' | 'bmp' = 'png'; // default
    
    // Handle base64 data URI
    if (imageData.src.startsWith('data:')) {
      const base64Data = imageData.src.split(',')[1];
      if (!base64Data) {
        console.warn('Invalid base64 data in image');
        return null;
      }
      imageBuffer = Buffer.from(base64Data, 'base64');
      
      // Detect type from data URI
      if (imageData.src.includes('image/jpeg') || imageData.src.includes('image/jpg')) {
        imageType = 'jpg';
      } else if (imageData.src.includes('image/png')) {
        imageType = 'png';
      } else if (imageData.src.includes('image/gif')) {
        imageType = 'gif';
      } else if (imageData.src.includes('image/bmp')) {
        imageType = 'bmp';
      }
    }
    // Handle file path
    else {
      let imagePath = imageData.src;
      if (imageData.src.startsWith('./')) {
        imagePath = path.join(process.cwd(), 'public', imageData.src.replace('./', '/'));
      } else if (imageData.src.startsWith('/')) {
        imagePath = path.join(process.cwd(), 'public', imageData.src);
      }
      
      if (fs.existsSync(imagePath)) {
        imageBuffer = fs.readFileSync(imagePath);
        
        // Detect type from file extension
        const ext = path.extname(imagePath).toLowerCase();
        if (ext === '.jpg' || ext === '.jpeg') {
          imageType = 'jpg';
        } else if (ext === '.png') {
          imageType = 'png';
        } else if (ext === '.gif') {
          imageType = 'gif';
        } else if (ext === '.bmp') {
          imageType = 'bmp';
        }
      } else {
        console.warn(`Table image not found: ${imagePath}`);
        return null;
      }
    }

    // Validate image buffer
    if (!imageBuffer || imageBuffer.length === 0) {
      console.warn('Invalid or empty image buffer');
      return null;
    }

    // Parse dimensions from style attribute - use exact values from response
    console.log(`  [TABLE IMAGE] Processing image:`, {
      src: imageData.src.substring(0, 50) + (imageData.src.length > 50 ? '...' : ''),
      hasStyle: !!imageData.style,
      style: imageData.style || 'NO STYLE ATTRIBUTE',
    });
    
    const parsedDims = parseImageDimensions(imageData.style, imageData.alt, true);
    
    console.log(`  [TABLE IMAGE] Parsed dimensions:`, {
      originalStyle: imageData.style || 'none',
      parsedWidth: parsedDims.width,
      parsedHeight: parsedDims.height,
      widthPx: parsedDims.width,
      heightPx: parsedDims.height,
    });
    
    // Use exact dimensions from style attribute (no constraints)
    // The response specifies dimensions in inches (e.g., width:1.09306in;height:0.45in)
    // which are converted to pixels by parseImageDimensions
    // We respect the exact dimensions from the response
    // For logo tables (Our Clientele), scale up images by 20%
    const scaleFactor = isLogoTable ? 1.2 : 1.0;
    const finalWidth = Math.round(parsedDims.width * scaleFactor);
    const finalHeight = Math.round(parsedDims.height * scaleFactor);
    
    console.log(`  [TABLE IMAGE] Final dimensions:`, {
      finalWidth,
      finalHeight,
      usingExactDimensions: true,
    });
    
    // Using proper docx ImageRun API with required type property
    const imageRun = new ImageRun({
      type: imageType,
      data: imageBuffer,
      transformation: {
        width: finalWidth,
        height: finalHeight,
      },
    });

    // Determine alignment based on cell alignment or default to center
    let imageAlignment: typeof AlignmentType[keyof typeof AlignmentType] = AlignmentType.CENTER;
    if (cellAlignment === 'left') imageAlignment = AlignmentType.LEFT;
    else if (cellAlignment === 'right') imageAlignment = AlignmentType.RIGHT;
    else if (cellAlignment === 'center') imageAlignment = AlignmentType.CENTER;
    
    // For logo tables, add vertical spacing between rows
    const spacingBefore = isLogoTable ? 120 : 0; // 6pt spacing before
    const spacingAfter = isLogoTable ? 120 : 0;  // 6pt spacing after
    
    return new Paragraph({
      alignment: imageAlignment,
      spacing: {
        before: spacingBefore,
        after: spacingAfter,
      },
      children: [imageRun],
    });
  } catch (error) {
    console.error('Error creating table image:', error);
    return null;
  }
}

async function createImage(imageData: { src: string; alt?: string; style?: string }): Promise<Paragraph | null> {
  try {
    let imageBuffer: Buffer;
    let imageType: 'png' | 'jpg' | 'gif' | 'bmp' = 'png'; // default
    
    // Handle base64 data URI
    if (imageData.src.startsWith('data:')) {
      const base64Data = imageData.src.split(',')[1];
      if (!base64Data) {
        console.warn('Invalid base64 data in image');
        return null;
      }
      imageBuffer = Buffer.from(base64Data, 'base64');
      
      // Detect type from data URI
      if (imageData.src.includes('image/jpeg') || imageData.src.includes('image/jpg')) {
        imageType = 'jpg';
      } else if (imageData.src.includes('image/png')) {
        imageType = 'png';
      } else if (imageData.src.includes('image/gif')) {
        imageType = 'gif';
      } else if (imageData.src.includes('image/bmp')) {
        imageType = 'bmp';
      }
    }
    // Handle file path
    else {
      let imagePath = imageData.src;
      if (imageData.src.startsWith('./')) {
        imagePath = path.join(process.cwd(), 'public', imageData.src.replace('./', '/'));
      } else if (imageData.src.startsWith('/')) {
        imagePath = path.join(process.cwd(), 'public', imageData.src);
      }
      
      if (fs.existsSync(imagePath)) {
        imageBuffer = fs.readFileSync(imagePath);
        
        // Detect type from file extension
        const ext = path.extname(imagePath).toLowerCase();
        if (ext === '.jpg' || ext === '.jpeg') {
          imageType = 'jpg';
        } else if (ext === '.png') {
          imageType = 'png';
        } else if (ext === '.gif') {
          imageType = 'gif';
        } else if (ext === '.bmp') {
          imageType = 'bmp';
        }
      } else {
        console.warn(`Image not found: ${imagePath}`);
        return null;
      }
    }

    // Validate image buffer
    if (!imageBuffer || imageBuffer.length === 0) {
      console.warn('Invalid or empty image buffer');
      return null;
    }

    // Parse dimensions from style attribute (similar to PDF CSS-based sizing)
    const { width, height } = parseImageDimensions(imageData.style, imageData.alt);
    
    // Using proper docx ImageRun API with required type property
    const imageRun = new ImageRun({
      type: imageType,
      data: imageBuffer,
      transformation: {
        width: width,
        height: height,
      },
    });

    return new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: {
        before: 360,
        after: 360,
      },
      children: [imageRun],
    });
  } catch (error) {
    console.error('Error creating image:', error);
    return null;
  }
}

function createBlockquote(section: ParsedSection): Paragraph {
  const formattedParts = parseInlineFormatting(section.content);
  
  return new Paragraph({
    spacing: {
      before: 360,
      after: 360,
      line: 396, // 1.65 line height
    },
    indent: {
      left: convertInchesToTwip(0.75), // 55pt ≈ 0.75in
    },
    children: formattedParts.map(part => 
      new TextRun({
        text: part.text,
        font: STYLES.fonts.body,
        size: 24, // 12pt
        italics: true, // Blockquotes are italic by default
        bold: part.bold,
        underline: part.underline ? {} : undefined,
        color: STYLES.colors.black,
      })
    ),
  });
}

function createPreformatted(section: ParsedSection): Paragraph {
  return new Paragraph({
    spacing: {
      before: 240,
      after: 240,
      line: 276, // 1.15 line height
    },
    shading: {
      fill: 'FFFFFF',
      type: ShadingType.CLEAR,
    },
    border: {
      top: { style: BorderStyle.SINGLE, size: 4, color: STYLES.colors.border },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: STYLES.colors.border },
      left: { style: BorderStyle.SINGLE, size: 4, color: STYLES.colors.border },
      right: { style: BorderStyle.SINGLE, size: 4, color: STYLES.colors.border },
    },
    children: [
      new TextRun({
        text: section.content,
        font: STYLES.fonts.code,
        size: 14, // 7pt
        color: STYLES.colors.black,
      }),
    ],
  });
}

// Create header with image at the top
async function createHeaderLogo(): Promise<Paragraph | null> {
  try {
    const imagePath = path.join(process.cwd(), 'public', 'media', 'media', 'header_img3.png');
    
    if (!fs.existsSync(imagePath)) {
      console.warn(`Header image not found at: ${imagePath}`);
      return null;
    }
    
    const imageBuffer = fs.readFileSync(imagePath);
    
    if (!imageBuffer || imageBuffer.length === 0) {
      console.warn('Invalid or empty header image buffer');
      return null;
    }
    
    // Get actual image dimensions using sharp
    const sharp = await import('sharp');
    const metadata = await sharp.default(imageBuffer).metadata();
    const imageWidth = metadata.width || 600; // Use actual width or fallback
    const imageHeight = metadata.height || 150; // Use actual height or fallback
    
    console.log(`Header image dimensions: ${imageWidth}x${imageHeight}px`);
    
    // Create image run for header image with exact original dimensions
    const imageRun = new ImageRun({
      type: 'png',
      data: imageBuffer,
      transformation: {
        width: imageWidth,
        height: imageHeight,
      },
    });
    
    // Create paragraph with image at absolute top-left of header (ignoring margins)
    // Use negative indent to position at the absolute left edge of the page
    return new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: {
        before: 0, // No space before - starts at top of header
        after: 0,  // No space after
        line: 200, // Minimal line height
      },
      indent: {
        left: -convertInchesToTwip(1.0), // Negative indent to ignore left margin (1.0 inch = 1440 twips)
      },
      children: [imageRun],
    });
  } catch (error) {
    console.error('Error creating header image:', error);
    return null;
  }
}

// Create footer with "Technical Proposal" on left and page numbers on right
function createFooterContent(): Paragraph[] {
  // Use tab stops for left-right alignment
  // Standard letter page width: 8.5 inches = 12240 twips
  // With 1.0 inch left margin, content area starts at 1440 twips
  // Content width: 6.5 inches = 9360 twips (8.5 - 1.0 left - 1.0 right = 6.5)
  // Set right tab stop at the right edge of content area (respecting margins)
  const rightTabPosition = convertInchesToTwip(6.5); // Rightmost position within content area
  
  return [
    // First paragraph: Blue separator line
    new Paragraph({
      spacing: {
        before: 160,  // Space above the line (8pt) - creates gap from document content
        after: 10,    // Minimal space between line and text (2pt) - line close to text
        line: 240,    // Line height for the border paragraph
      },
      border: {
        top: {
          color: '4472C4', // Blue color for separator line (matching screenshot)
          space: 0,   // No space above border
          style: BorderStyle.SINGLE,
          size: 6,    // Line thickness
        },
      },
      // No indent - line respects document margins
      children: [], // Empty paragraph just for the border
    }),
    // Second paragraph: Footer text
    new Paragraph({
      spacing: {
        before: 0,
        after: 0,
        line: 264,   // Line height matching 11pt font (22 half-points * 12 = 264 twips)
      },
      // No indent - footer respects document margins
      tabStops: [
        {
          type: TabStopType.RIGHT,
          position: rightTabPosition,
        },
      ],
      children: [
        // Left side: "Technical Proposal"
        new TextRun({
          text: 'Technical Proposal',
          font: STYLES.fonts.body, // Use body font (Verdana)
          size: 22, // 11pt (matching screenshot font size)
          color: STYLES.colors.black,
        }),
        // Tab to move to right side
        new TextRun({
          text: '\t',
          font: STYLES.fonts.body,
          size: 22,
        }),
        // Right side: Page numbers at rightmost position
        new TextRun({
          children: ['Page ', PageNumber.CURRENT, ' of ', PageNumber.TOTAL_PAGES],
          font: STYLES.fonts.body, // Use body font (Verdana)
          size: 22, // 11pt (matching screenshot font size)
          color: STYLES.colors.black,
        }),
      ],
    }),
  ];
}


