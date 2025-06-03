import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuestionContext } from '../../contexts/QuestionContext';
import RichTextEditor from './RichTextEditor';
import CodeEditor from './CodeEditor';
import NotesSection from './NotesSection';
import { ChevronLeft, Edit, Trash2, Star, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { deleteQuestion } from '../../services/firestore';

const QuestionView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { questions, deleteQuestion: deleteContextQuestion } = useQuestionContext();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showNotes, setShowNotes] = useState(true);
  
  const question = questions.find(q => q.id === id);
  
  if (!question) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <div className="bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 p-4 rounded-lg">
          <p>Question not found</p>
        </div>
      </div>
    );
  }
  
  const difficultyColors = {
    easy: 'success',
    medium: 'warning',
    hard: 'danger',
  };
  
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  const handleDelete = async () => {
    const { error } = await deleteQuestion(id);
    if (error) {
      toast.error('Failed to delete question');
    } else {
      toast.success('Question deleted successfully');
      deleteContextQuestion(id);
      navigate('/dashboard');
    }
    setShowDeleteModal(false);
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Button
          onClick={() => navigate(-1)}
          variant="secondary"
          icon={ChevronLeft}
        >
          Back
        </Button>
      </div>
      
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {question.title}
          </h1>
          <div className="flex items-center space-x-4 mt-2">
            <Badge variant={difficultyColors[question.difficulty]}>
              {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
            </Badge>
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <Clock className="h-4 w-4 mr-1" />
              <span className="text-sm">Updated {formatDate(question.updatedAt)}</span>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => navigate(`/edit-question/${id}`)}
            variant="secondary"
            icon={Edit}
          >
            Edit
          </Button>
          <Button
            onClick={() => setShowDeleteModal(true)}
            variant="danger"
            icon={Trash2}
          >
            Delete
          </Button>
        </div>
      </div>
      
      <NotesSection 
        notes={question.notes} 
        isOpen={showNotes}
        onToggle={() => setShowNotes(!showNotes)}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Problem Statement
            </h2>
            <div 
              className="prose dark:prose-invert max-w-none bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
              dangerouslySetInnerHTML={{ __html: question.description }}
            />
          </div>
          
          {question.testCases && question.testCases.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Test Cases
              </h2>
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <ul className="space-y-2">
                  {question.testCases.map((testCase, index) => (
                    <li key={index} className="flex">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Case {index + 1}:</span>
                      <pre className="ml-2 text-gray-600 dark:text-gray-400 overflow-x-auto">{testCase}</pre>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
        
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Solution Code
          </h2>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
            <CodeEditor 
              value={question.code} 
              readOnly={true}
            />
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Question"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete this question? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              onClick={() => setShowDeleteModal(false)}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              variant="danger"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default QuestionView;