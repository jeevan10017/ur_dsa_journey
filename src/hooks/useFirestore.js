import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { getUserQuestions } from '../services/firestore';

export const useFirestore = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      const loadQuestions = async () => {
        setLoading(true);
        const { questions: userQuestions, error } = await getUserQuestions(user.uid);
        if (error) {
          setError(error);
        } else {
          setQuestions(userQuestions);
        }
        setLoading(false);
      };
      loadQuestions();
    } else {
      setQuestions([]);
      setLoading(false);
    }
  }, [user]);

  return { questions, loading, error, setQuestions };
};