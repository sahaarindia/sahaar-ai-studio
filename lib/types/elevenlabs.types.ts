export interface Voice {
  voice_id: string;
  name: string;
  labels: {
    gender?: string;
    use_case?: string;
    language?: string;
    languages?: string[];
    country?: string;
    accent?: string;
  };
  category?: string;
}

export interface TTSOptions {
  text: string;
  voiceId: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
}

export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
}

export interface TTSRequest {
  text: string;
  model_id: string;
  voice_settings: VoiceSettings;
}
