export interface Scene {
  scene: number;
  narration: string;
  imagePrompt: string;
}

export interface ProjectPlan {
  title: string;
  scenes: Scene[];
}

export interface GeneratedAsset {
  scene: number;
  narration:string;
  imagePrompt: string;
  imageUrl: string | null;
  audioUrl: string | null;
}