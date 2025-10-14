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
} from 'docx';
import { parseV1Content, ParsedSection, extractV1Content, parseInlineFormatting, TextPart, CellData } from '../v1-content-parser';
import fs from 'fs';
import path from 'path';

// Styling constants matching PDF
const STYLES = {
  // Margins (in twips: 1 inch = 1440 twips)
  margins: {
    top: convertInchesToTwip(1),
    right: convertInchesToTwip(1),
    bottom: convertInchesToTwip(0.85),
    left: convertInchesToTwip(1),
  },
  
  // Fonts
  fonts: {
    body: 'Times New Roman',
    headers: 'Arial',
    code: 'Courier New',
  },
  
  // Font sizes (in half-points: 13pt = 26)
  sizes: {
    body: 26,      // 13pt
    h1: 40,        // 20pt
    h2: 32,        // 16pt
    h3: 28,        // 14pt
    h4: 26,        // 13pt
    table: 18,     // 9pt
    code: 22,      // 11pt
  },
  
  // Colors
  colors: {
    black: '000000',
    headerBg: 'E8E8E8',
    rowEven: 'F5F5F5',
    rowOdd: 'FFFFFF',
    border: '000000',
  },
  
  // Spacing (in twips)
  spacing: {
    lineHeight: 1.7,
    h1Before: 0,
    h1After: 280,   // 14pt
    h2Before: 320,  // 16pt
    h2After: 240,   // 12pt
    h3Before: 240,  // 12pt
    h3After: 160,   // 8pt
    paragraphAfter: 200, // 10pt
  },
};

export async function generateV1WordDocument(v1Data: any): Promise<Buffer> {
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
    const validChildren = documentChildren.filter(child => child !== null && child !== undefined);
    
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
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: STYLES.margins,
            },
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      children: ['Page ', PageNumber.CURRENT, ' of ', PageNumber.TOTAL_PAGES],
                      font: STYLES.fonts.headers,
                      size: 18, // 9pt
                      color: STYLES.colors.black,
                    }),
                  ],
                  border: {
                    top: {
                      color: STYLES.colors.black,
                      space: 1,
                      style: BorderStyle.SINGLE,
                      size: 6,
                    },
                  },
                  spacing: {
                    before: 160,
                  },
                }),
              ],
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

async function convertSectionsToDocx(sections: ParsedSection[]): Promise<(Paragraph | Table)[]> {
  const elements: (Paragraph | Table)[] = [];

  for (const section of sections) {
    switch (section.type) {
      case 'header':
        elements.push(createHeader(section));
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

function createHeader(section: ParsedSection): Paragraph {
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
      upperCase = true;
      letterSpacing = 50; // 0.12em approximation
      hasBorder = true;
      borderSize = 15; // 2.5pt
      break;
    case 2:
      headingLevel = HeadingLevel.HEADING_2;
      fontSize = STYLES.sizes.h2;
      spacingBefore = STYLES.spacing.h2Before;
      spacingAfter = STYLES.spacing.h2After;
      upperCase = true;
      letterSpacing = 40; // 0.1em approximation
      hasBorder = true;
      borderSize = 12; // 2pt
      break;
    case 3:
      headingLevel = HeadingLevel.HEADING_3;
      fontSize = STYLES.sizes.h3;
      spacingBefore = STYLES.spacing.h3Before;
      spacingAfter = STYLES.spacing.h3After;
      break;
    default:
      headingLevel = HeadingLevel.HEADING_4;
      fontSize = STYLES.sizes.h4;
      spacingBefore = 200;
      spacingAfter = 120;
  }

  const content = upperCase ? section.content.toUpperCase() : section.content;

  return new Paragraph({
    heading: headingLevel,
    spacing: {
      before: spacingBefore,
      after: spacingAfter,
      line: 280, // 1.2 line height
    },
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
        text: content,
        font: STYLES.fonts.headers,
        size: fontSize,
        bold: true,
        color: STYLES.colors.black,
        characterSpacing: letterSpacing,
      }),
    ],
  });
}

