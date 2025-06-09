import React, { useState, useRef, useEffect } from 'react';
import { Filter, ChevronDown, X, Tag, SortAsc, Search, Sparkles, Zap } from 'lucide-react';

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
    { value: 'all', label: 'All Difficulties', icon: Sparkles, color: 'text-gray-600 dark:text-gray-400' },
    { value: 'easy', label: 'Easy', icon: Zap, color: 'text-emerald-600 dark:text-emerald-400' },
    { value: 'medium', label: 'Medium', icon: Zap, color: 'text-amber-600 dark:text-amber-400' },
    { value: 'hard', label: 'Hard', icon: Zap, color: 'text-red-600 dark:text-red-400' },
  ];

  const sortOptions = [
    { value: 'recent', label: 'Recently Updated', desc: 'Latest changes first' },
    { value: 'oldest', label: 'Oldest First', desc: 'Classic content first' },
    { value: 'title', label: 'Title A-Z', desc: 'Alphabetical order' },
    { value: 'difficulty', label: 'By Difficulty', desc: 'Easy to hard' },
    { value: 'topics', label: 'Most Topics', desc: 'Comprehensive content' },
  ];

  const activeFiltersCount = selectedTopics.length + (selectedDifficulty !== 'all' ? 1 : 0);

  return (
    <div className="w-full">
      {/* Main Filter Controls */}
      <div className="flex flex-col lg:flex-row gap-4 p-1">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          
          {/* Topics Filter */}
          <div className="relative flex-1 min-w-0" ref={topicsDropdownRef}>
            <button
              onClick={() => setShowTopicsDropdown(!showTopicsDropdown)}
              className={`w-full inline-flex items-center justify-between px-5 py-3 border-2 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-indigo-500/20 ${
                selectedTopics.length > 0 
                  ? 'border-indigo-500 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-700 dark:text-indigo-300 shadow-lg shadow-indigo-500/10' 
                  : 'border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              <div className="flex items-center min-w-0">
                <Tag className="h-5 w-5 mr-3 flex-shrink-0" />
                <div className="flex flex-col items-start min-w-0">
                  <span className="truncate">
                    Topics
                    {selectedTopics.length > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500 text-white shadow-sm">
                        {selectedTopics.length}
                      </span>
                    )}
                  </span>
                </div>
              </div>
              <ChevronDown className={`h-5 w-5 ml-2 flex-shrink-0 transition-transform duration-200 ${showTopicsDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showTopicsDropdown && (
              <div className="absolute z-20 mt-2 w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl shadow-gray-900/10 dark:shadow-gray-900/30 backdrop-blur-md">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 rounded-t-xl">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search topics..."
                      value={topicSearch}
                      onChange={(e) => setTopicSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto">
                  {filteredTopics.length === 0 ? (
                    <div className="p-6 text-center">
                      <div className="text-gray-400 mb-2">
                        <Tag className="h-8 w-8 mx-auto opacity-50" />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {availableTopics.length === 0 ? 'No topics available' : 'No topics match your search'}
                      </p>
                    </div>
                  ) : (
                    <div className="py-2">
                      {filteredTopics.map(topic => (
                        <label
                          key={topic}
                          className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors group"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTopics.includes(topic)}
                            onChange={() => handleTopicToggle(topic)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded transition-colors"
                          />
                          <span className="ml-3 text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
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
              className={`inline-flex items-center px-5 py-3 border-2 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-indigo-500/20 ${
                selectedDifficulty !== 'all' 
                  ? 'border-indigo-500 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-700 dark:text-indigo-300 shadow-lg shadow-indigo-500/10' 
                  : 'border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              <Filter className="h-5 w-5 mr-3" />
              <span className="whitespace-nowrap">
                {difficultyOptions.find(opt => opt.value === selectedDifficulty)?.label || 'Difficulty'}
              </span>
              <ChevronDown className={`h-5 w-5 ml-3 transition-transform duration-200 ${showDifficultyDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showDifficultyDropdown && (
              <div className="absolute z-20 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl shadow-gray-900/10 dark:shadow-gray-900/30 backdrop-blur-md">
                <div className="py-2">
                  {difficultyOptions.map(option => {
                    const IconComponent = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => {
                          onDifficultyChange(option.value);
                          setShowDifficultyDropdown(false);
                        }}
                        className={`w-full flex items-center px-4 py-3 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                          selectedDifficulty === option.value
                            ? 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-700 dark:text-indigo-300 border-r-4 border-indigo-500'
                            : `text-gray-700 dark:text-gray-300 ${option.color}`
                        }`}
                      >
                        <IconComponent className="h-4 w-4 mr-3" />
                        <span className="font-medium">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sort Options */}
          <div className="relative" ref={sortDropdownRef}>
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="inline-flex items-center px-5 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all duration-200 transform hover:scale-[1.02]"
            >
              <SortAsc className="h-5 w-5 mr-3" />
              <span className="whitespace-nowrap">
                {sortOptions.find(opt => opt.value === sortBy)?.label || 'Sort'}
              </span>
              <ChevronDown className={`h-5 w-5 ml-3 transition-transform duration-200 ${showSortDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showSortDropdown && (
              <div className="absolute z-20 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl shadow-gray-900/10 dark:shadow-gray-900/30 backdrop-blur-md">
                <div className="py-2">
                  {sortOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onSortChange(option.value);
                        setShowSortDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                        sortBy === option.value
                          ? 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-700 dark:text-indigo-300 border-r-4 border-indigo-500'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Active Filters Summary
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-3 pt-3 lg:pt-0 lg:pl-6 lg:border-l border-gray-300 dark:border-gray-600">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
              <span className="font-medium">
                {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active
              </span>
            </div>
            <button
              onClick={() => {
                onTopicsChange([]);
                onDifficultyChange('all');
              }}
              className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors hover:underline"
            >
              Clear all
            </button>
          </div>
        )} */}
      </div>

      {/* Selected Topics Preview (when collapsed) */}
      {/* {selectedTopics.length > 0 && !showTopicsDropdown && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedTopics.slice(0, 5).map(topic => (
            <span
              key={topic}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
            >
              {topic}
              <button
                onClick={() => handleTopicRemove(topic)}
                className="ml-2 text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-200 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {selectedTopics.length > 5 && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              +{selectedTopics.length - 5} more
            </span>
          )}
        </div>
      )} */}
    </div>
  );
};

export default FilterBar;