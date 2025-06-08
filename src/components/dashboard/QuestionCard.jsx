import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { 
  Star, 
  Clock, 
  ExternalLink, 
  Edit, 
  Trash2, 
  Eye,
  Code,
  AlertCircle,
  FileText,
  ArrowUpRight
} from 'lucide-react';
import { deleteQuestion } from '../../services/firestore';
import toast from 'react-hot-toast';

const QuestionCard = ({ question, onDelete }) => {
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const navigate = useNavigate();

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-emerald-200 dark:from-emerald-900/30 dark:to-green-900/30 dark:text-emerald-300 dark:border-emerald-700/50';
      case 'medium':
        return 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-amber-200 dark:from-amber-900/30 dark:to-yellow-900/30 dark:text-amber-300 dark:border-amber-700/50';
      case 'hard':
        return 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border-red-200 dark:from-red-900/30 dark:to-rose-900/30 dark:text-red-300 dark:border-red-700/50';
      default:
        return 'bg-gradient-to-r from-slate-100 to-gray-100 text-slate-800 border-slate-200 dark:from-slate-900/30 dark:to-gray-900/30 dark:text-slate-300 dark:border-slate-700/50';
    }
  };

  const getDifficultyStars = (difficulty) => {
    const stars = {
      easy: 1,
      medium: 3,
      hard: 5
    };
    return stars[difficulty] || 1;
  };

  const handleCardClick = (e) => {
    // Prevent navigation if clicking on action buttons
    if (e.target.closest('[data-action-button]')) {
      return;
    }
    navigate(`/question/${question.id}`);
  };

  const handleDelete = async () => {
    setLoading(true);
    const { error } = await deleteQuestion(question.id);
    
    if (error) {
      toast.error('Failed to delete question');
    } else {
      toast.success('Question deleted successfully');
      onDelete();
    }
    
    setLoading(false);
    setShowDeleteConfirm(false);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp.seconds * 1000);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const truncateText = (text, maxLength = 120) => {
    if (!text || typeof text !== 'string') return '';
    // Remove HTML tags and clean up the text
    const cleanText = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    if (cleanText.length <= maxLength) return cleanText;
    return cleanText.substring(0, maxLength) + '...';
  };

  // Function to safely display text content
  const renderTextContent = (content, placeholder = 'No content available') => {
    if (!content || typeof content !== 'string' || content.trim() === '') {
      return (
        <span className="italic text-gray-400 dark:text-gray-500">
          {placeholder}
        </span>
      );
    }
    return truncateText(content);
  };

  // Check if question has topics
  const hasTopics = question.topics && Array.isArray(question.topics) && question.topics.length > 0;

  return (
    <div 
      className="relative bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 rounded-2xl p-6 hover:shadow-2xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-400/5 transition-all duration-300 group cursor-pointer hover:-translate-y-1 hover:border-indigo-200 dark:hover:border-indigo-800/50"
      onClick={handleCardClick}
    >
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-gray-700/20 dark:to-transparent rounded-2xl pointer-events-none"></div>
      
      {/* Click indicator */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <ArrowUpRight className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
      </div>

      {/* Difficulty badge and stars */}
      <div className="relative flex justify-between items-start mb-5">
        <div className="flex items-center space-x-3">
          <div className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${getDifficultyColor(question.difficulty)} shadow-sm`}>
            {question.difficulty?.charAt(0).toUpperCase() + question.difficulty?.slice(1) || 'Unknown'}
          </div>
          
          <div className="flex items-center space-x-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 transition-colors duration-200 ${
                  i < getDifficultyStars(question.difficulty)
                    ? 'fill-yellow-400 text-yellow-400 drop-shadow-sm'
                    : 'text-gray-300 dark:text-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Title */}
      <h3 className="relative text-xl font-bold text-gray-900 dark:text-white mb-4 line-clamp-2 leading-tight">
        {question.title || 'Untitled Question'}
      </h3>

      {/* Description */}
      <div className="relative text-gray-600 dark:text-gray-400 mb-5">
        <p className="line-clamp-3 leading-relaxed text-sm">
          {renderTextContent(question.description, 'No description provided')}
        </p>
      </div>

      {/* Topics */}
      {hasTopics && (
        <div className="relative mb-5">
          <div className="flex flex-wrap gap-2">
            {question.topics.slice(0, 3).map((topic, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 border border-indigo-100 dark:from-indigo-900/30 dark:to-blue-900/30 dark:text-indigo-300 dark:border-indigo-800/50 shadow-sm"
              >
                {topic}
              </span>
            ))}
            {question.topics.length > 3 && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-gray-50 to-slate-50 text-gray-600 border border-gray-200 dark:from-gray-800 dark:to-slate-800 dark:text-gray-400 dark:border-gray-700 shadow-sm">
                +{question.topics.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Notes preview (if exists) */}
      {question.notes && question.notes.trim() && (
        <div className="relative mb-5 p-4 bg-gradient-to-r from-gray-50/80 to-slate-50/80 dark:from-gray-800/50 dark:to-slate-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50 backdrop-blur-sm">
          <div className="flex items-center mb-2">
            <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Notes</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
            {renderTextContent(question.notes, 'No notes available')}
          </div>
        </div>
      )}

      {/* Bottom section */}
      <div className="relative flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-700/50">
        {/* Timestamp */}
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
          <Clock className="h-3.5 w-3.5 mr-1.5" />
          <span>Updated {formatTimestamp(question.updatedAt)}</span>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0">
          <Link
            to={`/edit-question/${question.id}`}
            data-action-button
            className="p-2.5 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all duration-200 hover:scale-110"
            title="Edit Question"
          >
            <Edit className="h-4 w-4" />
          </Link>
          
          <button
            onClick={() => setShowDeleteConfirm(true)}
            data-action-button
            className="p-2.5 text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 hover:scale-110"
            title="Delete Question"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 transform transition-all duration-200">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full mr-4">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Delete Question
              </h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
              Are you sure you want to delete "<strong className="text-gray-900 dark:text-white">{question.title || 'this question'}</strong>"? This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-6 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl font-medium transition-colors duration-200"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all duration-200 flex items-center shadow-lg hover:shadow-xl disabled:opacity-50"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionCard;