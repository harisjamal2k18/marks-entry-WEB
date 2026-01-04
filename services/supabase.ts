import { createClient } from '@supabase/supabase-js';

// Using credentials provided in the prompt
const SUPABASE_URL = 'https://hidwvmgjbthiepmtdvvi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpZHd2bWdqYnRoaWVwbXRkdnZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3Nzc5MzcsImV4cCI6MjA3OTM1MzkzN30.ru-sjp9GLsBkndyJbqQIrTU1BcNN2APVaHeHbDmXIMo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const getTableName = (classLevel: string) => `students_class_${classLevel}`;

export const getColumnName = (subject: string, testNo: number) => 
  `${subject.toLowerCase().replace(/\s+/g, '_')}_test_${testNo}`;