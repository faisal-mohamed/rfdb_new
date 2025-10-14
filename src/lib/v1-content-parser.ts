// Shared V1 Content Parser for both PDF and Word generation
// This extracts and parses V1 content structure

export interface CellData {
  text?: string;
  image?: {
    src: string;
    alt?: string;
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
  };
  imageData?: {
    src: string; // base64 data URI
    alt?: string;
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
  return v1Data?.["1"]?.extracted_content?.[0]?.fields?.[0]?.generated_data?.value || '';
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

    // Parse paragraph
    sections.push({
      type: 'paragraph',
      content: processInlineFormatting(trimmedLine),
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

function parseCellContent(cellHtml: string): CellData {
  // Check if cell contains an image
  const imgMatch = cellHtml.match(/<img[^>]*src=["']([^"']+)["'][^>]*(?:alt=["']([^"']*)["'])?[^>]*\/?>/i);
  
  if (imgMatch) {
    // Cell contains an image
    return {
      image: {
        src: imgMatch[1],
        alt: imgMatch[2] || '',
      },
      text: '', // Empty text for image cells
    };
  }
  
  // Cell contains text - clean it
  let cleaned = cellHtml;
  
  // Convert <br> and <br /> to newlines first
  cleaned = cleaned.replace(/<br\s*\/?>/gi, '\n');
  
  // Convert <p> tags to newlines (preserve paragraph structure)
  cleaned = cleaned.replace(/<\/p>/gi, '\n');
  cleaned = cleaned.replace(/<p[^>]*>/gi, '');
  
  // Remove other HTML tags
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
  
  return { text: cleaned };
}

// Legacy function for backward compatibility
function cleanCellContent(cell: string): string {
  const cellData = parseCellContent(cell);
  return cellData.text || '';
}

function extractTableData(html: string): { headerRows?: CellData[][]; headers?: string[]; rows: CellData[][] } | null {
  try {
    const headerRows: CellData[][] = [];
    const rows: CellData[][] = [];
    
    // Try to extract headers from <thead>
    const headerMatch = html.match(/<thead>[\s\S]*?<\/thead>/i);
    if (headerMatch) {
      const headerRowMatches = headerMatch[0].match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
      
      // Process each header row (there might be multiple rows in thead)
      for (const headerRow of headerRowMatches) {
        const headerCells = headerRow.match(/<th[^>]*>([\s\S]*?)<\/th>/gi) || [];
        const parsedHeaderRow: CellData[] = [];
        
        for (const cell of headerCells) {
          const cellData = parseCellContent(cell);
          
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
              parsedHeaderRow.push({ text: '' });
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
          const cellData = parseCellContent(cell);
          
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
              row.push({ text: '' });
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
            const cellData = parseCellContent(cell);
            const colspanMatch = cell.match(/colspan\s*=\s*["']?(\d+)["']?/i);
            const colspan = colspanMatch ? parseInt(colspanMatch[1]) : 1;
            
            for (let i = 0; i < colspan; i++) {
              parsedHeaderRow.push(i === 0 ? cellData : { text: '' });
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
          const cellData = parseCellContent(cell);
          const colspanMatch = cell.match(/colspan\s*=\s*["']?(\d+)["']?/i);
          const colspan = colspanMatch ? parseInt(colspanMatch[1]) : 1;
          
          for (let i = 0; i < colspan; i++) {
            row.push(i === 0 ? cellData : { text: '' });
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
      return { headerRows, headers: flatHeaders, rows };
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
  
  if (srcMatch) {
    return {
      section: {
        type: 'image',
        content: '',
        imageData: {
          src: srcMatch[1],
          alt: altMatch ? altMatch[1] : undefined,
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

