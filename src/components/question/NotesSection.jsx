import React from 'react';
import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';

const NotesSection = ({ notes, isOpen, onToggle }) => {
  if (!notes || notes.trim() === '') {
    return null;
  }

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center">
          <Lightbulb className="h-5 w-5 text-yellow-500 mr-2" />
          <span className="font-medium text-yellow-800 dark:text-yellow-200">
            Your Notes & Hints
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-yellow-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-yellow-500" />
        )}
      </button>
      
      {isOpen && (
        <div 
          className="p-4 pt-0 border-t border-yellow-200 dark:border-yellow-800 prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: notes }}
        />
      )}
    </div>
  );
};

export default NotesSection;