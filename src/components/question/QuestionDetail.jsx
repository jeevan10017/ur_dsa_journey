import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getQuestion, deleteQuestion } from '../../services/firestore';
import CodeEditor from './CodeEditor';
import NotesSection from './NotesSection';
import { 
  ChevronLeft, 
  Edit, 
  Trash2, 
  Star, 
  Clock, 
  ExternalLink,
  Share2,
  MessageCircle,
  FileText,
  Code,
  CheckCircle,
  Eye,
  EyeOff,
  Bookmark,
  Globe,
  Lock,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import ShareModal from '../ui/ShareModal';
import { getQuestionHistory } from '../../services/firestore';
import HistorySection from './HistorySection';
import CommentForm from './CommentForm';
import DSADriveLoader from '../common/DSADriveLoader';

const QuestionDetail = ({
  isShared = false,
  accessLevel = 'view',
  shareId,
  share,
  question: providedQuestion,
  history: providedHistory
}) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [history, setHistory] = useState(providedHistory || []);
  const [question, setQuestion] = useState(providedQuestion || null);
  const [loading, setLoading] = useState(!providedQuestion);
  const [error, setError] = useState(null);
  const [showNotes, setShowNotes] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeTab, setActiveTab] = useState('description');

  useEffect(() => {
    // If question is already provided (from shared page), skip loading
    if (providedQuestion) {
      setQuestion(providedQuestion);
      setHistory(providedHistory || []);
      setLoading(false);
      return;
    }

    const loadQuestion = async () => {
      if (!id || (!user && !isShared)) return;
      
      setLoading(true);
      try {
        const { question: q, error: e } = await getQuestion(id, shareId);
        
        if (e) {
          setError(e);
          toast.error('Failed to load question');
        } else if (!q) {
          setError('Question not found');
        } else if (!isShared && (!user || q.userId !== user.uid)) {
          setError('Question not found or access denied');
          navigate('/dashboard');
        } else {
          setQuestion(q);
        }
      } catch (err) {
        console.error('Error loading question:', err);
        setError('Failed to load question');
      } finally {
        setLoading(false);
      }
    };
    
    loadQuestion();
  }, [id, user, navigate, shareId, isShared, providedQuestion, providedHistory]);

  useEffect(() => {
    // Skip if history is already provided or question is not loaded
    if (providedHistory || !question || !id) return;
    
    const loadHistory = async () => {
      const { history: h, error } = await getQuestionHistory(id, shareId);
      if (!error) setHistory(h);
    };
    
    loadHistory();
  }, [id, shareId, question, providedHistory, isShared]);

  const handleDelete = async () => {
    if (!question || isShared) return;
    
    try {
      const { error } = await deleteQuestion(id);
      if (error) {
        toast.error('Failed to delete question');
      } else {
        toast.success('Question deleted successfully');
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Error deleting question:', err);
      toast.error('Failed to delete question');
    }
    setShowDeleteConfirm(false);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-emerald-700 bg-emerald-100 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700';
      case 'medium': return 'text-amber-700 bg-amber-100 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700';
      case 'hard': return 'text-red-700 bg-red-100 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700';
      default: return 'text-gray-700 bg-gray-100 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700';
    }
  };

  const canEdit = () => {
    if (isShared) {
      return accessLevel === 'edit';
    }
    return user && question && question.userId === user.uid;
  };

  const canComment = () => {
    if (isShared) {
      return ['comment', 'edit'].includes(accessLevel);
    }
    return user && question && question.userId === user.uid;
  };

  const canViewHistory = () => {
    if (isShared) {
      return ['comment', 'edit'].includes(accessLevel);
    }
    return user && question && question.userId === user.uid;
  };

  const canDelete = () => {
    return !isShared && user && question && question.userId === user.uid;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 flex items-center justify-center">
        <DSADriveLoader />
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:to-slate-900 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center border border-red-200 dark:border-red-800">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <ExternalLink className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Unable to Load Question
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error || 'Question not found'}
            </p>
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Enhanced Header with Breadcrumb */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="group inline-flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 mb-4"
          >
            <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </button>
          
          {/* Shared Status Banner */}
          {/* {isShared && share && (
            <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                  {share.type === 'public' ? (
                    <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-blue-800 dark:text-blue-300">
                    {share.type === 'public' ? 'Public Share' : 'Private Share'}
                  </h3>
                  <p className="text-blue-700 dark:text-blue-400 text-sm">
                    Access Level: <span className="font-semibold">{accessLevel.charAt(0).toUpperCase() + accessLevel.slice(1)}</span>
                    {share.email && share.type !== 'public' && (
                      <span className="ml-2">• Shared with {share.email}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )} */}
        </div>
        
        {/* Enhanced Title Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                {question.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold border ${getDifficultyColor(question.difficulty)}`}>
                  <Star className="h-4 w-4 mr-2" />
                  {question.difficulty}
                </span>
                
                {question.topics && question.topics.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {question.topics.map((topic) => (
                      <span
                        key={topic}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-700"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex items-center text-gray-500 dark:text-gray-400">
                <Clock className="h-4 w-4 mr-2" />
                <span className="text-sm">
                  Last updated {formatDate(question.updatedAt)}
                </span>
              </div>

              {question.questionLink && (
                <div className="mt-4">
                  <a
                    href={question.questionLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-2 py-1  text-indigo-500 from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Original Problem
                  </a>
                </div>
              )}
            </div>
            
            {/* Enhanced Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {!isShared && (
                <button
                  onClick={() => setShowShareModal(true)}
                  className="group inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Share2 className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                  Share
                </button>
              )}
              
              {canEdit() && (
                <button
                  onClick={() => navigate(`/edit-question/${id}`)}
                  className="group inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Edit className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                  Edit
                </button>
              )}
              
              {canDelete() && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="group inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Trash2 className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Enhanced Notes Section */}
        {question.notes && (
          <div className="mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                onClick={() => setShowNotes(!showNotes)}
                className="w-full px-6 py-4 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-b border-yellow-200 dark:border-yellow-800 flex items-center justify-between hover:from-yellow-100 hover:to-amber-100 dark:hover:from-yellow-900/30 dark:hover:to-amber-900/30 transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg">
                    <FileText className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <h2 className="text-lg font-bold text-yellow-800 dark:text-yellow-300">
                    Notes & Insights
                  </h2>
                </div>
                {showNotes ? (
                  <EyeOff className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                ) : (
                  <Eye className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                )}
              </button>
              
              {showNotes && (
                <div className="p-6">
                  <NotesSection 
                    notes={question.notes} 
                    isOpen={showNotes}
                    onToggle={() => setShowNotes(!showNotes)}
                  />
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Enhanced Tabbed Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('description')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'description'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Problem Statement</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('solution')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'solution'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Code className="h-4 w-4" />
                  <span>Solution</span>
                </div>
              </button>
              {question.testCases && question.testCases.length > 0 && (
                <button
                  onClick={() => setActiveTab('tests')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === 'tests'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Test Cases</span>
                  </div>
                </button>
              )}
            </nav>
          </div>
          
          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'description' && (
              <div className="space-y-6">
                <div 
                  className="prose dark:prose-invert max-w-none prose-lg prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300"
                  dangerouslySetInnerHTML={{ __html: question.description }}
                />
              </div>
            )}
            
            {activeTab === 'solution' && (
              <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden ">
                  <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2">
                      <Code className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Solution Code
                      </span>
                    </div>
                  </div>
                  <div className="h-full">
                    <CodeEditor 
                      value={question.code || '// No solution code provided'} 
                      readOnly={true}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'tests' && question.testCases && question.testCases.length > 0 && (
              <div className="space-y-6">
                <div className="grid gap-4">
                  {question.testCases.map((testCase, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                            {index + 1}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          Test Case {index + 1}
                        </h3>
                      </div>
                      
                      {typeof testCase === 'object' ? (
                        <div className="space-y-4">
                          {testCase.input && (
                            <div>
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                                Input
                              </label>
                              <pre className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 overflow-x-auto">
                                {testCase.input}
                              </pre>
                            </div>
                          )}
                          {testCase.output && (
                            <div>
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                                Expected Output
                              </label>
                              <pre className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 overflow-x-auto">
                                {testCase.output}
                              </pre>
                            </div>
                          )}
                        </div>
                      ) : (
                        <pre className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 overflow-x-auto">
                          {testCase}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Enhanced Comments Section */}
        {question && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => setShowComments(!showComments)}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-b border-purple-200 dark:border-purple-800 flex items-center justify-between hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                  <MessageCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-lg font-bold text-purple-800 dark:text-purple-300">
                  Comments & Discussion
                </h2>
                {history.length > 0 && (
                  <span className="px-2 py-1 bg-purple-200 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 rounded-full text-xs font-medium">
                    {history.length}
                  </span>
                )}
              </div>
              {showComments ? (
                <EyeOff className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              ) : (
                <Eye className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              )}
            </button>
            
            {showComments && (
              <div className="p-6 space-y-6">
                {canComment() && (
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                    <CommentForm questionId={id} shareId={shareId} />
                  </div>
                )}

                <div>
                  <HistorySection 
                    history={history} 
                    showComments={showComments}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Enhanced Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 max-w-md w-full">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Delete Question
                </h3>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                Are you sure you want to delete "<span className="font-semibold text-gray-900 dark:text-white">{question.title}</span>"? This action cannot be undone and will permanently remove all associated data.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
                >
                  Delete Forever
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && (
          <ShareModal 
            questionId={id} 
            onClose={() => setShowShareModal(false)} 
          />
        )}
      </div>
    </div>
  );
};

export default QuestionDetail;