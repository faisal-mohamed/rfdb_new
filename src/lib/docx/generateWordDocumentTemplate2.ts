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
  } from 'docx';
  import { parseV1Content, ParsedSection, extractV1Content, parseInlineFormatting, TextPart, CellData } from '../v1-content-parser';
  import fs from 'fs';
  import path from 'path';
  
  // Styling constants matching screenshots
  const STYLES = {
    // Margins (in twips: 1 inch = 1440 twips) - Further reduced
    margins: {
      top: convertInchesToTwip(0.5),
      right: convertInchesToTwip(0.5),
      bottom: convertInchesToTwip(0.75),
      left: convertInchesToTwip(0.5),
      header: 0, // Header distance from top (0 cm - flush with top edge)
      footer: 0, // Footer distance from bottom (0 cm - flush with bottom edge)
    },
    
    // Fonts - Updated to match screenshots
    fonts: {
      body: 'Verdana',           // Changed from Times New Roman to Verdana
      headers: 'Arial Black',    // Changed from Arial to Arial Black
      code: 'Courier New',
    },
    
    // Font sizes (in half-points: 14pt = 28, 20pt = 40)
    sizes: {
      body: 28,      // 14pt (matches screenshot - Verdana 14)
      h1: 40,        // 20pt (Arial Black) - matches toolbar in screenshot
      h2: 36,        // 18pt (Arial Black)
      h3: 32,        // 16pt (Arial Black)
      h4: 28,        // 14pt (Arial Black)
      table: 28,     // 14pt (matches body)
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
    
    // Spacing (in twips) - Reduced header heights
    spacing: {
      lineHeight: 1.7,
      h1Before: 0,
      h1After: 200,   // 10pt (reduced from 14pt)
      h2Before: 240,  // 12pt (reduced from 16pt)
      h2After: 160,   // 8pt (reduced from 12pt)
      h3Before: 160,  // 8pt (reduced from 12pt)
      h3After: 120,   // 6pt (reduced from 8pt)
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
    
    // Create header with top-right image (appears on every page)
    const headerWithImage = await createHeaderWithTopRightImage();
    
    // Create footer with bottom-left image and website/page numbers (appears on every page)
    const footerWithImage = await createFooterWithBottomLeftImage();
    
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
              children: headerWithImage,
            }),
          },
          footers: {
            default: new Footer({
              children: footerWithImage,
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
        borderSize = 8; // ~1.3pt (reduced from 2.5pt)
        break;
      case 2:
        headingLevel = HeadingLevel.HEADING_2;
        fontSize = STYLES.sizes.h2;
        spacingBefore = STYLES.spacing.h2Before;
        spacingAfter = STYLES.spacing.h2After;
        upperCase = true;
        letterSpacing = 40; // 0.1em approximation
        hasBorder = true;
        borderSize = 6; // 1pt (reduced from 2pt)
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
      // Page break handling: keep header with at least one line of following content
      // This prevents orphaned headers at the bottom of pages (similar to PDF generation)
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
          line: 476, // 1.7 line height for 14pt (28 * 1.7 * 10 = 476 twips)
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
        line: 476, // 1.7 line height for 14pt (28 * 1.7 * 10 = 476 twips)
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
          line: 434, // 1.55 line height for 14pt (28 * 1.55 * 10 = 434 twips)
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
    const tableFontFamily = tableStyle?.fontFamily || 'Calibri';
    const tableFontSize = tableStyle?.fontSize ? parseFloat(tableStyle.fontSize) : 14; // Default 14px
    const tableFontSizeHalfPoints = Math.round(tableFontSize * 2); // Convert px to half-points (14px = 28 half-points)
    const tableBorderColor = tableStyle?.borderColor || 'CCCCCC'; // Default #cccccc from JSON
    
    console.log(`createTable called with:`, {
      headerRowsCount: headerRows?.length || 0,
      headersCount: headers?.length || 0,
      rowsCount: rows.length,
      columnWidths: columnWidths?.length || 0
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
        const cellPadding = cellStyle.padding || 160; // Default 8px (160 twips) matching JSON
        const cellBorderColor = tableBorderColor; // Use table-level border color
        
        // Create cell children (can have multiple images and/or text)
        const cellChildren: Paragraph[] = [];
        
        // Handle images (can be multiple)
        const hasImages = (cellData.images && cellData.images.length > 0) || ('image' in cellData && cellData.image);
        
        if (cellData.images && cellData.images.length > 0) {
          for (const img of cellData.images) {
            const imagePara = await createTableImage(img, textAlign);
            if (imagePara) {
              cellChildren.push(imagePara);
            }
          }
        } else if ('image' in cellData && cellData.image) {
          // Legacy support for single image
          const imagePara = await createTableImage(cellData.image, textAlign);
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
                  color: STYLES.colors.black,
                });
                
                // Create text runs from formatted parts
                const textRuns = formattedParts.map(part => 
                  new TextRun({
                    text: part.text,
                    font: tableFontFamily,
                    size: tableFontSizeHalfPoints,
                    color: STYLES.colors.black,
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
                    color: STYLES.colors.black,
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
                    color: STYLES.colors.black,
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
                  color: STYLES.colors.black,
                }),
              ],
            })
          );
        }
        
        // Determine vertical alignment
        let verticalAlignment: 'top' | 'center' | 'bottom' = 'top';
        if (verticalAlign === 'middle') verticalAlignment = 'center';
        else if (verticalAlign === 'bottom') verticalAlignment = 'bottom';
        
        headerCells.push(
          new TableCell({
            columnSpan: colspan,
            verticalAlign: verticalAlignment,
            shading: {
              fill: STYLES.colors.headerBg,
              type: ShadingType.CLEAR,
            },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: cellBorderColor },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: cellBorderColor },
              left: { style: BorderStyle.SINGLE, size: 4, color: cellBorderColor },
              right: { style: BorderStyle.SINGLE, size: 4, color: cellBorderColor },
            },
            margins: {
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
  
    // Add data rows with alternating colors
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      const fillColor = rowIndex % 2 === 0 ? STYLES.colors.rowOdd : STYLES.colors.rowEven;
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
        const cellPadding = cellStyle.padding || 160; // Default 8px (160 twips) matching JSON
        const cellBorderColor = tableBorderColor; // Use table-level border color
        
        // Create cell children (can have multiple images and/or text)
        const cellChildren: Paragraph[] = [];
        
        // Handle images (can be multiple)
        const hasImages = (cellData.images && cellData.images.length > 0) || ('image' in cellData && cellData.image);
        
        if (cellData.images && cellData.images.length > 0) {
          for (const img of cellData.images) {
            const imagePara = await createTableImage(img, textAlign);
            if (imagePara) {
              cellChildren.push(imagePara);
            }
          }
        } else if ('image' in cellData && cellData.image) {
          // Legacy support for single image
          const imagePara = await createTableImage(cellData.image, textAlign);
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
        
        // Determine vertical alignment
        let verticalAlignment: 'top' | 'center' | 'bottom' = 'top';
        if (verticalAlign === 'middle') verticalAlignment = 'center';
        else if (verticalAlign === 'bottom') verticalAlignment = 'bottom';
        
        rowCells.push(
          new TableCell({
            columnSpan: colspan,
            verticalAlign: verticalAlignment,
            shading: {
              fill: fillColor,
              type: ShadingType.CLEAR,
            },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: cellBorderColor },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: cellBorderColor },
              left: { style: BorderStyle.SINGLE, size: 4, color: cellBorderColor },
              right: { style: BorderStyle.SINGLE, size: 4, color: cellBorderColor },
            },
            margins: {
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
      borders: {
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
  
  async function createTableImage(imageData: { src: string; alt?: string; style?: string }, cellAlignment?: 'left' | 'center' | 'right' | 'justify'): Promise<Paragraph | null> {
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
      const finalWidth = parsedDims.width;
      const finalHeight = parsedDims.height;
      
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
      
      return new Paragraph({
        alignment: imageAlignment,
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
  
  // Create header with top-right image (appears on every page with high quality)
  async function createHeaderWithTopRightImage(): Promise<Paragraph[]> {
    const headerParagraphs: Paragraph[] = [];
    
    // Add top image (image1.20.png) FIRST - full width at absolute top (above corner image)
    try {
      const possiblePaths = [
        path.join(process.cwd(), 'public', 'media', 'media', 'image1.20.png'),
        path.join(process.cwd(), 'media', 'media', 'image1.20.png'),
        path.resolve('./media/media/image1.20.png'),
        path.resolve('public/media/media/image1.20.png'),
      ];
      
      let imagePath: string | null = null;
      for (const testPath of possiblePaths) {
        if (fs.existsSync(testPath)) {
          imagePath = testPath;
          break;
        }
      }
      
      if (imagePath) {
        console.log(`Loading top image from: ${imagePath}`);
        const imageBuffer = fs.readFileSync(imagePath);
        
        if (imageBuffer && imageBuffer.length > 0) {
          // Detect image type from extension
          const ext = path.extname(imagePath).toLowerCase();
          let imageType: 'png' | 'jpg' | 'gif' | 'bmp' = 'png';
          if (ext === '.jpg' || ext === '.jpeg') imageType = 'jpg';
          else if (ext === '.gif') imageType = 'gif';
          else if (ext === '.bmp') imageType = 'bmp';
          
          // Calculate full page width in pixels (8.5 inches = 816 pixels at 96 DPI)
          // Use full width for the top image
          const pageWidthPixels = 816; // 8.5 inches * 96 DPI
          const imageHeight = 50; // Adjust height as needed
          
          const topImage = new ImageRun({
            type: imageType,
            data: imageBuffer,
            transformation: {
              width: pageWidthPixels,   // Full page width
              height: imageHeight,       // Appropriate height
            },
          });
          
          // Add top image paragraph FIRST - positioned at absolute top, ignoring margins
          headerParagraphs.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: {
                before: 0,
                after: 0,
                line: imageHeight,
              },
              indent: {
                left: -convertInchesToTwip(0.5),  // Negative indent to ignore left margin
                right: -convertInchesToTwip(0.5), // Negative indent to ignore right margin
              },
              children: [topImage],
            })
          );
        }
      } else {
        console.warn(`Top image (image1.20.png) not found. Tried paths:`, possiblePaths);
      }
    } catch (error) {
      console.error('Error loading top image:', error);
    }
    
    // Add logo at top-left and corner image at top-right - both on same horizontal line
    // Load both images first
    let logoImageBuffer: Buffer | null = null;
    let logoImageType: 'png' | 'jpg' | 'gif' | 'bmp' = 'png';
    let cornerImageBuffer: Buffer | null = null;
    let cornerImageType: 'png' | 'jpg' | 'gif' | 'bmp' = 'png';
    
    // Load logo image (image6.20.png) for top-left
    try {
      const logoPaths = [
        path.join(process.cwd(), 'public', 'media', 'media', 'image6.20.png'),
        path.join(process.cwd(), 'media', 'media', 'image6.20.png'),
        path.resolve('./media/media/image6.20.png'),
        path.resolve('public/media/media/image6.20.png'),
      ];
      
      let logoPath: string | null = null;
      for (const testPath of logoPaths) {
        if (fs.existsSync(testPath)) {
          logoPath = testPath;
          break;
        }
      }
      
      if (logoPath) {
        console.log(`Loading logo from: ${logoPath}`);
        logoImageBuffer = fs.readFileSync(logoPath);
        const ext = path.extname(logoPath).toLowerCase();
        if (ext === '.jpg' || ext === '.jpeg') logoImageType = 'jpg';
        else if (ext === '.gif') logoImageType = 'gif';
        else if (ext === '.bmp') logoImageType = 'bmp';
      } else {
        console.warn(`Logo image (image6.20.png) not found. Tried paths:`, logoPaths);
      }
    } catch (error) {
      console.error('Error loading logo image:', error);
    }
    
    // Load top-right corner image (image22.20.png)
    try {
      const cornerPaths = [
        path.join(process.cwd(), 'public', 'media', 'media', 'image22.20.png'),
        path.join(process.cwd(), 'media', 'media', 'image22.20.png'),
        path.resolve('./media/media/image22.20.png'),
        path.resolve('public/media/media/image22.20.png'),
      ];
      
      let cornerPath: string | null = null;
      for (const testPath of cornerPaths) {
        if (fs.existsSync(testPath)) {
          cornerPath = testPath;
          break;
        }
      }
      
      if (cornerPath) {
        console.log(`Loading top-right image from: ${cornerPath}`);
        cornerImageBuffer = fs.readFileSync(cornerPath);
        const ext = path.extname(cornerPath).toLowerCase();
        if (ext === '.jpg' || ext === '.jpeg') cornerImageType = 'jpg';
        else if (ext === '.gif') cornerImageType = 'gif';
        else if (ext === '.bmp') cornerImageType = 'bmp';
      } else {
        console.warn(`Top-right image not found. Tried paths:`, cornerPaths);
      }
    } catch (error) {
      console.error('Error loading top-right image:', error);
    }
    
    // Create a single paragraph with logo on left and corner image on right, horizontally aligned
    const headerRowChildren: (TextRun | ImageRun)[] = [];
    const maxImageHeight = 100; // Use consistent height for alignment
    
    // Add logo on the left
    if (logoImageBuffer && logoImageBuffer.length > 0) {
      const logoImage = new ImageRun({
        type: logoImageType,
        data: logoImageBuffer,
        transformation: {
          width: 150,  // Logo width
          height: 60,  // Match height with corner image
        },
      });
      headerRowChildren.push(logoImage);
    }
    
    // Add tab to push corner image to the right, then add corner image
    if (cornerImageBuffer && cornerImageBuffer.length > 0) {
      headerRowChildren.push(new TextRun({ text: '\t' })); // Tab to move to right
      const cornerImage = new ImageRun({
        type: cornerImageType,
        data: cornerImageBuffer,
        transformation: {
          width: 100,   // Corner image width
          height: maxImageHeight,  // Match height with logo
        },
      });
      headerRowChildren.push(cornerImage);
    }
    
    // Create the header row paragraph with tab stops for proper alignment
    if (headerRowChildren.length > 0) {
      // Calculate right tab position to reach absolute right edge
      const rightTabPosition = convertInchesToTwip(8.5); // Full page width
      
      headerParagraphs.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            before: 0,
            after: 0,
            line: maxImageHeight, // Match image height
          },
          indent: {
            left: -convertInchesToTwip(0.5), // Extend to absolute left edge
            right: -convertInchesToTwip(0.5), // Extend to absolute right edge
          },
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: rightTabPosition,
            },
          ],
          children: headerRowChildren,
        })
      );
    }
    
    return headerParagraphs;
  }
  
  // Create footer with bottom-left image and website/page numbers (appears on every page with high quality)
  async function createFooterWithBottomLeftImage(): Promise<Paragraph[]> {
    // Use tab stops for left-right alignment
    const rightTabPosition = convertInchesToTwip(7.5); // Rightmost position within content area
    
    const footerParagraphs: Paragraph[] = [];
    const footerChildren: (TextRun | ImageRun)[] = [];
    
    // Load bottom-left image
    try {
      // Load image from ./media/media/image13.20.png
      const possiblePaths = [
        path.join(process.cwd(), 'public', 'media', 'media', 'image13.20.png'),
        path.join(process.cwd(), 'media', 'media', 'image13.20.png'),
        path.resolve('./media/media/image13.20.png'),
        path.resolve('public/media/media/image13.20.png'),
      ];
      
      let imagePath: string | null = null;
      for (const testPath of possiblePaths) {
        if (fs.existsSync(testPath)) {
          imagePath = testPath;
          break;
        }
      }
      
      if (imagePath) {
        console.log(`Loading bottom-left image from: ${imagePath}`);
        const imageBuffer = fs.readFileSync(imagePath);
        
        if (imageBuffer && imageBuffer.length > 0) {
          // Detect image type from extension
          const ext = path.extname(imagePath).toLowerCase();
          let imageType: 'png' | 'jpg' | 'gif' | 'bmp' = 'png';
          if (ext === '.jpg' || ext === '.jpeg') imageType = 'jpg';
          else if (ext === '.gif') imageType = 'gif';
          else if (ext === '.bmp') imageType = 'bmp';
          
          // Reduced size for footer corner image
          const footerImage = new ImageRun({
            type: imageType,
            data: imageBuffer,
            transformation: {
              width: 100,   // Further reduced size
              height: 100,  // Further reduced size
            },
          });
          
          // Add image to footer children (left side)
          footerChildren.push(footerImage);
          footerChildren.push(
            new TextRun({
              text: '  ', // Space between image and text
              font: STYLES.fonts.headers,
              size: 18,
            })
          );
        }
      } else {
        console.warn(`Bottom-left image not found. Tried paths:`, possiblePaths);
      }
    } catch (error) {
      console.error('Error loading bottom-left image:', error);
    }
    
    // Create footer paragraph with left indent to ignore left margin (for bottom-left image)
    footerParagraphs.push(
      new Paragraph({
        spacing: {
          before: 80,  // Reduced to minimize footer height
          after: 0,
          line: 100,    // Match image height for proper spacing
        },
        // No border - removed horizontal line
        indent: {
          left: -convertInchesToTwip(0.5), // Negative indent to ignore left margin (0.5 inch = 720 twips)
        },
        children: footerChildren,
      })
    );
    
    // Add bottom image (image1.20.png) with website URL overlaid on it - full width at absolute bottom
    try {
      const possiblePaths = [
        path.join(process.cwd(), 'public', 'media', 'media', 'image1.20.png'),
        path.join(process.cwd(), 'media', 'media', 'image1.20.png'),
        path.resolve('./media/media/image1.20.png'),
        path.resolve('public/media/media/image1.20.png'),
      ];
      
      let imagePath: string | null = null;
      for (const testPath of possiblePaths) {
        if (fs.existsSync(testPath)) {
          imagePath = testPath;
          break;
        }
      }
      
      if (imagePath) {
        console.log(`Loading bottom image from: ${imagePath}`);
        const imageBuffer = fs.readFileSync(imagePath);
        
        if (imageBuffer && imageBuffer.length > 0) {
          // Detect image type from extension
          const ext = path.extname(imagePath).toLowerCase();
          let imageType: 'png' | 'jpg' | 'gif' | 'bmp' = 'png';
          if (ext === '.jpg' || ext === '.jpeg') imageType = 'jpg';
          else if (ext === '.gif') imageType = 'gif';
          else if (ext === '.bmp') imageType = 'bmp';
          
          // Calculate full page width in pixels (8.5 inches = 816 pixels at 96 DPI)
          // Use full width for the bottom image
          const pageWidthPixels = 816; // 8.5 inches * 96 DPI
          const imageHeight = 50; // Adjust height as needed
          
          const bottomImage = new ImageRun({
            type: imageType,
            data: imageBuffer,
            transformation: {
              width: pageWidthPixels,   // Full page width
              height: imageHeight,       // Appropriate height
            },
          });
          
          // Add bottom image paragraph with website URL overlaid on it
          // Positioned at absolute bottom, ignoring margins, with text centered on the image
          footerParagraphs.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: {
                before: 0,
                after: 0,
                line: imageHeight,
              },
              indent: {
                left: -convertInchesToTwip(0.5),  // Negative indent to ignore left margin
                right: -convertInchesToTwip(0.5), // Negative indent to ignore right margin
              },
              children: [
                bottomImage,
                new TextRun({
                  text: 'WWW.TECHURATE.COM',
                  font: STYLES.fonts.headers,
                  size: 20, // Slightly larger for visibility
                  color: 'FFFFFF', // White text
                  bold: true,
                }),
              ],
            })
          );
        }
      } else {
        console.warn(`Bottom image (image1.20.png) not found. Tried paths:`, possiblePaths);
      }
    } catch (error) {
      console.error('Error loading bottom image:', error);
    }
    
    return footerParagraphs;
  }
  
  
  