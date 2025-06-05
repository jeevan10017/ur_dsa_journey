import React from 'react';
import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';

const NotesSection = ({ notes, isOpen, onToggle }) => {
  if (!notes || notes.trim() === '') {
    return null;
  }

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700/50 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-yellow-100 dark:hover:bg-yellow-900/20 transition-colors"
      >
        <div className="flex items-center">
          <Lightbulb className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
          <span className="font-medium text-yellow-800 dark:text-yellow-100">
            Your Notes & Hints
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
        )}
      </button>
      
      {isOpen && (
        <div className="border-t border-yellow-200 dark:border-yellow-700/50">
          <div 
            className="p-4 text-gray-800 dark:text-gray-100 prose prose-sm dark:prose-invert max-w-none
                       prose-headings:text-gray-900 dark:prose-headings:text-gray-100
                       prose-p:text-gray-800 dark:prose-p:text-gray-100
                       prose-strong:text-gray-900 dark:prose-strong:text-gray-100
                       prose-code:text-gray-900 dark:prose-code:text-gray-100
                       prose-code:bg-gray-100 dark:prose-code:bg-gray-800
                       prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800
                       prose-pre:text-gray-800 dark:prose-pre:text-gray-100"
            dangerouslySetInnerHTML={{ __html: notes }}
          />
        </div>
      )}
    </div>
  );
};

export default NotesSection;