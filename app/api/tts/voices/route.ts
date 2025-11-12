import { NextRequest, NextResponse } from "next/server";
import { elevenLabsService } from "@/lib/services/elevenlabs.service";
import { API_CONFIG } from "@/lib/config";

// Cache for voices list
const TTL_MS = API_CONFIG.ELEVENLABS.CACHE.TTL_MS;
let VOICES_CACHE: { ts: number; data: any[] | null } = { ts: 0, data: null };

export async function GET(request: NextRequest) {
  try {
    const now = Date.now();
    
    // Check if cache is valid
    if (VOICES_CACHE.data && (now - VOICES_CACHE.ts) < TTL_MS) {
      const cacheAgeHours = Math.round((now - VOICES_CACHE.ts) / (60 * 60 * 1000));
      
      console.log(`[Voices] Returning cached data (age: ${cacheAgeHours}h)`);
      
      return NextResponse.json({ 
        voices: VOICES_CACHE.data,
        cached: true,
        cache_age_hours: cacheAgeHours,
        total: VOICES_CACHE.data.length
      });
    }
    
    // Fetch fresh data
    console.log('[Voices] Fetching fresh voice list from API');
    
    const voices = await elevenLabsService.fetchNormalizedVoices();
    
    // Sort by name
    voices.sort((a, b) => a.name.localeCompare(b.name));
    
    // Update cache
    VOICES_CACHE = { ts: now, data: voices };
    
    console.log(`[Voices] Fetched ${voices.length} voices`);
    
    return NextResponse.json({ 
      voices,
      cached: false,
      total: voices.length
    });
    
  } catch (err: any) {
    console.error("[Voices] Error:", err.message);
    
    return NextResponse.json(
      { 
        error: "Failed to fetch voices", 
        message: err.message 
      },
      { status: 500 }
    );
  }
}
