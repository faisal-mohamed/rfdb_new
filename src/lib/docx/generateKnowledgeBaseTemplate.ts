// Knowledge Base Template Generator
// Generates a Word document template with predefined headings and full Word feature support

import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  convertInchesToTwip,
} from 'docx';

// Styling constants matching the document image
// Font: Aptos (Body), Size: 13pt, Reduced margins
const STYLES = {
  // Reduced margins (0.75 inches = standard document margin)
  margins: {
    top: convertInchesToTwip(0.75),
    right: convertInchesToTwip(0.75),
    bottom: convertInchesToTwip(0.75),
    left: convertInchesToTwip(0.75),
  },
  fonts: {
    heading: 'Aptos',      // Microsoft Aptos font
    body: 'Aptos',         // Aptos (Body) - 13pt as shown in image
  },
  sizes: {
    title: 40,     // 20pt for main title (like "Smart Branch" in image)
    heading: 32,    // 16pt for headings (slightly larger than body)
    body: 26,      // 13pt (as shown in toolbar: "13")
  },
  spacing: {
    headingBefore: 240,   // 12pt before heading
    headingAfter: 120,    // 6pt after heading
    paragraphAfter: 120,  // 6pt after paragraph
    lineHeightRatio: 1.15,     // Line height ratio for body text
  },
};

// Calculate line height in twips for body text (13pt * 1.15 line height)
// 13pt = 260 twips, line height = 260 * 1.15 = 299 twips
const BODY_LINE_HEIGHT = Math.round((STYLES.sizes.body / 2) * STYLES.spacing.lineHeightRatio * 20);

export async function generateKnowledgeBaseTemplate(categoryName?: string): Promise<Buffer> {
  try {
    const children: Paragraph[] = [];

    // Main Title (Category Name)
    if (categoryName) {
      children.push(
        new Paragraph({
          spacing: {
            before: 0,
            after: 360,  // 18pt after title
          },
          alignment: AlignmentType.LEFT,
          children: [
            new TextRun({
              text: categoryName,
              font: STYLES.fonts.heading,
              size: STYLES.sizes.title,
              bold: true,
              color: '000000',
            }),
          ],
        })
      );
    }

    // ========== OBJECTIVES SECTION ==========
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: {
          before: STYLES.spacing.headingBefore,
          after: STYLES.spacing.headingAfter,
        },
        alignment: AlignmentType.LEFT,
        children: [
          new TextRun({
            text: 'Objective:',
            font: STYLES.fonts.heading,
            size: STYLES.sizes.heading,
            bold: true,
            color: '000000',
          }),
        ],
      })
    );

    // Placeholder paragraph for Objectives
    children.push(
      new Paragraph({
        spacing: {
          after: STYLES.spacing.paragraphAfter,
          line: BODY_LINE_HEIGHT,
        },
        alignment: AlignmentType.LEFT,
        children: [
          new TextRun({
            text: 'Enter your objectives here...',
            font: STYLES.fonts.body,
            size: STYLES.sizes.body,
            color: '000000',
          }),
        ],
      })
    );

    // ========== SCOPE OF WORK SECTION ==========
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: {
          before: STYLES.spacing.headingBefore,
          after: STYLES.spacing.headingAfter,
        },
        alignment: AlignmentType.LEFT,
        children: [
          new TextRun({
            text: 'Scope of Work:',
            font: STYLES.fonts.heading,
            size: STYLES.sizes.heading,
            bold: true,
            color: '000000',
          }),
        ],
      })
    );

    // Placeholder paragraph for Scope of Work
    children.push(
      new Paragraph({
        spacing: {
          after: STYLES.spacing.paragraphAfter,
          line: BODY_LINE_HEIGHT,
        },
        alignment: AlignmentType.LEFT,
        children: [
          new TextRun({
            text: 'Enter the scope of work here...',
            font: STYLES.fonts.body,
            size: STYLES.sizes.body,
            color: '000000',
          }),
        ],
      })
    );

    // ========== PROPOSED SOLUTION SECTION ==========
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: {
          before: STYLES.spacing.headingBefore,
          after: STYLES.spacing.headingAfter,
        },
        alignment: AlignmentType.LEFT,
        children: [
          new TextRun({
            text: 'Proposed Solution:',
            font: STYLES.fonts.heading,
            size: STYLES.sizes.heading,
            bold: true,
            color: '000000',
          }),
        ],
      })
    );

    // Placeholder paragraph for Proposed Solution
    children.push(
      new Paragraph({
        spacing: {
          after: STYLES.spacing.paragraphAfter,
          line: BODY_LINE_HEIGHT,
        },
        alignment: AlignmentType.LEFT,
        children: [
          new TextRun({
            text: 'Enter your proposed solution here...',
            font: STYLES.fonts.body,
            size: STYLES.sizes.body,
            color: '000000',
          }),
        ],
      })
    );

    // Create the document
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: STYLES.margins,
            },
          },
          children,
        },
      ],
    });

    // Convert to buffer
    const { Packer } = await import('docx');
    const buffer = await Packer.toBuffer(doc);

    return buffer;
  } catch (error) {
    console.error('Error generating knowledge base template:', error);
    throw new Error(
      `Failed to generate knowledge base template: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

