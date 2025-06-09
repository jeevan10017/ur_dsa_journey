import { useState } from 'react';

const DSADriveLogo = ({ Link }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link 
      to="/dashboard" 
      className="flex items-center space-x-3 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo Icon */}
      <div className="relative p-3 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl shadow-lg group-hover:shadow-2xl group-hover:shadow-blue-500/20 transition-all duration-500 group-hover:scale-105 border border-blue-500/30">
        {/* Animated border glow */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-sm"></div>
        <div className="absolute inset-[1px] rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
        
        {/* Code brackets with enhanced glow */}
        <div className="relative flex items-center justify-center z-10">
          <span className={`text-2xl font-bold font-mono text-blue-400 transition-all duration-300 ${
            isHovered ? 'text-blue-300 drop-shadow-[0_0_12px_rgba(16,185,129,0.9)] scale-110' : 'drop-shadow-[0_0_4px_rgba(16,185,129,0.5)]'
          }`}>
            &lt;
          </span>
          <span className={`text-xl font-bold font-mono mx-1 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent transition-all duration-300 ${
            isHovered ? 'from-blue-300 to-cyan-300 scale-110' : ''
          }`}>
            /
          </span>
          <span className={`text-2xl font-bold font-mono text-blue-400 transition-all duration-300 ${
            isHovered ? 'text-blue-300 drop-shadow-[0_0_12px_rgba(16,185,129,0.9)] scale-110' : 'drop-shadow-[0_0_4px_rgba(16,185,129,0.5)]'
          }`}>
            &gt;
          </span>
        </div>

        {/* Floating code elements */}
        <div className="absolute -top-1 -right-1 text-[8px] text-blue-400/60 font-mono animate-pulse">
          O(n)
        </div>
        <div className="absolute -bottom-1 -left-1 text-[8px] text-blue-400/60 font-mono animate-pulse" style={{ animationDelay: '0.5s' }}>
          []
        </div>
        <div className="absolute -bottom-1 right-1 transform -translate-y-1/2 text-[8px] text-blue-400/40 font-mono animate-pulse" style={{ animationDelay: '1s' }}>
          G1
        </div>
      </div>

      {/* Text Content */}
      <div className="hidden sm:block">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:to-blue-400 dark:group-hover:from-blue-400 dark:group-hover:to-blue-200 transition-all duration-500 font-bold tracking-wide">
            DSA DRIVE
          </h1>
          
          {/* Algorithm visualization dots */}
          <div className="flex space-x-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full bg-blue-400 transition-all duration-300 ${
                  isHovered 
                    ? 'animate-pulse opacity-100 scale-125' 
                    : 'opacity-40 scale-100'
                }`}
                style={{ 
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: '1.5s'
                }}
              />
            ))}
          </div>
        </div>
        
        <div className="flex items-center space-x-1 mt-0.5">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium font-sans group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
            Track & Master Algorithms
          </p>
          {/* Subtle code cursor animation */}
          <span className={`text-xs text-blue-400 font-mono transition-opacity duration-300 ${
            isHovered ? 'opacity-100 animate-pulse' : 'opacity-0'
          }`}>
            |
          </span>
        </div>
      </div>
    </Link>
  );
};

export default DSADriveLogo;