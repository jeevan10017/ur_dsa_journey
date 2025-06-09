import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { logout } from '../../services/auth';
import DSADriveLogo from './DSADriveLogo';
import {
  Menu,
  X,
  Home,
  Plus,
  User,
  LogOut,
  Moon,
  Sun,
  Code,
  BookOpen,
  Bell,
  Search,
  Settings,
  TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';

const Header = () => {
  const { user } = useAuth();
  const { effectiveTheme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();


const adminEmails = import.meta.env.VITE_ADMIN_EMAILS?.split(',') || [];
  
  const isAdmin = adminEmails.includes(user?.email);
  
  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    const { error } = await logout();
    if (error) {
      toast.error(error);
    } else {
      toast.success('Logged out successfully');
      navigate('/login');
    }
    setShowUserMenu(false);
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, description: 'Overview & Stats' },
    { name: 'Add Question', href: '/add-question', icon: Plus, description: 'New Challenge' },
    { name: 'Profile', href: '/profile', icon: User, description: 'Your Account' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg border-b border-gray-200/50 dark:border-gray-700/50' 
          : 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-sm border-b border-gray-200/30 dark:border-gray-700/30'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center h-16">
           <DSADriveLogo Link={Link} />
           {/* <img src="/logo.png" alt="" className='h-32 w-36'/> */}

            {/* Enhanced Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group relative flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 shadow-sm'
                        : 'text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <Icon className={`h-4 w-4 transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-105'}`} />
                    <span>{item.name}</span>
                    {active && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full"></div>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Enhanced Right side actions */}
            <div className="flex items-center space-x-3">

              {/* Notifications */}
              <button className="hidden lg:flex relative p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200 hover:scale-105">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="h-1.5 w-1.5 bg-white rounded-full"></span>
                </span>
              </button>

                {isAdmin && (
        <Link
          to="/admin/suggestions"
          className="px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text:gray-700 dark:text-gray-300 flex items-center space-x-2"
        >
          Admin
        </Link>
      )}

              {/* Enhanced Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200 hover:scale-105"
                aria-label="Toggle theme"
              >
                <div className="relative">
                  {effectiveTheme === 'dark' ? (
                    <Sun className="h-5 w-5 animate-pulse" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </div>
              </button>

              {/* Enhanced User menu */}
              <div className="hidden md:flex relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-950 rounded-xl "
                >
                  <div className="relative">
                    <img
                      src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || user?.email || 'User')}&background=6366f1&color=ffffff`}
                      alt="Profile"
                      className="h-8 w-8 rounded-full border-2 border-gray-200 dark:border-gray-600 shadow-sm"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {user?.displayName || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user?.email}
                    </p>
                  </div>
                </button>

                {/* User dropdown menu */}
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-10">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user?.displayName || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user?.email}
                      </p>
                    </div>
                    <Link
                      to="/profile"
                      className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="h-4 w-4" />
                      <span>Profile Settings</span>
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign out</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Enhanced Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200"
                >
                  <div className="relative">
                    {isMenuOpen ? (
                      <X className="h-6 w-6 rotate-90 transition-transform duration-300" />
                    ) : (
                      <Menu className="h-6 w-6 transition-transform duration-300" />
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 animate-slideDown">
            <div className="px-4 pt-4 pb-3 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center justify-between p-3 rounded-xl text-base font-medium transition-all duration-200 ${
                      isActive(item.href)
                        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 shadow-sm'
                        : 'text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5" />
                      <div>
                        <span className="block">{item.name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{item.description}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            
            <div className="pt-4 pb-3 border-t border-gray-200/50 dark:border-gray-700/50 mx-4">
              <div className="flex items-center px-3 py-3 space-x-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="relative">
                  <img
                    src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || user?.email || 'User')}&background=6366f1&color=ffffff`}
                    alt="Profile"
                    className="h-12 w-12 rounded-full border-2 border-gray-200 dark:border-gray-600 shadow-sm"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                </div>
                <div className="flex-1">
                  <p className="text-base font-medium text-gray-900 dark:text-white">
                    {user?.displayName || 'User'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {user?.email}
                  </p>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-3 w-full px-3 py-3 rounded-xl text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
      
      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        ></div>
      )}
    </>
  );
};

export default Header;