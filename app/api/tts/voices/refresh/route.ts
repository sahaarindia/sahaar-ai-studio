import { NextRequest, NextResponse } from "next/server";
import { elevenLabsService } from "@/lib/services/elevenlabs.service";

export async function GET(request: NextRequest) {
  try {
    console.log('[Voices] Manual refresh requested');
    
    const voices = await elevenLabsService.fetchNormalizedVoices();
    
    return NextResponse.json({ 
      ok: true, 
      count: voices.length,
      message: "Cache refreshed successfully",
      timestamp: new Date().toISOString()
    });
    
  } catch (e: any) {
    console.error('[Voices] Refresh error:', e.message);
    
    return NextResponse.json(
      { ok: false, error: e.message },
      { status: 500 }
    );
  }
}
