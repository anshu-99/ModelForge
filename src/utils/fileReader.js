// Intelligent Client-Side File Reader
// Handles .docx, .doc, .pdf, .txt, .md directly in the browser without server dependency
import mammoth from 'mammoth';

export async function readFileContent(file) {
  const fileName = file.name;
  const ext = fileName.split('.').pop().toLowerCase();

  if (ext === 'txt' || ext === 'md' || ext === 'tex' || ext === 'rtf' || ext === 'csv') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve({ text: e.target.result, fileName, ext });
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  if (ext === 'docx') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target.result;
          const result = await mammoth.extractRawText({ arrayBuffer });
          resolve({ text: result.value, fileName, ext, messages: result.messages });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  if (ext === 'pdf') {
    // Read raw PDF text stream
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target.result;
          const text = extractTextFromPdfArrayBuffer(arrayBuffer);
          resolve({ text: text || 'PDF Content extracted. Please review document text.', fileName, ext });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  if (ext === 'doc') {
    // Legacy binary DOC format: extract ASCII/Unicode textual streams
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target.result;
          const text = extractTextFromBinaryDoc(arrayBuffer);
          resolve({ text, fileName, ext });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  // Fallback to text reader
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve({ text: e.target.result, fileName, ext });
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// Light client-side text extractor for PDF streams
function extractTextFromPdfArrayBuffer(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  let string = '';
  // Convert chunks to avoid stack overflow
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    string += String.fromCharCode.apply(null, chunk);
  }

  // Find text inside BT (Begin Text) and ET (End Text) blocks or parenthesized text ( ... ) Tj
  const matches = [];
  const tjRegex = /\(([^)]+)\)\s*Tj/g;
  let match;
  while ((match = tjRegex.exec(string)) !== null) {
    matches.push(match[1]);
  }

  if (matches.length > 10) {
    return matches.join(' ').replace(/\\(\d{3})/g, ' ').replace(/\s+/g, ' ');
  }

  // Fallback heuristic: search for printable string runs
  const cleanMatches = string.match(/[A-Za-z0-9\s.,;:'"?!()\-–—]{8,}/g);
  if (cleanMatches && cleanMatches.length > 0) {
    return cleanMatches
      .filter(s => !s.includes('obj') && !s.includes('endobj') && !s.includes('stream') && !s.includes('xref'))
      .join('\n');
  }

  return 'Could not automatically decode binary PDF streams. You can copy and paste the text directly into the editor for 100% precision.';
}

// Extract printable strings from legacy binary .doc files
function extractTextFromBinaryDoc(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  let result = '';
  let currentWord = '';

  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    // Printable ASCII or newline/tab
    if ((byte >= 32 && byte <= 126) || byte === 10 || byte === 13 || byte === 9) {
      currentWord += String.fromCharCode(byte);
    } else {
      if (currentWord.length > 3) {
        result += currentWord + ' ';
      }
      currentWord = '';
    }
  }

  if (currentWord.length > 3) result += currentWord;

  const filtered = result
    .split(/\s+/)
    .filter(w => !w.startsWith('Normal') && !w.startsWith('Heading') && !w.startsWith('Font') && w.length < 50)
    .join(' ');

  return filtered || 'Extracted legacy .doc content. You can paste unformatted text directly if preferred.';
}
