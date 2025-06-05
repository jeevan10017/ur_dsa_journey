import React, { useState, useRef, useEffect } from 'react';
import { Filter, ChevronDown, X, Tag, SortAsc } from 'lucide-react';

const FilterBar = ({
  availableTopics = [],
  selectedTopics = [],
  onTopicsChange,
  selectedDifficulty,
  onDifficultyChange,
  sortBy,
  onSortChange
}) => {
  const [showTopicsDropdown, setShowTopicsDropdown] = useState(false);
  const [showDifficultyDropdown, setShowDifficultyDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [topicSearch, setTopicSearch] = useState('');
  
  const topicsDropdownRef = useRef(null);
  const difficultyDropdownRef = useRef(null);
  const sortDropdownRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (topicsDropdownRef.current && !topicsDropdownRef.current.contains(event.target)) {
        setShowTopicsDropdown(false);
      }
      if (difficultyDropdownRef.current && !difficultyDropdownRef.current.contains(event.target)) {
        setShowDifficultyDropdown(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
        setShowSortDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter topics based on search
  const filteredTopics = availableTopics.filter(topic =>
    topic.toLowerCase().includes(topicSearch.toLowerCase())
  );

  const handleTopicToggle = (topic) => {
    if (selectedTopics.includes(topic)) {
      onTopicsChange(selectedTopics.filter(t => t !== topic));
    } else {
      onTopicsChange([...selectedTopics, topic]);
    }
  };

  const handleTopicRemove = (topicToRemove) => {
    onTopicsChange(selectedTopics.filter(t => t !== topicToRemove));
  };

  const clearAllTopics = () => {
    onTopicsChange([]);
  };

  const difficultyOptions = [
    { value: 'all', label: 'All Difficulties' },
    { value: 'easy', label: 'Easy', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'hard', label: 'Hard', color: 'text-red-600' },
  ];

  const sortOptions = [
    { value: 'recent', label: 'Recently Updated' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'title', label: 'Title A-Z' },
    { value: 'difficulty', label: 'By Difficulty' },
    { value: 'topics', label: 'Most Topics' },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Topics Filter */}
      <div className="relative" ref={topicsDropdownRef}>
        <button
          onClick={() => setShowTopicsDropdown(!showTopicsDropdown)}
          className={`inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
            selectedTopics.length > 0 ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : ''
          }`}
        >
          <Tag className="h-4 w-4 mr-2" />
          <span>
            Topics
            {selectedTopics.length > 0 && (
              <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs bg-indigo-100 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200">
                {selectedTopics.length}
              </span>
            )}
          </span>
          <ChevronDown className="h-4 w-4 ml-2" />
        </button>

        {showTopicsDropdown && (
          <div className="absolute z-10 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <input
                type="text"
                placeholder="Search topics..."
                value={topicSearch}
                onChange={(e) => setTopicSearch(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            {selectedTopics.length > 0 && (
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Selected ({selectedTopics.length})
                  </span>
                  <button
                    onClick={clearAllTopics}
                    className="text-xs text-red-600 hover:text-red-800 dark:text-red-400"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedTopics.map(topic => (
                    <span
                      key={topic}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-200"
                    >
                      {topic}
                      <button
                        onClick={() => handleTopicRemove(topic)}
                        className="ml-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-300"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="max-h-60 overflow-y-auto">
              {filteredTopics.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                  {availableTopics.length === 0 ? 'No topics available' : 'No topics match your search'}
                </div>
              ) : (
                <div className="py-1">
                  {filteredTopics.map(topic => (
                    <label
                      key={topic}
                      className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTopics.includes(topic)}
                        onChange={() => handleTopicToggle(topic)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                      />
                      <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                        {topic}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Difficulty Filter */}
      <div className="relative" ref={difficultyDropdownRef}>
        <button
          onClick={() => setShowDifficultyDropdown(!showDifficultyDropdown)}
          className={`inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
            selectedDifficulty !== 'all' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : ''
          }`}
        >
          <Filter className="h-4 w-4 mr-2" />
          <span>
            {difficultyOptions.find(opt => opt.value === selectedDifficulty)?.label || 'Difficulty'}
          </span>
          <ChevronDown className="h-4 w-4 ml-2" />
        </button>

        {showDifficultyDropdown && (
          <div className="absolute z-10 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
            <div className="py-1">
              {difficultyOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => {
                    onDifficultyChange(option.value);
                    setShowDifficultyDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    selectedDifficulty === option.value
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                      : `text-gray-700 dark:text-gray-300 ${option.color || ''}`
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sort Options */}
      <div className="relative" ref={sortDropdownRef}>
        <button
          onClick={() => setShowSortDropdown(!showSortDropdown)}
          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
        >
          <SortAsc className="h-4 w-4 mr-2" />
          <span>
            {sortOptions.find(opt => opt.value === sortBy)?.label || 'Sort'}
          </span>
          <ChevronDown className="h-4 w-4 ml-2" />
        </button>

        {showSortDropdown && (
          <div className="absolute z-10 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
            <div className="py-1">
              {sortOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSortChange(option.value);
                    setShowSortDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    sortBy === option.value
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterBar;