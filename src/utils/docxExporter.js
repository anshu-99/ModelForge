// DOCX Word Document Exporter
import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, Packer } from 'docx';

export async function exportToDocx(doc, formatType = 'professional') {
  if (!doc) return;

  const children = [];

  // Title
  children.push(
    new Paragraph({
      text: doc.title || 'Untitled Document',
      heading: HeadingLevel.TITLE,
      alignment: formatType === 'academic' || formatType === 'ieee' ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: { after: 200 }
    })
  );

  // Subtitle / Authors
  if (doc.authors && doc.authors.length > 0) {
    const authorText = doc.authors.map(a => `${a.name} (${a.affiliation || 'Institution'})`).join('  |  ');
    children.push(
      new Paragraph({
        text: authorText,
        alignment: formatType === 'academic' || formatType === 'ieee' ? AlignmentType.CENTER : AlignmentType.LEFT,
        spacing: { after: 300 }
      })
    );
  }

  // Abstract
  if (doc.abstract) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Abstract— ', bold: true, italics: true }),
          new TextRun({ text: doc.abstract, italics: true })
        ],
        spacing: { before: 200, after: 240 }
      })
    );
  }

  // Keywords
  if (doc.keywords && doc.keywords.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Index Terms: ', bold: true }),
          new TextRun({ text: doc.keywords.join(', ') })
        ],
        spacing: { after: 300 }
      })
    );
  }

  // Sections
  (doc.sections || []).forEach((sec, idx) => {
    let headingPrefix = '';
    if (formatType === 'ieee') {
      const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
      headingPrefix = `${romanNumerals[idx] || (idx + 1)}. `;
    } else if (formatType === 'professional' || formatType === 'custom') {
      headingPrefix = `${idx + 1}.0 `;
    }

    children.push(
      new Paragraph({
        text: `${headingPrefix}${sec.cleanTitle || sec.title}`.toUpperCase(),
        heading: sec.level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
        spacing: { before: 280, after: 140 }
      })
    );

    (sec.items || []).forEach(item => {
      if (item.type === 'paragraph') {
        children.push(
          new Paragraph({
            text: item.content,
            spacing: { after: 180 },
            alignment: formatType === 'ieee' ? AlignmentType.JUSTIFIED : AlignmentType.LEFT
          })
        );
      } else if (item.type === 'list') {
        item.items.forEach(li => {
          children.push(
            new Paragraph({
              text: li.replace(/^[-*•\d\.\)]\s*/, ''),
              bullet: { level: 0 },
              spacing: { after: 100 }
            })
          );
        });
      } else if (item.type === 'equation') {
        children.push(
          new Paragraph({
            text: `[Equation]  ${item.content}`,
            alignment: AlignmentType.CENTER,
            spacing: { before: 140, after: 140 }
          })
        );
      } else if (item.type === 'table') {
        const tableRows = [];
        if (item.headers && item.headers.length > 0) {
          tableRows.push(
            new TableRow({
              children: item.headers.map(h => new TableCell({
                children: [new Paragraph({ text: h, alignment: AlignmentType.CENTER })],
                width: { size: 100 / item.headers.length, type: WidthType.PERCENTAGE }
              }))
            })
          );
        }
        (item.rows || []).forEach(r => {
          tableRows.push(
            new TableRow({
              children: r.map(c => new TableCell({
                children: [new Paragraph({ text: c })],
                width: { size: 100 / r.length, type: WidthType.PERCENTAGE }
              }))
            })
          );
        });

        if (tableRows.length > 0) {
          children.push(
            new Table({
              rows: tableRows,
              width: { size: 100, type: WidthType.PERCENTAGE }
            })
          );
        }
      }
    });
  });

  // References
  if (doc.references && doc.references.length > 0) {
    children.push(
      new Paragraph({
        text: 'REFERENCES',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 140 }
      })
    );

    doc.references.forEach((ref, idx) => {
      children.push(
        new Paragraph({
          text: `[${idx + 1}] ${ref.text}`,
          spacing: { after: 100 }
        })
      );
    });
  }

  const docxFile = new Document({
    sections: [{
      properties: {},
      children
    }]
  });

  const blob = await Packer.toBlob(docxFile);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${(doc.title || 'formatted_document').replace(/[^a-zA-Z0-9_-]/g, '_')}_${formatType}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
