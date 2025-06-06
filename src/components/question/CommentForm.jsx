
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { addQuestionHistory } from '../../services/firestore';
import toast from 'react-hot-toast';

const CommentForm = ({ questionId ,shareId, disabled }) => {
  const [comment, setComment] = useState('');
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    
    try {
      // Pass shareId to the addQuestionHistory function
      await addQuestionHistory(questionId, {
        action: 'comment',
        comment: comment.trim()
      }, shareId);
      
      toast.success('Comment added!');
      setComment('');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };
  
  
  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Add a comment..."
        className="w-full px-4 py-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
        rows={3}
        disabled={disabled}
      />
      <div className="mt-2 flex justify-end">
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg hover:from-pink-600 hover:to-purple-700"
          disabled={disabled || !comment.trim()}
        >
          Post Comment
        </button>
      </div>
    </form>
  );
};
export default CommentForm;