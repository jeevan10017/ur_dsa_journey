import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Code, Clock, CheckCircle, XCircle, Zap, Trophy, Calendar, TrendingUp, Target, Activity } from 'lucide-react';

const LeetcodeStats = ({ leetcodeUsername }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!leetcodeUsername) return;
    
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch(`https://leetcodeprofile-api.vercel.app/${leetcodeUsername}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch LeetCode stats');
        }
        
        const data = await response.json();
        setStats(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching LeetCode stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [leetcodeUsername]);

  if (!leetcodeUsername) {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-8 mt-6">
        <div className="flex flex-col items-center justify-center text-center py-8 cursor-pointer" onClick={() => window.location.href = '/profile'}>
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <Code className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Connect Your LeetCode Profile
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm">
            Add your LeetCode username in your profile settings to see detailed coding statistics and progress tracking.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-8 mt-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-blue-200 dark:border-blue-800 rounded-full"></div>
              <div className="absolute top-0 left-0 w-12 h-12 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
            </div>
            <span className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading LeetCode stats...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-2xl shadow-lg border border-red-200/50 dark:border-red-700/50 p-8 mt-6">
        <div className="flex flex-col items-center justify-center text-center py-8">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center mb-4">
            <XCircle className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Unable to Load Stats
          </h3>
          <p className="text-red-600 dark:text-red-400">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // Prepare data for the bar chart
  const difficultyData = [
    { 
      name: 'Easy', 
      solved: stats.easySolved, 
      total: stats.totalEasy,
      percentage: Math.round((stats.easySolved / stats.totalEasy) * 100),
      color: '#10B981'
    },
    { 
      name: 'Medium', 
      solved: stats.mediumSolved, 
      total: stats.totalMedium,
      percentage: Math.round((stats.mediumSolved / stats.totalMedium) * 100),
      color: '#F59E0B'
    },
    { 
      name: 'Hard', 
      solved: stats.hardSolved, 
      total: stats.totalHard,
      percentage: Math.round((stats.hardSolved / stats.totalHard) * 100),
      color: '#EF4444'
    }
  ];

  // Prepare data for pie chart
  const pieData = [
    { name: 'Easy', value: stats.easySolved, color: '#10B981' },
    { name: 'Medium', value: stats.mediumSolved, color: '#F59E0B' },
    { name: 'Hard', value: stats.hardSolved, color: '#EF4444' }
  ];

  // Get recent submissions (max 5)
  const recentSubmissions = stats.recentSubmissions.slice(0, 3);

  // Calculate success rate
  const totalSubmissions = stats.totalSubmissions?.[0]?.submissions || 0;
  const successRate = totalSubmissions > 0 ? Math.round((stats.totalSolved / totalSubmissions) * 100) : 0;

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6 mt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
            <Code className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              LeetCode Statistics
            </h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">@{leetcodeUsername}</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="hidden sm:flex items-center space-x-2 bg-white/50 dark:bg-gray-800/50 rounded-lg px-3 py-2">
          <Activity className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Active Profile
          </span>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm p-4 rounded-xl border border-white/20 dark:border-gray-700/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalSolved}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Total Solved</div>
            </div>
            <Target className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm p-4 rounded-xl border border-white/20 dark:border-gray-700/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {successRate}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Success Rate</div>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm p-4 rounded-xl border border-white/20 dark:border-gray-700/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                #{stats.ranking?.toLocaleString() || 'N/A'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Global Rank</div>
            </div>
            <Trophy className="h-8 w-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm p-4 rounded-xl border border-white/20 dark:border-gray-700/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {stats.contributionPoint || 0}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Contribution</div>
            </div>
            <Zap className="h-8 w-8 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Recent Activity and Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-gray-700/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Recent Activity
            </h3>
            
            <div className="space-y-3">
              {recentSubmissions.map((submission, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-700/50 rounded-lg border border-gray-200/30 dark:border-gray-600/30 hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all duration-200"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {submission.title}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1 space-x-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200">
                        {submission.lang}
                      </span>
                      <span>•</span>
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(submission.timestamp * 1000).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div 
                    className={`flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
                      submission.statusDisplay === 'Accepted' 
                        ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700' 
                        : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-700'
                    }`}
                  >
                    {submission.statusDisplay === 'Accepted' ? (
                      <CheckCircle className="h-3 w-3 mr-1.5" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1.5" />
                    )}
                    {submission.statusDisplay}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Pie Chart */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-white/20 dark:border-gray-700/20">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Distribution</h4>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [value, 'Problems']}
                    contentStyle={{
                      backgroundColor: 'rgba(17, 24, 39, 0.95)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-lg text-center">
              <div className="text-lg font-bold text-green-700 dark:text-green-400">
                {stats.easySolved}
              </div>
              <div className="text-xs text-green-600 dark:text-green-300">Easy</div>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-lg text-center">
              <div className="text-lg font-bold text-yellow-700 dark:text-yellow-400">
                {stats.mediumSolved}
              </div>
              <div className="text-xs text-yellow-600 dark:text-yellow-300">Medium</div>
            </div>
            
            <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded-lg text-center">
              <div className="text-lg font-bold text-red-700 dark:text-red-400">
                {stats.hardSolved}
              </div>
              <div className="text-xs text-red-600 dark:text-red-300">Hard</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeetcodeStats;