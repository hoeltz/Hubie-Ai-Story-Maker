import React, { useState, useEffect } from 'react';
import { generateVideoFromImage, fileToGenerativePart } from '../services/geminiService';
import Spinner from './Spinner';
import { UploadIcon } from './icons/UploadIcon';
import { VideoIcon } from './icons/VideoIcon';

const POLLING_MESSAGES = [
  "Warming up the digital director's chair...",
  "The AI is storyboarding your scene...",
  "Rendering pixels into motion...",
  "Applying digital cinematography...",
  "This can take a few minutes. Great art needs patience!",
  "Finalizing the edits...",
  "Almost there, adding the final touches..."
];

interface ImageToVideoProps {
  onApiKeyError: () => void;
}

const ImageToVideo: React.FC<ImageToVideoProps> = ({ onApiKeyError }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('Animate this image with subtle motion, like a gentle breeze.');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pollingMessage, setPollingMessage] = useState(POLLING_MESSAGES[0]);

  useEffect(() => {
    let interval: number;
    if (isLoading) {
      interval = window.setInterval(() => {
        setPollingMessage(prev => {
          const currentIndex = POLLING_MESSAGES.indexOf(prev);
          const nextIndex = (currentIndex + 1) % POLLING_MESSAGES.length;
          return POLLING_MESSAGES[nextIndex];
        });
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setVideoUrl(null);
      setError(null);
    }
  };

  const handleGenerateVideo = async () => {
    if (!imageFile) {
      setError('Please upload an image first.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setVideoUrl(null);
    setPollingMessage(POLLING_MESSAGES[0]);
    try {
      const imagePart = await fileToGenerativePart(imageFile);
      const resultUrl = await generateVideoFromImage(prompt, imagePart);
      setVideoUrl(resultUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      // Jika kita mendapatkan kesalahan kunci/proyek tertentu, panggil callback untuk menampilkan pemilih global
      if (errorMessage.includes("Requested entity was not found")) {
        onApiKeyError();
      } else {
        setError(errorMessage);
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-4">
        <VideoIcon className="w-6 h-6 text-indigo-400" />
        <h2 className="text-2xl font-semibold text-gray-100">Image to Video</h2>
      </div>
      <p className="text-gray-400 mb-6">Bring your static images to life by generating captivating videos.</p>
      
      <div className="flex-grow grid md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
          <label htmlFor="video-image-upload" className="cursor-pointer">
            <div className="h-48 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-indigo-500 hover:text-indigo-400 transition-colors">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="h-full w-full object-contain rounded-lg" />
              ) : (
                <>
                  <UploadIcon className="w-10 h-10 mb-2" />
                  <span>Upload a starting image</span>
                </>
              )}
            </div>
          </label>
          <input id="video-image-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={isLoading} />
          
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the video you want to create..."
            className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-colors duration-200 resize-none"
            rows={3}
            disabled={isLoading}
          />
        </div>
        
        <div className="flex flex-col items-center justify-center bg-gray-900 rounded-lg border border-gray-700 min-h-[250px] p-4">
          {isLoading ? (
            <div className="text-center">
              <Spinner />
              <p className="mt-4 text-indigo-300">{pollingMessage}</p>
            </div>
          ) : videoUrl ? (
            <video controls src={videoUrl} className="w-full h-auto max-h-full rounded-lg">
              Your browser does not support the video tag.
            </video>
          ) : (
            <p className="text-gray-500">Your generated video will appear here.</p>
          )}
        </div>
      </div>
      
      {error && <div className="text-red-400 bg-red-900/50 p-3 rounded-lg mt-4">{error}</div>}

      <div className="mt-6">
        <button
          onClick={handleGenerateVideo}
          disabled={isLoading || !imageFile || !prompt}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-900/50 disabled:cursor-not-allowed transition-colors duration-300"
        >
          {isLoading ? (
            'Generating Video...'
          ) : (
            'Generate Video'
          )}
        </button>
      </div>
    </div>
  );
};

export default ImageToVideo;
