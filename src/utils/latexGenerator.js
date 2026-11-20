// Advanced LaTeX & BibTeX Generator for FormatFlow
// Generates fully-compilable, publication-ready LaTeX code with IEEEtran and Article support,
// flexible column configurations (1, 2, or 3 columns), drop caps, and math optimization.

export function generateLatexCode(doc, options = 'article') {
  if (!doc) return '';

  // Normalize options
  const opts = typeof options === 'string'
    ? {
        template: options,
        columns: options === 'ieee' || options === 'ieee-journal' ? 2 : 1,
        dropCap: options.startsWith('ieee'),
        bibStyle: 'inline'
      }
    : {
        template: options?.template || 'ieee',
        columns: Number(options?.columns) || 2,
        dropCap: options?.dropCap ?? true,
        bibStyle: options?.bibStyle || 'inline',
        ...options
      };

  const isIEEE = opts.template.startsWith('ieee');
  const cols = Number(opts.columns) || 2;
  const isMultiColPackage = cols === 3;

  let out = '';

  // 1. Document Class Definition
  if (isIEEE) {
    if (opts.template === 'ieee-journal') {
      if (cols === 1) {
        out += `\\documentclass[11pt,journal,onecolumn]{IEEEtran}\n`;
      } else {
        out += `\\documentclass[journal]{IEEEtran}\n`;
      }
    } else if (opts.template === 'ieee-onecol' || cols === 1) {
      out += `\\documentclass[12pt,draftclsnofoot,onecolumn]{IEEEtran}\n`;
    } else {
      // Standard Conference (2-column default)
      out += `\\documentclass[conference]{IEEEtran}\n`;
    }
    out += `\\IEEEoverridecommandlockouts\n`;
    out += `% The preceding line is only needed to identify funding in the first footnote.\n`;
  } else {
    // Standard Article
    if (cols === 2) {
      out += `\\documentclass[11pt,a4paper,twocolumn]{article}\n`;
    } else {
      out += `\\documentclass[11pt,a4paper]{article}\n`;
    }
    out += `\\usepackage[margin=1in]{geometry}\n`;
    out += `\\usepackage[utf8]{inputenc}\n`;
  }

  // 2. Standard High-Quality Academic Packages
  out += `\\usepackage{cite}\n`;
  out += `\\usepackage{amsmath,amssymb,amsfonts}\n`;
  out += `\\usepackage{algorithmic}\n`;
  out += `\\usepackage{graphicx}\n`;
  out += `\\usepackage{textcomp}\n`;
  out += `\\usepackage{xcolor}\n`;
  out += `\\usepackage{booktabs}\n`;
  out += `\\usepackage{array}\n`;
  out += `\\usepackage{url}\n`;
  out += `\\usepackage{microtype}\n`;
  out += `\\usepackage{hyperref}\n`;

  // 3-Column multi-column package support
  if (isMultiColPackage) {
    out += `\\usepackage{multicol}\n`;
  }

  // Non-IEEE drop-cap package support
  if (opts.dropCap && !isIEEE) {
    out += `\\usepackage{lettrine}\n`;
  }

  // Hyperlink colors setup
  out += `\\hypersetup{\n`;
  out += `  colorlinks=true,\n`;
  out += `  linkcolor=blue,\n`;
  out += `  citecolor=blue,\n`;
  out += `  urlcolor=blue\n`;
  out += `}\n\n`;

  // 3. Title & Author Blocks
  out += `\\title{${escapeLatex(doc.title || 'Untitled Document')}}\n\n`;

  if (isIEEE) {
    out += `\\author{\n`;
    const authorList = (doc.authors && doc.authors.length > 0)
      ? doc.authors
      : [{ name: 'Author Name', affiliation: 'Department of Computer Science, University', email: 'author@univ.edu' }];

    const authorBlocks = authorList.map(author => {
      let block = `  \\IEEEauthorblockN{${escapeLatex(author.name)}}\n` +
                  `  \\IEEEauthorblockA{\\textit{${escapeLatex(author.affiliation || 'University Department')}} \\\\\n`;
      if (author.email) {
        block += `  \\texttt{${escapeLatex(author.email)}}}\n`;
      } else {
        block += `  City, Country}\n`;
      }
      return block;
    });

    out += authorBlocks.join('  \\and\n');
    out += `}\n\n`;
  } else {
    const authorList = (doc.authors && doc.authors.length > 0)
      ? doc.authors.map(a => escapeLatex(a.name)).join(' \\and ')
      : 'Author Name';
    out += `\\author{${authorList}}\n`;
    out += `\\date{\\today}\n\n`;
  }

  // 4. Document Body Start
  out += `\\begin{document}\n\n`;
  out += `\\maketitle\n\n`;

  // 5. Abstract
  if (doc.abstract) {
    out += `\\begin{abstract}\n`;
    out += `${escapeLatex(doc.abstract)}\n`;
    out += `\\end{abstract}\n\n`;
  }

  // 6. Keywords
  if (doc.keywords && doc.keywords.length > 0) {
    if (isIEEE) {
      out += `\\begin{IEEEkeywords}\n`;
      out += `${doc.keywords.map(k => escapeLatex(k)).join(', ')}\n`;
      out += `\\end{IEEEkeywords}\n\n`;
    } else {
      out += `\\noindent\\textbf{Keywords:} ${doc.keywords.map(k => escapeLatex(k)).join(', ')}\n\n`;
    }
  }

  // 7. Multi-column environment for 3-column layout
  if (isMultiColPackage) {
    out += `\\begin{multicols}{3}\n\n`;
  }

  // 8. Sections with Subsections & Formatted Items
  let hasAppliedDropCap = false;

  (doc.sections || []).forEach(sec => {
    const secTitle = escapeLatex(sec.cleanTitle || sec.title);
    const isReferenceSec = secTitle.toUpperCase() === 'REFERENCES' || secTitle.toUpperCase() === 'ACKNOWLEDGMENT';

    if (!isReferenceSec) {
      if (sec.level === 1) {
        out += `\\section{${secTitle}}\n`;
      } else if (sec.level === 2) {
        out += `\\subsection{${secTitle}}\n`;
      } else {
        out += `\\subsubsection{${secTitle}}\n`;
      }
    }

    (sec.items || []).forEach(item => {
      if (item.type === 'paragraph') {
        let content = item.content;

        // Apply IEEE / LaTeX Drop Cap on the very first body paragraph
        if (opts.dropCap && !hasAppliedDropCap && content.length > 20) {
          hasAppliedDropCap = true;
          const match = content.match(/^([A-Za-z])([A-Za-z]+|\b)(.*)$/s);
          if (match) {
            const firstLetter = match[1];
            const restOfWord = match[2];
            const restOfText = match[3];

            if (isIEEE) {
              out += `\\IEEEPARstart{${firstLetter}}{${escapeLatex(restOfWord)}}${escapeLatex(restOfText)}\n\n`;
            } else {
              out += `\\lettrine{${firstLetter}}{${escapeLatex(restOfWord)}}${escapeLatex(restOfText)}\n\n`;
            }
            return;
          }
        }

        out += `${escapeLatex(content)}\n\n`;
      } else if (item.type === 'list') {
        out += `\\begin{itemize}\n`;
        item.items.forEach(li => {
          out += `  \\item ${escapeLatex(li.replace(/^[-*•\d\.\)]\s*/, ''))}\n`;
        });
        out += `\\end{itemize}\n\n`;
      } else if (item.type === 'equation') {
        out += `\\begin{equation}\n`;
        out += `  ${formatMathForLatex(item.content)}\n`;
        out += `\\end{equation}\n\n`;
      } else if (item.type === 'table') {
        out += formatLatexTable(item, cols);
      } else if (item.type === 'figure') {
        const figEnv = cols > 1 ? 'figure' : 'figure';
        out += `\\begin{${figEnv}}[htbp]\n`;
        out += `  \\centering\n`;
        out += `  % \\includegraphics[width=0.85\\linewidth]{figure.png}\n`;
        out += `  \\caption{${escapeLatex(item.caption)}}\n`;
        out += `  \\label{fig:${(sec.cleanTitle || 'fig').toLowerCase().replace(/\s+/g, '_')}}\n`;
        out += `\\end{${figEnv}}\n\n`;
      }
    });
  });

  // End 3-column multicols before bibliography if needed
  if (isMultiColPackage) {
    out += `\\end{multicols}\n\n`;
  }

  // 9. Bibliography
  if (doc.references && doc.references.length > 0) {
    out += `\\begin{thebibliography}{00}\n`;
    doc.references.forEach((ref, idx) => {
      const citeKey = `ref${idx + 1}`;
      out += `\\bibitem{${citeKey}} ${escapeLatex(ref.text)}\n`;
    });
    out += `\\end{thebibliography}\n\n`;
  }

  out += `\\end{document}\n`;

  return out;
}

