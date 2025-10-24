import React, { useState } from 'react';
import TabButton from './TabButton';
import StoryGenerator from './StoryGenerator';
import ImageToText from './ImageToText';
import TextToVoice from './TextToVoice';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { EyeIcon } from './icons/EyeIcon';
import { VolumeIcon } from './icons/VolumeIcon';

type Tab = 'story' | 'image' | 'voice';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'story', label: 'Story Generator', icon: <BookOpenIcon className="w-5 h-5"/> },
    { id: 'image', label: 'Image to Text', icon: <EyeIcon className="w-5 h-5" /> },
    { id: 'voice', label: 'Text to Voice', icon: <VolumeIcon className="w-5 h-5" /> },
];

const WorkflowManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('story');

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'story':
        return <StoryGenerator />;
      case 'image':
        return <ImageToText />;
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