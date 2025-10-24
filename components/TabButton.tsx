
import React from 'react';

interface TabButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ label, isActive, onClick }) => {
  const baseClasses =
    'px-4 py-2 text-sm md:px-6 md:py-2.5 md:text-base font-semibold rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900';
  const activeClasses = 'bg-indigo-600 text-white shadow-lg';
  const inactiveClasses = 'bg-gray-700 text-gray-300 hover:bg-gray-600';

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
    >
      {label}
    </button>
  );
};

export default TabButton;
