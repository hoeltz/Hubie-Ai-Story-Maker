import { GoogleGenAI, Modality, Type, Part } from "@google/genai";
import { ProjectPlan, Scene } from "../types";

export const AVAILABLE_VOICES = [
    { id: 'Kore', name: 'Kore - Narator Wanita (Jelas & Hangat)' },
    { id: 'Puck', name: 'Puck - Narator Pria (Dalam & Berwibawa)' },
    { id: 'Charon', name: 'Charon - Suara Pria (Ramah)' },
    { id: 'Zephyr', name: 'Zephyr - Suara Wanita (Tenang & Lembut)' },
];

// --- AUDIO DECODING & ENCODING HELPERS ---
function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}
  
function pcmToWav(pcmData: Uint8Array, sampleRate: number, numChannels: number): ArrayBuffer {
    const bitsPerSample = 16;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const byteRate = sampleRate * blockAlign;
    const dataSize = pcmData.length;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // RIFF header
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + dataSize, true);
    view.setUint32(8, 0x57415645, false); // "WAVE"

    // "fmt " sub-chunk
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true); // Sub-chunk size
    view.setUint16(20, 1, true); // Audio format (1 for PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    // "data" sub-chunk
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, dataSize, true);

    new Uint8Array(buffer, 44).set(pcmData);

    return buffer;
}

// --- FILE HELPERS ---
export const fileToGenerativePart = async (file: File): Promise<Part> => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: {
        data: await base64EncodedDataPromise,
        mimeType: file.type,
      },
    };
};

// --- API FUNCTIONS ---

export const generateProjectPlan = async (idea: string): Promise<ProjectPlan> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: `You are a creative assistant that generates structured story plans. Based on the user's idea, create a project plan. The plan must include a title for the story and a series of scenes (between 3 and 5 scenes). For each scene, you must provide the scene number, the narration text, and a detailed visual prompt for generating an image. The entire output must be a single JSON object that strictly adheres to the provided schema. Do not add any explanatory text, markdown formatting, or any other characters before or after the JSON object. User's Idea: "${idea}"`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "The title of the story." },
                    scenes: {
                        type: Type.ARRAY,
                        description: "An array of scenes that make up the story.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                scene: { type: Type.INTEGER, description: "The sequential number of the scene." },
                                narration: { type: Type.STRING, description: "The narration text for this scene." },
                                imagePrompt: { type: Type.STRING, description: "A detailed prompt for an AI image generator to create a visual for this scene." }
                            },
                            required: ['scene', 'narration', 'imagePrompt']
                        }
                    }
                },
                required: ['title', 'scenes']
            },
        },
    });

    try {
        let jsonText = response.text.trim();
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.slice(7, -3).trim();
        } else if (jsonText.startsWith('```')) {
             jsonText = jsonText.slice(3, -3).trim();
        }
        
        const plan = JSON.parse(jsonText);
        
        if (!plan.title || !Array.isArray(plan.scenes)) {
            console.error("Invalid project plan structure. Received:", plan);
            throw new Error("Invalid project plan structure received from API.");
        }
        return plan;
    } catch (e) {
        console.error("Failed to parse project plan:", e);
        console.error("Raw response from API:", response.text);
        throw new Error("Could not generate a valid story plan. The AI returned an unexpected format. Please try again with a different idea.");
    }
};

