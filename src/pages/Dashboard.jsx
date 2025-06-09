import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserQuestions, testFirestoreConnection } from '../services/firestore';
import { Plus, Search, Filter, Calendar, Star, Clock, TrendingUp, AlertCircle, RefreshCw, Tag, ChevronDown, ChevronUp, Sparkles, Target, BookOpen, Trophy } from 'lucide-react';
import QuestionCard from '../components/dashboard/QuestionCard';
import StatsCard from '../components/dashboard/StatsCard';
import FilterBar from '../components/dashboard/FilterBar';
import DSADriveLoader from '../components/common/DSADriveLoader';
import toast from 'react-hot-toast';
import LeetcodeStats from '../components/dashboard/LeetcodeStats';

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

  // Enhanced stats computation with additional metrics
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

    const thisMonth = questions.filter(q => {
      const questionDate = new Date(q.createdAt?.seconds * 1000);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return questionDate >= monthAgo;
    }).length;

    const topicsCount = availableTopics.length;
    const completionRate = total > 0 ? Math.round((total / (total + 50)) * 100) : 0; // Assuming 50+ more to go

    return { total, easy, medium, hard, thisWeek, thisMonth, topicsCount, completionRate };
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center max-w-md backdrop-blur-sm bg-white/70 dark:bg-slate-800/70 rounded-2xl p-8 shadow-2xl border border-white/20">
              <div className="relative">
                <AlertCircle className="h-20 w-20 text-red-500 mx-auto mb-6 animate-pulse" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full animate-ping opacity-75"></div>
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-4">
                Connection Problem
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                {error}
              </p>
              <div className="space-y-6">
                <button
                  onClick={handleRetry}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 inline-flex items-center space-x-3"
                >
                  <RefreshCw className="h-5 w-5" />
                  <span>Try Again</span>
                </button>
                <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4">
                  <p className="mb-3 font-medium">If the problem persists:</p>
                  <ul className="text-left space-y-2">
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <span>Disable ad-blockers and privacy extensions</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <span>Try in incognito/private mode</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <span>Check your internet connection</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <span>Whitelist firestore.googleapis.com</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return <DSADriveLoader />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-gray-900  dark:to-gray-950 ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Enhanced Header */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="relative">
              {/* <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur opacity-25"></div> */}
              {/* <div className="relative">
                <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-3">
                  Dashboard
                </h1>
                <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
                  <Target className="h-5 w-5" />
                  <p className="text-lg">Track your DSA learning progress</p>
                </div>
              </div> */}
            </div>
            <div className="mt-6 sm:mt-0 flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-3 dark:text-gray-200 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                <div className={`w-3 h-3 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 
                  connectionStatus === 'failed' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
                }`} />
                <span className="text-sm font-medium">
                  {connectionStatus === 'connected' ? 'Connected' : 
                   connectionStatus === 'failed' ? 'Disconnected' : 'Connecting...'}
                </span>
              </div>
              {/* Add Question Button */}
              <Link
                to="/add-question"
                className="bg-gradient-to-r from-blue-950/90 to-blue-950/80 dark:fromblue-950/90 dark:to-indigo-950/80 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 inline-flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Add Question</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 mb-12">
          <div className="backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl group-hover:scale-110 transition-transform duration-200">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">This Week</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.thisWeek}</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl group-hover:scale-110 transition-transform duration-200">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Easy</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.easy}</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 rounded-xl group-hover:scale-110 transition-transform duration-200">
                <Star className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Medium</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.medium}</p>
              </div>
              <div className="bg-gradient-to-br from-yellow-500 to-orange-500 p-3 rounded-xl group-hover:scale-110 transition-transform duration-200">
                <Star className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Hard</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.hard}</p>
              </div>
              <div className="bg-gradient-to-br from-red-500 to-red-600 p-3 rounded-xl group-hover:scale-110 transition-transform duration-200">
                <Star className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Topics</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.topicsCount}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl group-hover:scale-110 transition-transform duration-200">
                <Tag className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-8 backdrop-blur-sm bg-red-50/80 dark:bg-red-900/40 border border-red-200/50 dark:border-red-800/50 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="bg-red-500 p-2 rounded-full">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <span className="text-red-700 dark:text-red-300 font-medium flex-1">{error}</span>
              <button
                onClick={handleRetry}
                className="text-red-600 hover:text-red-800 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800/30 p-2 rounded-lg transition-colors duration-200"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Enhanced LeetCode Stats Section */}
        <div className="mb-8">
          <div 
            className="backdrop-blur-sm bg-gradient-to-r from-blue-950/70 to-blue-950/60 dark:fromblue-950/90 dark:to-indigo-950/80 rounded-2xl shadow-2xl border border-white/20 cursor-pointer transition-all duration-300 hover:shadow-3xl group"
            onClick={toggleLeetCodeStats}
          >
            <div className="px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-white/20 p-3 rounded-xl group-hover:bg-white/30 transition-colors duration-200">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    Your LeetCode Statistics
                  </h2>
                </div>
                <div className="bg-white/20 p-2 rounded-lg group-hover:bg-white/30 transition-all duration-200">
                  {isLeetCodeExpanded ? (
                    <ChevronUp className="h-6 w-6 text-white transition-transform duration-300" />
                  ) : (
                    <ChevronDown className="h-6 w-6 text-white transition-transform duration-300" />
                  )}
                </div>
              </div>
            </div>
            
            <div 
              className={`overflow-hidden transition-all duration-500 ease-in-out ${
                isLeetCodeExpanded ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="px-8 pb-8">
                <LeetcodeStats leetcodeUsername={userProfile?.leetcodeUsername} />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filter Section */}
        <div className="mb-8">
          <div className="backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Enhanced Search */}
              <div className="flex-1 relative group">
                <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                <input
                  type="text"
                  placeholder="Search questions, topics, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/70 dark:bg-slate-900/70 border border-gray-200/50 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
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

            {/* Enhanced Active Filters Display */}
            {hasActiveFilters && (
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-xl border border-blue-200/30 dark:border-blue-700/30 z-50">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                      Active Filters:
                    </span>
                  </div>
                  {searchTerm && (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                      Search: "{searchTerm}"
                    </span>
                  )}
                  {selectedDifficulty !== 'all' && (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                      Difficulty: {selectedDifficulty}
                    </span>
                  )}
                  {selectedTopics.map(topic => (
                    <span
                      key={topic}
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-green-500/20 text-green-700 dark:text-green-300 border border-green-500/30"
                    >
                      Topic: {topic}
                    </span>
                  ))}
                  <button
                    onClick={clearAllFilters}
                    className="ml-2 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-semibold bg-white/50 hover:bg-white/70 dark:bg-slate-700/50 dark:hover:bg-slate-700/70 px-3 py-1.5 rounded-full border border-blue-200/50 hover:border-blue-300/50 transition-all duration-200"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Summary */}
        {questions.length > 0 && (
          <div className="mb-6 text-gray-600 dark:text-gray-400 bg-white/40 dark:bg-slate-800/40  rounded-xl px-4 py-3 border border-white/20 ">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span className="font-medium">
                Showing {filteredQuestions.length} of {questions.total} questions
                {hasActiveFilters && <span className="text-blue-600 dark:text-blue-400 ml-1">(filtered)</span>}
              </span>
            </div>
          </div>
        )}

        {/* Enhanced Questions Grid or Empty State */}
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-20">
            <div className="backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 rounded-3xl p-12 border border-white/20 shadow-2xl max-w-md mx-auto">
              <div className="relative mb-8">
                <div className="mx-auto h-32 w-32 text-gray-400 mb-4 relative">
                  {questions.length === 0 ? (
                    <>
                      <Calendar className="h-full w-full" />
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <Plus className="h-4 w-4 text-white" />
                      </div>
                    </>
                  ) : (
                    <Filter className="h-full w-full" />
                  )}
                </div>
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full blur-xl opacity-50"></div>
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-4">
                {questions.length === 0 ? 'Ready to Start Your Journey?' : 'No Questions Match Your Filters'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg leading-relaxed">
                {questions.length === 0
                  ? 'Begin your DSA mastery journey by adding your first coding question. Every expert was once a beginner!'
                  : 'Try adjusting your search terms or filter criteria to find what you\'re looking for.'}
              </p>
              {questions.length === 0 ? (
                <Link 
                  to="/add-question" 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 inline-flex items-center space-x-3"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add Your First Question</span>
                </Link>
              ) : (
                <button
                  onClick={clearAllFilters}
                  className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 inline-flex items-center space-x-3"
                >
                  <RefreshCw className="h-5 w-5" />
                  <span>Clear All Filters</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuestions.map((question, index) => (
              <div
                key={question.id}
                className=""
                style={{
                  animationDelay: `${index * 50}ms`,
                  animation: 'fadeInUp 0.6s ease-out forwards'
                }}
              >
                <QuestionCard
                  question={question}
                  onDelete={loadQuestions}
                />
              </div>
            ))}
          </div>
        )}
      </div>

    
    </div>
  );
};

export default Dashboard;