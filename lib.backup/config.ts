/**
 * Centralized API Configuration
 * Single source of truth for all API endpoints and settings
 */

export const API_CONFIG = {
  ELEVENLABS: {
    API_KEY: process.env.ELEVEN_LABS_API_KEY || '',
    BASE_URL: 'https://api.elevenlabs.io/v1',
    
    ENDPOINTS: {
      TEXT_TO_SPEECH: '/text-to-speech',
      VOICES: '/voices',
      VOICE_SETTINGS: '/voices/settings'
    },
    
    HEADERS: {
      NAMES: {
        XI_API_KEY: 'xi-api-key',
        CONTENT_TYPE: 'Content-Type',
        ACCEPT: 'Accept'
      },
      VALUES: {
        CONTENT_TYPE_JSON: 'application/json',
        ACCEPT_AUDIO: 'audio/mpeg'
      }
    },
    
    MODELS: {
      MULTILINGUAL_V2: 'eleven_multilingual_v2',
      MONOLINGUAL_V1: 'eleven_monolingual_v1',
      TURBO_V2: 'eleven_turbo_v2'
    },
    
    DEFAULT_SETTINGS: {
      stability: 0.5,
      similarity_boost: 0.75,
      model: 'eleven_multilingual_v2'
    },
    
    CACHE: {
      TTL_MS: 6 * 60 * 60 * 1000 // 6 hours
    }
  },
  
  APP: {
    FREE_WORD_LIMIT: 150,
    MAX_CHAR_LIMIT: 5000
  }
} as const;

/**
 * Type-safe getter for Eleven Labs API key
 * Throws error if key is not configured
 */
export function getElevenLabsKey(): string {
  const key = API_CONFIG.ELEVENLABS.API_KEY;
  if (!key) {
    throw new Error('ELEVEN_LABS_API_KEY not configured in environment');
  }
  return key;
}

/**
 * Build full API URL
 */
export function getElevenLabsUrl(endpoint: string, params?: string): string {
  const base = API_CONFIG.ELEVENLABS.BASE_URL;
  return params ? `${base}${endpoint}/${params}` : `${base}${endpoint}`;
}
