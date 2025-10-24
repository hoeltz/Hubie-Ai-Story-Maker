import React from 'react';
import { SparklesIcon } from './icons/SparklesIcon';

const Header: React.FC = () => {
  return (
    <header className="py-6 text-center">
      <div className="flex items-center justify-center gap-3">
        <SparklesIcon className="w-8 h-8 md:w-10 md:h-10 text-purple-400" />
        <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-500">
          Gemini Creative Suite
        </h1>
      </div>
      <p className="text-gray-400 mt-2">A collection of AI-powered tools to bring your ideas to life.</p>
    </header>
  );
};

export default Header;