// Generate companion BibTeX (.bib) file
export function generateBibtex(doc) {
  if (!doc || !doc.references || doc.references.length === 0) {
    return `% No references parsed from document\n@misc{example,\n  title = {Document References},\n  year = {2026}\n}\n`;
  }

  let bib = `% BibTeX Bibliography File for: ${doc.title || 'Document'}\n% Generated automatically by FormatFlow\n\n`;

  doc.references.forEach((ref, idx) => {
    const raw = ref.text || '';
    const citeKey = `ref${idx + 1}`;

    // Try extracting authors, title, publication, year
    const yearMatch = raw.match(/\b(19\d\d|20\d\d)\b/);
    const year = yearMatch ? yearMatch[1] : '2025';

    // Check if title is enclosed in quotes
    const quoteMatch = raw.match(/"([^"]+)"|“([^”]+)”|'([^']+)'/);
    let title = quoteMatch ? (quoteMatch[1] || quoteMatch[2] || quoteMatch[3]) : '';

    let authors = '';
    let journal = '';
    let volume = '';
    let pages = '';

    if (title) {
      const parts = raw.split(quoteMatch[0]);
      authors = (parts[0] || '').replace(/^\[\d+\]\s*/, '').replace(/,\s*$/, '').trim();
      const rest = parts[1] || '';

      const volMatch = rest.match(/vol\.?\s*(\d+)/i);
      if (volMatch) volume = volMatch[1];

      const pageMatch = rest.match(/pp?\.?\s*([\d\-–]+)/i);
      if (pageMatch) pages = pageMatch[1].replace('–', '--');

      journal = rest
        .replace(/,\s*vol\.?\s*\d+/i, '')
        .replace(/,\s*no\.?\s*\d+/i, '')
        .replace(/,\s*pp?\.?\s*[\d\-–]+/i, '')
        .replace(/,\s*(19\d\d|20\d\d)\.?/i, '')
        .replace(/^[,\s]+|[,\.\s]+$/g, '')
        .trim();
    } else {
      title = raw.replace(/^\[\d+\]\s*/, '');
    }

    if (journal.toLowerCase().includes('ieee') || journal.toLowerCase().includes('transactions') || journal.toLowerCase().includes('journal')) {
      bib += `@article{${citeKey},\n`;
      bib += `  author = {${escapeBibtex(authors || 'Anonymous')}},\n`;
      bib += `  title = {{${escapeBibtex(title)}}},\n`;
      bib += `  journal = {${escapeBibtex(journal || 'IEEE')}},\n`;
      if (volume) bib += `  volume = {${volume}},\n`;
      if (pages) bib += `  pages = {${pages}},\n`;
      bib += `  year = {${year}}\n`;
      bib += `}\n\n`;
    } else if (journal.toLowerCase().includes('proc') || journal.toLowerCase().includes('conference') || journal.toLowerCase().includes('symposium')) {
      bib += `@inproceedings{${citeKey},\n`;
      bib += `  author = {${escapeBibtex(authors || 'Anonymous')}},\n`;
      bib += `  title = {{${escapeBibtex(title)}}},\n`;
      bib += `  booktitle = {${escapeBibtex(journal)}},\n`;
      if (pages) bib += `  pages = {${pages}},\n`;
      bib += `  year = {${year}}\n`;
      bib += `}\n\n`;
    } else {
      bib += `@misc{${citeKey},\n`;
      if (authors) bib += `  author = {${escapeBibtex(authors)}},\n`;
      bib += `  title = {{${escapeBibtex(title)}}},\n`;
      if (journal) bib += `  howpublished = {${escapeBibtex(journal)}},\n`;
      bib += `  year = {${year}}\n`;
      bib += `}\n\n`;
    }
  });

  return bib;
}

