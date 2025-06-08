import React, { useState, useRef, useEffect } from 'react';
import { 
  Bold, Italic, Code, List, ListOrdered, Type, Hash, Quote, 
  Undo, Redo, Copy, Clipboard, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, Link, Image, Sun, Moon
} from 'lucide-react';

const MenuBar = ({ onFormat, canUndo, canRedo, onUndo, onRedo, onCopy, onPaste, isDark, toggleTheme }) => {
  const formatText = (command, value = null) => {
    document.execCommand(command, false, value);
    onFormat();
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      formatText('createLink', url);
    }
  };

  return (
    <div className="flex flex-wrap gap-1 p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
      {/* Theme Toggle */}
      <button
        type="button"
        onClick={toggleTheme}
        className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

      {/* Copy/Paste */}
      <button
        type="button"
        onClick={onCopy}
        className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
        title="Copy"
      >
        <Copy className="h-4 w-4" />
      </button>
      
      <button
        type="button"
        onClick={onPaste}
        className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
        title="Paste"
      >
        <Clipboard className="h-4 w-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

      {/* Undo/Redo */}
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Undo"
      >
        <Undo className="h-4 w-4" />
      </button>
      
      <button
        type="button"
        onClick={onRedo}
        disabled={!canRedo}
        className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Redo"
      >
        <Redo className="h-4 w-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

      {/* Text Formatting */}
      <button
        type="button"
        onClick={() => formatText('bold')}
        className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </button>
      
      <button
        type="button"
        onClick={() => formatText('italic')}
        className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => formatText('underline')}
        className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
        title="Underline"
      >
        <Underline className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => formatText('strikeThrough')}
        className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
        title="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </button>
      
      <button
        type="button"
        onClick={() => {
          const selection = window.getSelection();
          if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const code = document.createElement('code');
            code.className = 'inline-code';
            try {
              range.surroundContents(code);
            } catch (e) {
              code.appendChild(range.extractContents());
              range.insertNode(code);
            }
            onFormat();
          }
        }}
        className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
        title="Inline Code"
      >
        <Code className="h-4 w-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

      {/* Headings */}
      <button
        type="button"
        onClick={() => formatText('formatBlock', 'h1')}
        className="px-3 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors font-bold"
        title="Heading 1"
      >
        H1
      </button>
      
      <button
        type="button"
        onClick={() => formatText('formatBlock', 'h2')}
        className="px-3 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors font-bold text-sm"
        title="Heading 2"
      >
        H2
      </button>
      
      <button
        type="button"
        onClick={() => formatText('formatBlock', 'h3')}
        className="px-3 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors font-bold text-xs"
        title="Heading 3"
      >
        H3
      </button>

      <button
        type="button"
        onClick={() => formatText('formatBlock', 'p')}
        className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
        title="Paragraph"
      >
        <Type className="h-4 w-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

      {/* Alignment */}
      <button
        type="button"
        onClick={() => formatText('justifyLeft')}
        className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
        title="Align Left"
      >
        <AlignLeft className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => formatText('justifyCenter')}
        className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
        title="Align Center"
      >
        <AlignCenter className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => formatText('justifyRight')}
        className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
        title="Align Right"
      >
        <AlignRight className="h-4 w-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

      {/* Lists */}
      <button
        type="button"
        onClick={() => formatText('insertUnorderedList')}
        className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </button>
      
      <button
        type="button"
        onClick={() => formatText('insertOrderedList')}
        className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => formatText('formatBlock', 'blockquote')}
        className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
        title="Quote"
      >
        <Quote className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => {
          const selection = window.getSelection();
          if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const pre = document.createElement('pre');
            const code = document.createElement('code');
            code.className = 'code-block';
            
            try {
              code.appendChild(range.extractContents());
              pre.appendChild(code);
              range.insertNode(pre);
            } catch (e) {
              code.textContent = range.toString();
              pre.appendChild(code);
              range.deleteContents();
              range.insertNode(pre);
            }
            onFormat();
          }
        }}
        className="px-3 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors font-mono text-xs"
        title="Code Block"
      >
        {'{}'}
      </button>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

      {/* Link */}
      <button
        type="button"
        onClick={insertLink}
        className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
        title="Insert Link"
      >
        <Link className="h-4 w-4" />
      </button>
    </div>
  );
};

