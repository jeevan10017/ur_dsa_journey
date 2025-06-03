import React from 'react';

const Card = ({ 
  children, 
  className = '', 
  title, 
  titleSize = 'md',
  actions,
  hoverEffect = false
}) => {
  const titleClasses = {
    sm: 'text-lg font-medium',
    md: 'text-xl font-semibold',
    lg: 'text-2xl font-bold',
  };
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden ${
      hoverEffect ? 'hover:shadow-lg transition-shadow duration-300' : ''
    } ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          {title && <h3 className={`${titleClasses[titleSize]} text-gray-900 dark:text-white`}>{title}</h3>}
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};

export default Card;