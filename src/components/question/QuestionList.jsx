import React from 'react';
import QuestionCard from './QuestionCard';
import { useQuestionContext } from '../../contexts/QuestionContext';

const QuestionList = ({ questions }) => {
  const { loading } = useQuestionContext();
  
  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Loading questions...</p>
      </div>
    );
  }
  
  if (!questions || questions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">No questions found</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {questions.map((question) => (
        <QuestionCard
          key={question.id}
          question={question}
        />
      ))}
    </div>
  );
};

export default QuestionList;