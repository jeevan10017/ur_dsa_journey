import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getShare, getQuestion, getQuestionHistory } from '../../services/firestore';
import QuestionDetail from './QuestionDetail';
import LoadingSpinner from '../common/LoadingSpinner';
import Header from '../common/Header';

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

  // Show loading while auth is being determined
  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header showAuthButtons={true} />
        <main className="pt-16">
          <div className="max-w-4xl mx-auto px-4 py-8 text-center">
            <div className="bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 p-4 rounded-lg">
              <h2 className="text-xl font-bold mb-2">Access Error</h2>
              <p>{error}</p>
              {needsAuth && (
                <div className="mt-4">
                  <a 
                    href="/login" 
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Sign In to Continue
                  </a>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header showAuthButtons={true} />
        <main className="pt-16">
          <div className="max-w-4xl mx-auto px-4 py-8 text-center">
            <div className="bg-yellow-50 dark:bg-yellow-900/10 text-yellow-700 dark:text-yellow-400 p-4 rounded-lg">
              <p>Shared content not found</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header showAuthButtons={true} />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {share && (
            <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h2 className="text-lg font-bold text-blue-800 dark:text-blue-300">
                Shared {share.type === 'public' ? 'Publicly' : `Privately${share.email ? ` with ${share.email}` : ''}`}
              </h2>
              <p className="text-blue-700 dark:text-blue-400 mt-1">
                Access Level: {share.accessLevel?.charAt(0).toUpperCase() + share.accessLevel?.slice(1) || 'View'}
              </p>
            </div>
          )}
          
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