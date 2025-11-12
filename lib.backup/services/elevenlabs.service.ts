import { API_CONFIG, getElevenLabsKey, getElevenLabsUrl } from '../config';
import type { TTSOptions, Voice, TTSRequest } from '../types/elevenlabs.types';

/**
 * ElevenLabs Service
 * Singleton service for all ElevenLabs API interactions
 */
export class ElevenLabsService {
  private static instance: ElevenLabsService;
  
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  static getInstance(): ElevenLabsService {
    if (!this.instance) {
      this.instance = new ElevenLabsService();
    }
    return this.instance;
  }
  
  /**
   * Get common headers for API requests
   */
  private getHeaders(includeAccept: boolean = false): HeadersInit {
    const headers: Record<string, string> = {
      [API_CONFIG.ELEVENLABS.HEADERS.NAMES.XI_API_KEY]: getElevenLabsKey(),
      [API_CONFIG.ELEVENLABS.HEADERS.NAMES.CONTENT_TYPE]: API_CONFIG.ELEVENLABS.HEADERS.VALUES.CONTENT_TYPE_JSON,
    };
    
    if (includeAccept) {
      headers[API_CONFIG.ELEVENLABS.HEADERS.NAMES.ACCEPT] = API_CONFIG.ELEVENLABS.HEADERS.VALUES.ACCEPT_AUDIO;
    }
    
    return headers;
  }
  
  /**
   * Convert text to speech
   */
  async textToSpeech(options: TTSOptions): Promise<ArrayBuffer> {
    const {
      text,
      voiceId,
      modelId = API_CONFIG.ELEVENLABS.DEFAULT_SETTINGS.model,
      stability = API_CONFIG.ELEVENLABS.DEFAULT_SETTINGS.stability,
      similarityBoost = API_CONFIG.ELEVENLABS.DEFAULT_SETTINGS.similarity_boost
    } = options;
    
    const url = getElevenLabsUrl(API_CONFIG.ELEVENLABS.ENDPOINTS.TEXT_TO_SPEECH, voiceId);
    
    const requestBody: TTSRequest = {
      text,
      model_id: modelId,
      voice_settings: {
        stability,
        similarity_boost: similarityBoost
      }
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ElevenLabs API Error (${response.status}): ${error}`);
    }
    
    return await response.arrayBuffer();
  }
  
  /**
   * Fetch all available voices
   */
  async fetchVoices(): Promise<Voice[]> {
    const url = getElevenLabsUrl(API_CONFIG.ELEVENLABS.ENDPOINTS.VOICES);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        [API_CONFIG.ELEVENLABS.HEADERS.NAMES.XI_API_KEY]: getElevenLabsKey()
      }
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch voices (${response.status}): ${error}`);
    }
    
    const data = await response.json();
    return data.voices || [];
  }
  
  /**
   * Normalize voice data for consistent format
   */
  normalizeVoice(voice: any): Voice {
    const labels = voice.labels || {};
    
    return {
      voice_id: voice.voice_id || '',
      name: voice.name || 'Unknown',
      labels: {
        gender: labels.gender || 'Unknown',
        use_case: voice.category || labels.use_case || labels['use case'] || 'General',
        language: labels.language || 'English',
        languages: labels.languages || [],
        country: labels.country || labels.accent || 'Unknown',
        accent: labels.accent || 'Unknown'
      },
      category: voice.category || 'unknown'
    };
  }
  
  /**
   * Fetch and normalize all voices
   */
  async fetchNormalizedVoices(): Promise<Voice[]> {
    const voices = await this.fetchVoices();
    return voices.map(v => this.normalizeVoice(v));
  }
}

// Export singleton instance
export const elevenLabsService = ElevenLabsService.getInstance();
