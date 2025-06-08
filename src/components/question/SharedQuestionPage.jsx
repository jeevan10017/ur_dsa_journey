import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getShare, getQuestion, getQuestionHistory } from '../../services/firestore';
import QuestionDetail from './QuestionDetail';
import LoadingSpinner from '../common/LoadingSpinner';
import Header from '../common/Header';
import { 
  Shield, 
  AlertCircle, 
  ExternalLink, 
  Globe, 
  Lock, 
  Users, 
  Eye,
  MessageCircle,
  Edit,
  Sparkles,
  UserCheck,
  LogIn
} from 'lucide-react';

const SharedQuestionPage = () => {
  const { shareId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [share, setShare] = useState(null);
  const [question, setQuestion] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [needsAuth, setNeedsAuth] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading share data for:', shareId);
        
        // First, get the share metadata
        const { share: s, error: shareError } = await getShare(shareId);
        if (shareError) {
          if (shareError.includes('Authentication required')) {
            setNeedsAuth(true);
            setError(shareError);
            return; // Stop execution here
          }
          throw new Error(shareError);
        }

        if (!s) {
          throw new Error('Share not found');
        }

        console.log('Share data loaded:', s);
        setShare(s);

        // Now get the actual question using the share
        const { question: q, error: questionError } = await getQuestion(null, shareId);
        
        if (questionError) {
          throw new Error(questionError);
        }

        console.log('Question data loaded:', q);
        setQuestion(q);

        // Try to get history based on access level
        if (['comment', 'edit'].includes(s.accessLevel)) {
          try {
            const { history: h } = await getQuestionHistory(null, shareId);
            if (h) setHistory(h);
          } catch (historyError) {
            console.warn('Failed to load history:', historyError);
          }
        }

      } catch (err) {
        console.error('Load error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (shareId && !authLoading) {
      loadData();
    }
  }, [shareId, user, authLoading]);

  const getAccessLevelIcon = (level) => {
    switch (level) {
      case 'view': return Eye;
      case 'comment': return MessageCircle;
      case 'edit': return Edit;
      default: return Eye;
    }
  };

  const getAccessLevelColor = (level) => {
    switch (level) {
      case 'view': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
      case 'comment': return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30';
      case 'edit': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      default: return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
    }
  };

  // Show loading while auth is being determined
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <Sparkles className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900">
        <Header showAuthButtons={true} />
        <main className="pt-16 flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <LoadingSpinner />
            <p className="text-gray-600 dark:text-gray-400 mt-4">Loading shared content...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900">
        <Header showAuthButtons={true} />
        <main className="pt-16 flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="max-w-md w-full mx-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-red-200 dark:border-red-800 overflow-hidden">
              {/* Error Header */}
              <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 px-6 py-4 border-b border-red-200 dark:border-red-800">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg">
                    {needsAuth ? (
                      <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-red-800 dark:text-red-300">
                    {needsAuth ? 'Authentication Required' : 'Access Error'}
                  </h2>
                </div>
              </div>

              {/* Error Content */}
              <div className="p-6 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  {error}
                </p>
                
                {needsAuth ? (
                  <div className="space-y-3">
                    <a 
                      href="/login" 
                      className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <LogIn className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                      Sign In to Continue
                    </a>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      This shared content requires authentication
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => window.history.back()}
                    className="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Go Back
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900">
        <Header showAuthButtons={true} />
        <main className="pt-16 flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="max-w-md w-full mx-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-yellow-200 dark:border-yellow-800 overflow-hidden">
              {/* Warning Header */}
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 px-6 py-4 border-b border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <h2 className="text-lg font-bold text-yellow-800 dark:text-yellow-300">
                    Content Not Found
                  </h2>
                </div>
              </div>

              {/* Warning Content */}
              <div className="p-6 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  The shared content you're looking for could not be found or may have been removed.
                </p>
                <button
                  onClick={() => window.history.back()}
                  className="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const AccessLevelIcon = getAccessLevelIcon(share?.accessLevel);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900">
      <Header showAuthButtons={true} />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Enhanced Share Status Banner */}
          {share && (
            <div className="mb-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-6 py-6 border-b border-blue-200 dark:border-blue-800">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                      {share.type === 'public' ? (
                        <Globe className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-blue-800 dark:text-blue-300 flex items-center space-x-2">
                        <span>{share.type === 'public' ? 'Public Share' : 'Private Share'}</span>
                        <Sparkles className="h-4 w-4 text-blue-500" />
                      </h3>
                      <p className="text-blue-700 dark:text-blue-400 text-sm mt-1">
                        {share.email && share.type !== 'public' ? (
                          <>Shared privately with <span className="font-semibold">{share.email}</span></>
                        ) : share.type === 'public' ? (
                          'Anyone with the link can access this content'
                        ) : (
                          'Shared with specific users'
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${getAccessLevelColor(share.accessLevel)}`}>
                      <AccessLevelIcon className="h-4 w-4 mr-2" />
                      {share.accessLevel?.charAt(0).toUpperCase() + share.accessLevel?.slice(1) || 'View'} Access
                    </div>
                    
                    {user && (
                      <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                        <UserCheck className="h-3 w-3" />
                        <span>Signed in as {user.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Access Level Description */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50">
                <div className="flex items-start space-x-3">
                  <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg mt-0.5">
                    <Shield className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {share.accessLevel === 'view' && (
                      <p>You can view this question and its solution, but cannot make changes or leave comments.</p>
                    )}
                    {share.accessLevel === 'comment' && (
                      <p>You can view this question, its solution, and leave comments, but cannot edit the content.</p>
                    )}
                    {share.accessLevel === 'edit' && (
                      <p>You have full access to view, comment on, and edit this question and its solution.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Enhanced Question Detail with improved props */}
          <QuestionDetail 
            question={question}
            history={history}
            isShared={true}
            accessLevel={share?.accessLevel || 'view'}
            share={share}
            shareId={shareId}
          />
        </div>
      </main>
    </div>
  );
};

export default SharedQuestionPage;