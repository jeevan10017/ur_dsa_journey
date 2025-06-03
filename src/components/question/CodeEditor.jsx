import React, { useState, useEffect } from 'react';
import { createLowlight } from 'lowlight'; // Correct import path
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import cpp from 'highlight.js/lib/languages/cpp';
import java from 'highlight.js/lib/languages/java';
import python from 'highlight.js/lib/languages/python';

const lowlight = createLowlight();

lowlight.register('javascript', javascript);
lowlight.register('js', javascript);
lowlight.register('typescript', typescript);
lowlight.register('ts', typescript);
lowlight.register('cpp', cpp);
lowlight.register('c++', cpp);
lowlight.register('java', java);
lowlight.register('python', python);
lowlight.register('py', python);

const CodeEditor = ({ value, onChange, readOnly = false }) => {
  const [code, setCode] = useState(value || '');
  
  useEffect(() => {
    setCode(value);
  }, [value]);

  const handleChange = (e) => {
    const newCode = e.target.value;
    setCode(newCode);
    if (onChange) {
      onChange(newCode);
    }
  };

  return (
    <div className="relative">
      <textarea
        value={code}
        onChange={handleChange}
        readOnly={readOnly}
        className="w-full min-h-[300px] p-4 font-mono text-sm bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        style={{ whiteSpace: 'pre', overflowWrap: 'normal', overflowX: 'auto' }}
      />
    </div>
  );
};

export default CodeEditor;