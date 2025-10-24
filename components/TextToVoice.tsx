
import React, { useState } from 'react';
import { generateSpeech, AVAILABLE_VOICES } from '../services/geminiService';
import Spinner from './Spinner';
import { PlayIcon } from './icons/PlayIcon';
import { VolumeIcon } from './icons/VolumeIcon';


const TextToVoice: React.FC = () => {
  const [text, setText] = useState<string>('Hello! I am an AI assistant powered by Gemini. Type something here and I will say it for you.');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string>(AVAILABLE_VOICES[0].id);

  const handleGenerateSpeech = async () => {
    if (!text.trim()) {
      setError('Please enter some text to generate speech.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setAudioUrl(null);
    try {
      // FIX: Pass the selected voice as the second argument to generateSpeech.
      const audioUrlResult = await generateSpeech(text, selectedVoice);
      setAudioUrl(audioUrlResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-4">
        <VolumeIcon className="w-6 h-6 text-indigo-400" />
        <h2 className="text-2xl font-semibold text-gray-100">Text to Voice</h2>
      </div>
      <p className="text-gray-400 mb-6">Convert your written text into natural-sounding speech.</p>
      
      <div className="flex-grow flex flex-col gap-6">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text here..."
          className="w-full flex-grow p-4 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 resize-none min-h-[150px]"
          disabled={isLoading}
        />

        <div>
            <label htmlFor="voice-select" className="block text-sm font-medium text-gray-400 mb-2">Select a Voice:</label>
            <select
                id="voice-select"
                value={selectedVoice}
                onChange={e => setSelectedVoice(e.target.value)}
                className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500"
                disabled={isLoading}
            >
                {AVAILABLE_VOICES.map(voice => (
                    <option key={voice.id} value={voice.id}>{voice.name}</option>
                ))}
            </select>
        </div>
        
        {error && <div className="text-red-400 bg-red-900/50 p-3 rounded-lg">{error}</div>}
        
        {audioUrl && (
          <div className="bg-gray-700 p-4 rounded-lg">
            <audio controls src={audioUrl} className="w-full">
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
      </div>

      <div className="mt-6">
        <button
          onClick={handleGenerateSpeech}
          disabled={isLoading || !text}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-900/50 disabled:cursor-not-allowed transition-colors duration-300"
        >
          {isLoading ? (
            <>
              <Spinner />
              Generating...
            </>
          ) : (
            <>
              <PlayIcon className="w-5 h-5" />
              Generate Speech
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default TextToVoice;