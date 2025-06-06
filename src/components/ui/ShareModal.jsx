import React, { useState } from 'react';
import { createShare} from '../../services/firestore';
import { toast } from 'react-hot-toast';
import { X, Link, Lock, Mail, Eye, MessageSquare, Edit } from 'lucide-react';

const ShareModal = ({ questionId, onClose }) => {
  const [shareType, setShareType] = useState(null);
  const [email, setEmail] = useState('');
  const [accessLevel, setAccessLevel] = useState('view');
  const [createdShare, setCreatedShare] = useState(null);
  const [error, setError] = useState('');

const handleCreateShare = async () => {
    if (shareType === 'private' && !email) {
      setError('Email is required for private sharing');
      return;
    }

    try {
      const { id, error: shareError } = await createShare(questionId, {
        type: shareType,
        email,
        accessLevel
      });
      
      if (shareError) throw new Error(shareError);
      
      setCreatedShare({ id, type: shareType, email, accessLevel });
      toast.success('Share created successfully!');
    } catch (error) {
      setError(error.message || 'Sharing failed');
      toast.error(`Sharing failed: ${error.message}`);
    }
  };

  const copyToClipboard = () => {
    const link = `${window.location.origin}/shared/${createdShare.id}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Share Question
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
            <X className="h-6 w-6" />
          </button>
        </div>

        {!createdShare ? (
          <>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Choose how you want to share this question
            </p>

            <div className="space-y-4">
              <button
                onClick={() => setShareType('public')}
                className={`w-full flex items-center space-x-4 p-4 rounded-lg border ${
                  shareType === 'public'
                    ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                } transition-colors`}
              >
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                  <Link className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-left">
                  <h4 className="font-medium text-gray-900 dark:text-white">Public Link</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Anyone with the link can view
                  </p>
                </div>
              </button>

              <button
                onClick={() => setShareType('private')}
                className={`w-full flex items-center space-x-4 p-4 rounded-lg border ${
                  shareType === 'private'
                    ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                } transition-colors`}
              >
                <div className="bg-blue-100 dark:blue-900/30 p-3 rounded-full">
                  <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-left">
                  <h4 className="font-medium text-gray-900 dark:text-white">Private Link</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Only specific people can access
                  </p>
                </div>
              </button>
            </div>

            {shareType === 'private' && (
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Recipient Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 w-full px-4 py-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Access Level
                  </label>
                  <div className="grid grid-cols-3 gap-2  text-gray-700 dark:text-gray-400">
                    {[
                      { value: 'view', label: 'View', icon: Eye },
                      { value: 'comment', label: 'Comment', icon: MessageSquare },
                      { value: 'edit', label: 'Edit', icon: Edit }
                    ].map((level) => (
                      <button
                        key={level.value}
                        onClick={() => setAccessLevel(level.value)}
                        className={`flex flex-col items-center p-3 rounded-lg border ${
                          accessLevel === level.value
                            ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                            : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        } transition-colors`}
                      >
                        <level.icon className={`h-5 w-5 ${
                          accessLevel === level.value 
                            ? 'text-pink-600 dark:text-pink-400' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`} />
                        <span className="mt-1 text-sm">{level.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 text-red-500 dark:text-red-400 text-sm">{error}</div>
            )}

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateShare}
                disabled={!shareType || (shareType === 'private' && !email)}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg hover:from-pink-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50"
              >
                Create Link
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-2 text-green-600 dark:text-green-400 mb-1">
                {createdShare.type === 'public' ? (
                  <>
                    <Link className="h-5 w-5" />
                    <span className="font-medium">Public Link Created</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-5 w-5" />
                    <span className="font-medium">Private Link Created</span>
                  </>
                )}
              </div>
              
              {createdShare.type === 'private' && (
                <div className="mt-2">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Recipient:</span> {createdShare.email}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Access:</span> {createdShare.accessLevel}
                  </p>
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Shareable Link
              </label>
              <div className="flex">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/shared/${createdShare.id}`}
                  className="flex-1 px-4 py-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-l-lg"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-lg"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg hover:from-pink-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ShareModal;