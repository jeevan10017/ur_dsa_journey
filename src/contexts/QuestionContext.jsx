import React, { createContext, useContext, useState, useEffect } from 'react';
import { useFirestore } from '../hooks/useFirestore';

const QuestionContext = createContext();

export const useQuestionContext = () => {
  const context = useContext(QuestionContext);
  if (!context) {
    throw new Error('useQuestionContext must be used within a QuestionProvider');
  }
  return context;
};

export const QuestionProvider = ({ children }) => {
  const { questions, loading, error, setQuestions } = useFirestore();
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  const addQuestion = (question) => {
    setQuestions([question, ...questions]);
  };

  const updateQuestion = (updatedQuestion) => {
    setQuestions(questions.map(q => 
      q.id === updatedQuestion.id ? updatedQuestion : q
    ));
  };

  const deleteQuestion = (questionId) => {
    setQuestions(questions.filter(q => q.id !== questionId));
  };

  const value = {
    questions,
    loading,
    error,
    selectedQuestion,
    setSelectedQuestion,
    addQuestion,
    updateQuestion,
    deleteQuestion
  };

  return (
    <QuestionContext.Provider value={value}>
      {children}
    </QuestionContext.Provider>
  );
};