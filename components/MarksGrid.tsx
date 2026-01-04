import React, { useState, useRef, useEffect } from 'react';
import { Student } from '../types';
import { getMarkStatus, shortenName } from '../utils/formatters';
import { Loader2, AlertCircle, Database, PlusCircle, FileCode, Download, RefreshCw, CheckCircle } from 'lucide-react';

interface MarksGridProps {
  students: Student[];
  loading: boolean;
  columnKey: string;
  onUpdateMark: (studentId: string, value: string) => Promise<void>;
  isSaving: boolean;
  onInitialize?: () => void;
  canInitialize?: boolean;
  isTableMissing?: boolean;
  onCopySchema?: () => void;
  onDownloadSchema?: () => void;
  onDownloadMasterSchema?: () => void;
  onRefresh?: () => void;
  classNameStr?: string;
}

export const MarksGrid: React.FC<MarksGridProps> = ({
  students,
  loading,
  columnKey,
  onUpdateMark,
  isSaving,
  onInitialize,
  canInitialize,
  isTableMissing,
  onCopySchema,
  onDownloadSchema,
  onDownloadMasterSchema,
  onRefresh,
  classNameStr
}) => {
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    const initialValues: Record<string, string> = {};
    students.forEach(s => {
      initialValues[s.id] = s[columnKey] != null ? String(s[columnKey]) : '';
    });
    setLocalValues(initialValues);
  }, [students, columnKey]);

  const handleChange = (studentId: string, val: string) => {
    setLocalValues(prev => ({ ...prev, [studentId]: val }));
  };

  const handleBlur = async (studentId: string, originalValue: string | number | null) => {
    const currentValue = localValues[studentId] || '';
    const normalizedCurrent = currentValue.trim().toUpperCase();
    const normalizedOriginal = originalValue ? String(originalValue).trim().toUpperCase() : '';

    if (normalizedCurrent !== normalizedOriginal) {
      await onUpdateMark(studentId, normalizedCurrent);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextInput = inputRefs.current[index + 1];
      if (nextInput) nextInput.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevInput = inputRefs.current[index - 1];
      if (prevInput) prevInput.focus();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white rounded-xl border border-gray-200 h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-600" />
        <p className="font-medium">Loading Class Data...</p>
      </div>
    );
  }

  if (isTableMissing) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center flex flex-col items-center justify-center h-auto min-h-[400px]">
        <div className="bg-red-50 p-4 rounded-full mb-4">
          <Database className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Database Table Missing</h3>
        <p className="text-gray-500 mt-2 max-w-md mx-auto mb-6">
          The table for <strong>Class {classNameStr}</strong> does not exist in Supabase yet.
          <br />
          <span className="text-xs text-gray-400 mt-1 block">
            Step 1: Download SQL Schema. <br />
            Step 2: Run it in Supabase SQL Editor. <br />
            Step 3: Click Refresh below.
          </span>
        </p>

        <div className="flex flex-col gap-3 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {onCopySchema && (
              <button
                onClick={onCopySchema}
                className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-lg"
              >
                <FileCode className="w-4 h-4" />
                Copy SQL Schema
              </button>
            )}
            {onDownloadSchema && (
              <button
                onClick={onDownloadSchema}
                className="flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-lg font-medium transition-all shadow-sm"
              >
                <Download className="w-4 h-4" />
                Download SQL File
              </button>
            )}
          </div>
          {onDownloadMasterSchema && (
            <button
              onClick={onDownloadMasterSchema}
              className="text-xs text-gray-500 hover:text-indigo-600 underline mt-1"
            >
              Download Full Database Schema (Classes 3-10)
            </button>
          )}
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center justify-center gap-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-6 py-2 rounded-full transition-colors text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            I've Created the Table - Refresh
          </button>
        )}
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
        <div className="bg-green-50 p-4 rounded-full mb-4 ring-8 ring-green-50/50">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Database Connected & Ready</h3>
        <p className="text-gray-600 mt-2 max-w-sm mx-auto mb-8">
          The database table for <strong>Class {classNameStr}</strong> exists but is currently empty.
          <br />
          <span className="text-sm text-gray-400 mt-2 block">
            Click below to load the official student roster.
          </span>
        </p>

        {canInitialize && onInitialize && (
          <button
            onClick={onInitialize}
            className="flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-green-200 hover:shadow-green-300 hover:-translate-y-1 active:scale-95 animate-pulse"
          >
            <Database className="w-6 h-6" />
            {/* Calculate count dynamically if possible, or just show text */}
            Initialize Class {classNameStr} Roster ({canInitialize ? '40ish' : '0'} Students)
          </button>
        )}

        {/* Schema Tools Section for Empty State */}
        <div className="mt-12 pt-6 border-t border-gray-100 w-full max-w-md">
          <p className="text-[10px] text-gray-300 mb-3 uppercase tracking-wider font-semibold">Troubleshooting & Setup</p>
          <div className="flex justify-center gap-3 flex-wrap opacity-75 hover:opacity-100 transition-opacity">
            {onCopySchema && (
              <button onClick={onCopySchema} className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 px-3 py-2 rounded-lg text-xs font-medium transition-colors">
                <FileCode className="w-3 h-3" /> Copy SQL
              </button>
            )}
            {onDownloadMasterSchema && (
              <button onClick={onDownloadMasterSchema} className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 px-3 py-2 rounded-lg text-xs font-medium transition-colors">
                <Download className="w-3 h-3" /> Full SQL
              </button>
            )}
            {onRefresh && (
              <button onClick={onRefresh} className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 px-3 py-2 rounded-lg text-xs font-medium transition-colors">
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-180px)] min-h-[500px]">
      <div className="overflow-x-auto flex-1 relative no-scrollbar">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200 sticky top-0 z-20">
            <tr>
              <th className="px-4 py-3 font-semibold w-16">Roll</th>
              <th className="px-4 py-3 font-semibold sticky left-0 bg-gray-50 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Name</th>
              <th className="px-4 py-3 font-semibold text-center w-32 bg-indigo-50 text-indigo-700 border-b-2 border-indigo-200">
                Entry
                {isSaving && <Loader2 className="w-3 h-3 inline ml-1 animate-spin" />}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students.map((student, index) => {
              const val = localValues[student.id] ?? '';
              const statusColor = getMarkStatus(val);

              return (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-4 py-2 font-medium text-gray-500">{student.roll_no}</td>
                  <td className="px-4 py-2 font-medium text-gray-900 sticky left-0 bg-white group-hover:bg-gray-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] truncate max-w-[150px]">
                    {shortenName(student.name)}
                  </td>
                  <td className="px-2 py-2 bg-indigo-50/30">
                    <div className="relative flex items-center justify-center">
                      <input
                        ref={(el) => { inputRefs.current[index] = el; return; }}
                        type="text"
                        inputMode="text"
                        value={val}
                        onChange={(e) => handleChange(student.id, e.target.value)}
                        onBlur={() => handleBlur(student.id, student[columnKey])}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        placeholder="-"
                        className={`w-full text-center py-2 rounded-md font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${statusColor} border border-transparent`}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-50 border-t border-gray-200 p-3 text-xs text-gray-500 flex justify-between items-center">
        <span>Total Students: {students.length}</span>
        <div className="flex gap-3">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400"></span> Valid</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400"></span> Absent (A)</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Not Attempted (NA)</span>
        </div>
      </div>
    </div>
  );
};