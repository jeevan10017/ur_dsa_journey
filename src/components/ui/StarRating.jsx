import React from 'react';
import { Star } from 'lucide-react';

const StarRating = ({ 
  rating, 
  maxRating = 5,
  size = 'md',
  className = '',
  onRatingChange,
  editable = false
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };
  
  const handleClick = (index) => {
    if (editable && onRatingChange) {
      onRatingChange(index + 1);
    }
  };
  
  return (
    <div className={`flex ${className}`}>
      {[...Array(maxRating)].map((_, index) => (
        <button
          key={index}
          type="button"
          onClick={() => handleClick(index)}
          disabled={!editable}
          className={`${
            editable ? 'cursor-pointer' : 'cursor-default'
          } focus:outline-none`}
        >
          <Star
            className={`${
              index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'
            } ${sizeClasses[size]}`}
          />
        </button>
      ))}
    </div>
  );
};

export default StarRating;