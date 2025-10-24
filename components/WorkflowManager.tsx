
import React, { useState, useEffect } from 'react';
import TabButton from './TabButton';
import StoryGenerator from './StoryGenerator';
import ImageToText from './ImageToText';
import TextToVoice from './TextToVoice';
// FIX: Import ImageToVideo, ApiKeySelector, and VideoIcon to integrate the new feature.
import ImageToVideo from './ImageToVideo';
import ApiKeySelector from './ApiKeySelector';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { EyeIcon } from './icons/EyeIcon';
import { VolumeIcon } from './icons/VolumeIcon';
import { VideoIcon } from './icons/VideoIcon';

// FIX: Add 'video' to the Tab type definition.
type Tab = 'story' | 'image' | 'voice' | 'video';

// FIX: Add the new 'Image to Video' tab configuration.
const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'story', label: 'Story Generator', icon: <BookOpenIcon className="w-5 h-5"/> },
    { id: 'image', label: 'Image to Text', icon: <EyeIcon className="w-5 h-5" /> },
    { id: 'voice', label: 'Text to Voice', icon: <VolumeIcon className="w-5 h-5" /> },
    { id: 'video', label: 'Image to Video', icon: <VideoIcon className="w-5 h-5" /> },
];

// Add type definition for aistudio to avoid TypeScript errors.
declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    }
  }
}

const WorkflowManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('story');
  // FIX: Add state to manage the API key requirement for the video feature.
  const [hasApiKeyForVideo, setHasApiKeyForVideo] = useState<boolean>(false);
  const [apiKeyError, setApiKeyError] = useState<boolean>(false);

  // FIX: Add an effect to check for the API key when the video tab is selected.
  useEffect(() => {
    const checkApiKey = async () => {
        if (activeTab === 'video') {
            if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
                setHasApiKeyForVideo(true);
                setApiKeyError(false); // Reset error state on successful check
            } else {
                setHasApiKeyForVideo(false);
            }
        }
    };
    checkApiKey();
  }, [activeTab]);
  
  const handleKeySelected = () => {
    // Assume selection was successful. A failed API call will trigger the error state.
    setHasApiKeyForVideo(true);
    setApiKeyError(false);
  };
  
  const handleApiKeyError = () => {
    setHasApiKeyForVideo(false);
    setApiKeyError(true);
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'story':
        return <StoryGenerator />;
      case 'image':
        return <ImageToText />;
      case 'voice':
        return <TextToVoice />;
      // FIX: Add rendering logic for the new video tab, including the API key check.
      case 'video':
        if (!hasApiKeyForVideo) {
          return <ApiKeySelector onKeySelected={handleKeySelected} isErrorState={apiKeyError} />;
        }
        return <ImageToVideo onApiKeyError={handleApiKeyError} />;
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="mb-8 flex justify-center items-center flex-wrap gap-2 md:gap-4 p-2 bg-gray-900/50 rounded-full border border-gray-700">
        {TABS.map(tab => (
          <TabButton
            key={tab.id}
            label={tab.label}
            icon={tab.icon}
            isActive={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          />
        ))}
      </div>
      <div className="min-h-[500px]">
        {renderActiveTab()}
      </div>
    </div>
  );
};

export default WorkflowManager;
