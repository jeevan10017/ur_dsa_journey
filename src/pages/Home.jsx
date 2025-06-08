import React from 'react';
import { Link } from 'react-router-dom';
import { Code, BarChart, BookOpen, Clock, Send, Users, Sparkles, ArrowRight, Star } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 relative overflow-hidden">
      {/* Background decorations */}
     <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=&quot;60&quot; height=&quot;60&quot; viewBox=&quot;0 0 60 60&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cg fill=&quot;none&quot; fill-rule=&quot;evenodd&quot;%3E%3Cg fill=&quot;%236366f1&quot; fill-opacity=&quot;0.05&quot;%3E%3Cpath d=&quot;M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z&quot;/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>

      
      {/* Floating elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute top-40 right-20 w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full opacity-20 animate-bounce"></div>
      <div className="absolute bottom-20 left-20 w-12 h-12 bg-gradient-to-r from-pink-400 to-red-500 rounded-full opacity-20 animate-pulse"></div>

      {/* Hero Section */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-full border border-indigo-200/30 dark:border-indigo-700/30 mb-8">
          <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400 mr-2" />
          <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
            Revolutionize Your DSA Learning
          </span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-indigo-600 to-purple-600 dark:from-white dark:via-indigo-400 dark:to-purple-400 mb-6 leading-tight">
          Master DSA with
          <br />
          {/* <span className="relative"> */}
            Smart Tracking
            <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
          {/* </span> */}
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto mb-12 leading-relaxed">
          Transform your coding journey with AI-powered reminders, collaborative challenges, and personalized learning paths that adapt to your progress.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-6 mb-12">
          <Link
            to="/register"
            className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative flex items-center">
              Start Your Journey
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
            </span>
          </Link>
          
          <Link
            to="/login"
            className="group inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-indigo-600 dark:text-indigo-400 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-indigo-200 dark:border-indigo-700 rounded-2xl hover:bg-indigo-50 dark:hover:bg-gray-700 transition-all duration-300"
          >
            Sign In
          </Link>
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center space-x-8 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-8 h-8 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full border-2 border-white dark:border-gray-800"></div>
              ))}
            </div>
            <span className="ml-3">10,000+ Developers</span>
          </div>
          <div className="flex items-center">
            <Star className="h-4 w-4 text-yellow-400 mr-1" />
            <span>4.9/5 Rating</span>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Supercharge Your
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600"> Learning</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Advanced features designed to accelerate your DSA mastery and make learning collaborative and fun.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: <Code className="h-12 w-12" />,
              title: 'Smart Problem Tracking',
              description: 'AI-powered organization of your solved problems with intelligent categorization and progress insights.',
              gradient: 'from-blue-500 to-cyan-500',
              bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20'
            },
            {
              icon: <BookOpen className="h-12 w-12" />,
              title: 'Rich Code Editor',
              description: 'Advanced markdown editor with syntax highlighting, LaTeX support, and collaborative editing.',
              gradient: 'from-green-500 to-emerald-500',
              bgGradient: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20'
            },
            {
              icon: <Clock className="h-12 w-12" />,
              title: 'Adaptive Spaced Repetition',
              description: 'Machine learning algorithms optimize review schedules based on your retention patterns.',
              gradient: 'from-purple-500 to-pink-500',
              bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20'
            },
            {
              icon: <BarChart className="h-12 w-12" />,
              title: 'Advanced Analytics',
              description: 'Comprehensive insights with performance trends, weak areas identification, and improvement suggestions.',
              gradient: 'from-orange-500 to-red-500',
              bgGradient: 'from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20'
            },
            {
              icon: <Send className="h-12 w-12" />,
              title: 'Smart Notifications',
              description: 'Multi-channel reminders via email, push notifications, and in-app alerts with contextual hints.',
              gradient: 'from-indigo-500 to-blue-500',
              bgGradient: 'from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20'
            },
            {
              icon: <Users className="h-12 w-12" />,
              title: 'Group Problem Solving',
              description: 'Create and join study groups, share challenging problems, and solve them collaboratively with peers.',
              gradient: 'from-teal-500 to-green-500',
              bgGradient: 'from-teal-50 to-green-50 dark:from-teal-900/20 dark:to-green-900/20',
              isNew: true
            }
          ].map((feature, index) => (
            <div key={index} className={`group relative p-8 bg-gradient-to-br ${feature.bgGradient} backdrop-blur-sm border border-white/20 dark:border-gray-700/30 rounded-3xl hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 hover:-translate-y-2`}>
              {feature.isNew && (
                <div className="absolute -top-3 -right-3 px-3 py-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold rounded-full shadow-lg">
                  NEW
                </div>
              )}
              
              <div className={`inline-flex p-4 bg-gradient-to-r ${feature.gradient} rounded-2xl shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <div className="text-white">
                  {feature.icon}
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 transition-all duration-300">
                {feature.title}
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {feature.description}
              </p>
              
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-800 dark:via-purple-800 dark:to-pink-800 py-20 overflow-hidden">
       <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=&quot;20&quot; height=&quot;20&quot; viewBox=&quot;0 0 20 20&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cg fill=&quot;%23ffffff&quot; fill-opacity=&quot;0.1&quot;%3E%3Cpath d=&quot;M0 0h20v20H0V0zm10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14zm0-2a5 5 0 1 1 0-10 5 5 0 0 1 0 10z&quot;/%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>

        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Join the Elite Coders
          </h2>
          <p className="text-xl text-indigo-100 mb-10 max-w-3xl mx-auto leading-relaxed">
            Transform your problem-solving skills and land your dream job. Join thousands of developers who've accelerated their careers with our platform.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link
              to="/register"
              className="group inline-flex items-center justify-center px-10 py-5 text-lg font-bold text-indigo-600 bg-white rounded-2xl hover:bg-gray-50 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              <span className="mr-2">Start Free Trial</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            
            <button className="inline-flex items-center justify-center px-10 py-5 text-lg font-bold text-white border-2 border-white/30 rounded-2xl hover:bg-white/10 backdrop-blur-sm transition-all duration-300">
              Watch Demo
            </button>
          </div>
          
          <div className="mt-12 text-sm text-indigo-100">
            No credit card required • 14-day free trial • Cancel anytime
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;