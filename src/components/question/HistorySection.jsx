import React from 'react';
import { 
  User, Edit, MessageSquare, Clock 
} from 'lucide-react';

const HistorySection = ({ history }) => {
  const getActionIcon = (action) => {
    switch(action) {
      case 'edit': return <Edit className="h-4 w-4 mr-2" />;
      case 'comment': return <MessageSquare className="h-4 w-4 mr-2" />;
      default: return <Edit className="h-4 w-4 mr-2" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.seconds 
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="mt-10">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        History
      </h2>
      
      <div className="space-y-4">
        {history.map((item, index) => (
          <div 
            key={index} 
            className="bg-gray-50  text-gray-900 dark:text-gray-400 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center mb-2">
              {getActionIcon(item.action)}
              <span className="font-medium capitalize">{item.action}</span>
              <span className="mx-2">•</span>
              <User className="h-4 w-4 mr-1" />
              <span>{item.userEmail}</span>
              <span className="mx-2">•</span>
              <Clock className="h-4 w-4 mr-1" />
              <span>{formatTimestamp(item.timestamp)}</span>
            </div>
            
            {item.action === 'edit' && (
              <div className="mt-2">
                {item.changes.map((change, idx) => (
                  <div key={idx} className="text-sm mb-1">
                    <span className="font-medium">{change.field}:</span>
                    <div className="ml-2">
                      <div className="text-red-500 line-through">
                        {change.oldValue || 'Empty'}
                      </div>
                      <div className="text-green-500">
                        {change.newValue || 'Empty'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {item.action === 'comment' && (
              <div className="mt-2 p-3 bg-white dark:bg-gray-700 rounded">
                {item.comment}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistorySection;