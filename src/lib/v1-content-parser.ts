// Shared V1 Content Parser for both PDF and Word generation
// This extracts and parses V1 content structure

export interface CellData {
  text?: string;
  images?: Array<{
    src: string;
    alt?: string;
    style?: string;
    width?: number;
    height?: number;
  }>;
  // Legacy support - if single image, can use this
  image?: {
    src: string;
    alt?: string;
    style?: string;
    width?: number;
    height?: number;
  };
  // Cell styling
  style?: {
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    verticalAlign?: 'top' | 'middle' | 'bottom';
    padding?: number; // in points (twips / 20)
    fontWeight?: 'bold' | 'normal';
    fontSize?: string;
  };
}

export interface ParsedSection {
  type: 'header' | 'paragraph' | 'list' | 'table' | 'image' | 'blockquote' | 'pre';
  level?: number; // for headers (1-6)
  content: string;
  tableData?: {
    headerRows?: CellData[][]; // Multiple header rows with images support
    headers?: string[]; // Backward compatibility
    rows: CellData[][]; // Rows with images support
    columnWidths?: number[]; // Column widths from colgroup (percentages)
  };
  imageData?: {
    src: string; // base64 data URI
    alt?: string;
    style?: string;
    width?: number;
    height?: number;
  };
  listItems?: string[];
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  children?: ParsedSection[];
}

export function extractV1Content(v1Data: any): string {
  let content = v1Data?.["1"]?.extracted_content?.[0]?.fields?.[0]?.generated_data?.value || '';
  
  // Also extract compliance_items if available
  const fields = v1Data?.["1"]?.extracted_content?.[0]?.fields || [];
  const complianceField = fields.find((field: any) => field.compliance_items?.value);
  
  if (complianceField?.compliance_items?.value) {
    // Add a header for compliance items and append the markdown table
    const complianceContent = complianceField.compliance_items.value.trim();
    if (complianceContent) {
      content += '\n\n**COMPLIANCE ITEMS**\n\n' + complianceContent;
    }
  }

  return content;
}

export function parseV1Content(content: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  const lines = content.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      i++;
      continue;
    }

    // Skip <style> blocks
    if (trimmedLine.match(/<style[\s>]/i)) {
      console.log(`Found <style> block at line ${i}, skipping...`);
      i++;
      while (i < lines.length && !lines[i].trim().includes('</style>')) {
        i++;
      }
      if (i < lines.length) i++; // Skip </style> line
      continue;
    }

    // Handle div blocks - extract text content
    if (trimmedLine.match(/<div[\s>]/i)) {
      const divResult = parseDivBlock(lines, i);
      if (divResult.content && divResult.content.trim()) {
        sections.push({
          type: 'paragraph',
          content: divResult.content,
        });
      }
      i = divResult.endIndex;
      continue;
    }

    // Parse HTML table (check for <table> or <table with attributes)
    if (trimmedLine.match(/<table[\s>]/i)) {
      console.log(`Found table at line ${i}: ${trimmedLine.substring(0, 100)}`);
      const tableResult = parseHtmlTable(lines, i);
      if (tableResult.section) {
        console.log(`  Table parsed successfully with ${tableResult.section.tableData?.headerRows?.length || 0} header rows and ${tableResult.section.tableData?.rows.length || 0} data rows`);
        sections.push(tableResult.section);
      } else {
        console.log(`  Table parsing failed, no section returned`);
      }
      i = tableResult.endIndex;
      continue;
    }

    // Parse image
    if (trimmedLine.startsWith('<img')) {
      const imageResult = parseImage(lines, i);
      if (imageResult.section) {
        sections.push(imageResult.section);
      }
      i = imageResult.endIndex;
      continue;
    }

    // Parse pre block
    if (trimmedLine === '<pre> \n' || trimmedLine === '<pre>') {
      const preResult = parsePreBlock(lines, i);
      if (preResult.section) {
        sections.push(preResult.section);
      }
      i = preResult.endIndex;
      continue;
    }

    // Parse blockquote
    if (trimmedLine.startsWith('>')) {
      sections.push({
        type: 'blockquote',
        content: trimmedLine.replace(/^>\s*/, ''),
      });
      i++;
      continue;
    }

    // Parse headers - H1 with bold
    if (trimmedLine.startsWith('# **') && trimmedLine.endsWith('**')) {
      sections.push({
        type: 'header',
        level: 1,
        content: trimmedLine.replace(/^# \*\*(.*)\*\*$/, '$1'),
        isBold: true,
      });
      i++;
      continue;
    }

    // Parse headers - Bold text as H2
    if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**') && trimmedLine.length > 4 && !trimmedLine.includes('<u>')) {
      sections.push({
        type: 'header',
        level: 2,
        content: trimmedLine.replace(/\*\*/g, ''),
        isBold: true,
      });
      i++;
      continue;
    }

    // Parse headers - ## H2
    if (trimmedLine.startsWith('## **') && trimmedLine.endsWith('**')) {
      sections.push({
        type: 'header',
        level: 2,
        content: trimmedLine.replace(/^## \*\*(.*)\*\*$/, '$1'),
        isBold: true,
      });
      i++;
      continue;
    }

    // Parse headers - ### H3
    if (trimmedLine.startsWith('### **') && trimmedLine.endsWith('**')) {
      sections.push({
        type: 'header',
        level: 3,
        content: trimmedLine.replace(/^### \*\*(.*)\*\*$/, '$1'),
        isBold: true,
      });
      i++;
      continue;
    }

    // Parse headers - plain markdown
    if (trimmedLine.startsWith('# ')) {
      sections.push({
        type: 'header',
        level: 1,
        content: trimmedLine.replace(/^# /, ''),
      });
      i++;
      continue;
    }

    if (trimmedLine.startsWith('## ')) {
      sections.push({
        type: 'header',
        level: 2,
        content: trimmedLine.replace(/^## /, ''),
      });
      i++;
      continue;
    }

    if (trimmedLine.startsWith('### ')) {
      sections.push({
        type: 'header',
        level: 3,
        content: trimmedLine.replace(/^### /, ''),
      });
      i++;
      continue;
    }

    // Parse markdown table (pipe-separated: | col1 | col2 |)
    const isMarkdownTableRow = trimmedLine.startsWith('|') && trimmedLine.endsWith('|') && trimmedLine.includes('|');
    if (isMarkdownTableRow) {
      const tableResult = parseMarkdownTable(lines, i);
      if (tableResult.section) {
        console.log(`  Markdown table parsed successfully with ${tableResult.section.tableData?.headerRows?.length || 0} header rows and ${tableResult.section.tableData?.rows.length || 0} data rows`);
        sections.push(tableResult.section);
      }
      i = tableResult.endIndex;
      continue;
    }

    // Parse list items
    if (trimmedLine.startsWith('• ') || trimmedLine.startsWith('- ') || trimmedLine.match(/^\*\s+/)) {
      const listItems: string[] = [];
      while (i < lines.length) {
        const listLine = lines[i].trim();
        if (listLine.startsWith('• ') || listLine.startsWith('- ') || listLine.match(/^\*\s+/)) {
          listItems.push(listLine.substring(1).trim());
          i++;
        } else if (!listLine) {
          i++;
          break;
        } else {
          break;
        }
      }
      sections.push({
        type: 'list',
        content: '',
        listItems,
      });
      continue;
    }

    // Parse paragraph - preserve raw markdown for inline formatting parsing
    sections.push({
      type: 'paragraph',
      content: trimmedLine,
    });
    i++;
  }

  return sections;
}

function parseDivBlock(lines: string[], startIndex: number): { content: string; endIndex: number } {
  let i = startIndex;
  const divLines: string[] = [];
  let depth = 0;
  
  // Collect all lines until the div closes
  while (i < lines.length) {
    const line = lines[i];
    divLines.push(line);
    
    // Count div nesting
    const openDivs = (line.match(/<div[^>]*>/gi) || []).length;
    const closeDivs = (line.match(/<\/div>/gi) || []).length;
    depth += openDivs - closeDivs;
    
    i++;
    
    if (depth === 0 && closeDivs > 0) {
      break;
    }
    
    // Safety limit
    if (i - startIndex > 100) break;
  }
  
  const divHtml = divLines.join('\n');
  
  // Extract text content while preserving line breaks
  let content = divHtml;
  
  // Convert <br> and <br /> to newlines
  content = content.replace(/<br\s*\/?>/gi, '\n');
  
  // Handle <strong> tags - preserve with ** for bold
  content = content.replace(/<strong>/gi, '**');
  content = content.replace(/<\/strong>/gi, '**');
  
  // Remove div tags but keep content
  content = content.replace(/<\/?div[^>]*>/gi, '\n');
  
  // Remove HTML comments
  content = content.replace(/<!--[\s\S]*?-->/g, '');
  
  // Remove other HTML tags
  content = content.replace(/<[^>]*>/g, '');
  
  // Decode entities
  content = content.replace(/&nbsp;/g, ' ');
  content = content.replace(/&amp;/g, '&');
  
  // Clean up excessive whitespace while preserving intentional line breaks
  content = content.split('\n')
    .map(line => line.trim())
    .filter(line => line)
    .join('\n');
  
  return { content, endIndex: i };
}

function parseHtmlTable(lines: string[], startIndex: number): { section: ParsedSection | null; endIndex: number } {
  let i = startIndex;
  const tableLines: string[] = [];
  
  while (i < lines.length) {
    tableLines.push(lines[i]);
    if (lines[i].trim().includes('</table>')) {
      i++;
      break;
    }
    i++;
  }

  console.log(`  Collected ${tableLines.length} lines for table`);
  const tableHtml = tableLines.join('\n');
  const tableData = extractTableData(tableHtml);

  if (tableData) {
    console.log(`  Table data extracted successfully`);
    return {
      section: {
        type: 'table',
        content: '',
        tableData,
      },
      endIndex: i,
    };
  }

  console.log(`  Table data extraction returned null`);
  return { section: null, endIndex: i };
}

function parseCellContent(cellHtml: string, cellTag?: string): CellData {
  // Extract cell styles from the opening tag (<th> or <td>)
  const cellStyle: CellData['style'] = {};
  
  if (cellTag) {
    // Extract style attribute
    const styleMatch = cellTag.match(/style\s*=\s*["']([^"']+)["']/i);
    if (styleMatch) {
      const styleStr = styleMatch[1];
      
      // Extract text-align
      const textAlignMatch = styleStr.match(/text-align\s*:\s*(\w+)/i);
      if (textAlignMatch) {
        const align = textAlignMatch[1].toLowerCase();
        if (['left', 'center', 'right', 'justify'].includes(align)) {
          cellStyle.textAlign = align as 'left' | 'center' | 'right' | 'justify';
        }
      }
      
      // Extract vertical-align
      const verticalAlignMatch = styleStr.match(/vertical-align\s*:\s*(\w+)/i);
      if (verticalAlignMatch) {
        const valign = verticalAlignMatch[1].toLowerCase();
        if (['top', 'middle', 'bottom'].includes(valign)) {
          cellStyle.verticalAlign = valign as 'top' | 'middle' | 'bottom';
        }
      }
      
      // Extract padding (convert px to points: 1px = 0.75pt, but we'll use 1:1 for simplicity)
      const paddingMatch = styleStr.match(/padding\s*:\s*([\d.]+)px/i);
      if (paddingMatch) {
        cellStyle.padding = parseFloat(paddingMatch[1]) * 20; // Convert px to twips (1px ≈ 20 twips)
      }
      
      // Extract font-weight
      const fontWeightMatch = styleStr.match(/font-weight\s*:\s*(bold|normal)/i);
      if (fontWeightMatch) {
        cellStyle.fontWeight = fontWeightMatch[1].toLowerCase() as 'bold' | 'normal';
      }
      
      // Extract font-size
      const fontSizeMatch = styleStr.match(/font-size\s*:\s*([\d.]+(?:pt|px|em)?)/i);
      if (fontSizeMatch) {
        cellStyle.fontSize = fontSizeMatch[1];
      }
    }
  }
  
  // Extract ALL images from the cell (can be multiple)
  const images: Array<{ src: string; alt?: string; style?: string }> = [];
  
  // More robust regex that captures img tags and extracts attributes in any order
  // First, normalize multi-line img tags by replacing newlines with spaces
  const normalizedHtml = cellHtml.replace(/\s+/g, ' ');
  const imgTagRegex = /<img\s+([^>]+?)(?:\s*\/?>|\s*>)/gi;
  let imgTagMatch;
  
  while ((imgTagMatch = imgTagRegex.exec(normalizedHtml)) !== null) {
    const attributesStr = imgTagMatch[1];
    
    // Extract each attribute individually (order-independent)
    const srcMatch = attributesStr.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
    const altMatch = attributesStr.match(/\balt\s*=\s*["']([^"']*)["']/i);
    const styleMatch = attributesStr.match(/\bstyle\s*=\s*["']([^"']+)["']/i);
    
    const imageData = {
      src: srcMatch ? srcMatch[1] : '',
      alt: altMatch ? altMatch[1] : undefined,
      style: styleMatch ? styleMatch[1] : undefined,
    };
    
    // Only add if we have a src
    if (imageData.src) {
      console.log(`  [IMAGE EXTRACTION] Found image in cell:`, {
        src: imageData.src.substring(0, 50) + (imageData.src.length > 50 ? '...' : ''),
        hasStyle: !!imageData.style,
        stylePreview: imageData.style ? imageData.style.substring(0, 100) + (imageData.style.length > 100 ? '...' : '') : 'none',
        rawAttributes: attributesStr.substring(0, 150),
      });
      images.push(imageData);
    }
  }
  
  // Extract text content - preserve structure but remove image tags
  let cleaned = cellHtml;
  
  // Remove image tags (keep the rest of the content)
  cleaned = cleaned.replace(/<img[^>]*\/?>/gi, '');
  
  // Convert <br> and <br /> to newlines first
  cleaned = cleaned.replace(/<br\s*\/?>/gi, '\n');
  
  // Convert <p> tags to newlines (preserve paragraph structure)
  cleaned = cleaned.replace(/<\/p>/gi, '\n');
  cleaned = cleaned.replace(/<p[^>]*>/gi, '');
  
  // Convert blockquote tags to newlines with indentation marker
  cleaned = cleaned.replace(/<\/blockquote>/gi, '\n');
  cleaned = cleaned.replace(/<blockquote[^>]*>/gi, '\n');
  
  // Convert list items to newlines with bullet marker
  cleaned = cleaned.replace(/<\/li>/gi, '\n');
  cleaned = cleaned.replace(/<li[^>]*>/gi, '• ');
  
  // Convert <ul> and <ol> to newlines
  cleaned = cleaned.replace(/<\/[uo]l>/gi, '\n');
  cleaned = cleaned.replace(/<[uo]l[^>]*>/gi, '\n');
  
  // Convert <hr> to separator
  cleaned = cleaned.replace(/<hr\s*\/?>/gi, '\n---\n');
  
  // Convert <strong> and <b> to ** for bold
  cleaned = cleaned.replace(/<\/strong>|<\/b>/gi, '**');
  cleaned = cleaned.replace(/<strong[^>]*>|<b[^>]*>/gi, '**');
  
  // Convert <em> and <i> to * for italic
  cleaned = cleaned.replace(/<\/em>|<\/i>/gi, '*');
  cleaned = cleaned.replace(/<em[^>]*>|<i[^>]*>/gi, '*');
  
  // Remove other HTML tags but preserve their content
  cleaned = cleaned.replace(/<[^>]*>/g, '');
  
  // Decode HTML entities
  cleaned = cleaned.replace(/&nbsp;/g, ' ');
  cleaned = cleaned.replace(/&amp;/g, '&');
  cleaned = cleaned.replace(/&lt;/g, '<');
  cleaned = cleaned.replace(/&gt;/g, '>');
  cleaned = cleaned.replace(/&quot;/g, '"');
  cleaned = cleaned.replace(/&#39;/g, "'");
  cleaned = cleaned.replace(/&#x27;/g, "'");
  cleaned = cleaned.replace(/&mdash;/g, '—');
  cleaned = cleaned.replace(/&ndash;/g, '–');
  cleaned = cleaned.replace(/&rsquo;/g, "'");
  cleaned = cleaned.replace(/&lsquo;/g, "'");
  cleaned = cleaned.replace(/&rdquo;/g, '"');
  cleaned = cleaned.replace(/&ldquo;/g, '"');
  
  // Clean up whitespace but preserve line breaks
  cleaned = cleaned.split('\n')
    .map(line => line.trim())
    .filter(line => line) // Remove empty lines
    .join('\n');
  
  // Build result
  const result: CellData = {};
  
  if (images.length > 0) {
    result.images = images;
    // For backward compatibility, also set image if only one
    if (images.length === 1) {
      result.image = images[0];
    }
  }
  
  if (cleaned) {
    result.text = cleaned;
  }
  
  // If no images and no text, return empty text to preserve cell structure
  if (!result.images && !result.text) {
    result.text = '';
  }
  
  // Add cell styles if any were extracted
  if (Object.keys(cellStyle).length > 0) {
    result.style = cellStyle;
  }
  
  return result;
}

// Legacy function for backward compatibility
function cleanCellContent(cell: string): string {
  const cellData = parseCellContent(cell);
  return cellData.text || '';
}

function extractTableData(html: string): { headerRows?: CellData[][]; headers?: string[]; rows: CellData[][]; columnWidths?: number[] } | null {
  try {
    const headerRows: CellData[][] = [];
    const rows: CellData[][] = [];
    let columnWidths: number[] | undefined;
    
    // Extract colgroup column widths if present
    const colgroupMatch = html.match(/<colgroup>[\s\S]*?<\/colgroup>/i);
    if (colgroupMatch) {
      const colMatches = colgroupMatch[0].match(/<col[^>]*>/gi) || [];
      columnWidths = colMatches.map(col => {
        // Extract width from style attribute: style="width: 28%" or style="width:28%"
        const widthMatch = col.match(/width\s*[:=]\s*["']?([\d.]+)%?["']?/i);
        if (widthMatch) {
          return parseFloat(widthMatch[1]);
        }
        return undefined;
      }).filter((w): w is number => w !== undefined);
      
      // If we got column widths, use them; otherwise calculate equal widths
      if (columnWidths.length === 0) {
        columnWidths = undefined;
      }
    }
    
    // Try to extract headers from <thead>
    const headerMatch = html.match(/<thead>[\s\S]*?<\/thead>/i);
    if (headerMatch) {
      const headerRowMatches = headerMatch[0].match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
      
      // Process each header row (there might be multiple rows in thead)
      for (const headerRow of headerRowMatches) {
        const headerCells = headerRow.match(/<th[^>]*>([\s\S]*?)<\/th>/gi) || [];
        const parsedHeaderRow: CellData[] = [];
        
        for (const cell of headerCells) {
          // Extract the opening tag for style parsing
          const tagMatch = cell.match(/<th[^>]*>/i);
          const cellTag = tagMatch ? tagMatch[0] : undefined;
          const cellData = parseCellContent(cell, cellTag);
          
          // Check for colspan attribute
          const colspanMatch = cell.match(/colspan\s*=\s*["']?(\d+)["']?/i);
          const colspan = colspanMatch ? parseInt(colspanMatch[1]) : 1;
          
          // Add the cell content multiple times if colspan is present
          if (colspan === 1) {
            parsedHeaderRow.push(cellData);
          } else {
            // First cell gets content, rest are empty placeholders
            parsedHeaderRow.push(cellData);
            for (let j = 1; j < colspan; j++) {
              parsedHeaderRow.push({ text: '' } as CellData);
            }
          }
        }
        
        if (parsedHeaderRow.length > 0) {
          headerRows.push(parsedHeaderRow);
        }
      }
    }

    // Try to extract rows from <tbody>
    const bodyMatch = html.match(/<tbody>[\s\S]*?<\/tbody>/i);
    if (bodyMatch) {
      const rowMatches = bodyMatch[0].match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
      
      for (const rowHtml of rowMatches) {
        const cellMatches = rowHtml.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
        const row: CellData[] = [];
        
        for (const cell of cellMatches) {
          // Extract the opening tag for style parsing
          const tagMatch = cell.match(/<td[^>]*>/i);
          const cellTag = tagMatch ? tagMatch[0] : undefined;
          const cellData = parseCellContent(cell, cellTag);
          
          // Check for colspan attribute
          const colspanMatch = cell.match(/colspan\s*=\s*["']?(\d+)["']?/i);
          const colspan = colspanMatch ? parseInt(colspanMatch[1]) : 1;
          
          // Add the cell content multiple times if colspan is present
          if (colspan === 1) {
            row.push(cellData);
          } else {
            // First cell gets content, rest are empty placeholders
            row.push(cellData);
            for (let j = 1; j < colspan; j++) {
              row.push({ text: '' } as CellData);
            }
          }
        }
        
        if (row.length > 0) {
          rows.push(row);
        }
      }
    }
    
    // Fallback: If no tbody found, try to get all <tr> directly
    if (rows.length === 0) {
      const allRowMatches = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
      let firstRow = true;
      
      for (const rowHtml of allRowMatches) {
        // Check if this row is in thead (skip if we already have headers)
        if (headerMatch && rowHtml.match(/<th[^>]*>/)) {
          continue;
        }
        
        // If first row has <th> tags and we don't have headers yet, treat as header
        if (firstRow && rowHtml.match(/<th[^>]*>/) && headerRows.length === 0) {
          const headerCells = rowHtml.match(/<th[^>]*>([\s\S]*?)<\/th>/gi) || [];
          const parsedHeaderRow: CellData[] = [];
          
          for (const cell of headerCells) {
            // Extract the opening tag for style parsing
            const tagMatch = cell.match(/<th[^>]*>/i);
            const cellTag = tagMatch ? tagMatch[0] : undefined;
            const cellData = parseCellContent(cell, cellTag);
            const colspanMatch = cell.match(/colspan\s*=\s*["']?(\d+)["']?/i);
            const colspan = colspanMatch ? parseInt(colspanMatch[1]) : 1;
            
            for (let i = 0; i < colspan; i++) {
              parsedHeaderRow.push(i === 0 ? cellData : ({ text: '' } as CellData));
            }
          }
          
          if (parsedHeaderRow.length > 0) {
            headerRows.push(parsedHeaderRow);
          }
          firstRow = false;
          continue;
        }
        
        // Extract cells (both <td> and <th>)
        const cellMatches = rowHtml.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi) || [];
        const row: CellData[] = [];
        
        for (const cell of cellMatches) {
          // Extract the opening tag for style parsing (could be <td> or <th>)
          const tagMatch = cell.match(/<t[dh][^>]*>/i);
          const cellTag = tagMatch ? tagMatch[0] : undefined;
          const cellData = parseCellContent(cell, cellTag);
          const colspanMatch = cell.match(/colspan\s*=\s*["']?(\d+)["']?/i);
          const colspan = colspanMatch ? parseInt(colspanMatch[1]) : 1;
          
          for (let i = 0; i < colspan; i++) {
            row.push(i === 0 ? cellData : ({ text: '' } as CellData));
          }
        }
        
        if (row.length > 0) {
          rows.push(row);
        }
        firstRow = false;
      }
    }

    // Return data if we have at least headers or rows
    if (headerRows.length > 0 || rows.length > 0) {
      console.log(`Parsed table: ${headerRows.length} header rows, ${rows.length} body rows`);
      
      // Count images in table
      let imageCount = 0;
      headerRows.forEach(hr => hr.forEach(cell => { if (cell.image) imageCount++; }));
      rows.forEach(r => r.forEach(cell => { if (cell.image) imageCount++; }));
      console.log(`  Table contains ${imageCount} images`);
      
        // Return both headerRows and headers for backward compatibility
        const flatHeaders = headerRows.length > 0 ? headerRows[headerRows.length - 1].map(c => c.text || '') : [];
        return { headerRows, headers: flatHeaders, rows, columnWidths };
    }

    console.log('No table data found in HTML');
    return null;
  } catch (error) {
    console.error('Error parsing table:', error);
    return null;
  }
}

function parseImage(lines: string[], startIndex: number): { section: ParsedSection | null; endIndex: number } {
  let i = startIndex;
  const imgLines: string[] = [];
  
  imgLines.push(lines[i]);
  
  // Check if it's a multi-line img tag
  if (!lines[i].includes('/>') && !lines[i].includes('</img>')) {
    i++;
    while (i < lines.length) {
      imgLines.push(lines[i]);
      if (lines[i].includes('/>') || lines[i].includes('</img>')) {
        i++;
        break;
      }
      i++;
    }
  } else {
    i++;
  }

  const imgHtml = imgLines.join('\n');
  const srcMatch = imgHtml.match(/src="([^"]*)"/);
  const altMatch = imgHtml.match(/alt="([^"]*)"/);
  const styleMatch = imgHtml.match(/style="([^"]*)"/);
  
  if (srcMatch) {
    return {
      section: {
        type: 'image',
        content: '',
        imageData: {
          src: srcMatch[1],
          alt: altMatch ? altMatch[1] : undefined,
          style: styleMatch ? styleMatch[1] : undefined,
        },
      },
      endIndex: i,
    };
  }

  return { section: null, endIndex: i };
}

function parsePreBlock(lines: string[], startIndex: number): { section: ParsedSection | null; endIndex: number } {
  let i = startIndex + 1;
  const preLines: string[] = [];
  
  while (i < lines.length) {
    if (lines[i].trim() === '</pre>' || lines[i].trim() === '</pre>\n') {
      i++;
      break;
    }
    preLines.push(lines[i]);
    i++;
  }

  return {
    section: {
      type: 'pre',
      content: preLines.join('\n'),
    },
    endIndex: i,
  };
}

function processInlineFormatting(text: string): string {
  // Remove bold markers for plain text extraction
  let processed = text;
  
  // Convert **text** to just text (we'll handle bold in rendering)
  processed = processed.replace(/\*\*([^*]+?)\*\*/g, '$1');
  
  // Convert *text* to just text (we'll handle italic in rendering)
  processed = processed.replace(/\*([^*]+?)\*/g, '$1');
  
  // Remove HTML tags but keep text
  processed = processed.replace(/<[^>]*>/g, '');
  
  return processed.trim();
}

export interface TextPart {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

export function parseInlineFormatting(text: string): TextPart[] {
  const parts: TextPart[] = [];
  
  // Clean up the text first
  let cleanText = text;
  
  // Replace HTML underline tags with markdown-style markers
  cleanText = cleanText.replace(/<u>/gi, '__U__');
  cleanText = cleanText.replace(/<\/u>/gi, '__/U__');
  
  // Remove other HTML tags
  cleanText = cleanText.replace(/<(?!u>|\/u>)[^>]*>/g, '');
  
  // Parse the text with markdown formatting
  let remaining = cleanText;
  const currentPos = 0;
  
  while (remaining.length > 0) {
    // Check for bold text: **text**
    const boldMatch = remaining.match(/\*\*([^*]+?)\*\*/);
    
    if (boldMatch && boldMatch.index !== undefined) {
      // Add text before the bold part (if any)
      if (boldMatch.index > 0) {
        const beforeText = remaining.substring(0, boldMatch.index);
        if (beforeText) {
          parts.push({ text: beforeText });
        }
      }
      
      // Add the bold part
      parts.push({ text: boldMatch[1], bold: true });
      
      // Move forward
      remaining = remaining.substring(boldMatch.index + boldMatch[0].length);
      continue;
    }
    
    // Check for italic text: *text* (but not **)
    const italicMatch = remaining.match(/(?<!\*)\*([^*]+?)\*(?!\*)/);
    
    if (italicMatch && italicMatch.index !== undefined) {
      // Add text before the italic part (if any)
      if (italicMatch.index > 0) {
        const beforeText = remaining.substring(0, italicMatch.index);
        if (beforeText) {
          parts.push({ text: beforeText });
        }
      }
      
      // Add the italic part
      parts.push({ text: italicMatch[1], italic: true });
      
      // Move forward
      remaining = remaining.substring(italicMatch.index + italicMatch[0].length);
      continue;
    }
    
    // Check for underline text: __U__text__/U__
    const underlineMatch = remaining.match(/__U__([^_]+?)__\/U__/);
    
    if (underlineMatch && underlineMatch.index !== undefined) {
      // Add text before the underline part (if any)
      if (underlineMatch.index > 0) {
        const beforeText = remaining.substring(0, underlineMatch.index);
        if (beforeText) {
          parts.push({ text: beforeText });
        }
      }
      
      // Add the underline part
      parts.push({ text: underlineMatch[1], underline: true });
      
      // Move forward
      remaining = remaining.substring(underlineMatch.index + underlineMatch[0].length);
      continue;
    }
    
    // No more formatting found, add the rest as plain text
    if (remaining) {
      parts.push({ text: remaining });
    }
    break;
  }
  
  // Filter out empty parts
  return parts.filter(part => part.text.length > 0);
}

function parseMarkdownTable(lines: string[], startIndex: number): { section: ParsedSection | null; endIndex: number } {
  let i = startIndex;
  const tableLines: string[] = [];
  
  // Collect all markdown table rows (lines starting and ending with |)
  while (i < lines.length) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Check if this is a markdown table row
    const isTableRow = trimmedLine.startsWith('|') && trimmedLine.endsWith('|') && trimmedLine.includes('|');
    
    if (isTableRow) {
      tableLines.push(trimmedLine);
      i++;
    } else if (!trimmedLine) {
      // Empty line might be end of table, but continue collecting if next line is also table row
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        const isNextTableRow = nextLine.startsWith('|') && nextLine.endsWith('|') && nextLine.includes('|');
        if (isNextTableRow) {
          tableLines.push(trimmedLine); // Keep empty line
          i++;
        } else {
          break; // End of table
        }
      } else {
        break; // End of file
      }
    } else {
      // Non-table line, end of table
      break;
    }
    
    // Safety limit
    if (i - startIndex > 500) break;
  }
  
  if (tableLines.length < 2) {
    // Need at least header and separator
    return { section: null, endIndex: i };
  }
  
  console.log(`  Collected ${tableLines.length} lines for markdown table`);
  
  // Parse markdown table
  const tableData = parseMarkdownTableData(tableLines);
  
  if (tableData) {
    console.log(`  Markdown table data extracted successfully`);
    return {
      section: {
        type: 'table',
        content: '',
        tableData,
      },
      endIndex: i,
    };
  }
  
  console.log(`  Markdown table data extraction returned null`);
  return { section: null, endIndex: i };
}

function parseMarkdownTableData(tableLines: string[]): { headerRows?: CellData[][]; headers?: string[]; rows: CellData[][]; columnWidths?: number[] } | null {
  try {
    if (tableLines.length < 2) return null;
    
    // Find header row (first row with |)
    let headerIndex = -1;
    let separatorIndex = -1;
    
    for (let i = 0; i < tableLines.length; i++) {
      const line = tableLines[i];
      if (line.startsWith('|') && line.endsWith('|')) {
        // Check if this is a separator row (contains only dashes, colons, spaces, and pipes)
        if (line.match(/^\|[\s\-:]*\|$/)) {
          if (headerIndex === -1) {
            // Separator before header? Skip it
            continue;
          }
          separatorIndex = i;
          break;
        } else if (headerIndex === -1) {
          headerIndex = i;
        }
      }
    }
    
    if (headerIndex === -1) return null;
    
    // Parse header row
    const headerLine = tableLines[headerIndex];
    const headerCells = headerLine
      .split('|')
      .map(cell => cell.trim())
      .filter(cell => cell && !cell.match(/^[-:\s]+$/)); // Filter out empty cells and separators
    
    if (headerCells.length === 0) return null;
    
    // Create header row as CellData[]
    const headerRow: CellData[] = headerCells.map(text => ({
      text: text.trim(),
      style: {
        fontWeight: 'bold',
        textAlign: 'left',
        verticalAlign: 'middle',
      },
    }));
    
    // Determine where data rows start (after separator if present, or after header)
    const dataStartIndex = separatorIndex !== -1 ? separatorIndex + 1 : headerIndex + 1;
    
    // Parse data rows
    const rows: CellData[][] = [];
    for (let i = dataStartIndex; i < tableLines.length; i++) {
      const line = tableLines[i].trim();
      if (!line || !line.startsWith('|') || !line.endsWith('|')) continue;
      
      // Skip separator rows (lines that contain only dashes, colons, spaces, and pipes)
      // This pattern matches: |---|---| or |:---|:---:|---:|
      if (line.match(/^\|[\s\-:]*\|$/)) {
        continue;
      }
      
      let cells = line
        .split('|')
        .map(cell => cell.trim());
      
      // Remove first and last empty cells (from leading/trailing |)
      if (cells.length > 0 && cells[0] === '') cells.shift();
      if (cells.length > 0 && cells[cells.length - 1] === '') cells.pop();
      
      // Filter out cells that contain only dashes/hyphens (placeholders)
      // These are typically from markdown tables like |---|---| which should be empty cells
      cells = cells.map(cell => {
        // If cell contains only dashes, hyphens, spaces, or is empty, treat as empty
        if (!cell || cell.match(/^[\s\-]+$/)) {
          return '';
        }
        return cell;
      });
      
      // Pad or trim cells to match header length
      while (cells.length < headerCells.length) {
        cells.push('');
      }
      if (cells.length > headerCells.length) {
        cells = cells.slice(0, headerCells.length);
      }
      
      const row: CellData[] = cells.map(text => ({
        // Convert cells with only dashes to empty strings
        text: text.match(/^[\s\-]+$/) ? '' : text.trim(),
        style: {
          textAlign: 'left',
          verticalAlign: 'top',
        },
      }));
      
      // Skip rows where all cells are empty (no actual content)
      const hasContent = row.some(cell => cell.text && cell.text.trim().length > 0);
      if (!hasContent) {
        continue; // Skip this empty row
      }
      
      rows.push(row);
    }
    
    return {
      headerRows: [headerRow],
      headers: headerCells,
      rows,
    };
  } catch (error) {
    console.error('Error parsing markdown table:', error);
    return null;
  }
}

