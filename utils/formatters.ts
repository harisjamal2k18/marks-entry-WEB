import { Student } from '../types';
import * as XLSX from 'xlsx';
import { getColumnName } from '../services/supabase';

export const toTitleCase = (str: string) => {
  if (typeof str !== 'string') return '';
  // Remove double spaces first, then title case
  return str.replace(/\s+/g, ' ').trim().toLowerCase().split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}-${month}-${year}`; // DD-MM-YYYY
};

export const shortenName = (name: string) => {
  if (!name) return '';
  const trimmed = name.trim();
  // Check if the name is JUST "Muhammad" or "Mohammad" (case insensitive)
  if (/^(Muhammad|Mohammad)$/i.test(trimmed)) {
    return trimmed;
  }
  return trimmed.replace(/Muhammad/gi, 'M').replace(/Mohammad/gi, 'M');
};

export const copyToClipboardSmart = async (
  students: Student[],
  columnKey: string,
  className: string,
  subject: string,
  testNo: number,
  maxMarks: number,
  testDate: string
) => {
  const formattedDate = formatDate(testDate);
  const title = `Class ${className} - ${subject} Test ${testNo} (${formattedDate})`;
  const headerSub = `(Out of ${maxMarks})`;

  // 1. Generate WhatsApp text (ASCII style, aligned)
  const MAX_NAME_WIDTH = 12;

  // Determine dynamic widths
  const maxNameLen = Math.min(
    Math.max(...students.map(s => shortenName(s.name || '').length), 4), // minimum 4 for "Name"
    MAX_NAME_WIDTH
  );

  // Calculate max roll number length (default to at least 2 for 'No')
  const maxRollLen = Math.max(2, ...students.map(s => (s.roll_no || '').length));

  const marksLen = 5; // Fixed width for "Marks" header alignment

  let textData = `*${title} ${headerSub}*\n`;
  textData += "```\n"; // Start Code Block for Monospace Font

  // Header Construction: No | Name | Marks
  const hRoll = 'No'.padEnd(maxRollLen);
  const hName = 'Name'.padEnd(maxNameLen);
  const hMarks = 'Marks'.padStart(marksLen);

  textData += `${hRoll} | ${hName} | ${hMarks}\n`;

  // Separator Line
  textData += `${'-'.repeat(maxRollLen)}-|-${'-'.repeat(maxNameLen)}-|-${'-'.repeat(marksLen)}\n`;

  students.forEach(s => {
    const roll = (s.roll_no || '').padEnd(maxRollLen);

    // TRUNCATE and TRIM name to fit exactly in the box
    const name = shortenName(s.name || '').trim().substring(0, maxNameLen).padEnd(maxNameLen);

    const markVal = s[columnKey] ? String(s[columnKey]) : '-';
    // Align marks right to match "Marks" header
    const mark = markVal.padStart(marksLen);

    textData += `${roll} | ${name} | ${mark}\n`;
  });

  textData += "```"; // End Code Block

  // 2. Generate HTML for Excel/Word
  let htmlData = `
    <table border="1" style="border-collapse: collapse; font-family: Arial, sans-serif;">
      <thead>
        <tr style="background-color: #f0f0f0;">
          <th colspan="3" style="padding: 8px; text-align: center;">${title} <br/> <span style="font-size: 0.8em">${headerSub}</span></th>
        </tr>
        <tr style="background-color: #e0e0e0;">
          <th style="padding: 5px; text-align: left;">Roll No</th>
          <th style="padding: 5px; text-align: left;">Name</th>
          <th style="padding: 5px; text-align: center;">Marks (/${maxMarks})</th>
        </tr>
      </thead>
      <tbody>
  `;

  students.forEach(s => {
    const mark = s[columnKey];
    let color = '#000000';
    if (mark === 'A') color = '#dc2626'; // Red
    if (mark === 'NA') color = '#d97706'; // Amber

    htmlData += `
      <tr>
        <td style="padding: 5px;">${s.roll_no}</td>
        <td style="padding: 5px;">${s.name}</td>
        <td style="padding: 5px; text-align: center; color: ${color}; font-weight: bold;">
          ${mark || ''}
        </td>
      </tr>
    `;
  });
  htmlData += `</tbody></table>`;

  // Execute Copy
  try {
    const blobText = new Blob([textData], { type: 'text/plain' });
    const blobHtml = new Blob([htmlData], { type: 'text/html' });

    const data = [new ClipboardItem({
      'text/plain': blobText,
      'text/html': blobHtml
    })];

    await navigator.clipboard.write(data);
    return true;
  } catch (err) {
    console.error('Clipboard write failed', err);
    return false;
  }
};

