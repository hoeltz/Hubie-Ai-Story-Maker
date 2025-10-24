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
  const timerRef = useRef<number | null>(null);
  const progressRef = useRef<number | null>(null);

  const currentScene = scenes[currentSceneIndex];

  useEffect(() => {
    if (!currentScene) return;

    // Estimate duration based on word count (e.g., 2 words per second)
    const words = currentScene.narration.split(' ').length;
    const estimatedDuration = Math.max(3000, (words / 2) * 1000); // Minimum 3 seconds

    const advanceScene = () => {
      if (currentSceneIndex < scenes.length - 1) {
        setCurrentSceneIndex(currentSceneIndex + 1);
      } else {
        onClose();
      }
    };
    
    // Clear previous timers
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressRef.current) clearInterval(progressRef.current);

    setProgress(0);
    timerRef.current = window.setTimeout(advanceScene, estimatedDuration);

    // Progress bar animation
    const startTime = Date.now();
    progressRef.current = window.setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        const newProgress = Math.min(100, (elapsedTime / estimatedDuration) * 100);
        setProgress(newProgress);
        if (newProgress >= 100) {
            if (progressRef.current) clearInterval(progressRef.current);
        }
    }, 50);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };

  }, [currentSceneIndex, scenes, onClose]);
  
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
        <img
          key={currentScene.scene}
          // FIX: The 'GeneratedAsset' type does not have 'animationUrl'. Use 'imageUrl' instead.
          src={currentScene.imageUrl || ''}
          className="w-full h-full object-contain"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-4 md:p-6 text-center">
          <p className="text-sm md:text-lg">{currentScene.narration}</p>
           {/* Progress Bar */}
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
    </div>
  );
};

export default AnimationPlayer;