export const continueProjectPlan = async (existingPlan: ProjectPlan): Promise<Scene[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: `You are a creative assistant continuing a story. Based on the existing story plan, generate the next 2 to 3 scenes to continue the narrative logically. The new scenes must follow the same JSON structure as the existing scenes. The entire output must be a single JSON object containing only a "new_scenes" array. Do not add any explanatory text or markdown. Existing Plan: ${JSON.stringify(existingPlan)}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    new_scenes: {
                        type: Type.ARRAY,
                        description: "An array of new scenes to continue the story.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                scene: { type: Type.INTEGER, description: "The sequential number of the new scene." },
                                narration: { type: Type.STRING, description: "The narration text for this new scene." },
                                imagePrompt: { type: Type.STRING, description: "A detailed prompt for an AI image generator for this new scene." }
                            },
                            required: ['scene', 'narration', 'imagePrompt']
                        }
                    }
                },
                required: ['new_scenes']
            },
        },
    });

    try {
        let jsonText = response.text.trim();
        const parsedResponse = JSON.parse(jsonText);
        if (!Array.isArray(parsedResponse.new_scenes)) {
            throw new Error("API did not return a valid 'new_scenes' array.");
        }
        return parsedResponse.new_scenes;
    } catch (e) {
        console.error("Failed to parse continued project plan:", e);
        console.error("Raw response from API:", response.text);
        throw new Error("Could not continue the story. The AI returned an unexpected format.");
    }
};

export const generateConclusion = async (existingPlan: ProjectPlan): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const storyText = existingPlan.scenes.map(s => s.narration).join('\n\n');
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are a storyteller. Based on the following story, write a single, satisfying concluding paragraph to end it. Output only the text of the conclusion, with no extra formatting or titles.\n\nSTORY:\n${storyText}`,
    });
    return response.text;
};

export const generateImage = async (prompt: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    const blockReason = response.promptFeedback?.blockReason;
    if (blockReason) {
        console.error("Image generation blocked. Reason:", blockReason, "Details:", response.promptFeedback);
        throw new Error(`Image generation for the prompt was blocked due to: ${blockReason}. Please try a different story idea.`);
    }

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part?.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
    }
    
    console.error("Image generation failed. Full API response:", JSON.stringify(response, null, 2));
    throw new Error("Image generation failed to return data. The model may have finished for an unexpected reason (check the console for the full API response).");
};

export const generateImagePromptFromNarration = async (narration: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Based on the following narration, create a detailed, vibrant, and imaginative prompt for an AI image generator. The prompt should capture the mood, characters, setting, and action. Focus on visual details.\n\nNarration: "${narration}"`,
    });
    return response.text;
};


export const generateTextFromImage = async (prompt: string, image: Part): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [image, { text: prompt }] },
    });
    return response.text;
};

// FIX: Added 'generateVideoFromImage' function to support the Image-to-Video feature.
export const generateVideoFromImage = async (prompt: string, image: Part): Promise<string> => {
    // Per Veo guidelines, create a new instance right before the API call
    // to ensure the latest API key from the selection dialog is used.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    if (!image.inlineData) {
        throw new Error("Invalid image part provided for video generation.");
    }

    const imagePayload = {
        imageBytes: image.inlineData.data,
        mimeType: image.inlineData.mimeType,
    };

    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        image: imagePayload,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '16:9' // Defaulting to landscape
        }
    });

    // Poll for the result
    while (!operation.done) {
        // Wait for 10 seconds before polling again
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    if (operation.error) {
        console.error("Video generation operation failed:", operation.error);
        throw new Error(`Video generation failed: ${operation.error.message}`);
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

    if (!downloadLink) {
        console.error("Video generation finished but no download link was provided. Full response:", operation.response);
        throw new Error("Video generation failed to return a download link.");
    }
    
    // Fetch the video MP4 bytes and create a blob URL
    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    
    if (!videoResponse.ok) {
        const errorBody = await videoResponse.text();
        console.error("Failed to download video from URI.", { status: videoResponse.status, body: errorBody });
        // This is a key part of the error handling for API key setup issues
        if (errorBody.includes("Requested entity was not found")) {
            throw new Error("Requested entity was not found. This often means the Google Cloud project is not configured correctly. Please ensure billing is enabled and the 'Generative Language API' is active for your project.");
        }
        throw new Error(`Failed to download the generated video. Status: ${videoResponse.status}`);
    }
    
    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);
};

export const generateSpeech = async (text: string, voiceName: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say this with a gentle, storytelling tone: ${text}` }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voiceName },
                },
            },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
        const pcmData = decode(base64Audio);
        const wavBuffer = pcmToWav(pcmData, 24000, 1);
        const blob = new Blob([wavBuffer], { type: 'audio/wav' });
        return URL.createObjectURL(blob);
    }
    throw new Error("Speech generation failed to return audio data.");
};