function createParagraph(section: ParsedSection): Paragraph | Paragraph[] {
  // Check if content has multiple lines (like Contact Us section)
  if (section.content.includes('\n')) {
    const lines = section.content.split('\n').filter(line => line.trim());
    
    return lines.map((line, index) => {
      const formattedParts = parseInlineFormatting(line);
      
      return new Paragraph({
        spacing: {
          after: index === lines.length - 1 ? STYLES.spacing.paragraphAfter : 80, // Smaller gap between lines
          line: 408, // 1.7 line height
        },
        alignment: AlignmentType.LEFT, // Left align for structured content like Contact Us
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
      line: 408, // 1.7 line height (240 * 1.7)
    },
    alignment: AlignmentType.JUSTIFIED,
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

function createList(section: ParsedSection): Paragraph[] {
  if (!section.listItems) return [];

  return section.listItems.map((item) => {
    // Parse inline formatting for each list item
    const formattedParts = parseInlineFormatting(item);
    
    return new Paragraph({
      bullet: {
        level: 0,
      },
      spacing: {
        after: 120, // 6pt
        line: 372, // 1.55 line height
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

async function createTable(tableData: { headerRows?: CellData[][]; headers?: string[]; rows: CellData[][] }): Promise<(Paragraph | Table)[]> {
  const { headerRows, headers, rows } = tableData;
  
  console.log(`createTable called with:`, {
    headerRowsCount: headerRows?.length || 0,
    headersCount: headers?.length || 0,
    rowsCount: rows.length
  });
  
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
  const columnWidth = 100 / columnCount;

  console.log(`  Creating table: ${columnCount} columns, ${headerRows?.length || (headers ? 1 : 0)} header rows, ${rows.length} data rows`);

  const tableRows: TableRow[] = [];

  // Add all header rows (supporting multi-row headers)
  const headerRowsToProcess = headerRows && headerRows.length > 0 ? headerRows : (headers ? [headers.map(h => ({ text: h }))] : []);
  
  // Pad all header rows to match column count
  const paddedHeaderRows = headerRowsToProcess.map(headerRow => {
    const padded = [...headerRow];
    while (padded.length < columnCount) {
      padded.push({ text: '' });
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
      
      const cellData = headerRow[i];
      
      // Check if next cells are empty (indicating colspan)
      // BUT: Only apply colspan if the CURRENT cell has content
      // If current cell is empty, it should be rendered as an individual empty cell
      let colspan = 1;
      const hasContent = cellData.text || ('image' in cellData && cellData.image);
      
      if (hasContent) {
        // Current cell has content, check for empty cells after it (colspan pattern)
        while (i + colspan < headerRow.length) {
          const nextCell = headerRow[i + colspan] as CellData;
          // Skip empty cells (no text and no image)
          if (nextCell && (!nextCell.text || nextCell.text.trim() === '') && !('image' in nextCell && nextCell.image)) {
            colspan++;
          } else {
            break;
          }
        }
      }
      // If current cell is empty, colspan stays 1 (render as single empty cell)
      
      skipNext = colspan - 1;
      
      console.log(`  Header cell ${i}: "${cellData.text || ''}" (colspan=${colspan})`);
      
      // Create cell children (image or text)
      const cellChildren: Paragraph[] = [];
      
      if ('image' in cellData && cellData.image) {
        // Cell contains image
        const imagePara = await createTableImage(cellData.image);
        if (imagePara) {
          cellChildren.push(imagePara);
        }
      } else {
        // Cell contains text
        const text = cellData.text || '';
        
        // Check if text has multiple lines
        if (text && text.includes('\n')) {
          // Split into lines and create separate paragraphs
          const lines = text.split('\n').filter(line => line.trim());
          lines.forEach((line, lineIndex) => {
            cellChildren.push(
              new Paragraph({
                spacing: {
                  after: lineIndex === lines.length - 1 ? 0 : 80, // Small gap between lines
                },
                children: [
                  new TextRun({
                    text: line,
                    font: STYLES.fonts.headers,
                    size: STYLES.sizes.table,
                    bold: true, // Headers are always bold
                    color: STYLES.colors.black,
                  }),
                ],
              })
            );
          });
        } else {
          // Single line text (including empty cells)
          cellChildren.push(
            new Paragraph({
              spacing: {
                before: 100, // 5pt
                after: 100,  // 5pt
                line: 240,   // 12pt line height
              },
              children: [
                new TextRun({
                  text: text || ' ', // Regular space for empty cells to ensure borders render
                  font: STYLES.fonts.headers,
                  size: STYLES.sizes.table,
                  bold: true, // Headers are always bold
                  color: STYLES.colors.black,
                }),
              ],
            })
          );
        }
      }
      
      headerCells.push(
        new TableCell({
          columnSpan: colspan,
          shading: {
            fill: STYLES.colors.headerBg,
            type: ShadingType.CLEAR,
          },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 6, color: STYLES.colors.border },
            bottom: { style: BorderStyle.SINGLE, size: 6, color: STYLES.colors.border },
            left: { style: BorderStyle.SINGLE, size: 6, color: STYLES.colors.border },
            right: { style: BorderStyle.SINGLE, size: 6, color: STYLES.colors.border },
          },
          margins: {
            top: 100, // 5pt
            bottom: 100,
            left: 100,
            right: 100,
          },
          width: {
            size: columnWidth * colspan,
            type: WidthType.PERCENTAGE,
          },
          children: cellChildren,
        })
      );
    }
    
    tableRows.push(new TableRow({ children: headerCells }));
  }

  // Add data rows with alternating colors
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    const fillColor = rowIndex % 2 === 0 ? STYLES.colors.rowOdd : STYLES.colors.rowEven;
    const rowCells: TableCell[] = [];
    let skipNext = 0;
    
    // Pad row to match column count if needed
    const paddedRow = [...row];
    while (paddedRow.length < columnCount) {
      paddedRow.push({ text: '' });
    }
    
    for (let i = 0; i < paddedRow.length; i++) {
      if (skipNext > 0) {
        skipNext--;
        continue;
      }
      
      const cellData = paddedRow[i];
      
      // Debug: Log empty cells
      if (!cellData.text || cellData.text.trim() === '') {
        console.log(`  Creating empty cell at position ${i} in data row ${rowIndex}`);
      }
      
      // For data rows, NEVER apply colspan - every cell should be individual
      // This ensures all empty cells in week columns render with borders
      const colspan = 1;
      skipNext = 0;
      
      console.log(`  Processing cell ${i}: "${cellData.text || ''}" (colspan=${colspan})`);
      
      // Create cell children (image or text)
      const cellChildren: Paragraph[] = [];
      
      if ('image' in cellData && cellData.image) {
        // Cell contains image
        const imagePara = await createTableImage(cellData.image);
        if (imagePara) {
          cellChildren.push(imagePara);
        }
      } else {
        // Cell contains text
        const text = cellData.text || '';
        
        // Check if text has multiple lines
        if (text && text.includes('\n')) {
          // Split into lines and create separate paragraphs
          const lines = text.split('\n').filter(line => line.trim());
          lines.forEach((line, lineIndex) => {
            cellChildren.push(
              new Paragraph({
                spacing: {
                  after: lineIndex === lines.length - 1 ? 0 : 80, // Small gap between lines
                },
                children: parseInlineFormatting(line).map(part => 
                  new TextRun({
                    text: part.text,
                    font: STYLES.fonts.headers,
                    size: STYLES.sizes.table,
                    color: STYLES.colors.black,
                    bold: part.bold,
                    italics: part.italic,
                    underline: part.underline ? {} : undefined,
                  })
                ),
              })
            );
          });
        } else {
          // Single line text (including empty cells)
          // For empty cells, parseInlineFormatting will return empty array, so add empty TextRun
          const formattedParts = text ? parseInlineFormatting(text) : [];
          cellChildren.push(
            new Paragraph({
              spacing: {
                before: 100, // 5pt
                after: 100,  // 5pt
                line: 240,   // 12pt line height
              },
              children: formattedParts.length > 0
                ? formattedParts.map(part => 
                    new TextRun({
                      text: part.text,
                      font: STYLES.fonts.headers,
                      size: STYLES.sizes.table,
                      color: STYLES.colors.black,
                      bold: part.bold,
                      italics: part.italic,
                      underline: part.underline ? {} : undefined,
                    })
                  )
                : [
                    new TextRun({
                      text: ' ', // Regular space for empty cells to ensure borders render
                      font: STYLES.fonts.headers,
                      size: STYLES.sizes.table,
                      color: STYLES.colors.black,
                    })
                  ],
            })
          );
        }
      }
      
      rowCells.push(
        new TableCell({
          columnSpan: colspan,
          shading: {
            fill: fillColor,
            type: ShadingType.CLEAR,
          },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 6, color: STYLES.colors.border },
            bottom: { style: BorderStyle.SINGLE, size: 6, color: STYLES.colors.border },
            left: { style: BorderStyle.SINGLE, size: 6, color: STYLES.colors.border },
            right: { style: BorderStyle.SINGLE, size: 6, color: STYLES.colors.border },
          },
          margins: {
            top: 100, // 5pt
            bottom: 100,
            left: 100,
            right: 100,
          },
          width: {
            size: columnWidth * colspan,
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
    borders: {
      top: { style: BorderStyle.SINGLE, size: 6, color: STYLES.colors.border },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: STYLES.colors.border },
      left: { style: BorderStyle.SINGLE, size: 6, color: STYLES.colors.border },
      right: { style: BorderStyle.SINGLE, size: 6, color: STYLES.colors.border },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 6, color: STYLES.colors.border },
      insideVertical: { style: BorderStyle.SINGLE, size: 6, color: STYLES.colors.border },
    },
  });

  console.log(`  Table object created with ${tableRows.length} rows, returning [Paragraph, Table, Paragraph]`);

  // Return table with spacing paragraphs
  return [
    new Paragraph({
      spacing: {
        before: 320,
        after: 320,
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

async function createTableImage(imageData: { src: string; alt?: string }): Promise<Paragraph | null> {
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

    // Create small image for table cell (matching PDF: max 50pt = ~70 pixels)
    // Using proper docx ImageRun API with required type property
    const imageRun = new ImageRun({
      type: imageType,
      data: imageBuffer,
      transformation: {
        width: 70,
        height: 50,
      },
    });

    return new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: {
        before: 0,
        after: 0,
      },
      children: [imageRun],
    });
  } catch (error) {
    console.error('Error creating table image:', error);
    return null;
  }
}

async function createImage(imageData: { src: string; alt?: string }): Promise<Paragraph | null> {
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

    // Create image with reasonable size (max width 6 inches = 600 pixels)
    // Using proper docx ImageRun API with required type property
    const imageRun = new ImageRun({
      type: imageType,
      data: imageBuffer,
      transformation: {
        width: 600,
        height: 400,
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
      top: { style: BorderStyle.SINGLE, size: 6, color: STYLES.colors.border },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: STYLES.colors.border },
      left: { style: BorderStyle.SINGLE, size: 6, color: STYLES.colors.border },
      right: { style: BorderStyle.SINGLE, size: 6, color: STYLES.colors.border },
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

