import React from 'react';

const LoadingSpinner = ({ 
  size = 'md', 
  text = 'Loading...', 
  variant = 'default',
  className = '',
  showText = true,
  fullScreen = false
}) => {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
    '2xl': 'h-20 w-20'
  };

  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
    '2xl': 'text-xl'
  };

  const variants = {
    default: {
      spinner: 'border-gray-200 border-t-indigo-600 dark:border-gray-700 dark:border-t-indigo-400',
      container: 'bg-transparent',
      text: 'text-gray-600 dark:text-gray-400'
    },
    primary: {
      spinner: 'border-indigo-100 border-t-indigo-600 dark:border-indigo-900 dark:border-t-indigo-400',
      container: 'bg-indigo-50/50 dark:bg-indigo-900/10 backdrop-blur-sm rounded-2xl border border-indigo-100 dark:border-indigo-800',
      text: 'text-indigo-600 dark:text-indigo-400'
    },
    glass: {
      spinner: 'border-white/20 border-t-white shadow-lg',
      container: 'bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl',
      text: 'text-white/90'
    },
    minimal: {
      spinner: 'border-transparent border-t-current',
      container: 'bg-transparent',
      text: 'text-current'
    },
    gradient: {
      spinner: 'border-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500',
      container: 'bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 rounded-2xl border border-indigo-200 dark:border-indigo-800',
      text: 'text-gray-700 dark:text-gray-300'
    }
  };

  const currentVariant = variants[variant] || variants.default;

  const SpinnerComponent = () => {
    if (variant === 'gradient') {
      return (
        <div className={`${sizeClasses[size]} rounded-full p-1 animate-spin`}>
          <div className={`h-full w-full rounded-full ${currentVariant.spinner}`}></div>
        </div>
      );
    }

    return (
      <div className={`animate-spin rounded-full border-4 ${currentVariant.spinner} ${sizeClasses[size]}`}></div>
    );
  };

  const DotsSpinner = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${size === 'xs' ? 'w-1 h-1' : size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : size === 'lg' ? 'w-3 h-3' : 'w-4 h-4'} bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce`}
          style={{
            animationDelay: `${i * 0.1}s`,
            animationDuration: '0.6s'
          }}
        ></div>
      ))}
    </div>
  );

  const PulseSpinner = () => (
    <div className="relative">
      <div className={`${sizeClasses[size]} bg-indigo-600 dark:bg-indigo-400 rounded-full animate-ping opacity-75`}></div>
      <div className={`absolute inset-0 ${sizeClasses[size]} bg-indigo-600 dark:bg-indigo-400 rounded-full animate-pulse`}></div>
    </div>
  );

  const WaveSpinner = () => (
    <div className="flex items-end space-x-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`${size === 'xs' ? 'w-0.5' : size === 'sm' ? 'w-1' : size === 'md' ? 'w-1.5' : size === 'lg' ? 'w-2' : 'w-3'} bg-indigo-600 dark:bg-indigo-400 animate-pulse`}
          style={{
            height: `${12 + (i % 3) * 8}px`,
            animationDelay: `${i * 0.1}s`,
            animationDuration: '1s'
          }}
        ></div>
      ))}
    </div>
  );

  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return <DotsSpinner />;
      case 'pulse':
        return <PulseSpinner />;
      case 'wave':
        return <WaveSpinner />;
      default:
        return <SpinnerComponent />;
    }
  };

  const containerClasses = `
    flex flex-col items-center justify-center
    ${fullScreen ? 'fixed inset-0 z-50' : 'p-8'}
    ${currentVariant.container}
    ${className}
  `;

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center space-y-4">
        {/* Main spinner */}
        <div className="relative">
          {renderSpinner()}
          
          {/* Optional overlay animation */}
          {variant === 'primary' && (
            <div className={`absolute inset-0 ${sizeClasses[size]} rounded-full border-2 border-indigo-300 dark:border-indigo-600 animate-ping opacity-20`}></div>
          )}
        </div>
        
        {/* Loading text */}
        {showText && text && (
          <div className="text-center space-y-1">
            <p className={`font-medium ${textSizeClasses[size]} ${currentVariant.text}`}>
              {text}
            </p>
            {variant === 'primary' && (
              <div className="flex justify-center space-x-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1 h-1 bg-indigo-400 dark:bg-indigo-500 rounded-full animate-bounce"
                    style={{
                      animationDelay: `${i * 0.2}s`,
                      animationDuration: '1s'
                    }}
                  ></div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Background overlay for fullscreen */}
      {fullScreen && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm -z-10"></div>
      )}
    </div>
  );
};

// Specialized loading components
export const LoadingButton = ({ children, loading, ...props }) => (
  <button {...props} disabled={loading}>
    <div className="flex items-center space-x-2">
      {loading && <LoadingSpinner size="sm" variant="minimal" showText={false} />}
      <span>{children}</span>
    </div>
  </button>
);

export const LoadingCard = ({ children, loading, text = "Loading content..." }) => (
  <div className="relative">
    {children}
    {loading && (
      <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm flex items-center justify-center rounded-lg">
        <LoadingSpinner variant="primary" text={text} size="md" />
      </div>
    )}
  </div>
);

export const LoadingOverlay = ({ loading, text = "Processing..." }) => {
  if (!loading) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700">
        <LoadingSpinner variant="primary" text={text} size="lg" />
      </div>
    </div>
  );
};

export default LoadingSpinner;