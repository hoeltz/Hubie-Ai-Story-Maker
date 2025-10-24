import React from 'react';
import Header from './components/Header';
import WorkflowManager from './components/WorkflowManager';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col">
      <Header />
      <main className="flex-grow flex flex-col items-center p-4 md:p-8">
        <div className="w-full max-w-5xl">
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-700 min-h-[600px]">
            <WorkflowManager />
          </div>
        </div>
      </main>
      <footer className="text-center p-4 text-gray-500 text-sm">
        <p>Powered by Gemini AI</p>
      </footer>
    </div>
  );
};

export default App;