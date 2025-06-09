import React from 'react';
import { Github, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="w-full py-4 px-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 transition-colors duration-200">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <span>Created by Jeevan Kumar Korra</span>
        <div className="flex items-center gap-3">
          <a 
            href="https://github.com/jeevan10017" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <Github size={16} />
            <span>GitHub</span>
          </a>
          <a 
            href="https://linkedin.com/in/jkkorra" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <Linkedin size={16} />
            <span>LinkedIn</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;