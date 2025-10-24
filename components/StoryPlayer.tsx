import React, { useState, useEffect, useRef } from 'react';
import { GeneratedAsset } from '../types';
import { CloseIcon } from './icons/CloseIcon';

interface AnimationPlayerProps {
  scenes: GeneratedAsset[];
  onClose: () => void;
}

const AnimationPlayer: React.FC<AnimationPlayerProps> = ({ scenes, onClose }) => {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<number | null>(null);

  const currentScene = scenes[currentSceneIndex];

  useEffect(() => {
    if (!currentScene || !audioRef.current) return;

    const audio = audioRef.current;

    const advanceScene = () => {
      if (currentSceneIndex < scenes.length - 1) {
        setCurrentSceneIndex(prevIndex => prevIndex + 1);
      } else {
        onClose();
      }
    };

    const startPlayback = () => {
      setProgress(0);
      audio.play().catch(e => {
        console.error("Audio play failed:", e);
        // If autoplay fails, use a fallback timer based on text length
        const words = currentScene.narration.split(' ').length;
        const estimatedDuration = Math.max(5000, (words / 2) * 1000);
        setTimeout(advanceScene, estimatedDuration);
      });

      // Progress bar animation based on audio duration
      const duration = audio.duration * 1000;
      if (isFinite(duration)) {
        if (progressRef.current) clearInterval(progressRef.current);
        const startTime = Date.now();
        progressRef.current = window.setInterval(() => {
            const elapsedTime = Date.now() - startTime;
            const newProgress = Math.min(100, (elapsedTime / duration) * 100);
            setProgress(newProgress);
            if (newProgress >= 100) {
                if (progressRef.current) clearInterval(progressRef.current);
            }
        }, 50);
      }
    };

    // Set up event listeners
    audio.addEventListener('ended', advanceScene);
    audio.addEventListener('loadedmetadata', startPlayback);
    
    // Trigger loading of the new audio source
    audio.load();

    return () => {
      audio.removeEventListener('ended', advanceScene);
      audio.removeEventListener('loadedmetadata', startPlayback);
      if (progressRef.current) clearInterval(progressRef.current);
      audio.pause();
    };
  }, [currentSceneIndex, scenes, onClose, currentScene]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!currentScene) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="relative w-full max-w-4xl aspect-video bg-black rounded-lg shadow-2xl overflow-hidden">
        {/* Hidden audio element to control playback */}
        <audio ref={audioRef} src={currentScene.audioUrl || ''} preload="auto" />
        <img
          key={currentScene.scene}
          src={currentScene.imageUrl || ''}
          className="w-full h-full object-contain animate-fade-in"
          style={{ animation: 'fade-in 0.5s ease-in-out' }}
        />
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-4 md:p-6 text-center">
          <p className="text-sm md:text-lg">{currentScene.narration}</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div className="h-full bg-purple-500" style={{ width: `${progress}%`, transition: 'width 0.05s linear' }}></div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-75 transition-colors"
          aria-label="Close player"
        >
          <CloseIcon className="w-6 h-6" />
        </button>
        <div className="absolute top-2 left-2 p-2 bg-black bg-opacity-50 rounded-full text-white text-sm">
          Scene {currentSceneIndex + 1} / {scenes.length}
        </div>
      </div>
       <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default AnimationPlayer;