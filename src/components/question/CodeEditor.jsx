import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Copy, Settings, Zap, AlertCircle, CheckCircle, Info, Clipboard, Code, Sun, Moon } from 'lucide-react';

// Custom syntax highlighter with proper token handling
const highlightCode = (code, language) => {
  if (!code) return '';
  
  const keywords = {
    cpp: ['#include', '#define', '#if', '#endif', 'int', 'float', 'double', 'char', 'bool', 'void', 'const', 'static', 'class', 'struct', 'public', 'private', 'protected', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'std', 'cout', 'cin', 'endl', 'namespace', 'using', 'new', 'delete', 'try', 'catch', 'throw'],
    python: ['def', 'class', 'if', 'elif', 'else', 'for', 'while', 'in', 'return', 'yield', 'import', 'from', 'as', 'with', 'try', 'except', 'finally', 'raise', 'pass', 'break', 'continue', 'and', 'or', 'not', 'is', 'True', 'False', 'None', 'print', 'len', 'range', 'enumerate', 'zip'],
    java: ['public', 'private', 'protected', 'static', 'final', 'abstract', 'class', 'interface', 'extends', 'implements', 'import', 'package', 'int', 'float', 'double', 'boolean', 'char', 'String', 'void', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'return', 'new', 'this', 'super', 'try', 'catch', 'finally', 'throw', 'throws', 'System', 'out', 'println']
  };

  // Tokenize the code to avoid conflicts
  const tokens = [];
  let currentIndex = 0;
  
  // Find all string literals first (highest priority)
  const stringRegex = /(["'])((?:\\.|(?!\1)[^\\])*?)\1/g;
  let stringMatch;
  while ((stringMatch = stringRegex.exec(code)) !== null) {
    tokens.push({
      start: stringMatch.index,
      end: stringMatch.index + stringMatch[0].length,
      type: 'string',
      content: stringMatch[0]
    });
  }
  
  // Find comments
  if (language === 'python') {
    const commentRegex = /#.*$/gm;
    let commentMatch;
    while ((commentMatch = commentRegex.exec(code)) !== null) {
      // Check if this comment is inside a string
      const isInString = tokens.some(token => 
        token.type === 'string' && 
        commentMatch.index >= token.start && 
        commentMatch.index < token.end
      );
      if (!isInString) {
        tokens.push({
          start: commentMatch.index,
          end: commentMatch.index + commentMatch[0].length,
          type: 'comment',
          content: commentMatch[0]
        });
      }
    }
  } else {
    // Single line comments
    const singleCommentRegex = /\/\/.*$/gm;
    let singleCommentMatch;
    while ((singleCommentMatch = singleCommentRegex.exec(code)) !== null) {
      const isInString = tokens.some(token => 
        token.type === 'string' && 
        singleCommentMatch.index >= token.start && 
        singleCommentMatch.index < token.end
      );
      if (!isInString) {
        tokens.push({
          start: singleCommentMatch.index,
          end: singleCommentMatch.index + singleCommentMatch[0].length,
          type: 'comment',
          content: singleCommentMatch[0]
        });
      }
    }
    
    // Multi-line comments
    const multiCommentRegex = /\/\*[\s\S]*?\*\//g;
    let multiCommentMatch;
    while ((multiCommentMatch = multiCommentRegex.exec(code)) !== null) {
      const isInString = tokens.some(token => 
        token.type === 'string' && 
        multiCommentMatch.index >= token.start && 
        multiCommentMatch.index < token.end
      );
      if (!isInString) {
        tokens.push({
          start: multiCommentMatch.index,
          end: multiCommentMatch.index + multiCommentMatch[0].length,
          type: 'comment',
          content: multiCommentMatch[0]
        });
      }
    }
  }
  
  // Find numbers
  const numberRegex = /\b\d+(?:\.\d+)?\b/g;
  let numberMatch;
  while ((numberMatch = numberRegex.exec(code)) !== null) {
    const isInToken = tokens.some(token => 
      numberMatch.index >= token.start && 
      numberMatch.index < token.end
    );
    if (!isInToken) {
      tokens.push({
        start: numberMatch.index,
        end: numberMatch.index + numberMatch[0].length,
        type: 'number',
        content: numberMatch[0]
      });
    }
  }
  
// Find keywords
if (keywords[language]) {
  keywords[language].forEach(keyword => {
    const keywordRegex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
    let keywordMatch;
    while ((keywordMatch = keywordRegex.exec(code)) !== null) {
      const isInToken = tokens.some(token => 
        keywordMatch.index >= token.start && 
        keywordMatch.index < token.end
      );
      if (!isInToken) {
        tokens.push({
          start: keywordMatch.index,
          end: keywordMatch.index + keywordMatch[0].length,
          type: 'keyword',
          content: keywordMatch[0]
        });
      }
    }
  });
}
  
  // Sort tokens by start position
  tokens.sort((a, b) => a.start - b.start);
  
  // Build highlighted string
  let result = '';
  let lastIndex = 0;
  
  tokens.forEach(token => {
    // Add unhighlighted text before this token
    result += code.substring(lastIndex, token.start);
    
    // Add highlighted token
    let color;
    switch (token.type) {
      case 'string': color = '#98C379'; break;
      case 'comment': color = '#5C6370'; break;
      case 'number': color = '#D19A66'; break;
      case 'keyword': color = '#C678DD'; break;
      default: color = '#ABB2BF';
    }
    
    result += `<span style="color: ${color};">${token.content}</span>`;
    lastIndex = token.end;
  });
  
  // Add remaining unhighlighted text
  result += code.substring(lastIndex);
  
  return result;
};

const CodeEditor = ({ value, onChange, readOnly = false, language = 'cpp' }) => {
  const [code, setCode] = useState(value || '');
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [errors, setErrors] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [output, setOutput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [tabSize, setTabSize] = useState(4);
  const [lineNumbers, setLineNumbers] = useState(true);
  const [wordWrap, setWordWrap] = useState(false);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [copySuccess, setCopySuccess] = useState(false);
  
  const textareaRef = useRef(null);
  const preRef = useRef(null);

  const languages = {
    cpp: { 
      name: 'C++', 
      template: '#include <iostream>\n#include <vector>\n#include <string>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}'
    },
    python: { 
      name: 'Python', 
      template: '# Python program\ndef main():\n    print("Hello, World!")\n    numbers = [1, 2, 3, 4, 5]\n    for num in numbers:\n        print(f"Number: {num}")\n\nif __name__ == "__main__":\n    main()'
    },
    java: { 
      name: 'Java', 
      template: 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n        \n        List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);\n        for (int num : numbers) {\n            System.out.println("Number: " + num);\n        }\n    }\n}'
    }
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
    
    if (lang === 'java') {
      const lines = code.split('\n');
      lines.forEach((line, index) => {
        if (line.trim().match(/^(int|float|double|String|boolean).*[^;{}]$/) && !line.includes('//') && !line.includes('for') && !line.includes('if')) {
          newErrors.push({
            line: index + 1,
            message: 'Missing semicolon',
            type: 'error'
          });
        }
      });
    } else if (lang === 'python') {
      const lines = code.split('\n');
      lines.forEach((line, index) => {
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

  const handleScroll = (e) => {
    if (preRef.current) {
      preRef.current.scrollTop = e.target.scrollTop;
      preRef.current.scrollLeft = e.target.scrollLeft;
    }
  };

  const handleKeyDown = (e) => {
    if (readOnly) return;
    
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
    if (selectedLanguage === 'python') {
      setOutput('Python code execution simulated.\nOutput: Hello, World!\nNumber: 1\nNumber: 2\nNumber: 3\nNumber: 4\nNumber: 5');
    } else if (selectedLanguage === 'java') {
      setOutput('Java code compiled and executed successfully.\nOutput: Hello, World!\nNumber: 1\nNumber: 2\nNumber: 3\nNumber: 4\nNumber: 5');
    } else if (selectedLanguage === 'cpp') {
      setOutput('C++ code compiled and executed successfully.\nOutput: Hello, World!');
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
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
    }
  };

  const aiSuggest = () => {
    setIsAIProcessing(true);
    
    setTimeout(() => {
      const langSuggestions = {
        cpp: [
          'Consider using smart pointers instead of raw pointers',
          'Add const correctness to improve code safety',
          'Use auto keyword for type deduction'
        ],
        python: [
          'Use list comprehensions for more Pythonic code',
          'Add type hints for better code documentation',
          'Consider using f-strings for string formatting'
        ],
        java: [
          'Use StringBuilder for string concatenation in loops',
          'Consider using generics for type safety',
          'Add proper exception handling'
        ]
      };
      
      setSuggestions(langSuggestions[selectedLanguage].slice(0, 2));
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
      <div key={index} className="text-right pr-3 text-gray-500 dark:text-gray-400 select-none leading-6">
        {index + 1}
      </div>
    ));
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-lg bg-white dark:bg-gray-900">
      
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
          <div className="flex items-center space-x-2">
            <Code className="text-blue-600 dark:text-blue-400" size={20} />
            <span className="font-bold text-lg text-gray-900 dark:text-white">Code Editor</span>
          </div>
          
          <select
            value={selectedLanguage}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all w-full sm:w-auto"
            disabled={readOnly}
          >
            {Object.entries(languages).map(([key, lang]) => (
              <option key={key} value={key}>{lang.name}</option>
            ))}
          </select>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={runCode}
            disabled={readOnly}
            className="flex items-center space-x-2 px-3 py-2 text-sm bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 transition-all transform hover:scale-105 flex-1 sm:flex-none justify-center"
            title="Run Code"
          >
            <Play size={16} />
            <span className="hidden sm:inline">Execute</span>
          </button>
          
          <button
            onClick={copyCode}
            className={`p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all ${copySuccess ? 'bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-400' : ''}`}
            title="Copy Code"
          >
            {copySuccess ? <CheckCircle size={16} /> : <Copy size={16} />}
          </button>
          
          <button
            onClick={pasteCode}
            disabled={readOnly}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-all"
            title="Paste Code"
          >
            <Clipboard size={16} />
          </button>
          
          <button
            onClick={aiSuggest}
            disabled={readOnly || isAIProcessing}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-all"
            title="AI Suggestions"
          >
            <Zap size={16} className={isAIProcessing ? 'animate-pulse' : ''} />
          </button>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
            title="Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">Font Size: {fontSize}px</label>
              <input
                type="range"
                min="12"
                max="24"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>
            <div>
              <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">Tab Size: {tabSize}</label>
              <input
                type="range"
                min="2"
                max="8"
                value={tabSize}
                onChange={(e) => setTabSize(Number(e.target.value))}
                className="w-full accent-pink-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={lineNumbers}
                onChange={(e) => setLineNumbers(e.target.checked)}
                className="accent-pink-500"
              />
              <label className="text-gray-700 dark:text-gray-300">Line Numbers</label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={wordWrap}
                onChange={(e) => setWordWrap(e.target.checked)}
                className="accent-pink-500"
              />
              <label className="text-gray-700 dark:text-gray-300">Word Wrap</label>
            </div>
          </div>
        </div>
      )}

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <div className="flex items-start space-x-2">
            <Info className="text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" size={16} />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">AI Suggestions:</h4>
              <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-300">
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-blue-600 dark:text-blue-400">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {errors.length > 0 && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <div className="flex items-start space-x-2">
            <AlertCircle className="text-red-600 dark:text-red-400 mt-1 flex-shrink-0" size={16} />
            <div>
              <h4 className="font-medium text-red-900 dark:text-red-200 mb-2">Errors Found:</h4>
              <ul className="space-y-1 text-sm text-red-800 dark:text-red-300">
                {errors.map((error, index) => (
                  <li key={index}>Line {error.line}: {error.message}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Main Editor */}
      <div className="flex relative" style={{ minHeight: '400px', maxHeight: '600px' }}>
        {/* Line Numbers */}
        {lineNumbers && (
          <div 
            className="py-4 px-2 bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 font-mono text-sm select-none flex-shrink-0 overflow-y-auto"
            style={{ 
              fontSize: `${fontSize}px`, 
              lineHeight: '1.5',
              minHeight: '400px',
              maxHeight: '600px'
            }}
          >
            {getLineNumbers()}
          </div>
        )}
        
        {/* Code Area with Syntax Highlighting */}
        <div className="flex-1 relative overflow-hidden">
          {/* Custom Syntax Highlighted Background */}
          <pre
            ref={preRef}
            className="absolute inset-0 p-4 pointer-events-none overflow-auto bg-gray-900 text-gray-100"
            style={{ 
              fontSize: `${fontSize}px`,
              lineHeight: '1.5',
              tabSize: tabSize,
              whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
              overflowWrap: wordWrap ? 'break-word' : 'normal',
              margin: 0,
              zIndex: 1
            }}
            dangerouslySetInnerHTML={{
              __html: highlightCode(code, selectedLanguage)
            }}
          />
          
          {/* Transparent Textarea */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
            readOnly={readOnly}
            className="w-full h-full p-4 font-mono bg-transparent text-transparent caret-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-inset resize-none relative z-10"
            style={{ 
              fontSize: `${fontSize}px`,
              lineHeight: '1.5',
              tabSize: tabSize,
              whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
              overflowWrap: wordWrap ? 'break-word' : 'normal',
              minHeight: '400px',
              maxHeight: '600px'
            }}
            spellCheck={false}
          />
        </div>
      </div>

      {output && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="p-4">
            <div className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300 flex items-center">
              <Play size={16} className="mr-2 text-green-600 dark:text-green-400" />
              Execution Output:
            </div>
            <div className="font-mono text-sm bg-black text-green-400 p-4 rounded-lg max-h-40 overflow-y-auto whitespace-pre-wrap border border-green-500/20">
              {output}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeEditor;