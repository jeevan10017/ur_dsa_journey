import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Copy, Settings, Zap, AlertCircle, CheckCircle, Info, Clipboard } from 'lucide-react';

const CodeEditor = ({ value, onChange, readOnly = false, language = 'cpp' }) => {
  const [code, setCode] = useState(value || '');
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [errors, setErrors] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [output, setOutput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [tabSize, setTabSize] = useState(2);
  const [lineNumbers, setLineNumbers] = useState(true);
  const [wordWrap, setWordWrap] = useState(true);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  
  const textareaRef = useRef(null);

  const languages = {
    javascript: { name: 'JavaScript', template: 'console.log("Hello, JavaScript!");' },
    typescript: { name: 'TypeScript', template: 'const message: string = "Hello, TypeScript!";\nconsole.log(message);' },
    python: { name: 'Python', template: 'print("Hello, Python!")' },
    cpp: { name: 'C++17', template: '#include <iostream>\nint main() {\n    std::cout << "Hello, C++!" << std::endl;\n    return 0;\n}' },
    java: { name: 'Java', template: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, Java!");\n    }\n}' },
    html: { name: 'HTML', template: '<!DOCTYPE html>\n<html>\n<head>\n    <title>Hello World</title>\n</head>\n<body>\n    <h1>Hello, HTML!</h1>\n</body>\n</html>' },
    css: { name: 'CSS', template: 'body {\n    font-family: Arial, sans-serif;\n    background-color: #f0f0f0;\n}' }
  };

  useEffect(() => {
    setCode(value || '');
  }, [value]);

  useEffect(() => {
    detectErrors(code, selectedLanguage);
  }, [code, selectedLanguage]);

  const detectErrors = useCallback((code, lang) => {
    const newErrors = [];
    const newWarnings = [];
    
    if (lang === 'javascript' || lang === 'typescript') {
      const lines = code.split('\n');
      lines.forEach((line, index) => {
        // Check for missing semicolons
        if (line.trim().match(/^(let|const|var|function|return|console\.log).*[^;{}]$/) && !line.includes('//')) {
          newWarnings.push({
            line: index + 1,
            message: 'Missing semicolon',
            type: 'warning'
          });
        }
        
        // Check for unmatched brackets
        const openBrackets = (line.match(/\{/g) || []).length;
        const closeBrackets = (line.match(/\}/g) || []).length;
        if (openBrackets > closeBrackets && !line.includes('//')) {
          newErrors.push({
            line: index + 1,
            message: 'Unmatched opening bracket',
            type: 'error'
          });
        }
      });
    } else if (lang === 'python') {
      const lines = code.split('\n');
      lines.forEach((line, index) => {
        // Check for basic syntax issues
        if (line.trim().endsWith(':') && lines[index + 1] && !lines[index + 1].startsWith('    ') && lines[index + 1].trim() !== '') {
          newErrors.push({
            line: index + 2,
            message: 'Expected indentation after colon',
            type: 'error'
          });
        }
      });
    } else if (lang === 'cpp') {
      const lines = code.split('\n');
      lines.forEach((line, index) => {
        // Check for missing semicolons in C++
        if (line.trim().match(/^(int|float|double|char|std::).*[^;{}]$/) && !line.includes('//') && !line.includes('#')) {
          newErrors.push({
            line: index + 1,
            message: 'Missing semicolon',
            type: 'error'
          });
        }
      });
    }
    
    setErrors(newErrors);
    setWarnings(newWarnings);
  }, []);

  const handleChange = (e) => {
    const newCode = e.target.value;
    setCode(newCode);
    if (onChange) {
      onChange(newCode);
    }
  };

  const handleKeyDown = (e) => {
    if (readOnly) return;
    
    // Tab handling
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const spaces = ' '.repeat(tabSize);
      
      setCode(prev => prev.substring(0, start) + spaces + prev.substring(end));
      
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + tabSize;
      }, 0);
    }
    
    // Auto-closing brackets
    if (e.key === '{') {
      e.preventDefault();
      const start = e.target.selectionStart;
      setCode(prev => prev.substring(0, start) + '{}' + prev.substring(start));
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 1;
      }, 0);
    }
  };

  const runCode = () => {
    if (selectedLanguage === 'javascript') {
      try {
        const logs = [];
        const mockConsole = {
          log: (...args) => logs.push(args.join(' ')),
          error: (...args) => logs.push('ERROR: ' + args.join(' ')),
          warn: (...args) => logs.push('WARNING: ' + args.join(' '))
        };
        
        const func = new Function('console', code);
        func(mockConsole);
        
        setOutput(logs.join('\n') || 'Code executed successfully');
      } catch (error) {
        setOutput('Error: ' + error.message);
      }
    } else {
      setOutput(`Execution not supported for ${languages[selectedLanguage].name} in this environment`);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
  };

  const pasteCode = async () => {
    if (readOnly) return;
    
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText) {
        setCode(clipboardText);
        if (onChange) {
          onChange(clipboardText);
        }
      }
    } catch (error) {
      console.error('Failed to paste from clipboard:', error);
      // Fallback: show a message or handle the error gracefully
    }
  };

  const aiSuggest = () => {
    setIsAIProcessing(true);
    
    setTimeout(() => {
      const suggestions = [
        'Consider adding error handling',
        'Use const instead of let for immutable variables',
        'Add type annotations for better documentation',
        'Consider breaking long functions into smaller ones',
        'Add input validation'
      ];
      
      setSuggestions(suggestions.slice(0, 2));
      setIsAIProcessing(false);
    }, 1500);
  };

  const handleLanguageChange = (newLang) => {
    setSelectedLanguage(newLang);
    if (!code.trim()) {
      setCode(languages[newLang].template);
      if (onChange) {
        onChange(languages[newLang].template);
      }
    }
  };

  const getLineNumbers = () => {
    return code.split('\n').map((_, index) => (
      <div key={index} className="text-right pr-2 text-gray-500 dark:text-gray-400 select-none">
        {index + 1}
      </div>
    ));
  };

  return (
    <div className=" border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <select
            value={selectedLanguage}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={readOnly}
          >
            {Object.entries(languages).map(([key, lang]) => (
              <option key={key} value={key}>{lang.name}</option>
            ))}
          </select>
          
          {/* Error/Warning Count */}
          <div className="flex items-center space-x-2 text-sm">
            {errors.length > 0 && (
              <span className="flex items-center text-red-500">
                <AlertCircle size={14} className="mr-1" />
                {errors.length}
              </span>
            )}
            {warnings.length > 0 && (
              <span className="flex items-center text-yellow-500">
                <Info size={14} className="mr-1" />
                {warnings.length}
              </span>
            )}
            {errors.length === 0 && warnings.length === 0 && (
              <span className="flex items-center text-green-500">
                <CheckCircle size={14} className="mr-1" />
                Clean
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={aiSuggest}
            disabled={isAIProcessing || readOnly}
            className="flex items-center space-x-1 px-2 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 transition-colors"
            title="AI Suggestions"
          >
            <Zap size={14} />
            <span>{isAIProcessing ? '...' : 'AI'}</span>
          </button>
          
          <button
            onClick={runCode}
            disabled={readOnly}
            className="flex items-center space-x-1 px-2 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 transition-colors"
            title="Run Code"
          >
            <Play size={14} />
            <span>Run</span>
          </button>
          
          <button
            onClick={copyCode}
            className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            title="Copy Code"
          >
            <Copy size={16} />
          </button>
          
          <button
            onClick={pasteCode}
            disabled={readOnly}
            className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 transition-colors"
            title="Paste Code"
          >
            <Clipboard size={16} />
          </button>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            title="Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <label className="block mb-1 font-medium">Font Size: {fontSize}px</label>
              <input
                type="range"
                min="10"
                max="20"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Tab Size: {tabSize}</label>
              <input
                type="range"
                min="2"
                max="8"
                value={tabSize}
                onChange={(e) => setTabSize(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={lineNumbers}
                onChange={(e) => setLineNumbers(e.target.checked)}
                className="mr-2"
              />
              <label>Line Numbers</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={wordWrap}
                onChange={(e) => setWordWrap(e.target.checked)}
                className="mr-2"
              />
              <label>Word Wrap</label>
            </div>
          </div>
        </div>
      )}

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-200 dark:border-purple-800">
          <div className="text-sm">
            <div className="font-medium mb-2 flex items-center text-purple-700 dark:text-purple-300">
              <Zap size={14} className="mr-1" />
              AI Suggestions:
            </div>
            {suggestions.map((suggestion, index) => (
              <div key={index} className="text-purple-600 dark:text-purple-400 ml-5">
                • {suggestion}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Editor */}
      <div className="flex">
        {/* Line Numbers */}
        {lineNumbers && (
          <div 
            className="py-4 px-2 h-72 bg-gray-100 dark:bg-gray-900 font-mono text-sm border-r border-gray-200 dark:border-gray-600"
            style={{ fontSize: `${fontSize}px` }}
          >
            {getLineNumbers()}
          </div>
        )}
        
        {/* Code Area */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={code}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            readOnly={readOnly}
            className="w-full min-h-72 h-full p-4 font-mono bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none resize-none"
            style={{ 
              fontSize: `${fontSize}px`,
              tabSize: tabSize,
              whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
              overflowWrap: wordWrap ? 'break-word' : 'normal',
              overflowX: wordWrap ? 'hidden' : 'auto'
            }}
            spellCheck={false}
          />
          
          {/* Error Indicators */}
          <div className="absolute top-2 right-2 space-y-1">
            {[...errors, ...warnings].slice(0, 3).map((issue, index) => (
              <div 
                key={index} 
                className={`text-xs px-2 py-1 rounded ${
                  issue.type === 'error' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-black'
                }`}
                title={`Line ${issue.line}: ${issue.message}`}
              >
                L{issue.line}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Output Panel */}
      {output && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="p-3">
            <div className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Output:</div>
            <div className="font-mono text-sm bg-black text-green-400 p-3 rounded max-h-32 overflow-y-auto whitespace-pre-wrap">
              {output}
            </div>
          </div>
        </div>
      )}

      {/* Problems Summary */}
      {/* {(errors.length > 0 || warnings.length > 0) && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="p-3 max-h-32 overflow-y-auto">
            <div className="text-sm space-y-1">
              {errors.map((error, index) => (
                <div key={index} className="flex items-start space-x-2 text-red-600 dark:text-red-400">
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                  <span>Line {error.line}: {error.message}</span>
                </div>
              ))}
              {warnings.map((warning, index) => (
                <div key={index} className="flex items-start space-x-2 text-yellow-600 dark:text-yellow-400">
                  <Info size={14} className="mt-0.5 flex-shrink-0" />
                  <span>Line {warning.line}: {warning.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default CodeEditor;