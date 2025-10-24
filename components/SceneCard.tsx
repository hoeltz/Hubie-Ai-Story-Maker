import React, { useState, useRef, useEffect } from 'react';
import { GeneratedAsset } from '../types';
import Spinner from './Spinner';
import { DownloadIcon } from './icons/DownloadIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { StopIcon } from './icons/StopIcon';
import { PencilIcon } from './icons/PencilIcon';
import { CheckIcon } from './icons/CheckIcon';
import { generateImagePromptFromNarration } from '../services/geminiService';

type GenerationStatus = 'pending' | 'generating'| 'done' | 'error';
interface GenerationProgress {
    image: GenerationStatus;
    audio: GenerationStatus;
}
interface SceneCardProps {
  asset: GeneratedAsset;
  isEditing: boolean;
  voiceOption: 'ai' | 'user';
  generationProgress?: GenerationProgress;
  onAudioRecorded: (audioUrl: string) => void;
  onToggleEdit: () => void;
  onUpdateScene: (sceneId: number, newNarration: string, newImagePrompt: string) => void;
}

const SceneCard: React.FC<SceneCardProps> = ({ asset, isEditing, voiceOption, generationProgress, onAudioRecorded, onToggleEdit, onUpdateScene }) => {
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Local state for editing
  const [editedNarration, setEditedNarration] = useState(asset.narration);
  const [editedImagePrompt, setEditedImagePrompt] = useState(asset.imagePrompt);
  const [isSuggesting, setIsSuggesting] = useState(false);

  useEffect(() => {
    // Reset local state if the asset changes (e.g., when editing is cancelled)
    setEditedNarration(asset.narration);
    setEditedImagePrompt(asset.imagePrompt);
  }, [asset, isEditing]);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setIsDownloadMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleStartRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.ondataavailable = (event) => {
            audioChunksRef.current.push(event.data);
        };
        mediaRecorderRef.current.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);
            onAudioRecorded(audioUrl);
            audioChunksRef.current = [];
            stream.getTracks().forEach(track => track.stop());
        };
        audioChunksRef.current = [];
        mediaRecorderRef.current.start();
        setIsRecording(true);
    } catch (err) {
        console.error("Error accessing microphone:", err);
        alert("Could not access microphone. Please ensure you have given permission in your browser settings.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
    }
  };
  
  const handleSuggestPrompt = async () => {
    setIsSuggesting(true);
    try {
        const newPrompt = await generateImagePromptFromNarration(editedNarration);
        setEditedImagePrompt(newPrompt);
    } catch (e) {
        console.error("Failed to suggest prompt", e);
        // Optionally show an error to the user
    } finally {
        setIsSuggesting(false);
    }
  }
  
  const renderMedia = () => {
    const isImageLoading = generationProgress?.image === 'generating' || generationProgress?.image === 'pending';
    
    if (isImageLoading) {
      return <div className="w-full h-full flex flex-col items-center justify-center text-center text-gray-400 p-4"><Spinner /> <p className="mt-2">Generating Image...</p></div>;
    }
    
    if (asset.imageUrl) {
      return <img src={asset.imageUrl} alt={`Scene ${asset.scene}`} className="w-full h-full object-cover" />;
    }
    
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center text-gray-400 p-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>Image generation failed</p>
      </div>
    );
  };

  const renderAudioContent = () => {
    const isAudioLoading = generationProgress?.audio === 'generating' || generationProgress?.audio === 'pending';

    if (isAudioLoading) {
        return <div className="text-center text-sm p-2 bg-gray-700/50 rounded flex justify-center items-center gap-2"><Spinner className="w-4 h-4" /> Generating Audio...</div>;
    }
    
    if (asset.audioUrl) {
        return (
            <audio controls src={asset.audioUrl} className="w-full h-10">
                Your browser does not support the audio element.
            </audio>
        );
    }
    
    if (voiceOption === 'user') {
        return isRecording ? (
            <button
                onClick={handleStopRecording}
                className="w-full flex items-center justify-center gap-2 bg-red-600 text-white text-sm font-bold py-2 px-3 rounded-lg hover:bg-red-700"
            >
                <StopIcon className="w-4 h-4" /> Stop Recording
            </button>
        ) : (
            <button
                onClick={handleStartRecording}
                disabled={!asset.imageUrl}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white text-sm font-bold py-2 px-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
                <MicrophoneIcon className="w-4 h-4" /> Record Narration
            </button>
        );
    }
    
    return (
        <div className="text-center text-red-400 text-sm p-2 bg-red-900/50 rounded">
            Audio generation failed.
        </div>
    );
  }

  const renderViewMode = () => (
    <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden shadow-lg flex flex-col h-full">
      <div className="w-full h-48 bg-gray-900 flex items-center justify-center relative">
        {renderMedia()}
        <div className="absolute top-2 right-2 flex gap-2">
            <button
                onClick={onToggleEdit}
                className="p-2 bg-black/50 hover:bg-black/75 rounded-full transition-colors"
                aria-label="Edit scene"
            >
                <PencilIcon className="w-5 h-5 text-white" />
            </button>
            <div className="relative" ref={downloadMenuRef}>
            <button
                onClick={() => setIsDownloadMenuOpen(prev => !prev)}
                className="p-2 bg-black/50 hover:bg-black/75 rounded-full transition-colors"
                aria-label="Download options"
            >
                <DownloadIcon className="w-5 h-5 text-white" />
            </button>
            {isDownloadMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg z-10">
                    <ul className="py-1 text-sm text-gray-200">
                        <li>
                            <a href={asset.imageUrl || '#'} download={asset.imageUrl ? `scene_${asset.scene}_image.png` : undefined} onClick={() => setIsDownloadMenuOpen(false)} className={`flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-600 ${!asset.imageUrl ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                Image (.png)
                            </a>
                        </li>
                        <li>
                            <a href={asset.audioUrl || '#'} download={asset.audioUrl ? `scene_${asset.scene}_audio.wav` : undefined} onClick={() => setIsDownloadMenuOpen(false)} className={`flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-600 ${!asset.audioUrl ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                Audio (.wav)
                            </a>
                        </li>
                    </ul>
                </div>
            )}
        </div>
        </div>
      </div>
      <div className="p-4 flex-grow flex flex-col">
        <h3 className="font-bold text-indigo-400 mb-2">Scene {asset.scene}</h3>
        <p className="text-gray-300 text-sm flex-grow mb-4">{asset.narration}</p>
        
        {renderAudioContent()}
      </div>
    </div>
  );

  const renderEditMode = () => (
    <div className="bg-indigo-900/30 border-2 border-indigo-500 rounded-lg overflow-hidden shadow-lg flex flex-col h-full p-4 space-y-3">
        <h3 className="font-bold text-indigo-300">Editing Scene {asset.scene}</h3>
        
        <div>
            <label className="text-sm font-semibold text-gray-300 block mb-1">Narration</label>
            <textarea 
                value={editedNarration}
                onChange={(e) => setEditedNarration(e.target.value)}
                className="w-full p-2 text-sm bg-gray-900 border border-gray-600 rounded-md resize-y focus:ring-2 focus:ring-indigo-500"
                rows={4}
            />
        </div>
        
        <div>
            <label className="text-sm font-semibold text-gray-300 block mb-1">Image Prompt</label>
             <button onClick={handleSuggestPrompt} disabled={isSuggesting} className="w-full text-xs flex items-center justify-center gap-1 mb-2 bg-gray-600 hover:bg-gray-500 rounded p-1">
                {isSuggesting ? <><Spinner className="w-3 h-3"/> Suggesting...</> : 'Suggest Prompt from Narration'}
            </button>
            <textarea 
                value={editedImagePrompt}
                onChange={(e) => setEditedImagePrompt(e.target.value)}
                className="w-full p-2 text-xs bg-gray-900 border border-gray-600 rounded-md resize-y focus:ring-2 focus:ring-indigo-500"
                rows={5}
            />
        </div>

        <div className="flex gap-3 mt-auto pt-2">
            <button onClick={onToggleEdit} className="w-full bg-gray-600 text-sm font-bold py-2 px-3 rounded-lg hover:bg-gray-700">
                Cancel
            </button>
            <button 
                onClick={() => onUpdateScene(asset.scene, editedNarration, editedImagePrompt)}
                className="w-full flex items-center justify-center gap-2 bg-green-600 text-sm font-bold py-2 px-3 rounded-lg hover:bg-green-700">
                <CheckIcon className="w-4 h-4" /> Save & Regenerate
            </button>
        </div>
    </div>
  );

  return isEditing ? renderEditMode() : renderViewMode();
};

export default SceneCard;