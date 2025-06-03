import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { createQuestion, updateQuestion, getQuestion } from '../../services/firestore';
import RichTextEditor from './RichTextEditor';
import CodeEditor from './CodeEditor';
import { Plus, Save, ChevronLeft, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Select from 'react-select';
import { scheduleEmailReminder, createUserProfileIfNotExists } from '../../services/emailService';
import { TOPICS } from '../../utils/constants';

const QuestionForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'medium',
    code: '',
    notes: '',
    reminder: '7_days',
    topics: [],
    questionLink: '',
    testCases: [{ input: '', output: '' }]
  });

  // Load question data for editing
  useEffect(() => {
    if (isEditing && id) {
      const loadQuestion = async () => {
        setLoading(true);
        try {
          const { question, error } = await getQuestion(id);
          if (error) {
            toast.error('Failed to load question');
            navigate('/dashboard');
          } else if (question && question.userId === user.uid) {
            setFormData({
              title: question.title || '',
              description: question.description || '',
              difficulty: question.difficulty || 'medium',
              code: question.code || '',
              notes: question.notes || '',
              reminder: question.reminder || '7_days',
              topics: question.topics || [],
              questionLink: question.questionLink || '',
              testCases: Array.isArray(question.testCases) && question.testCases.length > 0
                ? question.testCases.map(tc => typeof tc === 'object' ? tc : { input: tc, output: '' })
                : [{ input: '', output: '' }]
            });
          }
        } catch (err) {
          console.error('Error loading question:', err);
          toast.error('Failed to load question');
        } finally {
          setLoading(false);
        }
      };
      loadQuestion();
    }
  }, [id, isEditing, user, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRichTextChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleTestCaseChange = (index, field, value) => {
    const newTestCases = [...formData.testCases];
    newTestCases[index][field] = value;
    setFormData({ ...formData, testCases: newTestCases });
  };

  const addTestCase = () => {
    setFormData({
      ...formData,
      testCases: [...formData.testCases, { input: '', output: '' }]
    });
  };

  const removeTestCase = (index) => {
    if (formData.testCases.length > 1) {
      const newTestCases = formData.testCases.filter((_, i) => i !== index);
      setFormData({ ...formData, testCases: newTestCases });
    }
  };

  const handleTopicsChange = (selectedOptions) => {
    setFormData({
      ...formData,
      topics: selectedOptions ? selectedOptions.map(option => option.value) : []
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Title and description are required');
      return;
    }

    setLoading(true);

    try {
      // Ensure user profile exists before creating questions/reminders
      console.log('Ensuring user profile exists for user:', user.uid);
      await createUserProfileIfNotExists(user.uid);

      const questionData = {
        title: formData.title.trim(),
        description: formData.description,
        difficulty: formData.difficulty,
        code: formData.code,
        notes: formData.notes,
        reminder: formData.reminder,
        topics: formData.topics,
        questionLink: formData.questionLink.trim(),
        testCases: formData.testCases.filter(tc => tc.input.trim() || tc.output.trim()),
        updatedAt: new Date()
      };

      let questionId;

      if (isEditing) {
        const { error } = await updateQuestion(id, questionData);
        if (error) {
          toast.error('Failed to update question: ' + error);
          return;
        }
        questionId = id;
        console.log('Question updated successfully:', questionId);
      } else {
        const { id: newId, error } = await createQuestion(user.uid, {
          ...questionData,
          createdAt: new Date()
        });
        if (error) {
          toast.error('Failed to add question: ' + error);
          return;
        }
        questionId = newId;
        console.log('Question created successfully:', questionId);
      }

      // Schedule email reminders if reminder is not 'none'
      if (formData.reminder && formData.reminder !== 'none') {
        try {
          console.log('Scheduling email reminder:', {
            userId: user.uid,
            questionId,
            reminderInterval: formData.reminder
          });
          
          await scheduleEmailReminder(user.uid, questionId, formData.reminder);
          console.log('Email reminder scheduled successfully');
        } catch (emailError) {
          console.error('Error scheduling email reminder:', emailError);
          toast.error('Question saved but failed to schedule email reminder: ' + emailError.message);
        }
      }

      toast.success(isEditing ? 'Question updated successfully!' : 'Question added successfully!');
      navigate(`/question/${questionId}`);

    } catch (error) {
      console.error('Error saving question:', error);
      toast.error('An error occurred while saving: ' + (error.message || error));
    } finally {
      setLoading(false);
    }
  };

  const topicOptions = TOPICS.map(topic => ({ value: topic, label: topic }));
  const selectedTopics = formData.topics.map(topic => ({ value: topic, label: topic }));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="btn-secondary inline-flex items-center space-x-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditing ? 'Edit Question' : 'Add New Question'}
        </h1>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn-primary inline-flex items-center space-x-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {isEditing ? 'Updating...' : 'Saving...'}
            </>
          ) : (
            <>
              {isEditing ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              <span>{isEditing ? 'Update Question' : 'Save Question'}</span>
            </>
          )}
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Question Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="input w-full"
            placeholder="Enter question title"
          />
        </div>

        {/* Topics and Question Link */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Topics
            </label>
            <Select
              isMulti
              options={topicOptions}
              value={selectedTopics}
              onChange={handleTopicsChange}
              className="react-select-container"
              classNamePrefix="react-select"
              placeholder="Select topics..."
            />
          </div>
          <div>
            <label htmlFor="questionLink" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Question Link
            </label>
            <input
              type="url"
              id="questionLink"
              value={formData.questionLink}
              onChange={(e) => setFormData({...formData, questionLink: e.target.value})}
              className="input w-full"
              placeholder="https://leetcode.com/problems/..."
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Problem Description *
          </label>
          <RichTextEditor
            value={formData.description}
            onChange={(value) => handleRichTextChange('description', value)}
          />
        </div>

        {/* Test Cases */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Test Cases
          </label>
          <div className="space-y-4">
            {formData.testCases.map((testCase, index) => (
              <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Test Case {index + 1}
                  </span>
                  {formData.testCases.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTestCase(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Input</label>
                    <textarea
                      value={testCase.input}
                      onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                      className="input w-full h-20 resize-none"
                      placeholder="[1,2,3,4]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Expected Output</label>
                    <textarea
                      value={testCase.output}
                      onChange={(e) => handleTestCaseChange(index, 'output', e.target.value)}
                      className="input w-full h-20 resize-none"
                      placeholder="10"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addTestCase}
              className="btn-secondary inline-flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Test Case</span>
            </button>
          </div>
        </div>

        {/* Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Solution Code
          </label>
          <CodeEditor
            value={formData.code}
            onChange={(value) => handleRichTextChange('code', value)}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notes/Hints
          </label>
          <RichTextEditor
            value={formData.notes}
            onChange={(value) => handleRichTextChange('notes', value)}
          />
        </div>

        {/* Difficulty and Reminder */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Difficulty Level
            </label>
            <div className="flex space-x-4">
              {['easy', 'medium', 'hard'].map((level) => (
                <label key={level} className="flex items-center">
                  <input
                    type="radio"
                    name="difficulty"
                    value={level}
                    checked={formData.difficulty === level}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 capitalize text-gray-700 dark:text-gray-300">
                    {level}
                  </span>
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <label htmlFor="reminder" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Remind me to revise in
            </label>
            <select
              id="reminder"
              name="reminder"
              value={formData.reminder}
              onChange={handleChange}
              className="input w-full"
            >
              <option value="7_days">7 Days</option>
              <option value="14_days">2 Weeks</option>
              <option value="30_days">1 Month</option>
              <option value="none">No Reminder</option>
            </select>
          </div>
        </div>
      </form>
    </div>
  );
};

export default QuestionForm;