export const copyDashboardSmart = async (
  students: Student[],
  className: string,
  subject: string
) => {
  const title = `Class ${className} - ${subject} Master Sheet`;
  const allTests = Array.from({ length: 20 }, (_, i) => i + 1);

  // Identify which tests actually have data to keep the table clean
  const activeTests = allTests.filter(t => {
    const key = getColumnName(subject, t);
    return students.some(s => {
      const val = s[key];
      return val !== null && val !== undefined && val !== '';
    });
  });

  // 1. WhatsApp Data (ASCII)
  // Shows only recorded data (e.g. T1 | T2) instead of Total/Avg summary
  let textData = `*${title}*\n`;
  textData += "```\n";

  const MAX_NAME_WIDTH = 12;
  const hRoll = 'No'.padEnd(3);
  const hName = 'Name'.padEnd(MAX_NAME_WIDTH);

  // Dynamic Headers for active tests only
  // Allocating 3 chars per test column (e.g. " T1") for compactness on mobile
  const testHeaders = activeTests.map(t => `T${t}`.padStart(3)).join('|');

  textData += `${hRoll}|${hName}|${testHeaders}\n`;

  const testSeps = activeTests.map(() => '---').join('|');
  textData += `${'-'.repeat(3)}|${'-'.repeat(MAX_NAME_WIDTH)}|${testSeps}\n`;

  students.forEach(s => {
    const r = (s.roll_no || '').padEnd(3);
    const n = shortenName(s.name || '').trim().substring(0, MAX_NAME_WIDTH).padEnd(MAX_NAME_WIDTH);

    const marks = activeTests.map(t => {
      const key = getColumnName(subject, t);
      const val = s[key];
      // Show '-' if empty, otherwise the value
      return (val ? String(val) : '-').padStart(3);
    }).join('|');

    textData += `${r}|${n}|${marks}\n`;
  });
  textData += "```";

  // 2. HTML Data (Excel)
  // We also hide empty test columns here for a cleaner Master Sheet
  // But we KEEP Total and Avg as they are standard for Excel reports
  let htmlData = `
    <table border="1" style="border-collapse: collapse; font-family: Arial, sans-serif; font-size: 12px;">
      <thead>
        <tr style="background-color: #f0f0f0;">
          <th colspan="${2 + activeTests.length + 2}" style="padding: 10px; text-align: center; font-size: 16px;">${title}</th>
        </tr>
        <tr style="background-color: #e0e0e0;">
          <th style="padding: 5px;">Roll</th>
          <th style="padding: 5px; text-align: left;">Name</th>
          ${activeTests.map(t => `<th style="padding: 2px; width: 30px;">T${t}</th>`).join('')}
          <th style="padding: 5px;">Total</th>
          <th style="padding: 5px;">Avg</th>
        </tr>
      </thead>
      <tbody>
  `;

  students.forEach(s => {
    let total = 0;
    let count = 0;

    // Calculate totals based on ALL valid numeric data
    allTests.forEach(t => {
      const key = getColumnName(subject, t);
      const val = s[key];
      const num = parseFloat(String(val));
      if (!isNaN(num)) {
        total += num;
        count++;
      }
    });

    const totStr = count > 0 ? total.toFixed(1).replace(/\.0$/, '') : '-';
    const avgStr = count > 0 ? (total / count).toFixed(1) : '-';

    htmlData += `<tr>`;
    htmlData += `<td style="padding: 5px;">${s.roll_no}</td>`;
    htmlData += `<td style="padding: 5px;">${s.name}</td>`;

    activeTests.forEach(t => {
      const key = getColumnName(subject, t);
      const val = s[key];
      let display = '';
      let color = '#000';
      if (val !== null && val !== undefined && val !== '') {
        display = String(val);
        const num = parseFloat(String(val));
        if (!isNaN(num)) {
          // Normal number
        } else {
          if (display.toUpperCase() === 'A') color = 'red';
          else if (display.toUpperCase() === 'NA') color = 'orange';
        }
      }
      htmlData += `<td style="padding: 5px; text-align: center; color: ${color};">${display}</td>`;
    });

    htmlData += `<td style="padding: 5px; text-align: center; font-weight: bold; background-color: #f9fafb;">${totStr}</td>`;
    htmlData += `<td style="padding: 5px; text-align: center; font-weight: bold; background-color: #f9fafb;">${avgStr}</td>`;
    htmlData += `</tr>`;
  });

  htmlData += `</tbody></table>`;

  try {
    const blobText = new Blob([textData], { type: 'text/plain' });
    const blobHtml = new Blob([htmlData], { type: 'text/html' });
    const data = [new ClipboardItem({ 'text/plain': blobText, 'text/html': blobHtml })];
    await navigator.clipboard.write(data);
    return true;
  } catch (e) {
    console.error('Clipboard write failed', e);
    return false;
  }
};

