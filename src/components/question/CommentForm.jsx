import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { addQuestionHistory } from '../../services/firestore';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const CommentForm = ({ questionId, shareId, disabled }) => {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addQuestionHistory(questionId, {
        action: 'comment',
        comment: comment.trim()
      }, shareId);

      toast.success('Comment added successfully!');
      setComment('');
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
      <div className="p-6">
        <div className="flex items-center mb-4">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Add Comment
            </h3>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts, insights, or questions..."
              className="w-full px-4 py-3 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all duration-200 placeholder-gray-500 dark:placeholder-gray-400"
              rows={4}
              disabled={disabled || isSubmitting}
              maxLength={1000}
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {comment.length}/1000
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              {user && (
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                    {user.email?.[0]?.toUpperCase()}
                  </div>
                  <span>Commenting as {user.email}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="inline-flex items-center space-x-2 px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
              disabled={disabled || !comment.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Post Comment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommentForm;