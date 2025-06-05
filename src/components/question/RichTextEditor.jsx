import React, { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Code, List, ListOrdered, Type, Hash, Quote, Undo, Redo } from 'lucide-react';

const MenuBar = ({ onFormat, canUndo, canRedo, onUndo, onRedo }) => {
   const formatText = (command, value = null) => {
    document.execCommand(command, false, value);
    onFormat();
  };

   const handleCodeButtonClick = (e, handler) => {
    e.stopPropagation();
    handler();
  };


  return (
    <div className="flex flex-wrap gap-1 p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
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
        onClick={() => {
          const selection = window.getSelection();
          if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const code = document.createElement('code');
            code.style.backgroundColor = '#f1f5f9';
            code.style.padding = '2px 4px';
            code.style.borderRadius = '3px';
            code.style.fontFamily = 'monospace';
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
        onClick={() => {
          const selection = window.getSelection();
          if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const pre = document.createElement('pre');
            const code = document.createElement('code');
            code.style.backgroundColor = '#1e293b';
            code.style.color = '#e2e8f0';
            code.style.padding = '12px';
            code.style.borderRadius = '6px';
            code.style.display = 'block';
            code.style.fontFamily = 'monospace';
            code.style.whiteSpace = 'pre-wrap';
            
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
    </div>
  );
};

const RichTextEditor = ({ value = '', onChange = () => {} }) => {
  const editorRef = useRef(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [history, setHistory] = useState([value]);
  const [historyIndex, setHistoryIndex] = useState(0);

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

  const handleKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    }
  };

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
      <MenuBar 
        onFormat={handleFormat}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className="min-h-[200px] max-h-[400px] overflow-y-auto p-4 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-inset text-gray-900 dark:text-gray-100"
        style={{
          lineHeight: '1.6',
        }}
        suppressContentEditableWarning={true}
      />
      <style jsx>{`
        [contenteditable] h1 {
          font-size: 2rem;
          font-weight: bold;
          margin: 1rem 0 0.5rem 0;
          line-height: 1.2;
        }
        [contenteditable] h2 {
          font-size: 1.5rem;
          font-weight: bold;
          margin: 0.875rem 0 0.5rem 0;
          line-height: 1.3;
        }
        [contenteditable] h3 {
          font-size: 1.25rem;
          font-weight: bold;
          margin: 0.75rem 0 0.5rem 0;
          line-height: 1.4;
        }
        [contenteditable] p {
          margin: 0.5rem 0;
        }
        [contenteditable] ul, [contenteditable] ol {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }
        [contenteditable] li {
          margin: 0.25rem 0;
        }
        [contenteditable] pre {
          margin: 1rem 0;
          overflow-x: auto;
        }
        [contenteditable] code {
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.875rem;
        }
        [contenteditable] blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;