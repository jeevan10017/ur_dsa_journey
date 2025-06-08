import React from 'react';
import { 
  User, Edit, MessageSquare, Clock, History, 
  ArrowRight, Quote, FileText
} from 'lucide-react';

const HistorySection = ({ history }) => {
  const getActionIcon = (action) => {
    switch(action) {
      case 'edit': return <Edit className="h-4 w-4" />;
      case 'comment': return <MessageSquare className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getActionColor = (action) => {
    switch(action) {
      case 'edit': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
      case 'comment': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.seconds 
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);
    
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 168) { // 7 days
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getUserInitials = (email) => {
    if (!email) return '?';
    const parts = email.split('@')[0].split('.');
    return parts.map(part => part[0]?.toUpperCase()).join('').slice(0, 2);
  };

  if (!history || history.length === 0) {
    return (
      <div className="mt-8 text-center py-12">
        <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No activity yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Comments and edits will appear here as they happen.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex items-center space-x-3 mb-6">
        <History className="h-6 w-6 text-gray-700 dark:text-gray-300" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Activity History
        </h2>
        <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-600"></div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {history.length} {history.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>
      
      <div className="space-y-4">
        {history.map((item, index) => (
          <div 
            key={index} 
            className="group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
          >
            {/* Timeline connector */}
            {index < history.length - 1 && (
              <div className="absolute left-12 top-16 w-px h-8 bg-gradient-to-b from-gray-300 to-transparent dark:from-gray-600 z-10"></div>
            )}
            
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {/* Action badge */}
                  <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium ${getActionColor(item.action)}`}>
                    {getActionIcon(item.action)}
                    <span className="capitalize">{item.action}</span>
                  </div>
                  
                  {/* User info */}
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                      {getUserInitials(item.userEmail)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.userEmail}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Timestamp */}
                <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span>{formatTimestamp(item.timestamp)}</span>
                </div>
              </div>
              
              {/* Content */}
              <div className="ml-11">
                {item.action === 'edit' && item.changes && (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Made {item.changes.length} {item.changes.length === 1 ? 'change' : 'changes'}:
                    </div>
                    {item.changes.map((change, idx) => (
                      <div key={idx} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                            {change.field}
                          </span>
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                        </div>
                        
                        <div className="space-y-2">
                          {change.oldValue && (
                            <div className="relative">
                              <div className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Before:</div>
                              <div className="text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 p-3 rounded border-l-4 border-red-400 line-through opacity-75">
                                {change.oldValue.length > 100 
                                  ? `${change.oldValue.substring(0, 100)}...` 
                                  : change.oldValue
                                }
                              </div>
                            </div>
                          )}
                          
                          {change.newValue && (
                            <div className="relative">
                              <div className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">After:</div>
                              <div className="text-sm text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 p-3 rounded border-l-4 border-green-400">
                                {change.newValue.length > 100 
                                  ? `${change.newValue.substring(0, 100)}...` 
                                  : change.newValue
                                }
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {item.action === 'comment' && (
                  <div className="relative">
                    <Quote className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 pl-10 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                        {item.comment}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistorySection;