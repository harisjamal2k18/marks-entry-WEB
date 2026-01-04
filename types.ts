export interface Student {
  id: string;
  name: string;
  roll_no: string;
  [key: string]: string | number | null; // Allow dynamic access for subject_test_n columns
}

export type ClassLevel = '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10';

export const SUBJECTS = [
  'English',
  'Math',
  'Science',
  'Urdu',
  'Islamiat',
  'Sindhi',
  'Pakistan Studies',
  'Computer',
  'Chemistry',
  'Physics',
  'Biology'
] as const;

export type Subject = typeof SUBJECTS[number];

export interface MarksData {
  [studentId: string]: string; // Current working value for the input
}

export type MarksStatus = 'valid' | 'absent' | 'not_attempted' | 'empty' | 'invalid';

export type ViewMode = 'entry' | 'dashboard';