import React from 'react';
import { Link } from 'react-router-dom';
import { Code, BarChart, BookOpen, Clock, Send } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-6">
          Track Your <span className="text-gradient">DSA Journey</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-10">
          Never forget a solution again. Organize, revise, and master Data Structures & Algorithms with personalized reminders.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            to="/register"
            className="btn-primary inline-flex items-center justify-center px-6 py-3 text-base font-medium"
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className="btn-secondary inline-flex items-center justify-center px-6 py-3 text-base font-medium"
          >
            Sign In
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Features to Boost Your Learning
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Everything you need to track and master DSA problems efficiently.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: <Code className="h-12 w-12 text-indigo-600" />,
              title: 'Problem Tracking',
              description: 'Record and organize all your solved DSA problems with detailed notes and code solutions.'
            },
            {
              icon: <BookOpen className="h-12 w-12 text-indigo-600" />,
              title: 'Rich Notes',
              description: 'Add hints, insights, and explanations using our rich text editor with code formatting.'
            },
            {
              icon: <Clock className="h-12 w-12 text-indigo-600" />,
              title: 'Spaced Repetition',
              description: 'Schedule reminders to revisit problems at optimal intervals for long-term retention.'
            },
            {
              icon: <BarChart className="h-12 w-12 text-indigo-600" />,
              title: 'Progress Analytics',
              description: 'Visualize your progress with statistics on solved problems by difficulty and category.'
            },
            {
              icon: <Send className="h-12 w-12 text-indigo-600" />,
              title: 'Email Reminders',
              description: 'Get email notifications when its time to revise a problem, with direct links to the question.'
            }

          ].map((feature, index) => (
            <div key={index} className="card p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-indigo-600 dark:bg-indigo-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Master DSA?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Join thousands of developers who are improving their problem-solving skills with DSA Journey Tracker.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50"
          >
            Start Your Journey Today
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;