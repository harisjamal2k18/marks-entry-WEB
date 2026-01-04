import React from 'react';
import { GraduationCap, LayoutDashboard, PenTool } from 'lucide-react';
import { ViewMode } from '../types';

interface HeaderProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onViewChange }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight hidden sm:block">Marks Entry - Class Tests </h1>
            <h1 className="text-lg font-bold text-gray-900 leading-tight sm:hidden">Marks</h1>
            <p className="text-xs text-gray-500 hidden sm:block">Naya Nazimabad Campus</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => onViewChange('entry')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              currentView === 'entry' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span className="hidden sm:inline">Data Entry</span>
            <span className="sm:hidden">Entry</span>
          </button>
          <button
            onClick={() => onViewChange('dashboard')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              currentView === 'dashboard' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>
        </div>
      </div>
    </header>
  );
};