
import React from 'react';

interface ApiKeySelectorProps {
  onKeySelected: () => void;
  isErrorState: boolean;
}

const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onKeySelected, isErrorState }) => {
  const handleSelectKey = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      onKeySelected();
    } else {
      alert("API key selection utility is not available.");
    }
  };

  const renderInitialPrompt = () => (
    <>
      <h3 className="text-2xl font-bold text-yellow-400 mb-4">API Key Required</h3>
      <p className="text-gray-300 max-w-lg mb-2">
        To use the powerful video generation feature, you need to provide your own Google AI API key.
      </p>
      <p className="text-gray-400 max-w-lg mb-6 text-sm">
        Don't worry, Google provides a generous <strong className="text-gray-300">free tier</strong> for you to get started and experiment. You will only be billed if your usage exceeds the free limits.
      </p>
      <button
        onClick={handleSelectKey}
        className="bg-yellow-500 text-gray-900 font-bold py-3 px-6 rounded-lg hover:bg-yellow-600 transition-colors duration-300"
      >
        Select Your API Key
      </button>
    </>
  );

  const renderErrorPrompt = () => (
    <>
      <h3 className="text-2xl font-bold text-red-400 mb-4">Project Setup Incomplete</h3>
      <p className="text-gray-300 max-w-xl mb-6">
        The API key you selected is valid, but the Google Cloud project it belongs to needs configuration. This is the most common issue, but it's easy to fix!
      </p>
      <div className="text-left max-w-md mx-auto bg-gray-900/50 p-4 rounded-lg border border-gray-700 space-y-4">
          <div>
              <p className="font-bold text-gray-200">1. Enable Billing</p>
              <p className="text-sm text-gray-400">Your project must have a billing account attached, even to use the free tier. This verifies your identity.</p>
              <a href="https://console.cloud.google.com/billing" target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-400 hover:underline">Go to Google Cloud Billing &rarr;</a>
          </div>
           <div>
              <p className="font-bold text-gray-200">2. Enable the API</p>
              <p className="text-sm text-gray-400">Ensure the "Generative Language API" is enabled for your project.</p>
              <a href="https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com" target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-400 hover:underline">Enable the API &rarr;</a>
          </div>
      </div>
      <p className="text-xs text-gray-500 max-w-md mx-auto mt-4">After confirming both steps, try selecting your key again.</p>
       <button
        onClick={handleSelectKey}
        className="mt-6 bg-yellow-500 text-gray-900 font-bold py-3 px-6 rounded-lg hover:bg-yellow-600 transition-colors duration-300"
      >
        I've fixed it, let me select my key
      </button>
    </>
  );

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
      {isErrorState ? renderErrorPrompt() : renderInitialPrompt()}
    </div>
  );
};

export default ApiKeySelector;