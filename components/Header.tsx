import React from 'react';
import { HLogoIcon } from './icons/HLogoIcon';

const Header: React.FC = () => {
  return (
    <header className="py-6 text-center">
      <div className="flex items-center justify-center gap-3">
        <HLogoIcon className="w-8 h-8 md:w-10 md:h-10 text-purple-400" />
        <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-500">
          Hubie Kreative
        </h1>
      </div>
      <p className="text-gray-400 mt-2">Your AI-powered partner for bringing ideas to life.</p>
    </header>
  );
};

export default Header;