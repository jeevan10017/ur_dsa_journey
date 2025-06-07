import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserQuestions, testFirestoreConnection } from '../services/firestore';
import { Plus, Search, Filter, Calendar, Star, Clock, TrendingUp, AlertCircle, RefreshCw, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import QuestionCard from '../components/dashboard/QuestionCard';
import StatsCard from '../components/dashboard/StatsCard';
import FilterBar from '../components/dashboard/FilterBar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import LeetcodeStats from '../components/leetcodeStats/LeetcodeStats';

const Dashboard = () => {
 const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [isLeetCodeExpanded, setIsLeetCodeExpanded] = useState(false);
 

  useEffect(() => {
    if (user) {
      checkConnectionAndLoadQuestions();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [questions, searchTerm, selectedDifficulty, sortBy, selectedTopics]);

  // Memoized computation of all available topics
  const availableTopics = useMemo(() => {
    const topicsSet = new Set();
    questions.forEach(question => {
      if (question.topics && Array.isArray(question.topics)) {
        question.topics.forEach(topic => {
          if (topic && typeof topic === 'string' && topic.trim()) {
            topicsSet.add(topic.trim());
          }
        });
      }
    });
    return Array.from(topicsSet).sort();
  }, [questions]);

  // Memoized stats computation
  const stats = useMemo(() => {
    const total = questions.length;
    const easy = questions.filter(q => q.difficulty === 'easy').length;
    const medium = questions.filter(q => q.difficulty === 'medium').length;
    const hard = questions.filter(q => q.difficulty === 'hard').length;
    
    const thisWeek = questions.filter(q => {
      const questionDate = new Date(q.createdAt?.seconds * 1000);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return questionDate >= weekAgo;
    }).length;

    const topicsCount = availableTopics.length;

    return { total, easy, medium, hard, thisWeek, topicsCount };
  }, [questions, availableTopics]);

  const checkConnectionAndLoadQuestions = async () => {
    setLoading(true);
    setError(null);
    
    // First, test the connection
    const { connected, error: connectionError } = await testFirestoreConnection();
    
    if (!connected) {
      setConnectionStatus('failed');
      setError(connectionError);
      setLoading(false);
      return;
    }
    
    setConnectionStatus('connected');
    await loadQuestions();
  };

  const loadQuestions = async () => {
    if (!user) return;
    
    const { questions: userQuestions, error: questionsError } = await getUserQuestions(user.uid);
    
    if (questionsError) {
      setError(questionsError);
      toast.error(questionsError);
    } else {
      setQuestions(userQuestions);
      setError(null);
    }
    
    setLoading(false);
  };

  const handleRetry = () => {
    checkConnectionAndLoadQuestions();
  };

  const applyFilters = () => {
    let filtered = [...questions];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(q =>
        q.title?.toLowerCase().includes(searchLower) ||
        q.description?.toLowerCase().includes(searchLower) ||
        (q.topics || []).some(topic => 
          topic && topic.toLowerCase().includes(searchLower)
        ) ||
        (q.notes && q.notes.toLowerCase().includes(searchLower))
      );
    }

    // Topics filter - improved logic
    if (selectedTopics.length > 0) {
      filtered = filtered.filter(q => {
        if (!q.topics || !Array.isArray(q.topics)) return false;
        
        // Check if question has ALL selected topics (AND logic)
        // Change to some() for OR logic if you prefer
        return selectedTopics.every(selectedTopic =>
          q.topics.some(questionTopic => 
            questionTopic && questionTopic.toLowerCase() === selectedTopic.toLowerCase()
          )
        );
      });
    }

    // Difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(q => q.difficulty === selectedDifficulty);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.updatedAt?.seconds * 1000) - new Date(a.updatedAt?.seconds * 1000);
        case 'oldest':
          return new Date(a.createdAt?.seconds * 1000) - new Date(b.createdAt?.seconds * 1000);
        case 'difficulty': {
          const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
          return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        }
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'topics':
          const aTopicCount = (a.topics || []).length;
          const bTopicCount = (b.topics || []).length;
          return bTopicCount - aTopicCount;
        default:
          return 0;
      }
    });

    setFilteredQuestions(filtered);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedDifficulty('all');
    setSelectedTopics([]);
    setSortBy('recent');
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || selectedDifficulty !== 'all' || selectedTopics.length > 0;

  // Toggle LeetCode stats expansion
  const toggleLeetCodeStats = () => {
    setIsLeetCodeExpanded(!isLeetCodeExpanded);
  };

  // Connection error state
  if (connectionStatus === 'failed' && error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Connection Problem
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error}
            </p>
            <div className="space-y-4">
              <button
                onClick={handleRetry}
                className="btn-primary inline-flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Try Again</span>
              </button>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <p className="mb-2">If the problem persists:</p>
                <ul className="text-left space-y-1">
                  <li>• Disable ad-blockers and privacy extensions</li>
                  <li>• Try in incognito/private mode</li>
                  <li>• Check your internet connection</li>
                  <li>• Whitelist firestore.googleapis.com</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your questions..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Track your DSA learning progress
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' : 
                connectionStatus === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
              }`} />
              <span className="text-xs text-gray-500">
                {connectionStatus === 'connected' ? 'Connected' : 
                 connectionStatus === 'failed' ? 'Disconnected' : 'Connecting...'}
              </span>
            </div>
            <Link
              to="/add-question"
              className="btn-primary inline-flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Add Question</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatsCard
          title="Total Questions"
          value={stats.total}
          icon={<Calendar className="h-6 w-6" />}
          color="blue"
        />
        <StatsCard
          title="This Week"
          value={stats.thisWeek}
          icon={<TrendingUp className="h-6 w-6" />}
          color="green"
        />
        <StatsCard
          title="Easy Problems"
          value={stats.easy}
          icon={<Star className="h-6 w-6" />}
          color="emerald"
        />
        <StatsCard
          title="Medium Problems"
          value={stats.medium}
          icon={<Star className="h-6 w-6" />}
          color="yellow"
        />
        <StatsCard
          title="Hard Problems"
          value={stats.hard}
          icon={<Star className="h-6 w-6" />}
          color="red"
        />
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
            <button
              onClick={handleRetry}
              className="ml-auto text-red-600 hover:text-red-800 dark:text-red-400"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* LeetCode Stats Collapsible Section */}
      <div className="mb-6">
        <div 
          className="bg-gradient-to-r from-blue-900/80 to-blue-800/80  dark:bg-gradient-to-r  dark:from-blue-900 dark:to-blue-800 rounded-t-lg px-6 py-4 cursor-pointer transition-all duration-200 shadow-lg"
          onClick={toggleLeetCodeStats}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <span>Your LeetCode Stats</span>
            </h2>
            <div className=" text-blue-100 ">
              {isLeetCodeExpanded ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </div>
          </div>
        </div>
        
        <div 
          className={`overflow-hidden transition-all duration-1000 ease-in-out ${
            isLeetCodeExpanded ? 'max-h-fit opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className=" rounded-b-lg  p-6 shadow-lg">
            <LeetcodeStats leetcodeUsername={userProfile?.leetcodeUsername} />
          </div>
        </div>
      </div>
 
      {/* Search and Filter Bar */}
<div className="mb-6">
  <div className="flex flex-col lg:flex-row gap-4">
    {/* Search */}
    <div className="flex-1 relative">
      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
      <input
        type="text"
        placeholder="Search questions, topics, or notes..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-10 input dark:bg-gradient-to-r from-slate-900 to-gray-900"
      />
    </div>
    
    {/* Filters */}
    <div className="lg:flex-shrink-0">
      <FilterBar
        availableTopics={availableTopics}
        selectedTopics={selectedTopics}
        onTopicsChange={setSelectedTopics}
        selectedDifficulty={selectedDifficulty}
        onDifficultyChange={setSelectedDifficulty}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />
    </div>
  </div>

  {/* Active filters display and clear button */}
  {hasActiveFilters && (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg mt-4">
      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
        Active filters:
      </span>
      {searchTerm && (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200">
          Search: "{searchTerm}"
        </span>
      )}
      {selectedDifficulty !== 'all' && (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200">
          Difficulty: {selectedDifficulty}
        </span>
      )}
      {selectedTopics.map(topic => (
        <span
          key={topic}
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200"
        >
          Topic: {topic}
        </span>
      ))}
      <button
        onClick={clearAllFilters}
        className="ml-2 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-medium"
      >
        Clear all
      </button>
    </div>
  )}
</div>


      {/* Results summary */}
      {questions.length > 0 && (
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredQuestions.length} of {questions.length} questions
          {hasActiveFilters && (
            <span className="ml-1">(filtered)</span>
          )}
        </div>
      )}

      {/* Questions Grid */}
      {filteredQuestions.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
            {questions.length === 0 ? (
              <Calendar className="h-full w-full" />
            ) : (
              <Filter className="h-full w-full" />
            )}
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {questions.length === 0 ? 'No questions yet' : 'No questions match your filters'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {questions.length === 0
              ? 'Start your DSA journey by adding your first question!'
              : 'Try adjusting your search or filter criteria.'}
          </p>
          {questions.length === 0 ? (
            <Link to="/add-question" className="btn-primary">
              Add Your First Question
            </Link>
          ) : (
            <button
              onClick={clearAllFilters}
              className="btn-secondary"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuestions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              onDelete={loadQuestions}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;