import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Selector } from './components/Selector';
import { MarksGrid } from './components/MarksGrid';
import { Dashboard } from './components/Dashboard';
import { ClassLevel, Student, Subject, SUBJECTS, ViewMode } from './types';
import { getTableName, getColumnName, supabase } from './services/supabase';
import { copyToClipboardSmart, exportToExcel, toTitleCase } from './utils/formatters';
import { Copy, Download, CheckCircle2, AlertTriangle, Database, FileCode } from 'lucide-react';
import { INITIAL_ROSTERS } from './data/class_rosters';

const App: React.FC = () => {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('entry');
  const [selectedClass, setSelectedClass] = useState<ClassLevel>('3');
  const [selectedSubject, setSelectedSubject] = useState<Subject>(SUBJECTS[0]);
  const [selectedTest, setSelectedTest] = useState<number>(1);
  const [maxMarks, setMaxMarks] = useState<number>(10);
  
  // Initialize date with today, but we will try to load from local storage immediately
  const [testDate, setTestDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isTableMissing, setIsTableMissing] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  // Derived
  const tableName = getTableName(selectedClass);
  const columnKey = getColumnName(selectedSubject, selectedTest);

  // --- Automatic Date Persistence Logic ---
  // 1. Load date when switching context
  useEffect(() => {
    const storageKey = `date_${selectedClass}_${selectedSubject}_${selectedTest}`;
    const savedDate = localStorage.getItem(storageKey);
    if (savedDate) {
      setTestDate(savedDate);
    } else {
      // Default to today if no date is saved for this specific test
      setTestDate(new Date().toISOString().split('T')[0]);
    }
  }, [selectedClass, selectedSubject, selectedTest]);

  // 2. Save date when user changes it
  const handleDateChange = (newDate: string) => {
    setTestDate(newDate);
    const storageKey = `date_${selectedClass}_${selectedSubject}_${selectedTest}`;
    localStorage.setItem(storageKey, newDate);
  };
  // ----------------------------------------

  // Fetch Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setIsTableMissing(false);
    try {
      // We deliberately remove .order() from the query to avoid server-side sorting issues
      // if columns have mixed types. We'll sort naturally on the client.
      const { data, error } = await supabase
        .from(tableName)
        .select('*');

      if (error) throw error;

      const rawData = (data as unknown as Student[]) || [];

      // Client-side natural sort for roll numbers
      const sortedData = rawData.sort((a, b) => {
        const rollA = a.roll_no != null ? String(a.roll_no) : '';
        const rollB = b.roll_no != null ? String(b.roll_no) : '';
        return rollA.localeCompare(rollB, undefined, { numeric: true, sensitivity: 'base' });
      });

      setStudents(sortedData);
      setFeedback(null);
    } catch (err: any) {
      const isMissingTable = err?.code === '42P01' || err?.code === 'PGRST205';

      // Only log actual unexpected errors to console
      if (!isMissingTable) {
        let errorDetails = "Unknown error";
        try {
          if (err instanceof Error) {
            errorDetails = err.message;
          } else if (typeof err === 'object' && err !== null) {
            errorDetails = JSON.stringify(err, null, 2);
          } else {
            errorDetails = String(err);
          }
        } catch (e) {
          errorDetails = "Error could not be stringified";
        }
        console.error("Error fetching data:", errorDetails);
      }
      
      // Handle specific error states for UI
      if (isMissingTable) {
         setStudents([]);
         setIsTableMissing(true);
      } else {
         let displayMessage = 'Failed to load class data.';
         if (err) {
           if (err.message) displayMessage = err.message;
           else if (err.details) displayMessage = err.details;
           else if (typeof err === 'string') displayMessage = err;
         }
         setFeedback({ type: 'error', msg: displayMessage });
      }
    } finally {
      setLoading(false);
    }
  }, [tableName]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Initialize Data
  const handleInitializeClass = async () => {
    if (isTableMissing) {
      setFeedback({ type: 'error', msg: 'Table missing. Please copy the schema and run it in Supabase.' });
      return;
    }

    // Removed confirmation dialog to ensure robust execution in all environments
    // if (!window.confirm(`Are you sure you want to initialize data for Class ${selectedClass}? This will add default student records.`)) return;
    
    setLoading(true);
    console.log("Starting initialization for class", selectedClass);
    
    try {
      const roster = INITIAL_ROSTERS[selectedClass];
      if (!roster) throw new Error("No roster data available for this class.");

      console.log("Roster found, students:", roster.length);

      const rows = roster.map((name, index) => ({
        roll_no: (index + 1).toString(),
        name: toTitleCase(name)
      }));

      const { error } = await supabase
        .from(tableName)
        .insert(rows);

      if (error) {
          console.error("Supabase Insert Error:", error);
          throw error;
      }
      
      setFeedback({ type: 'success', msg: `Initialized Class ${selectedClass} with ${rows.length} students.` });
      await fetchData(); // Refresh
    } catch (err: any) {
      console.error("Initialization process failed:", err);
      let msg = err.message || 'Failed to initialize data.';
      if (err?.code === '42P01' || err?.code === 'PGRST205') {
        msg = `Table '${tableName}' does not exist.`;
        setIsTableMissing(true);
      }
      setFeedback({ type: 'error', msg: msg });
    } finally {
      setLoading(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const generateSqlSchema = () => {
    const cols = SUBJECTS.map(s => s.toLowerCase().replace(/\s+/g, '_'))
      .flatMap(s => Array.from({length: 20}, (_, i) => `  ${s}_test_${i+1} text`));
    
    return `CREATE TABLE IF NOT EXISTS public.${tableName} (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  roll_no text,
${cols.join(',\n')}
);

ALTER TABLE public.${tableName} ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable access" ON public.${tableName};
CREATE POLICY "Enable access" ON public.${tableName} FOR ALL USING (true) WITH CHECK (true);`;
  };

  const generateMasterSqlSchema = () => {
    const classes = ['3', '4', '5', '6', '7', '8', '9', '10'];
    
    // Pre-calculate columns string as it is same for all
    const subjectCols = SUBJECTS.map(s => s.toLowerCase().replace(/\s+/g, '_'))
      .flatMap(s => Array.from({length: 20}, (_, i) => `  ${s}_test_${i+1} text`));
    
    const columnsSql = subjectCols.join(',\n');
    
    let masterSql = '-- Master Database Schema for Marks Entry App\n';
    masterSql += '-- Includes tables for Classes 3-10 with all subjects (Tests 1-20)\n\n';

    classes.forEach(c => {
      const tbl = `students_class_${c}`;
      masterSql += `-- Table for Class ${c}\n`;
      masterSql += `CREATE TABLE IF NOT EXISTS public.${tbl} (\n`;
      masterSql += `  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,\n`;
      masterSql += `  name text NOT NULL,\n`;
      masterSql += `  roll_no text,\n`;
      masterSql += columnsSql;
      masterSql += `\n);\n\n`;
      masterSql += `ALTER TABLE public.${tbl} ENABLE ROW LEVEL SECURITY;\n`;
      masterSql += `DROP POLICY IF EXISTS "Enable access ${tbl}" ON public.${tbl};\n`;
      masterSql += `CREATE POLICY "Enable access ${tbl}" ON public.${tbl} FOR ALL USING (true) WITH CHECK (true);\n\n`;
    });
    
    return masterSql;
  };

  const handleCopySchema = async () => {
    const sql = generateSqlSchema();
    try {
      await navigator.clipboard.writeText(sql);
      setFeedback({ type: 'success', msg: 'SQL Schema copied! Run this in Supabase SQL Editor.' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (e) {
      setFeedback({ type: 'error', msg: 'Failed to copy SQL.' });
    }
  };

  const handleDownloadSchema = () => {
    const sql = generateSqlSchema();
    try {
      downloadStringAsFile(sql, `init_class_${selectedClass}_schema.sql`);
      setFeedback({ type: 'success', msg: 'SQL file downloaded.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (e) {
      setFeedback({ type: 'error', msg: 'Failed to download SQL.' });
    }
  };

  const handleDownloadMasterSchema = () => {
    const sql = generateMasterSqlSchema();
    try {
      downloadStringAsFile(sql, 'full_database_schema.sql');
      setFeedback({ type: 'success', msg: 'Full Database SQL downloaded.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (e) {
      setFeedback({ type: 'error', msg: 'Failed to download SQL.' });
    }
  };

  const downloadStringAsFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'application/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Update Mark Logic
  const handleUpdateMark = async (studentId: string, value: string) => {
    setIsSaving(true);
    
    let valToSave: string | number | null = value;
    if (value === '' || value === '-') valToSave = null;
    else if (!isNaN(Number(value))) valToSave = Number(value);
    
    try {
      const { error } = await supabase
        .from(tableName)
        .update({ [columnKey]: valToSave })
        .eq('id', studentId);

      if (error) throw error;

      setStudents(prev => prev.map(s => 
        s.id === studentId ? { ...s, [columnKey]: valToSave } : s
      ));

    } catch (err: any) {
      console.error("Error saving mark:", err);
      setFeedback({ type: 'error', msg: err.message || 'Failed to save mark.' });
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Action Handlers
  const handleSmartCopy = async () => {
    const success = await copyToClipboardSmart(
      students, 
      columnKey, 
      selectedClass, 
      selectedSubject, 
      selectedTest,
      maxMarks,
      testDate
    );
    if (success) {
      setFeedback({ type: 'success', msg: 'Copied! Ready for WhatsApp & Excel.' });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleExport = () => {
    exportToExcel(students, selectedClass, selectedSubject, selectedTest, testDate);
    setFeedback({ type: 'success', msg: 'Excel report downloaded.' });
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header currentView={viewMode} onViewChange={setViewMode} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Feedback Toast */}
        {feedback && (
          <div className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in-down ${
            feedback.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}>
            {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5"/> : <AlertTriangle className="w-5 h-5"/>}
            <span className="font-medium text-sm">{feedback.msg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
          
          <div className="lg:col-span-1">
            <Selector 
              selectedClass={selectedClass}
              setSelectedClass={setSelectedClass}
              selectedSubject={selectedSubject}
              setSelectedSubject={setSelectedSubject}
              selectedTest={selectedTest}
              setSelectedTest={setSelectedTest}
              maxMarks={maxMarks}
              setMaxMarks={setMaxMarks}
              testDate={testDate}
              setTestDate={handleDateChange} // Use wrapper to save to local storage
              loading={loading}
              viewMode={viewMode}
            />

            {viewMode === 'entry' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3 sticky top-24 animate-fade-in">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Actions</h3>
                
                <button 
                  onClick={handleSmartCopy}
                  disabled={loading || students.length === 0 || isTableMissing}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50 shadow-md shadow-indigo-200"
                >
                  <Copy className="w-4 h-4" />
                  Smart Copy
                </button>
                <p className="text-[10px] text-gray-400 text-center px-2 leading-tight">
                  Copies ASCII for WhatsApp & HTML for Excel simultaneously.
                </p>

                <hr className="border-gray-100 my-2" />

                <button 
                  onClick={handleExport}
                  disabled={loading || students.length === 0 || isTableMissing}
                  className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-2.5 px-4 rounded-lg font-medium transition-all disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Export Excel
                </button>
              </div>
            )}
          </div>

          <div className="lg:col-span-3">
            {viewMode === 'entry' ? (
              <MarksGrid 
                students={students} 
                loading={loading} 
                columnKey={columnKey}
                onUpdateMark={handleUpdateMark}
                isSaving={isSaving}
                onInitialize={handleInitializeClass}
                canInitialize={!!INITIAL_ROSTERS[selectedClass]}
                isTableMissing={isTableMissing}
                onCopySchema={handleCopySchema}
                onDownloadSchema={handleDownloadSchema}
                onDownloadMasterSchema={handleDownloadMasterSchema}
                onRefresh={fetchData}
                classNameStr={selectedClass}
              />
            ) : (
              <Dashboard 
                students={students}
                loading={loading}
                selectedSubject={selectedSubject}
                selectedClass={selectedClass}
                isTableMissing={isTableMissing}
              />
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;