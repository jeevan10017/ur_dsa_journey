import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
  FileText
} from 'lucide-react';
import { deleteQuestion } from '../../services/firestore';
import toast from 'react-hot-toast';

const QuestionCard = ({ question, onDelete }) => {
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'hard':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
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
    <div className="card p-6 hover:shadow-xl transition-shadow duration-200 group">
      {/* Difficulty badge and stars */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center">
          <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
            {question.difficulty?.charAt(0).toUpperCase() + question.difficulty?.slice(1) || 'Unknown'}
          </div>
          
          <div className="ml-3 flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < getDifficultyStars(question.difficulty)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300 dark:text-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
        
        <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2">
        {question.title || 'Untitled Question'}
      </h3>

      {/* Description */}
      <div className="text-gray-600 dark:text-gray-400 mb-4">
        <div className="line-clamp-3 leading-relaxed">
          {renderTextContent(question.description, 'No description provided')}
        </div>
      </div>

      {/* Topics */}
      {hasTopics && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {question.topics.slice(0, 3).map((topic, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
              >
                {topic}
              </span>
            ))}
            {question.topics.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                +{question.topics.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Notes preview (if exists) */}
      {question.notes && question.notes.trim() && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center mb-1">
            <FileText className="h-3.5 w-3.5 text-gray-500 mr-1" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Notes</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {renderTextContent(question.notes, 'No notes available')}
          </div>
        </div>
      )}

      {/* Timestamp */}
      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center mb-4">
        <Clock className="h-3.5 w-3.5 mr-1" />
        Updated {formatTimestamp(question.updatedAt)}
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <Link
          to={`/question/${question.id}`}
          className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
        >
          <Eye className="h-4 w-4 mr-1" />
          View Details
        </Link>
        
        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Link
            to={`/edit-question/${question.id}`}
            className="p-2 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            title="Edit Question"
          >
            <Edit className="h-4 w-4" />
          </Link>
          
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            title="Delete Question"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-500 mr-2" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Delete Question
              </h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete "<strong>{question.title || 'this question'}</strong>"? This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn-danger flex items-center"
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