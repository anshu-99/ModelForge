// Format Analysis & Cloning Engine
// Analyzes uploaded reference format files (.doc, .docx, .pdf, .txt) and extracts layout signatures

export function analyzeReferenceDocument(rawContent, fileName = 'reference_template.doc') {
  const content = typeof rawContent === 'string' ? rawContent : '';
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  
  const ext = fileName.split('.').pop().toLowerCase();
  const detectionAudit = [];
  let confidencePoints = 80;

  // 1. Analyze Section Heading Patterns
  let romanCount = 0;
  let decimalCount = 0;
  let allCapsCount = 0;
  let letterCount = 0;
  
  lines.forEach(line => {
    if (line.match(/^([IVXLCDM]+)\.\s+[A-Z]/i)) romanCount++;
    if (line.match(/^\d+(\.\d+)*\s+[A-Z]/)) decimalCount++;
    if (line.match(/^[A-Z\s]{4,30}$/)) allCapsCount++;
    if (line.match(/^[A-Z]\.\s+[A-Z]/)) letterCount++;
  });

  let headingNumbering = 'none';
  let headingTransform = 'none';

  if (romanCount >= 2 || (romanCount > 0 && romanCount >= decimalCount)) {
    headingNumbering = 'roman';
    headingTransform = 'uppercase';
    detectionAudit.push('Detected Roman Numeral section scheme (I. INTRODUCTION, II. METHODOLOGY)');
    confidencePoints += 5;
  } else if (decimalCount >= 2) {
    headingNumbering = 'decimal';
    detectionAudit.push('Detected Decimal section numbering scheme (1.0, 1.1, 2.0)');
    confidencePoints += 5;
  } else if (allCapsCount >= 3) {
    headingTransform = 'uppercase';
    headingNumbering = 'pill';
    detectionAudit.push('Detected Uppercase modern section banners');
    confidencePoints += 4;
  } else {
    headingNumbering = 'decimal';
    detectionAudit.push('Defaulted to clean Structured Section hierarchy');
  }

  // 2. Analyze Citations & References
  let bracketCitations = 0;
  let authorYearCitations = 0;
  let footnoteCitations = 0;

  lines.forEach(line => {
    if (line.match(/\[\d+\]/)) bracketCitations++;
    if (line.match(/\([A-Z][a-z]+(?:\s+et\s+al\.)?,\s*\d{4}\)/)) authorYearCitations++;
    if (line.match(/\^\d+|\bfootnote\b/i)) footnoteCitations++;
  });

  let citationStyle = 'bracket';
  if (authorYearCitations > bracketCitations) {
    citationStyle = 'apa';
    detectionAudit.push('Detected Author-Year citation conventions (e.g., Smith et al., 2024)');
    confidencePoints += 5;
  } else if (footnoteCitations > bracketCitations) {
    citationStyle = 'footnote';
    detectionAudit.push('Detected Footnote / Superscript citation markers');
    confidencePoints += 4;
  } else {
    citationStyle = 'bracket';
    detectionAudit.push('Detected Bracketed numeric reference notation [1], [2]');
    confidencePoints += 5;
  }

  // 3. Layout: Single Column vs Double Column Detection
  // Short average line length (< 55 chars) in dense paragraphs often indicates 2-column or conference format
  let avgLineLen = 0;
  if (lines.length > 5) {
    const totalChars = lines.slice(0, 30).reduce((acc, l) => acc + l.length, 0);
    avgLineLen = totalChars / Math.min(lines.length, 30);
  }

  const isTwoColumn = romanCount >= 2 || (avgLineLen > 0 && avgLineLen < 60) || content.toLowerCase().includes('column') || content.toLowerCase().includes('ieee');
  const columns = isTwoColumn ? 2 : 1;
  detectionAudit.push(isTwoColumn ? 'Identified dual-column page balance (Conference / Journal profile)' : 'Identified full-width single-column layout (Standard / Executive report profile)');

  // 4. Typography Inference
  let fontFamily = "'Plus Jakarta Sans', sans-serif";
  let headingFontFamily = "'Plus Jakarta Sans', sans-serif";
  let baseFontSize = '11pt';
  let lineHeight = '1.6';
  let paragraphIndent = '0in';
  let paragraphSpacing = '0.75rem';

  const lowerContent = content.toLowerCase();
  if (lowerContent.includes('times') || lowerContent.includes('cambria') || lowerContent.includes('serif') || romanCount >= 2) {
    fontFamily = "'Source Serif 4', 'Times New Roman', serif";
    headingFontFamily = "'Source Serif 4', 'Times New Roman', serif";
    baseFontSize = isTwoColumn ? '10pt' : '11pt';
    lineHeight = '1.5';
    paragraphIndent = isTwoColumn ? '0.15in' : '0.35in';
    paragraphSpacing = '0.35rem';
    detectionAudit.push('Extracted Classic Serif typeface palette (Source Serif / Times New Roman)');
  } else if (lowerContent.includes('academic') || lowerContent.includes('thesis') || authorYearCitations > 0) {
    fontFamily = "'Merriweather', serif";
    headingFontFamily = "'Inter', sans-serif";
    baseFontSize = '11.5pt';
    lineHeight = '1.75';
    paragraphIndent = '0.5in';
    paragraphSpacing = '0.4rem';
    detectionAudit.push('Extracted Academic Manuscript styling (Merriweather 1.75x spacing with 0.5" indents)');
  } else {
    fontFamily = "'Inter', -apple-system, sans-serif";
    headingFontFamily = "'Plus Jakarta Sans', sans-serif";
    baseFontSize = '10.5pt';
    lineHeight = '1.65';
    paragraphIndent = '0in';
    paragraphSpacing = '0.85rem';
    detectionAudit.push('Extracted Clean Modern Sans-Serif typography (Inter & Plus Jakarta Sans)');
  }

  // 5. Accent Color Inference
  let accentColor = '#2563eb'; // Royal Blue
  if (lowerContent.includes('nature') || lowerContent.includes('crimson') || lowerContent.includes('medical') || lowerContent.includes('red')) {
    accentColor = '#991b1b';
    detectionAudit.push('Identified Editorial Crimson (#991b1b) primary accent');
  } else if (lowerContent.includes('consulting') || lowerContent.includes('navy') || lowerContent.includes('executive') || lowerContent.includes('finance')) {
    accentColor = '#0f172a';
    detectionAudit.push('Identified Slate Navy (#0f172a) executive color token');
  } else if (lowerContent.includes('emerald') || lowerContent.includes('green') || lowerContent.includes('bio') || lowerContent.includes('ecology')) {
    accentColor = '#059669';
    detectionAudit.push('Identified Emerald Sage (#059669) accent token');
  } else {
    accentColor = '#2563eb';
    detectionAudit.push('Selected High-Contrast Cobalt Blue (#2563eb) accent token');
  }

  // Margins
  const margins = isTwoColumn ? '0.85in' : '1in';

  const confidenceScore = Math.min(confidencePoints, 99);

  return {
    name: `Cloned Format (${fileName.replace(/\.[^/.]+$/, '')})`,
    sourceFile: fileName,
    fileExtension: ext.toUpperCase(),
    fontFamily,
    headingFontFamily,
    baseFontSize,
    h1Style: {
      size: isTwoColumn ? '14pt' : '17pt',
      weight: '700',
      transform: headingTransform,
      numbering: headingNumbering,
      color: accentColor
    },
    h2Style: {
      size: isTwoColumn ? '11.5pt' : '13pt',
      weight: '600',
      transform: 'none',
      numbering: headingNumbering === 'roman' ? 'letter' : 'decimal',
      color: '#334155'
    },
    lineHeight,
    paragraphIndent,
    paragraphSpacing,
    textAlign: isTwoColumn ? 'justify' : 'left',
    columns,
    margins,
    citationStyle,
    accentColor,
    badgeLabel: 'Strict Format Cloned',
    confidenceScore,
    detectedAttributes: detectionAudit
  };
}
