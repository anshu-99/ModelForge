// Advanced Document AST Parser
// Converts messy, unformatted, or extracted text into a structured semantic model

export function parseDocument(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return createEmptyDocument();
  }

  const lines = rawText.split(/\r?\n/).map(l => l.trimEnd());
  
  // State for parsing
  let title = '';
  let subtitle = '';
  const authors = [];
  let abstract = '';
  const keywords = [];
  const sections = [];
  const references = [];
  
  let currentSection = null;
  let currentBlockType = null;
  let currentBlockContent = [];
  
  let inAbstract = false;
  let inReferences = false;
  let hasFoundTitle = false;
  let abstractBuffer = [];

  // Helper to commit pending blocks into the active section
  const commitBlock = () => {
    if (!currentBlockType || currentBlockContent.length === 0) {
      currentBlockType = null;
      currentBlockContent = [];
      return;
    }

    if (inAbstract) {
      // Abstract collection
      abstractBuffer.push(currentBlockContent.join(' '));
    } else if (inReferences) {
      // References collection
      references.push(...currentBlockContent);
    } else if (currentSection) {
      if (currentBlockType === 'table') {
        currentSection.items.push(parseTableBlock(currentBlockContent));
      } else if (currentBlockType === 'list') {
        currentSection.items.push({
          type: 'list',
          items: [...currentBlockContent]
        });
      } else if (currentBlockType === 'equation') {
        currentSection.items.push({
          type: 'equation',
          content: currentBlockContent.join(' ')
        });
      } else if (currentBlockType === 'figure') {
        currentSection.items.push({
          type: 'figure',
          caption: currentBlockContent.join(' ')
        });
      } else {
        const text = currentBlockContent.join(' ').trim();
        if (text) {
          currentSection.items.push({
            type: 'paragraph',
            content: text
          });
        }
      }
    } else {
      // Preamble or unassigned paragraph before Section 1
      const text = currentBlockContent.join(' ').trim();
      if (text) {
        if (!currentSection) {
          currentSection = {
            id: 'sec-overview',
            title: 'Overview',
            cleanTitle: 'Overview',
            level: 1,
            items: []
          };
          sections.push(currentSection);
        }
        currentSection.items.push({
          type: 'paragraph',
          content: text
        });
      }
    }

    currentBlockType = null;
    currentBlockContent = [];
  };

  // Helper to test if a line is a section heading
  const detectHeading = (line) => {
    if (!line || line.length > 120) return null;
    
    // Markdown headings (# Title, ## Subheading)
    const mdMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (mdMatch) {
      return {
        level: mdMatch[1].length,
        title: mdMatch[2].trim(),
        cleanTitle: mdMatch[2].replace(/^[\dIVXABC\.\s\-:]+/, '').trim()
      };
    }

    // Roman numeral headings: I. INTRODUCTION, II. RELATED WORK, etc.
    const romanMatch = line.match(/^(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV|XVI|XVII|XVIII|XIX|XX)\.\s+(.+)$/i);
    if (romanMatch) {
      return {
        level: 1,
        title: line,
        cleanTitle: romanMatch[2].trim()
      };
    }

    // Decimal headings: 1. Introduction, 1.1 Dataset, 2.3.1 Algorithm
    const decimalMatch = line.match(/^(\d+(?:\.\d+)*)\s*[\.:\-]?\s+(.+)$/);
    if (decimalMatch) {
      const depth = decimalMatch[1].split('.').length;
      return {
        level: Math.min(depth, 3),
        title: line,
        cleanTitle: decimalMatch[2].trim()
      };
    }

    // Lettered subsections: A. Architecture, B. Training, C. Feature Extraction, etc.
    const letterMatch = line.match(/^([A-Z])\.\s+([A-Za-z].+)$/);
    if (letterMatch && letterMatch[2].length < 80) {
      return {
        level: 2,
        title: line,
        cleanTitle: letterMatch[2].trim()
      };
    }

    // Section keywords: "Section 1: ...", "Chapter 2: ..."
    const secWordMatch = line.match(/^(?:Section|Chapter|Part)\s+\d+[\s:\-]+(.+)$/i);
    if (secWordMatch) {
      return {
        level: 1,
        title: line,
        cleanTitle: secWordMatch[1].trim()
      };
    }

    // ALL CAPS standalone short lines (e.g. "INTRODUCTION", "METHODOLOGY", "RESULTS")
    const isAllCaps = line.length > 3 && line.length < 50 && line === line.toUpperCase() && /^[A-Z\s,–-]+$/.test(line);
    const standardSecNames = ['INTRODUCTION', 'BACKGROUND', 'RELATED WORK', 'METHODOLOGY', 'SYSTEM DESIGN', 'ARCHITECTURE', 'EXPERIMENTS', 'RESULTS', 'EVALUATION', 'DISCUSSION', 'CONCLUSION', 'FUTURE WORK', 'ACKNOWLEDGMENT', 'ACKNOWLEDGMENTS', 'REFERENCES'];
    if (isAllCaps || standardSecNames.includes(line.toUpperCase().trim())) {
      return {
        level: 1,
        title: line,
        cleanTitle: line.trim()
      };
    }

    return null;
  };

  // Line-by-line parsing
  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Empty line separates blocks
    if (!trimmed) {
      commitBlock();
      continue;
    }

    // 1. Detect Title (first non-empty line if not yet found)
    if (!hasFoundTitle) {
      const cleanLine = trimmed.replace(/^#\s*/, '').replace(/^[A-Z0-9\s:_-]+:\s*/, '');
      title = cleanLine;
      hasFoundTitle = true;
      continue;
    }

    // 2. Detect Authors / Metadata lines immediately following title
    if (authors.length === 0 && !abstract && sections.length === 0 && !trimmed.toLowerCase().startsWith('abstract')) {
      const lower = trimmed.toLowerCase();
      // If line contains email, department, university, or author indicators
      if (lower.includes('@') || lower.includes('university') || lower.includes('institute') || lower.includes('dr.') || lower.includes('prof.') || lower.includes('dept') || lower.includes('prepared by') || lower.includes('author:')) {
        parseAuthorLine(trimmed, authors);
        continue;
      } else if (trimmed.startsWith('Date:') || trimmed.startsWith('Target') || trimmed.startsWith('Advisor:') || trimmed.startsWith('Course:')) {
        subtitle += (subtitle ? ' | ' : '') + trimmed;
        continue;
      }
    }

    // 3. Detect Abstract
    const isAbstractHeader = trimmed.toLowerCase() === 'abstract' || trimmed.toLowerCase() === 'executive summary';
    const abstractMatch = trimmed.match(/^(\*?abstract\*?|\*?executive summary\*?)[\s:–—\-]\s*(.*)$/i);
    if (isAbstractHeader || abstractMatch) {
      commitBlock();
      inAbstract = true;
      inReferences = false;
      const content = abstractMatch && abstractMatch[2] ? abstractMatch[2].trim() : '';
      if (content) {
        abstractBuffer.push(content);
      }
      continue;
    }

    // 4. Detect Keywords
    const kwMatch = trimmed.match(/^(\*?keywords\*?|\*?index terms\*?)[\s:–—,\-]\s*(.+)$/i);
    if (kwMatch) {
      commitBlock();
      inAbstract = false;
      const kwString = kwMatch[2].trim();
      const extractedKeywords = kwString.split(/[,;]/).map(k => k.trim()).filter(Boolean);
      keywords.push(...extractedKeywords);
      continue;
    }

    // 5. Detect References Section
    if (trimmed.toLowerCase() === 'references' || trimmed.toLowerCase().startsWith('references:') || trimmed.toLowerCase() === 'bibliography') {
      commitBlock();
      inReferences = true;
      inAbstract = false;
      continue;
    }

    // If we are in References, collect reference items
    if (inReferences) {
      const refMatch = trimmed.match(/^\[?(\d+)\]?[\.\s]*(.+)$/);
      if (refMatch) {
        references.push({
          id: `ref-${refMatch[1]}`,
          num: refMatch[1],
          text: refMatch[2].trim()
        });
      } else if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.match(/^[A-Z][a-z]+,\s+[A-Z]/)) {
        references.push({
          id: `ref-${references.length + 1}`,
          num: `${references.length + 1}`,
          text: trimmed.replace(/^[-*]\s*/, '').trim()
        });
      } else if (references.length > 0) {
        // Append continuation line to previous reference
        references[references.length - 1].text += ' ' + trimmed;
      }
      continue;
    }

    // 6. Check for Section Headings
    const heading = detectHeading(trimmed);
    if (heading) {
      commitBlock();
      inAbstract = false;
      
      currentSection = {
        id: `sec-${sections.length + 1}`,
        title: heading.title,
        cleanTitle: heading.cleanTitle,
        level: heading.level,
        items: []
      };
      sections.push(currentSection);
      continue;
    }

    // If still in abstract mode and hit regular text
    if (inAbstract) {
      abstractBuffer.push(trimmed);
      continue;
    }

    // 7. Detect Table Caption or Table rows
    const isTableCaption = trimmed.match(/^(?:table|tbl)\s*[\dIVXLCDM\.:\-]/i);
    if (isTableCaption || trimmed.includes('|')) {
      if (currentBlockType !== 'table') {
        commitBlock();
        currentBlockType = 'table';
      }
      currentBlockContent.push(trimmed);
      continue;
    }

    // 8. Detect Bullet / Numbered Lists
    if (trimmed.match(/^[-*•]\s+(.+)$/) || trimmed.match(/^\d+[\.\)]\s+(.+)$/)) {
      if (currentBlockType !== 'list') {
        commitBlock();
        currentBlockType = 'list';
      }
      currentBlockContent.push(trimmed);
      continue;
    }

    // 9. Detect Equations
    const isEquation = (
      trimmed.toLowerCase().startsWith('equation') ||
      trimmed.startsWith('$$') ||
      (trimmed.length < 120 && (trimmed.includes('=') || trimmed.includes('≤') || trimmed.includes('≥') || trimmed.includes('≈')) && (
        trimmed.includes('+') || trimmed.includes('*') || trimmed.includes('alpha') || trimmed.includes('α') ||
        trimmed.includes('β') || trimmed.includes('σ') || trimmed.includes('Σ') || trimmed.includes('∑') ||
        trimmed.includes('τ') || trimmed.includes('argmax') || trimmed.includes('log') || trimmed.includes('L_') ||
        trimmed.includes('\\') || /\(\d+\)$/.test(trimmed)
      ))
    );
    if (isEquation) {
      commitBlock();
      currentBlockType = 'equation';
      currentBlockContent.push(trimmed.replace(/^equation\s*\d*[\s:–—]*/i, ''));
      commitBlock();
      continue;
    }

    // 10. Detect Figures
    if (trimmed.match(/^(?:fig(?:ure)?\.?)\s*[\dIVXLCDM\.:\-]/i)) {
      commitBlock();
      currentBlockType = 'figure';
      currentBlockContent.push(trimmed);
      commitBlock();
      continue;
    }

    // 11. Normal Paragraph Text
    if (currentBlockType !== 'paragraph') {
      commitBlock();
      currentBlockType = 'paragraph';
    }
    currentBlockContent.push(trimmed);
  }

  // Final commit
  commitBlock();

  // Consolidate abstract
  abstract = abstractBuffer.join(' ').replace(/^[-–—:\s]+/, '').trim();

  // If title was missing, pick fallback
  if (!title && sections.length > 0) {
    title = sections[0].cleanTitle;
  }

  // If no authors detected, add default placeholder author
  if (authors.length === 0) {
    authors.push({
      name: 'Author Name',
      affiliation: 'Department of Research, Academic Institution',
      email: 'author@institution.edu'
    });
  }

  // Calculate stats
  const wordCount = rawText.trim().split(/\s+/).filter(Boolean).length;
  const charCount = rawText.length;
  const readingTimeMin = Math.ceil(wordCount / 200);

  return {
    title: title || 'Untitled Document',
    subtitle,
    authors,
    abstract,
    keywords,
    sections,
    references,
    rawText,
    stats: {
      wordCount,
      charCount,
      readingTimeMin,
      sectionCount: sections.length,
      refCount: references.length
    }
  };
}

// Parse author line: supports multiple formats like comma-separated, emails, affiliations, pipe-separated blocks
function parseAuthorLine(line, authors) {
  let cleanLine = line.trim();
  // Strip outer leading or trailing pipes: | author1 | author2 |
  if (cleanLine.startsWith('|')) cleanLine = cleanLine.substring(1);
  if (cleanLine.endsWith('|')) cleanLine = cleanLine.slice(0, -1);

  // Split by pipe if present, or by semicolon or newline
  let parts = [];
  if (cleanLine.includes('|')) {
    parts = cleanLine.split('|').map(p => p.trim()).filter(Boolean);
  } else if (cleanLine.includes(';') || cleanLine.includes('\n')) {
    parts = cleanLine.split(/[;\n]/).map(p => p.trim()).filter(Boolean);
  } else {
    parts = [cleanLine];
  }

  parts.forEach(part => {
    let clean = part.replace(/^(prepared by:|author:|authors:)\s*/i, '').trim();
    if (!clean) return;

    // Extract email
    const emailMatch = clean.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const email = emailMatch ? emailMatch[0] : '';
    let withoutEmail = clean.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '').trim();
    withoutEmail = withoutEmail.replace(/[,;]+$/, '').trim();

    // Check for department / academic rank / institution keywords
    const titleIndicators = [
      'assistant professor', 'associate professor', 'professor', 'dr\\.', 'prof\\.',
      'department of', 'dept of', 'dept\\. of', 'school of', 'faculty of', 'institute of',
      'college of', 'university', 'research lab', 'student', 'fellow'
    ];
    const regexIndicator = new RegExp(`\\b(${titleIndicators.join('|')})`, 'i');
    const indicatorMatch = withoutEmail.match(regexIndicator);

    let name = '';
    let affiliation = '';

    if (indicatorMatch && indicatorMatch.index > 0) {
      name = withoutEmail.substring(0, indicatorMatch.index).trim();
      affiliation = withoutEmail.substring(indicatorMatch.index).trim();
    } else if (withoutEmail.includes(',')) {
      const subParts = withoutEmail.split(',').map(s => s.trim()).filter(Boolean);
      name = subParts[0];
      affiliation = subParts.slice(1).join(', ');
    } else if (/\s{2,}/.test(withoutEmail)) {
      const subParts = withoutEmail.split(/\s{2,}/).map(s => s.trim()).filter(Boolean);
      name = subParts[0];
      affiliation = subParts.slice(1).join(', ');
    } else {
      const words = withoutEmail.split(/\s+/);
      if (words.length <= 3) {
        name = withoutEmail;
        affiliation = 'Academic / Corporate Institution';
      } else {
        name = words.slice(0, 2).join(' ');
        affiliation = words.slice(2).join(' ');
      }
    }

    name = name.replace(/^[|,\s]+|[|,\s]+$/g, '').trim();
    affiliation = affiliation.replace(/^[|,\s]+|[|,\s]+$/g, '').trim();

    authors.push({
      name: name || 'Author',
      affiliation: affiliation || 'Institution / Organization',
      email: email || ''
    });
  });
}

