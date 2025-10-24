import React, { useState, useEffect } from 'react';
import TabButton from './TabButton';
import StoryGenerator from './StoryGenerator';
import ImageToText from './ImageToText';
import TextToVoice from './TextToVoice';
import ImageToVideo from './ImageToVideo';
import ApiKeySelector from './ApiKeySelector';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { EyeIcon } from './icons/EyeIcon';
import { VolumeIcon } from './icons/VolumeIcon';
import { VideoIcon } from './icons/VideoIcon';

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

type Tab = 'story' | 'image' | 'video' | 'voice';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'story', label: 'Story Generator', icon: <BookOpenIcon className="w-5 h-5"/> },
    { id: 'image', label: 'Image to Text', icon: <EyeIcon className="w-5 h-5" /> },
    { id: 'video', label: 'Image to Video', icon: <VideoIcon className="w-5 h-5" /> },
    { id: 'voice', label: 'Text to Voice', icon: <VolumeIcon className="w-5 h-5" /> },
];

const WorkflowManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('story');

  // State for video feature's API key requirement
  const [videoTabNeedsKey, setVideoTabNeedsKey] = useState(false);
  const [isApiKeyError, setIsApiKeyError] = useState(false);

  useEffect(() => {
    const checkApiKeyRequirement = async () => {
      if (activeTab === 'video') {
        if (window.aistudio?.hasSelectedApiKey) {
          try {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            setVideoTabNeedsKey(!hasKey);
            if (hasKey) {
              setIsApiKeyError(false); // Reset error state if key exists
            }
          } catch (e) {
            console.error("Error checking for API key:", e);
            setVideoTabNeedsKey(true);
          }
        } else {
          // If aistudio is not available, video generation will fail, so prompt for key.
          setVideoTabNeedsKey(true);
        }
      } else {
        setVideoTabNeedsKey(false);
      }
    };
    checkApiKeyRequirement();
  }, [activeTab]);

  const handleKeySelected = () => {
    setVideoTabNeedsKey(false);
    setIsApiKeyError(false);
  };
  
  const handleApiKeyError = () => {
    setVideoTabNeedsKey(true);
    setIsApiKeyError(true);
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'story':
        return <StoryGenerator />;
      case 'image':
        return <ImageToText />;
      case 'video':
        if (videoTabNeedsKey) {
            return <ApiKeySelector onKeySelected={handleKeySelected} isErrorState={isApiKeyError} />;
        }
        return <ImageToVideo onApiKeyError={handleApiKeyError} />;
      case 'voice':
        return <TextToVoice />;
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