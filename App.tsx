import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import WorkflowManager from './components/WorkflowManager';
import ApiKeySelector from './components/ApiKeySelector';
import Spinner from './components/Spinner';

const App: React.FC = () => {
  const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'present' | 'missing'>('checking');
  const [isApiKeyError, setIsApiKeyError] = useState<boolean>(false);

  useEffect(() => {
    const checkApiKey = async () => {
      // Objek `window.aistudio` mungkin tidak tersedia secara langsung.
      // Penundaan singkat dapat membantu memastikan itu dimuat.
      setTimeout(async () => {
        if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          setApiKeyStatus(hasKey ? 'present' : 'missing');
        } else {
          // Jika aistudio tidak tersedia, asumsikan kunci ada melalui .env tradisional
          // dan biarkan SDK menangani kesalahan jika tidak ada.
          console.warn('aistudio.hasSelectedApiKey not found, assuming API key is present.');
          setApiKeyStatus('present');
        }
      }, 100);
    };
    checkApiKey();
  }, []);

  const handleKeySelected = () => {
    setApiKeyStatus('present');
    setIsApiKeyError(false);
  };

  const handleApiKeyError = () => {
    setApiKeyStatus('missing');
    setIsApiKeyError(true);
  };

  const renderContent = () => {
    switch (apiKeyStatus) {
      case 'checking':
        return (
          <div className="flex items-center justify-center min-h-[600px]">
            <Spinner className="w-10 h-10" />
          </div>
        );
      case 'missing':
        return (
          <ApiKeySelector
            onKeySelected={handleKeySelected}
            isErrorState={isApiKeyError}
          />
        );
      case 'present':
        return <WorkflowManager onApiKeyError={handleApiKeyError} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col">
      <Header />
      <main className="flex-grow flex flex-col items-center p-4 md:p-8">
        <div className="w-full max-w-5xl">
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-700 min-h-[600px]">
            {renderContent()}
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
