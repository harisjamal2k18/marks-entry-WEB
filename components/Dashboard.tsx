import React, { useState, useMemo } from 'react';
import { Student, Subject } from '../types';
import { getColumnName } from '../services/supabase';
import { copyDashboardSmart, shortenName } from '../utils/formatters';
import { Loader2, Database, Table2, Download, Copy, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';

interface DashboardProps {
  students: Student[];
  loading: boolean;
  selectedSubject: Subject;
  selectedClass: string;
  isTableMissing: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  students,
  loading,
  selectedSubject,
  selectedClass,
  isTableMissing
}) => {
  const [copyFeedback, setCopyFeedback] = useState('');

  const tests = Array.from({ length: 20 }, (_, i) => i + 1);

  // Calculate active tests (tests that have at least one mark entered)
  const activeTests = useMemo(() => {
    if (!students.length) return [];
    return tests.filter(t => {
      const colKey = getColumnName(selectedSubject, t);
      return students.some(s => {
        const val = s[colKey];
        return val !== null && val !== undefined && val !== '';
      });
    });
  }, [students, selectedSubject, tests]);

  const handleExportDashboard = () => {
    // 1. Prepare Title
    const title = `Class ${selectedClass} - ${selectedSubject} Master Sheet`;

    // 2. Prepare Headers
    // Logic: Retrieve date from LocalStorage matching the key format in App.tsx
    const headers = [
      "Roll No",
      "Name",
      ...tests.map(t => {
        // Retrieve automatic date from local storage
        const storageKey = `date_${selectedClass}_${selectedSubject}_${t}`;
        const isoDate = localStorage.getItem(storageKey);

        if (isoDate) {
          const [year, month, day] = isoDate.split('-');
          return `Test ${t} (${day}/${month}/${year})`;
        }
        return `Test ${t}`;
      }),
      "Total",
      "Avg"
    ];

    // 3. Prepare Data Rows
    const dataRows = students.map(s => {
      let totalMarks = 0;
      let count = 0;

      // Map scores for each test
      const scores = tests.map(t => {
        const colKey = getColumnName(selectedSubject, t);
        const val = s[colKey];

        if (val !== null && val !== undefined && val !== '') {
          const numVal = parseFloat(String(val));
          if (!isNaN(numVal)) {
            totalMarks += numVal;
            count++;
          }
          return val; // Return the raw value (mark, A, NA)
        }
        return '';
      });

      // Calculate stats
      const totalStr = count > 0 ? Number(totalMarks.toFixed(1).replace(/\.0$/, '')) : '';
      const avgStr = count > 0 ? Number((totalMarks / count).toFixed(1)) : '';

      return [
        s.roll_no,
        s.name,
        ...scores,
        totalStr,
        avgStr
      ];
    });

    // 4. Combine into Array of Arrays for SheetJS
    const wsData = [
      [title], // Row 0: Title
      headers, // Row 1: Headers
      ...dataRows // Row 2+: Data
    ];

    // 5. Create Sheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // 6. Styling: Merge Title
    const lastColIndex = headers.length - 1;
    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: lastColIndex } });

    // 7. Set Column Widths
    const wscols = [
      { wch: 8 },  // Roll
      { wch: 25 }, // Name
    ];
    // Add widths for tests (Wider to fit "Test 1 (24/11/2025)")
    tests.forEach(() => wscols.push({ wch: 18 }));
    // Add widths for Total/Avg
    wscols.push({ wch: 10 }); // Total
    wscols.push({ wch: 10 }); // Avg

    ws['!cols'] = wscols;

    // 8. Write File
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${selectedSubject} Master`);
    XLSX.writeFile(wb, `Class_${selectedClass}_${selectedSubject}_Master_Sheet.xlsx`);
  };

  const handleSmartCopy = async () => {
    const success = await copyDashboardSmart(students, selectedClass, selectedSubject);
    if (success) {
      setCopyFeedback('Copied!');
      setTimeout(() => setCopyFeedback(''), 2000);
    } else {
      setCopyFeedback('Failed');
      setTimeout(() => setCopyFeedback(''), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white rounded-xl border border-gray-200 h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-600" />
        <p className="font-medium">Compiling Master Sheet...</p>
      </div>
    );
  }

  if (isTableMissing || students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white rounded-xl border border-gray-200 min-h-[400px]">
        <Database className="w-12 h-12 mb-4 text-gray-300" />
        <p className="font-medium text-lg text-gray-600">No Data Available</p>
        <p className="text-sm text-gray-400 mt-1">Please select a valid class or initialize the roster in Data Entry mode.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col h-[calc(100vh-250px)] min-h-[500px]">

      {/* Dashboard Toolbar */}
      <div className="flex flex-col border-b border-gray-200 bg-gray-50/50">
        <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <Table2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Master Sheet</h2>
              <p className="text-xs text-gray-500">Class {selectedClass} • {selectedSubject} • All Tests</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={handleSmartCopy}
              className={`flex items-center gap-2 border px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm ${copyFeedback === 'Copied!'
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'
                }`}
            >
              {copyFeedback === 'Copied!' ? (
                <><CheckCircle2 className="w-4 h-4" /> Copied!</>
              ) : (
                <><Copy className="w-4 h-4" /> Copy</>
              )}
            </button>

            <button
              onClick={handleExportDashboard}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm ml-auto sm:ml-0"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Master Table */}
      <div className="overflow-auto flex-1 relative pb-2">
        <table className="w-full text-sm text-left border-collapse whitespace-nowrap">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200 sticky top-0 z-30">
            <tr>
              <th className="px-2 sm:px-4 py-3 font-semibold w-12 sm:w-16 bg-gray-50 sticky left-0 z-40 border-r border-gray-200">Roll</th>
              <th className="px-2 sm:px-4 py-3 font-semibold w-28 sm:w-48 bg-gray-50 sticky left-12 sm:left-16 z-40 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-r border-gray-200">Name</th>

              {tests.map(t => (
                <th key={t} className="px-1 sm:px-2 py-3 font-semibold text-center border-r border-gray-100 min-w-[50px] sm:min-w-[60px]">
                  T{t}
                </th>
              ))}
              <th className="px-2 sm:px-4 py-3 font-semibold min-w-[80px] text-center bg-indigo-50 text-indigo-800 border-l border-indigo-100">Total</th>
              <th className="px-2 sm:px-4 py-3 font-semibold min-w-[80px] text-center bg-indigo-50 text-indigo-800 border-l border-indigo-100">Avg</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students.map((student, index) => {
              // Calculate stats
              let totalMarks = 0;
              let count = 0;

              return (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-2 sm:px-4 py-2 font-medium text-gray-500 sticky left-0 bg-white group-hover:bg-gray-50 z-20 border-r border-gray-100">
                    {student.roll_no}
                  </td>
                  <td className="px-2 sm:px-4 py-2 font-medium text-gray-900 sticky left-12 sm:left-16 bg-white group-hover:bg-gray-50 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] border-r border-gray-100 truncate max-w-[112px] sm:max-w-[192px]">
                    {shortenName(student.name)}
                  </td>

                  {tests.map(t => {
                    const colKey = getColumnName(selectedSubject, t);
                    const val = student[colKey];
                    let displayVal = '-';
                    let cellClass = "text-gray-300";

                    if (val !== null && val !== undefined && val !== '') {
                      displayVal = String(val);
                      cellClass = "text-gray-900 font-medium";

                      const numVal = parseFloat(String(val));
                      if (!isNaN(numVal)) {
                        totalMarks += numVal;
                        count++;
                      } else if (String(val).toUpperCase() === 'A') {
                        cellClass = "text-red-600 font-bold bg-red-50";
                      } else if (String(val).toUpperCase() === 'NA') {
                        cellClass = "text-amber-600 font-bold bg-amber-50";
                      }
                    }

                    return (
                      <td key={t} className={`px-1 sm:px-2 py-2 text-center border-r border-gray-100 text-xs ${cellClass}`}>
                        {displayVal}
                      </td>
                    );
                  })}

                  <td className="px-2 sm:px-2 py-2 text-center font-bold text-indigo-700 bg-indigo-50/30 border-l border-indigo-100">
                    {count > 0 ? totalMarks.toFixed(1).replace(/\.0$/, '') : '-'}
                  </td>
                  <td className="px-2 sm:px-2 py-2 text-center font-bold text-indigo-700 bg-indigo-50/30 border-l border-indigo-100">
                    {count > 0 ? (totalMarks / count).toFixed(1) : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};