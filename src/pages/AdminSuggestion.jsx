import React, { useState, useEffect } from 'react';
import { getSuggestions, updateSuggestionStatus } from '../services/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Bug, Lightbulb, Check, X, RefreshCw, Eye, EyeOff, Sun, Moon } from 'lucide-react';

const AdminSuggestions = () => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedDescriptions, setExpandedDescriptions] = useState(new Set());
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check for saved theme preference or default to system preference
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

 const adminEmails = import.meta.env.VITE_ADMIN_EMAILS?.split(',') || [];

  const isAdmin = adminEmails.includes(user?.email);

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    if (isAdmin) {
      fetchSuggestions();
    }
  }, [isAdmin]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const { suggestions, error } = await getSuggestions();
      if (error) throw new Error(error);
      setSuggestions(suggestions);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const { error } = await updateSuggestionStatus(id, status);
      if (error) throw new Error(error);
      setSuggestions(prev => prev.map(s => 
        s.id === id ? { ...s, status } : s
      ));
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleDescription = (id) => {
    const newExpanded = new Set(expandedDescriptions);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedDescriptions(newExpanded);
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const getStatusBadgeClasses = (status) => {
    const baseClasses = 'px-3 py-1 rounded-full text-xs font-medium capitalize';
    switch (status) {
      case 'open':
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`;
      case 'in-progress':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`;
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200`;
    }
  };

  const filteredSuggestions = statusFilter === 'all' 
    ? suggestions 
    : suggestions.filter(s => s.status === statusFilter);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-8 rounded-xl max-w-md text-center shadow-lg">
            <div className="mb-4">
              <X size={48} className="mx-auto text-red-500" />
            </div>
            <h2 className="text-xl font-bold mb-3">Access Denied</h2>
            <p className="text-red-600 dark:text-red-300">You don't have permission to view this page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Suggestions Management
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
            <button 
              onClick={fetchSuggestions}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center disabled:opacity-50 transition-colors shadow-sm"
            >
              <RefreshCw size={18} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-4 rounded-lg mb-6 shadow-sm">
            <div className="flex items-center">
              <X size={20} className="mr-2 text-red-500" />
              {error}
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading suggestions...</p>
            </div>
          </div>
        ) : filteredSuggestions.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="mb-4">
              <Lightbulb size={48} className="mx-auto text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-xl font-medium text-gray-900 dark:text-white mb-2">No suggestions found</p>
            <p className="text-gray-500 dark:text-gray-400">
              {statusFilter === 'all' ? 'No suggestions have been submitted yet.' : `No ${statusFilter} suggestions found.`}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Type</th>
                    <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Title</th>
                    <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Description</th>
                    <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">User</th>
                    <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Date</th>
                    <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredSuggestions.map((suggestion) => (
                    <tr key={suggestion.id} className=" transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          {suggestion.type === 'bug' ? (
                            <Bug size={18} className="text-red-500 mr-2" />
                          ) : (
                            <Lightbulb size={18} className="text-yellow-500 mr-2" />
                          )}
                          <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                            {suggestion.type}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm font-medium text-gray-900 dark:text-white max-w-xs">
                          {suggestion.title}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="max-w-sm">
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {expandedDescriptions.has(suggestion.id) 
                              ? suggestion.description 
                              : truncateText(suggestion.description, 80)}
                          </p>
                          {suggestion.description && suggestion.description.length > 80 && (
                            <button
                              onClick={() => toggleDescription(suggestion.id)}
                              className="mt-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center transition-colors"
                            >
                              {expandedDescriptions.has(suggestion.id) ? (
                                <>
                                  <EyeOff size={12} className="mr-1" />
                                  Show less
                                </>
                              ) : (
                                <>
                                  <Eye size={12} className="mr-1" />
                                  Show more
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900 dark:text-white">{suggestion.userEmail}</div>
                          <div className="text-gray-500 dark:text-gray-400 text-xs">
                            {suggestion.userAgent?.split(' ')[0] || 'Unknown browser'}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {suggestion.createdAt?.toDate 
                            ? suggestion.createdAt.toDate().toLocaleDateString() 
                            : 'N/A'}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={getStatusBadgeClasses(suggestion.status)}>
                          {suggestion.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex space-x-2">
                          {suggestion.status !== 'completed' && (
                            <button
                              onClick={() => handleStatusChange(suggestion.id, 'completed')}
                              className="p-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                              title="Mark as completed"
                            >
                              <Check size={16} />
                            </button>
                          )}
                          {suggestion.status !== 'rejected' && (
                            <button
                              onClick={() => handleStatusChange(suggestion.id, 'rejected')}
                              className="p-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                              title="Reject"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden">
              {filteredSuggestions.map((suggestion) => (
                <div key={suggestion.id} className="p-6 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      {suggestion.type === 'bug' ? (
                        <Bug size={18} className="text-red-500 mr-2" />
                      ) : (
                        <Lightbulb size={18} className="text-yellow-500 mr-2" />
                      )}
                      <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                        {suggestion.type}
                      </span>
                    </div>
                    <span className={getStatusBadgeClasses(suggestion.status)}>
                      {suggestion.status}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {suggestion.title}
                  </h3>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {expandedDescriptions.has(suggestion.id) 
                        ? suggestion.description 
                        : truncateText(suggestion.description, 120)}
                    </p>
                    {suggestion.description && suggestion.description.length > 120 && (
                      <button
                        onClick={() => toggleDescription(suggestion.id)}
                        className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center transition-colors"
                      >
                        {expandedDescriptions.has(suggestion.id) ? (
                          <>
                            <EyeOff size={12} className="mr-1" />
                            Show less
                          </>
                        ) : (
                          <>
                            <Eye size={12} className="mr-1" />
                            Show more
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{suggestion.userEmail}</div>
                      <div className="text-xs">{suggestion.userAgent?.split(' ')[0] || 'Unknown browser'}</div>
                    </div>
                    <div>
                      {suggestion.createdAt?.toDate 
                        ? suggestion.createdAt.toDate().toLocaleDateString() 
                        : 'N/A'}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {suggestion.status !== 'completed' && (
                      <button
                        onClick={() => handleStatusChange(suggestion.id, 'completed')}
                        className="flex-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 py-2 px-4 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors text-sm font-medium"
                      >
                        <Check size={16} className="inline mr-2" />
                        Complete
                      </button>
                    )}
                    {suggestion.status !== 'rejected' && (
                      <button
                        onClick={() => handleStatusChange(suggestion.id, 'rejected')}
                        className="flex-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 py-2 px-4 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium"
                      >
                        <X size={16} className="inline mr-2" />
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSuggestions;