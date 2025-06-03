import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AuthGuard from './components/auth/AuthGuard';
import Header from './components/common/Header';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './pages/Dashboard';
import AddQuestion from './pages/AddQuestion';
import QuestionDetail from './components/question/QuestionDetail';
import Profile from './pages/Profile';
import './styles/globals.css';
import Home from './pages/Home';
import { QuestionProvider } from './contexts/QuestionContext';


function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QuestionProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--toast-bg)',
                  color: 'var(--toast-color)',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#ffffff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#ffffff',
                  },
                },
              }}
            />
            
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected Routes */}
              <Route
                path="/*"
                element={
                  <AuthGuard>
                    <Header />
                    <main className="pt-16">
                      <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/add-question" element={<AddQuestion />} />
                        <Route path="/question/:id" element={<QuestionDetail />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                      </Routes>
                    </main>
                  </AuthGuard>
                }
              />
            </Routes>
          </div>
        </Router>
        </QuestionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;