// Parse a markdown or pipe-separated table block
function parseTableBlock(lines) {
  const rows = [];
  let title = '';

  for (const line of lines) {
    if (line.match(/^(?:table|tbl)\s*[\dIVXLCDM\.:\-]/i) || (!line.includes('|') && line.length < 160)) {
      title = line;
      continue;
    }
    // Filter out separator lines like |---|---|
    if (/^[|\s\-:]+$/.test(line)) continue;
    
    const cells = line.split('|')
      .map(c => c.trim())
      .filter((c, idx, arr) => {
        // filter out leading/trailing empty cells from | col1 | col2 |
        if ((idx === 0 || idx === arr.length - 1) && c === '') return false;
        return true;
      });
    
    if (cells.length > 0) {
      rows.push(cells);
    }
  }

  return {
    type: 'table',
    title: title || 'Table 1: Data Summary',
    headers: rows.length > 0 ? rows[0] : [],
    rows: rows.length > 1 ? rows.slice(1) : []
  };
}

function createEmptyDocument() {
  return {
    title: 'Untitled Document',
    subtitle: '',
    authors: [],
    abstract: '',
    keywords: [],
    sections: [],
    references: [],
    rawText: '',
    stats: { wordCount: 0, charCount: 0, readingTimeMin: 0, sectionCount: 0, refCount: 0 }
  };
}
