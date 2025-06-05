import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getQuestion, deleteQuestion } from '../../services/firestore';
import CodeEditor from './CodeEditor';
import NotesSection from './NotesSection';
import { ChevronLeft, Edit, Trash2, Star, Clock, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../common/LoadingSpinner';

const QuestionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNotes, setShowNotes] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const loadQuestion = async () => {
      if (!id || !user) return;
      
      setLoading(true);
      try {
        const { question: q, error: e } = await getQuestion(id);
        
        if (e) {
          setError(e);
          toast.error('Failed to load question');
        } else if (!q || q.userId !== user.uid) {
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
  }, [id, user, navigate]);

  const handleDelete = async () => {
    if (!question) return;
    
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
      case 'easy': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'hard': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !question) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <div className="bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 p-4 rounded-lg">
          <p>{error || 'Question not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="btn-secondary inline-flex items-center space-x-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back</span>
        </button>
      </div>
      
      {/* Title and Actions */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {question.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getDifficultyColor(question.difficulty)}`}>
              <Star className="h-3 w-3 mr-1" />
              {question.difficulty}
            </span>
            
            {question.topics && question.topics.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {question.topics.map((topic) => (
                  <span
                    key={topic}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            )}
            
            <div className="flex items-center text-gray-500">
              <Clock className="h-4 w-4 mr-1" />
              <span className="text-sm">
                Updated {formatDate(question.updatedAt)}
              </span>
            </div>
          </div>

          {question.questionLink && (
            <div className="mt-3">
              <a
                href={question.questionLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                View Original Problem
              </a>
            </div>
          )}
        </div>
        
        <div className="flex space-x-2 ml-4">
          <button
            onClick={() => navigate(`/edit-question/${id}`)}
            className="btn-secondary inline-flex items-center space-x-2"
          >
            <Edit className="h-4 w-4" />
            <span>Edit</span>
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn-danger inline-flex items-center space-x-2"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>
      
      {/* Notes Section */}
      {question.notes && (
        <NotesSection 
          notes={question.notes} 
          isOpen={showNotes}
          onToggle={() => setShowNotes(!showNotes)}
        />
      )}
      
      {/* Main Content - Two Column Layout on Large Screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
        {/* Left Column - Problem Description */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Problem Statement
            </h2>
            <div 
              className="prose dark:prose-invert max-w-none bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700"
              dangerouslySetInnerHTML={{ __html: question.description }}
            />
          </div>
        </div>
        
        {/* Right Column - Solution Code and Test Cases */}
        <div className="space-y-6">
          {/* Solution Code */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Solution Code
            </h2>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden h-84">
              <CodeEditor 
                value={question.code || '// No solution code provided'} 
                readOnly={true}
              />
            </div>
          </div>
          
          {/* Test Cases */}
          {question.testCases && question.testCases.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Test Cases
              </h2>
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
                {question.testCases.map((testCase, index) => (
                  <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0 last:pb-0">
                    <div className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Test Case {index + 1}:
                    </div>
                    {typeof testCase === 'object' ? (
                      <div className="space-y-3">
                        {testCase.input && (
                          <div>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Input:</span>
                            <pre className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 p-3 rounded mt-1 overflow-x-auto">
                              {testCase.input}
                            </pre>
                          </div>
                        )}
                        {testCase.output && (
                          <div>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Output:</span>
                            <pre className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 p-3 rounded mt-1 overflow-x-auto">
                              {testCase.output}
                            </pre>
                          </div>
                        )}
                      </div>
                    ) : (
                      <pre className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-x-auto">
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Delete Question
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete "{question.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn-danger"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionDetail;