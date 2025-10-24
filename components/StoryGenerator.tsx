import React, { useState } from 'react';
import { generateProjectPlan, generateImage, generateSpeech, continueProjectPlan, generateConclusion, AVAILABLE_VOICES } from '../services/geminiService';
import Spinner from './Spinner';
import SceneCard from './SceneCard';
import StoryPlayer from './StoryPlayer';
import { SparklesIcon } from './icons/SparklesIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { PlayIcon } from './icons/PlayIcon';
import { ProjectPlan, GeneratedAsset, Scene } from '../types';

declare const JSZip: any;

// --- TYPE DEFINITIONS ---
type WorkflowState = 'IDLE' | 'PLANNING' | 'CONFIRMATION' | 'GENERATING' | 'DONE';
type GenerationStatus = 'pending' | 'generating'| 'done' | 'error';
type VoiceOption = 'ai' | 'user';

interface GenerationProgress {
    [sceneNumber: number]: {
        image: GenerationStatus;
        audio: GenerationStatus;
    };
}

const StoryGenerator: React.FC = () => {
  const [workflowState, setWorkflowState] = useState<WorkflowState>('IDLE');
  const [idea, setIdea] = useState<string>('A brave little car explores a magical forest');
  const [projectPlan, setProjectPlan] = useState<ProjectPlan | null>(null);
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAsset[]>([]);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress>({});
  const [error, setError] = useState<string | null>(null);
  const [conclusion, setConclusion] = useState<string | null>(null);
  const [isContinuing, setIsContinuing] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isZipping, setIsZipping] = useState<'images' | 'audio' | 'all' | null>(null);
  const [voiceOption, setVoiceOption] = useState<VoiceOption>('ai');
  const [selectedAiVoice, setSelectedAiVoice] = useState<string>(AVAILABLE_VOICES[0].id);
  const [editingSceneId, setEditingSceneId] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);


  const updateAsset = (sceneNumber: number, updates: Partial<GeneratedAsset>) => {
    setGeneratedAssets(prevAssets =>
      prevAssets.map(asset =>
        asset.scene === sceneNumber ? { ...asset, ...updates } : asset
      )
    );
  };

  const handleAudioRecorded = (sceneNumber: number, audioUrl: string) => {
    updateAsset(sceneNumber, { audioUrl });
  };

  const handleStartOver = () => {
    setWorkflowState('IDLE');
    setIdea('A short story about a brave little car exploring the world');
    setProjectPlan(null);
    setGeneratedAssets([]);
    setGenerationProgress({});
    setError(null);
    setConclusion(null);
    setIsContinuing(false);
    setIsFinalizing(false);
    setVoiceOption('ai');
    setSelectedAiVoice(AVAILABLE_VOICES[0].id);
    setEditingSceneId(null);
  };

  const handlePlanGeneration = async () => {
    if (!idea.trim()) {
      setError('Please enter an idea.');
      return;
    }
    setWorkflowState('PLANNING');
    setError(null);
    setConclusion(null);
    try {
      const plan = await generateProjectPlan(idea);
      setProjectPlan(plan);
      setWorkflowState('CONFIRMATION');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setWorkflowState('IDLE');
    }
  };

  const generateAssetsForScenes = async (scenes: Scene[]): Promise<GeneratedAsset[]> => {
      const initialProgress: GenerationProgress = {};
      scenes.forEach(scene => {
          initialProgress[scene.scene] = { image: 'pending', audio: 'pending' };
      });
      setGenerationProgress(prev => ({...prev, ...initialProgress}));
  
      const assetPromises = scenes.map(async (scene): Promise<GeneratedAsset> => {
          let imageUrl: string | null = null;
          let audioUrl: string | null = null;
  
          try {
              imageUrl = await generateImage(scene.imagePrompt);
              setGenerationProgress(prev => ({ ...prev, [scene.scene]: { ...prev[scene.scene], image: 'done' } }));
          } catch (e) {
              console.error(`Failed to generate image for scene ${scene.scene}:`, e);
              setGenerationProgress(prev => ({ ...prev, [scene.scene]: { ...prev[scene.scene], image: 'error' } }));
          }
  
          if (voiceOption === 'ai') {
            try {
                audioUrl = await generateSpeech(scene.narration, selectedAiVoice);
                setGenerationProgress(prev => ({ ...prev, [scene.scene]: { ...prev[scene.scene], audio: 'done' } }));
            } catch (e) {
                console.error(`Failed to generate audio for scene ${scene.scene}:`, e);
                setGenerationProgress(prev => ({ ...prev, [scene.scene]: { ...prev[scene.scene], audio: 'error' } }));
            }
          } else {
             setGenerationProgress(prev => ({ ...prev, [scene.scene]: { ...prev[scene.scene], audio: 'done' } }));
          }
  
          return { scene: scene.scene, narration: scene.narration, imagePrompt: scene.imagePrompt, imageUrl, audioUrl };
      });
      return await Promise.all(assetPromises);
  }
  
  const handleAssetGeneration = async () => {
      if (!projectPlan) return;
      setWorkflowState('GENERATING');
      const results = await generateAssetsForScenes(projectPlan.scenes);
      setGeneratedAssets(results);
      setWorkflowState('DONE');
  };

  const handleContinueStory = async () => {
    if (!projectPlan) return;
    setIsContinuing(true);
    setError(null);
    try {
        const newScenes = await continueProjectPlan(projectPlan);
        
        const maxSceneNumber = projectPlan.scenes.length > 0
          ? Math.max(...projectPlan.scenes.map(s => s.scene))
          : 0;
        
        const renumberedNewScenes = newScenes.map((scene, index) => ({
            ...scene,
            scene: maxSceneNumber + index + 1,
        })).sort((a, b) => a.scene - b.scene);

        const updatedPlan = {...projectPlan, scenes: [...projectPlan.scenes, ...renumberedNewScenes]};
        setProjectPlan(updatedPlan);
        
        const newAssets = await generateAssetsForScenes(renumberedNewScenes);
        setGeneratedAssets(prev => [...prev, ...newAssets]);

    } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to continue story.');
    } finally {
        setIsContinuing(false);
    }
  }

  const handleFinalizeStory = async () => {
    if (!projectPlan) return;
    setIsFinalizing(true);
    setError(null);
    try {
        const finalParagraph = await generateConclusion(projectPlan);
        setConclusion(finalParagraph);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate conclusion.');
    } finally {
        setIsFinalizing(false);
    }
  }

    const handleToggleEdit = (sceneId: number | null) => {
        setEditingSceneId(sceneId);
    };

    const handleUpdateAndRegenerateScene = async (
        sceneId: number,
        newNarration: string,
        newImagePrompt: string
    ) => {
        // Optimistically update the text content
        updateAsset(sceneId, { narration: newNarration, imagePrompt: newImagePrompt });
        setProjectPlan(prevPlan => {
            if (!prevPlan) return null;
            return {
                ...prevPlan,
                scenes: prevPlan.scenes.map(s => s.scene === sceneId ? {...s, narration: newNarration, imagePrompt: newImagePrompt} : s)
            }
        });
        setEditingSceneId(null);
        
        // Mark assets as generating
        updateAsset(sceneId, { imageUrl: null, audioUrl: null }); // Clear old assets
        setGenerationProgress(prev => ({ ...prev, [sceneId]: { image: 'generating', audio: 'generating' } }));
        
        try {
            const imageUrl = await generateImage(newImagePrompt);
            updateAsset(sceneId, { imageUrl });
            setGenerationProgress(prev => ({ ...prev, [sceneId]: { ...prev[sceneId], image: 'done' } }));
        } catch (e) {
            console.error(`Failed to regenerate image for scene ${sceneId}:`, e);
            setGenerationProgress(prev => ({ ...prev, [sceneId]: { ...prev[sceneId], image: 'error' } }));
        }

        if (voiceOption === 'ai') {
            try {
                const audioUrl = await generateSpeech(newNarration, selectedAiVoice);
                updateAsset(sceneId, { audioUrl });
                setGenerationProgress(prev => ({ ...prev, [sceneId]: { ...prev[sceneId], audio: 'done' } }));
            } catch (e) {
                console.error(`Failed to regenerate audio for scene ${sceneId}:`, e);
                 setGenerationProgress(prev => ({ ...prev, [sceneId]: { ...prev[sceneId], audio: 'error' } }));
            }
        } else {
            // If user recording, mark as 'done' and nullify audio so they can re-record
            updateAsset(sceneId, { audioUrl: null });
            setGenerationProgress(prev => ({ ...prev, [sceneId]: { ...prev[sceneId], audio: 'done' } }));
        }
    };


  const handleDownloadAll = async (type: 'images' | 'audio') => {
    setIsZipping(type);
    try {
        const zip = new JSZip();
        
        const promises = generatedAssets.map(async (asset) => {
            if (type === 'images' && asset.imageUrl) {
                const response = await fetch(asset.imageUrl);
                const blob = await response.blob();
                zip.file(`scene_${asset.scene}_image.png`, blob);
            } else if (type === 'audio' && asset.audioUrl) {
                const response = await fetch(asset.audioUrl);
                const blob = await response.blob();
                zip.file(`scene_${asset.scene}_audio.wav`, blob);
            }
        });

        await Promise.all(promises);

        const content = await zip.generateAsync({ type: 'blob' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `story_${projectPlan?.title?.replace(/\s+/g, '_') || 'project'}_${type}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    } catch (err) {
        setError(`Failed to create zip file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
        setIsZipping(null);
    }
};

 const handleDownloadAllAssets = async () => {
    setIsZipping('all');
    try {
        const zip = new JSZip();

        const promises = generatedAssets.map(async (asset) => {
            const sceneFolder = zip.folder(`scene_${asset.scene}`);
            if (!sceneFolder) return;

            // Add narration text
            sceneFolder.file('narration.txt', asset.narration);
            
            // Add image prompt text
            sceneFolder.file('image_prompt.txt', asset.imagePrompt);

            // Add image
            if (asset.imageUrl) {
                const response = await fetch(asset.imageUrl);
                const blob = await response.blob();
                sceneFolder.file(`image.png`, blob);
            }

            // Add audio
            if (asset.audioUrl) {
                const response = await fetch(asset.audioUrl);
                const blob = await response.blob();
                sceneFolder.file(`audio.wav`, blob);
            }
        });

        await Promise.all(promises);

        const content = await zip.generateAsync({ type: 'blob' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `project_${projectPlan?.title?.replace(/\s+/g, '_') || 'story'}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

    } catch (err) {
        setError(`Failed to create project zip file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
        setIsZipping(null);
    }
};

  const renderContent = () => {
    switch (workflowState) {
      case 'IDLE':
      case 'PLANNING':
        return (
          <div className="text-center max-w-lg mx-auto">
            <SparklesIcon className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Let's Create Something Amazing</h2>
            <p className="text-gray-400 mb-6">Enter a simple idea, and I'll develop a full storyboard with images and narration for you.</p>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="e.g., A story about a cat who learns to fly"
              className="w-full p-4 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-colors duration-200 resize-none"
              rows={4}
              disabled={workflowState === 'PLANNING'}
            />
            {error && <div className="text-red-400 bg-red-900/50 p-3 rounded-lg mt-4 text-left">{error}</div>}
            <button
              onClick={handlePlanGeneration}
              disabled={workflowState === 'PLANNING' || !idea}
              className="w-full mt-4 flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-900/50 disabled:cursor-not-allowed transition-colors duration-300"
            >
              {workflowState === 'PLANNING' ? <><Spinner /> Developing Plan...</> : 'Generate Project Plan'}
            </button>
          </div>
        );

      case 'CONFIRMATION':
        return (
            projectPlan && (
            <div>
                <h2 className="text-3xl font-bold text-center mb-1">Project Plan: <span className="text-indigo-400">{projectPlan.title}</span></h2>
                <p className="text-center text-gray-400 mb-6">Here is the script and visual plan. Do you want to proceed?</p>
                <div className="max-h-[300px] overflow-y-auto bg-gray-900/50 p-4 rounded-lg border border-gray-700 space-y-4">
                    {projectPlan.scenes.map(scene => (
                        <div key={scene.scene} className="p-3 bg-gray-800 rounded">
                            <h3 className="font-bold text-indigo-400">Scene {scene.scene}</h3>
                            <p className="text-gray-300 mt-1"><strong className="text-gray-500">Narration:</strong> {scene.narration}</p>
                            <p className="text-gray-300 mt-1"><strong className="text-gray-500">Image Prompt:</strong> <em className="text-purple-300">"{scene.imagePrompt}"</em></p>
                        </div>
                    ))}
                </div>
                
                <div className="mt-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <h3 className="text-lg font-semibold text-center text-gray-200 mb-4">Narration Voice Options</h3>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <label className={`flex-1 p-3 border-2 rounded-lg cursor-pointer text-center transition-colors ${voiceOption === 'ai' ? 'bg-indigo-600/30 border-indigo-500' : 'border-gray-600 hover:border-gray-500'}`}>
                            <input type="radio" name="voice-option" value="ai" checked={voiceOption === 'ai'} onChange={() => setVoiceOption('ai')} className="sr-only" />
                            <span className="font-bold">Use Professional AI Voice</span>
                            <p className="text-xs text-gray-400">High-quality, consistent narration.</p>
                        </label>
                        <label className={`flex-1 p-3 border-2 rounded-lg cursor-pointer text-center transition-colors ${voiceOption === 'user' ? 'bg-indigo-600/30 border-indigo-500' : 'border-gray-600 hover:border-gray-500'}`}>
                            <input type="radio" name="voice-option" value="user" checked={voiceOption === 'user'} onChange={() => setVoiceOption('user')} className="sr-only" />
                            <span className="font-bold">Record My Own Voice</span>
                             <p className="text-xs text-gray-400">Add a personal touch to your story.</p>
                        </label>
                    </div>
                    {voiceOption === 'ai' && (
                        <div className="mt-4">
                            <select value={selectedAiVoice} onChange={e => setSelectedAiVoice(e.target.value)} className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500">
                                {AVAILABLE_VOICES.map(voice => (
                                    <option key={voice.id} value={voice.id}>{voice.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="flex gap-4 mt-6">
                    <button onClick={handleStartOver} className="w-full bg-gray-600 font-bold py-3 px-4 rounded-lg hover:bg-gray-700">Start Over</button>
                    <button onClick={handleAssetGeneration} className="w-full bg-green-600 font-bold py-3 px-4 rounded-lg hover:bg-green-700">Approve & Create</button>
                </div>
            </div>
            )
        );

      case 'GENERATING':
          return (
            <div>
                <h2 className="text-3xl font-bold text-center mb-2">Creating Your Story...</h2>
                <p className="text-center text-gray-400 mb-6">The AI is now generating all the images and audio. Please wait.</p>
                <div className="max-h-[450px] overflow-y-auto p-1 space-y-3">
                    {projectPlan?.scenes.map(scene => {
                        const progress = generationProgress[scene.scene];
                        const StatusIndicator = ({ status }: { status: GenerationStatus }) => {
                            if (status === 'pending' || status === 'generating') return <Spinner className="w-4 h-4" />;
                            if (status === 'done') return <span className="text-green-400">✓</span>;
                            return <span className="text-red-400">!</span>;
                        };
                        return (
                            <div key={scene.scene} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                                <span className="font-semibold">Scene {scene.scene}</span>
                                <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-2">Image: <StatusIndicator status={progress?.image || 'pending'} /></div>
                                    <div className="flex items-center gap-2">Audio: <StatusIndicator status={progress?.audio || 'pending'} /></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
          );

      case 'DONE':
        return (
            <div>
                 <h2 className="text-3xl font-bold text-center mb-1">Your Story is Ready!</h2>
                 <p className="text-center text-gray-400 mb-6">{projectPlan?.title}</p>
                 {error && <div className="text-red-400 bg-red-900/50 p-3 rounded-lg mb-4">{error}</div>}
                 
                 {conclusion && (
                    <div className="mb-6 p-4 bg-gray-900/50 rounded-lg border border-indigo-500">
                        <h3 className="font-bold text-indigo-400 text-lg text-center">Conclusion</h3>
                        <p className="text-gray-300 mt-2 text-center italic">{conclusion}</p>
                    </div>
                 )}

                 <div className="max-h-[480px] overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-2">
                    {generatedAssets.sort((a,b) => a.scene - b.scene).map(asset => 
                      <SceneCard 
                        key={asset.scene} 
                        asset={asset}
                        isEditing={editingSceneId === asset.scene}
                        generationProgress={generationProgress[asset.scene]}
                        voiceOption={voiceOption}
                        onAudioRecorded={(audioUrl) => handleAudioRecorded(asset.scene, audioUrl)}
                        onToggleEdit={() => handleToggleEdit(editingSceneId === asset.scene ? null : asset.scene)}
                        onUpdateScene={handleUpdateAndRegenerateScene}
                      />)}
                 </div>

                 <div className="mt-6 border-t border-gray-700 pt-6">
                    <h3 className="text-xl font-semibold text-center mb-4">Project Tools</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm md:text-base">
                      <button
                        onClick={() => setIsPlaying(true)}
                        disabled={generatedAssets.length === 0 || generatedAssets.some(a => !a.imageUrl || !a.audioUrl)}
                        className="w-full flex items-center justify-center gap-2 bg-purple-600 font-bold py-3 px-4 rounded-lg hover:bg-purple-700 disabled:bg-purple-900/50 disabled:cursor-not-allowed"
                        >
                        <PlayIcon className="w-5 h-5"/> Play Story
                      </button>
                      <button 
                          onClick={handleContinueStory}
                          disabled={isContinuing || isFinalizing || !!conclusion}
                          className="w-full flex items-center justify-center gap-2 bg-indigo-600 font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-900/50 disabled:cursor-not-allowed"
                      >
                          {isContinuing ? <><Spinner /> Continuing...</> : <><BookOpenIcon className="w-5 h-5"/> Continue</>}
                      </button>
                      
                      <button 
                          onClick={handleFinalizeStory}
                          disabled={isFinalizing || !!conclusion}
                          className="w-full flex items-center justify-center gap-2 bg-green-600 font-bold py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-green-900/50 disabled:cursor-not-allowed"
                      >
                         {isFinalizing ? <><Spinner /> Finalizing...</> : <><CheckCircleIcon className="w-5 h-5"/> Finalize</>}
                      </button>
                      <button onClick={handleStartOver} className="w-full bg-gray-600 font-bold py-3 px-4 rounded-lg hover:bg-gray-700">Start Over</button>
                    </div>
                    
                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                      <h4 className="font-bold text-center text-gray-300 mb-3">Download Assets</h4>
                       <div className="mb-4">
                         <button onClick={handleDownloadAllAssets} disabled={!!isZipping} className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-green-900/50 disabled:cursor-not-allowed">
                            {isZipping === 'all' ? <Spinner /> : <DownloadIcon className="w-5 h-5" />} Download Full Project (.zip)
                        </button>
                       </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button onClick={() => handleDownloadAll('images')} disabled={!!isZipping} className="flex items-center justify-center gap-2 bg-sky-600 text-white text-sm font-bold py-2 px-3 rounded-lg hover:bg-sky-700 disabled:bg-sky-900/50 disabled:cursor-not-allowed">
                          {isZipping === 'images' ? <Spinner className="w-4 h-4" /> : <DownloadIcon className="w-4 h-4" />} All Images (.zip)
                        </button>
                        <button onClick={() => handleDownloadAll('audio')} disabled={!!isZipping} className="flex items-center justify-center gap-2 bg-teal-600 text-white text-sm font-bold py-2 px-3 rounded-lg hover:bg-teal-700 disabled:bg-teal-900/50 disabled:cursor-not-allowed">
                          {isZipping === 'audio' ? <Spinner className="w-4 h-4" /> : <DownloadIcon className="w-4 h-4" />} All Audio (.zip)
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 text-center mt-3">
                        You can combine the downloaded assets in your favorite video editing software.
                      </p>
                    </div>
                 </div>
            </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
        {isPlaying && generatedAssets.length > 0 && (
            <StoryPlayer
                scenes={generatedAssets.filter(a => a.imageUrl && a.audioUrl).sort((a,b) => a.scene - b.scene)}
                onClose={() => setIsPlaying(false)}
            />
        )}
        {renderContent()}
    </div>
  );
};

export default StoryGenerator;