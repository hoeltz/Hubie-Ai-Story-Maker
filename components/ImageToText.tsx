
import React, { useState, useCallback } from 'react';
import { generateTextFromImage, fileToGenerativePart } from '../services/geminiService';
import Spinner from './Spinner';
import { UploadIcon } from './icons/UploadIcon';
import { EyeIcon } from './icons/EyeIcon';

const ImageToText: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('Describe this image in detail.');
  const [generatedText, setGeneratedText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setGeneratedText('');
      setError(null);
    }
  };

  const handleGenerateText = useCallback(async () => {
    if (!imageFile) {
      setError('Please upload an image first.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedText('');
    try {
      const imagePart = await fileToGenerativePart(imageFile);
      const result = await generateTextFromImage(prompt, imagePart);
      setGeneratedText(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [imageFile, prompt]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-4">
          <EyeIcon className="w-6 h-6 text-indigo-400" />
          <h2 className="text-2xl font-semibold text-gray-100">Image to Text</h2>
      </div>
      <p className="text-gray-400 mb-6">Upload an image and get a detailed text description from the AI.</p>
      
      <div className="flex-grow grid md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
          <label htmlFor="image-upload" className="cursor-pointer">
            <div className="h-48 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-indigo-500 hover:text-indigo-400 transition-colors">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="h-full w-full object-contain rounded-lg" />
              ) : (
                <>
                  <UploadIcon className="w-10 h-10 mb-2" />
                  <span>Click to upload an image</span>
                </>
              )}
            </div>
          </label>
          <input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={isLoading} />
          
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Optional: Add a specific prompt (e.g., 'What is the main subject?')"
            className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-colors duration-200 resize-none"
            rows={3}
            disabled={isLoading}
          />
        </div>
        
        <div className="flex flex-col bg-gray-900 p-4 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold mb-2 text-gray-300">Generated Description</h3>
          {isLoading ? (
            <div className="flex-grow flex items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <div className="flex-grow overflow-y-auto pr-2 text-gray-300 whitespace-pre-wrap">
              {generatedText || 'AI-generated text will appear here...'}
            </div>
          )}
        </div>
      </div>
      
      {error && <div className="text-red-400 bg-red-900/50 p-3 rounded-lg mt-4">{error}</div>}

      <div className="mt-6">
        <button
          onClick={handleGenerateText}
          disabled={isLoading || !imageFile}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-900/50 disabled:cursor-not-allowed transition-colors duration-300"
        >
          {isLoading ? (
            <>
              <Spinner />
              Analyzing...
            </>
          ) : (
            'Generate Description'
          )}
        </button>
      </div>
    </div>
  );
};

export default ImageToText;