const RichTextEditor = ({ value = '', onChange = () => {} }) => {
  const editorRef = useRef(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [history, setHistory] = useState([value]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const updateHistory = (content) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(content);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCanUndo(newHistory.length > 1);
    setCanRedo(false);
  };

  const cleanPastedContent = (html) => {
    // Remove background colors, font colors, and other unwanted styles
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Remove style attributes that contain background colors and other unwanted styles
    const allElements = tempDiv.querySelectorAll('*');
    allElements.forEach(element => {
      if (element.style) {
        // Remove specific style properties
        element.style.removeProperty('background-color');
        element.style.removeProperty('background');
        element.style.removeProperty('color');
        element.style.removeProperty('font-family');
        element.style.removeProperty('font-size');
        
        // If style is empty after cleanup, remove the attribute
        if (!element.style.cssText) {
          element.removeAttribute('style');
        }
      }
      
      // Remove class attributes that might contain styling
      if (element.className && typeof element.className === 'string') {
        element.removeAttribute('class');
      }
    });
    
    return tempDiv.innerHTML;
  };

  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
      updateHistory(content);
    }
  };

  const handleFormat = () => {
    setTimeout(() => {
      if (editorRef.current) {
        const content = editorRef.current.innerHTML;
        onChange(content);
        updateHistory(content);
      }
    }, 10);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const content = history[newIndex];
      setHistoryIndex(newIndex);
      setCanUndo(newIndex > 0);
      setCanRedo(true);
      
      if (editorRef.current) {
        editorRef.current.innerHTML = content;
        onChange(content);
      }
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const content = history[newIndex];
      setHistoryIndex(newIndex);
      setCanUndo(true);
      setCanRedo(newIndex < history.length - 1);
      
      if (editorRef.current) {
        editorRef.current.innerHTML = content;
        onChange(content);
      }
    }
  };

  const handleCopy = async () => {
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const content = range.toString();
        if (content) {
          try {
            await navigator.clipboard.writeText(content);
          } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = content;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
          }
        }
      }
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && editorRef.current) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          const textNode = document.createTextNode(text);
          range.insertNode(textNode);
          range.setStartAfter(textNode);
          range.setEndAfter(textNode);
          selection.removeAllRanges();
          selection.addRange(range);
          handleFormat();
        }
      }
    } catch (err) {
      console.log('Paste failed:', err);
    }
  };

  const handlePasteEvent = (e) => {
    e.preventDefault();
    const clipboardData = e.clipboardData;
    const htmlData = clipboardData.getData('text/html');
    const textData = clipboardData.getData('text/plain');
    
    let contentToInsert;
    
    if (htmlData) {
      // Clean the HTML content
      contentToInsert = cleanPastedContent(htmlData);
    } else {
      // Use plain text if no HTML
      contentToInsert = textData;
    }
    
    if (contentToInsert) {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        
        if (htmlData) {
          const div = document.createElement('div');
          div.innerHTML = contentToInsert;
          const fragment = document.createDocumentFragment();
          while (div.firstChild) {
            fragment.appendChild(div.firstChild);
          }
          range.insertNode(fragment);
        } else {
          const textNode = document.createTextNode(contentToInsert);
          range.insertNode(textNode);
          range.setStartAfter(textNode);
          range.setEndAfter(textNode);
        }
        
        selection.removeAllRanges();
        selection.addRange(range);
        handleFormat();
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'c') {
        handleCopy();
      } else if (e.key === 'v') {
        // Let the paste event handler take care of this
        return;
      }
    }
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
        <MenuBar 
          onFormat={handleFormat}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onCopy={handleCopy}
          onPaste={handlePaste}
          isDark={isDark}
          toggleTheme={toggleTheme}
        />
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePasteEvent}
          className="min-h-[300px] max-h-[500px] overflow-y-auto p-4 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-inset text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900"
          style={{
            lineHeight: '1.6',
          }}
          suppressContentEditableWarning={true}
          placeholder="Start typing..."
        />
        <style jsx>{`
          [contenteditable] h1 {
            font-size: 2rem;
            font-weight: bold;
            margin: 1rem 0 0.5rem 0;
            line-height: 1.2;
            color: inherit;
          }
          [contenteditable] h2 {
            font-size: 1.5rem;
            font-weight: bold;
            margin: 0.875rem 0 0.5rem 0;
            line-height: 1.3;
            color: inherit;
          }
          [contenteditable] h3 {
            font-size: 1.25rem;
            font-weight: bold;
            margin: 0.75rem 0 0.5rem 0;
            line-height: 1.4;
            color: inherit;
          }
          [contenteditable] p {
            margin: 0.5rem 0;
            color: inherit;
          }
          [contenteditable] ul, [contenteditable] ol {
            margin: 0.5rem 0;
            padding-left: 1.5rem;
          }
          [contenteditable] li {
            margin: 0.25rem 0;
            color: inherit;
          }
          [contenteditable] pre {
            margin: 1rem 0;
            overflow-x: auto;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 12px;
          }
          .dark [contenteditable] pre {
            background-color: #1e293b;
            border-color: #374151;
          }
          [contenteditable] .code-block {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 0.875rem;
            display: block;
            background-color: #1e293b;
            color: #e2e8f0;
            padding: 12px;
            border-radius: 6px;
            white-space: pre-wrap;
          }
          .dark [contenteditable] .code-block {
            background-color: #0f172a;
            color: #f1f5f9;
          }
          [contenteditable] .inline-code {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 0.875rem;
            background-color: #f1f5f9;
            color: #374151;
            padding: 2px 4px;
            border-radius: 3px;
            border: 1px solid #e5e7eb;
          }
          .dark [contenteditable] .inline-code {
            background-color: #374151;
            color: #f3f4f6;
            border-color: #4b5563;
          }
          [contenteditable] blockquote {
            border-left: 4px solid #e5e7eb;
            padding-left: 1rem;
            margin: 1rem 0;
            font-style: italic;
            color: #6b7280;
          }
          .dark [contenteditable] blockquote {
            border-left-color: #4b5563;
            color: #9ca3af;
          }
          [contenteditable] a {
            color: #3b82f6;
            text-decoration: underline;
          }
          .dark [contenteditable] a {
            color: #60a5fa;
          }
          [contenteditable] a:hover {
            color: #1d4ed8;
          }
          .dark [contenteditable] a:hover {
            color: #93c5fd;
          }
          [contenteditable]:empty:before {
            content: "Start typing...";
            color: #9ca3af;
            font-style: italic;
          }
          .dark [contenteditable]:empty:before {
            color: #6b7280;
          }
        `}</style>
      </div>
    </div>
  );
};

export default RichTextEditor;