function escapeBibtex(str) {
  if (!str) return '';
  return str.replace(/([#&%_{}])/g, '\\$1');
}

export function escapeLatex(str) {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}

export function formatMathForLatex(expr) {
  if (!expr) return 'x = y';

  // Subscript beautification (e.g. L_total -> L_{\text{total}}, alpha -> \alpha)
  let math = expr
    .replace(/alpha/g, '\\alpha')
    .replace(/beta/g, '\\beta')
    .replace(/gamma/g, '\\gamma')
    .replace(/delta/g, '\\delta')
    .replace(/lambda/g, '\\lambda')
    .replace(/sigma/g, '\\sigma')
    .replace(/theta/g, '\\theta')
    .replace(/mu/g, '\\mu')
    .replace(/omega/g, '\\omega')
    .replace(/in\s+/g, '\\in ')
    .replace(/\*/g, ' \\cdot ')
    .replace(/<=/g, ' \\le ')
    .replace(/>=/g, ' \\ge ')
    .replace(/!=/g, ' \\ne ')
    .replace(/~=/g, ' \\approx ');

  // Subscripts: word after underscore -> \text{word} if alphabetical
  math = math.replace(/_([a-zA-Z]{2,})/g, '_{\\text{$1}}');

  return math;
}

function formatLatexTable(tableItem, columns = 2) {
  const headers = tableItem.headers || [];
  const rows = tableItem.rows || [];
  if (headers.length === 0 && rows.length === 0) return '';

  const colCount = Math.max(headers.length, rows.length > 0 ? rows[0].length : 1);
  const colSpec = 'c'.repeat(colCount);

  // If table has many columns in multi-column doc, span with table*
  const tableEnv = (columns >= 2 && colCount >= 4) ? 'table*' : 'table';

  let tbl = `\\begin{${tableEnv}}[htbp]\n`;
  tbl += `  \\caption{${escapeLatex(tableItem.title || 'Table Summary')}}\n`;
  tbl += `  \\centering\n`;
  tbl += `  \\begin{tabular}{${colSpec}}\n`;
  tbl += `    \\toprule\n`;

  if (headers.length > 0) {
    tbl += `    ${headers.map(h => `\\textbf{${escapeLatex(h)}}`).join(' & ')} \\\\\n`;
    tbl += `    \\midrule\n`;
  }

  rows.forEach(r => {
    tbl += `    ${r.map(c => escapeLatex(c)).join(' & ')} \\\\\n`;
  });

  tbl += `    \\bottomrule\n`;
  tbl += `  \\end{tabular}\n`;
  tbl += `\\end{${tableEnv}}\n\n`;

  return tbl;
}
