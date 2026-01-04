import React from 'react';
import { ClassLevel, Subject, SUBJECTS, ViewMode } from '../types';
import { Filter, BookOpen, ClipboardList, Hash, Calendar } from 'lucide-react';

interface SelectorProps {
  selectedClass: ClassLevel;
  setSelectedClass: (c: ClassLevel) => void;
  selectedSubject: Subject;
  setSelectedSubject: (s: Subject) => void;
  selectedTest: number;
  setSelectedTest: (t: number) => void;
  maxMarks: number;
  setMaxMarks: (m: number) => void;
  testDate: string;
  setTestDate: (d: string) => void;
  loading: boolean;
  viewMode: ViewMode;
}

export const Selector: React.FC<SelectorProps> = ({
  selectedClass,
  setSelectedClass,
  selectedSubject,
  setSelectedSubject,
  selectedTest,
  setSelectedTest,
  maxMarks,
  setMaxMarks,
  testDate,
  setTestDate,
  loading,
  viewMode
}) => {
  const classes: ClassLevel[] = ['3', '4', '5', '6', '7', '8', '9', '10'];
  const tests = Array.from({ length: 20 }, (_, i) => i + 1);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 transition-all">
      {/* 
        Responsive Grid Layout Updated for Test Date:
        - Mobile: grid-cols-2. Class, Subject, Test, Marks take 1 slot. Date takes 2 slots (full width).
        - Tablet (md): grid-cols-5. All items in one row.
        - Desktop (lg): grid-cols-1. Stacked vertically sidebar.
      */}
      <div className={`grid gap-4 ${viewMode === 'entry' ? 'grid-cols-2 md:grid-cols-5 lg:grid-cols-1' : 'grid-cols-2 lg:grid-cols-1'}`}>

        {/* Class Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3 h-3" /> Class
          </label>
          <div className="relative">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value as ClassLevel)}
              disabled={loading}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none disabled:opacity-50"
            >
              {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
            </select>
          </div>
        </div>

        {/* Subject Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <BookOpen className="w-3 h-3" /> Subject
          </label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value as Subject)}
            disabled={loading}
            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:opacity-50"
          >
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Test Selector - Hidden in Dashboard Mode */}
        {viewMode === 'entry' && (
          <div className="space-y-1.5 animate-fade-in">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <ClipboardList className="w-3 h-3" /> Test
            </label>
            <select
              value={selectedTest}
              onChange={(e) => setSelectedTest(Number(e.target.value))}
              disabled={loading}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:opacity-50"
            >
              {tests.map(t => <option key={t} value={t}>Test {t}</option>)}
            </select>
          </div>
        )}

        {/* Max Marks Selector - Hidden in Dashboard Mode */}
        {viewMode === 'entry' && (
          <div className="space-y-1.5 animate-fade-in">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Hash className="w-3 h-3" /> Total Marks
            </label>
            <input
              type="number"
              min="1"
              value={maxMarks || ''}
              onChange={(e) => setMaxMarks(Number(e.target.value))}
              disabled={loading}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:opacity-50"
            />
          </div>
        )}

        {/* Test Date Selector - Hidden in Dashboard Mode */}
        {/* On Mobile (grid-cols-2), this takes 2 cols to fit perfectly at bottom */}
        {viewMode === 'entry' && (
          <div className="space-y-1.5 animate-fade-in col-span-2 md:col-span-1 lg:col-span-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Test Date
            </label>
            <input
              type="date"
              value={testDate}
              onChange={(e) => setTestDate(e.target.value)}
              disabled={loading}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:opacity-50"
            />
          </div>
        )}

      </div>
    </div>
  );
};