import { useState, useEffect } from 'react';

const DSADriveLoader = ({ onLoadingComplete }) => {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    // Show text after initial animation
    const textTimer = setTimeout(() => setShowText(true), 800);
    
    // Simulate loading progress
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsAnimating(false);
            if (onLoadingComplete) {
              setTimeout(onLoadingComplete, 500);
            }
          }, 500);
          return 100;
        }
        return prev + Math.random() * 3 + 1;
      });
    }, 100);

    return () => {
      clearInterval(interval);
      clearTimeout(textTimer);
    };
  }, [onLoadingComplete]);

  return (
    <div className={`fixed inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center z-50 transition-opacity duration-500 ${
      !isAnimating ? 'opacity-0 pointer-events-none' : 'opacity-100'
    }`}>
      {/* Background animated grid */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(90deg, #3b82f6 1px, transparent 1px),
            linear-gradient(#3b82f6 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'grid-move 20s linear infinite'
        }}></div>
      </div>

      <div className="text-center relative">
        {/* Main Logo Container */}
        <div className="relative mb-8 flex justify-center">
          {/* Logo Icon with enhanced animations */}
          <div className="relative p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 rounded-2xl shadow-2xl border border-blue-500/30 animate-pulse-glow">
            {/* Animated border glow with rotating effect */}
            {/* <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 opacity-30 blur-sm animate-spin-slow"></div> */}
            <div className="absolute inset-[2px] rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800"></div>
            
            {/* Pulsing ring effect */}
            <div className="absolute inset-0 rounded-2xl border-2 border-blue-400/50 animate-ping"></div>
            
            {/* Code brackets with breathing animation */}
            <div className="relative flex items-center justify-center z-10">
              <span className="text-4xl font-bold font-mono text-blue-400 drop-shadow-[0_0_20px_rgba(59,130,246,0.8)] animate-breath">
                &lt;
              </span>
              <span className="text-3xl font-bold font-mono mx-2 bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent animate-gradient-x">
                /
              </span>
              <span className="text-4xl font-bold font-mono text-blue-400 drop-shadow-[0_0_20px_rgba(59,130,246,0.8)] animate-breath" style={{ animationDelay: '0.5s' }}>
                &gt;
              </span>
            </div>

            {/* Floating code elements with complex animations */}
            <div className="absolute -top-2 -right-2 text-sm text-blue-400/80 font-mono animate-float">
              O(n)
            </div>
            <div className="absolute -bottom-2 -left-2 text-sm text-cyan-400/80 font-mono animate-float" style={{ animationDelay: '0.8s' }}>
              []
            </div>
            <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 text-sm text-purple-400/80 font-mono animate-float" style={{ animationDelay: '1.5s' }}>
              {}
            </div>
            <div className="absolute top-1/4 -left-2 text-sm text-emerald-400/80 font-mono animate-float" style={{ animationDelay: '2s' }}>
              ()
            </div>
          </div>
        </div>

        {/* Text Content with staggered animation */}
        <div className={`transition-all duration-1000 ${showText ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}>
          <div className="flex items-center justify-center space-x-3 mb-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-600 to-gray-700 dark:from-white dark:via-blue-400 dark:to-gray-300 bg-clip-text text-transparent animate-gradient-x tracking-wide">
              DSA DRIVE
            </h1>
            
            {/* Algorithm visualization dots with wave animation */}
            <div className="flex space-x-1.5">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 animate-wave"
                  style={{ 
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: '2s'
                  }}
                />
              ))}
            </div>
          </div>
          
          <p className="text-lg text-gray-600 dark:text-gray-400 font-medium mb-8 animate-fade-in">
            Track & Master Algorithms
          </p>
        </div>

        {/* Loading Progress Bar */}
        <div className="w-80 max-w-full mx-auto">
          <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-purple-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${loadingProgress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
          </div>
          
          {/* Loading percentage */}
          <div className="text-center">
            <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
              {Math.round(loadingProgress)}% loaded
            </span>
          </div>
        </div>

        {/* Loading dots */}
        <div className="flex justify-center space-x-2 mt-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes grid-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
          50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.6); }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes breath {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-8px) rotate(2deg); }
          66% { transform: translateY(4px) rotate(-2deg); }
        }
        
        @keyframes wave {
          0%, 100% { transform: scaleY(1); opacity: 0.7; }
          50% { transform: scaleY(1.5); opacity: 1; }
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 4s linear infinite;
        }
        
        .animate-breath {
          animation: breath 3s ease-in-out infinite;
        }
        
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-wave {
          animation: wave 2s ease-in-out infinite;
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out 1.2s both;
        }
        
        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default DSADriveLoader;