export const exportToExcel = (
  students: Student[],
  className: string,
  subject?: string,
  testNo?: number,
  testDate?: string
) => {
  // 1. Prepare Metadata & Title
  const formattedDate = testDate ? formatDate(testDate) : '';
  let title = `Class ${className}`;
  let columnKey = '';

  if (subject && testNo) {
    title = `Class ${className} - ${subject} Test ${testNo}`;
    if (formattedDate) title += ` (${formattedDate})`;
    columnKey = getColumnName(subject, testNo);
  }

  // 2. Prepare Data Rows
  // We strictly want: Roll No | Name | Marks
  const headerRow = ["Roll No", "Name", "Marks"];

  const dataRows = students.map(s => {
    const mark = columnKey ? s[columnKey] : '';
    return [
      s.roll_no,
      s.name,
      mark
    ];
  });

  // 3. Combine into Array of Arrays for aoa_to_sheet
  // Row 0: Title (Merged later)
  // Row 1: Headers
  // Row 2+: Data
  const wsData = [
    [title], // Title row
    headerRow,
    ...dataRows
  ];

  // 4. Create Sheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // 5. Styling & Formatting
  // Merge the title across 3 columns (A1:C1)
  if (!ws['!merges']) ws['!merges'] = [];
  ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } });

  // Set column widths
  ws['!cols'] = [
    { wch: 8 },  // Roll
    { wch: 25 }, // Name
    { wch: 10 }  // Marks
  ];

  // 6. Create Workbook
  const wb = XLSX.utils.book_new();

  // Sheet Name max 31 chars
  let sheetName = subject ? `${subject} T${testNo}` : `Class ${className}`;
  if (sheetName.length > 31) sheetName = sheetName.substring(0, 31);

  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // 7. Generate Filename
  let filename = `Class_${className}_Marks`;
  if (subject && testNo) {
    filename = `Class_${className}_${subject}_Test_${testNo}`;
    if (formattedDate) filename += `_(${formattedDate})`;
  }

  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const getMarkStatus = (value: string | number | null): string => {
  if (value === null || value === '') return 'bg-gray-50';
  const valStr = String(value).toUpperCase();
  if (valStr === 'A') return 'bg-red-100 text-red-800 border-red-200';
  if (valStr === 'NA') return 'bg-amber-100 text-amber-800 border-amber-200';
  const num = parseFloat(valStr);
  if (!isNaN(num)) {
    if (num < 0 || num > 100) return 'bg-red-50 text-red-500 ring-2 ring-red-500'; // Warning
    return 'bg-green-50 text-green-800 border-green-200';
  }
  return 'bg-gray-50';
};