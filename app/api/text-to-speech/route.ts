import { NextRequest, NextResponse } from "next/server";

// Use same variable name as podcast API
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech";

export async function POST(req: NextRequest) {
  try {
    const { text, voiceId, modelId } = await req.json();

    console.log(`[TTS] Generating audio: ${text.split(' ').length} words, voice: ${voiceId}, model: ${modelId}`);

    if (!text || !voiceId) {
      return NextResponse.json(
        { error: "Text and voiceId are required" },
        { status: 400 }
      );
    }

    if (!ELEVENLABS_API_KEY) {
      console.error("[TTS] Error: ELEVENLABS_API_KEY not configured in environment");
      return NextResponse.json(
        { error: "ElevenLabs API key not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(`${ELEVENLABS_API_URL}/${voiceId}`, {
      method: "POST",
      headers: {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: modelId || "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[TTS] ElevenLabs API error: ${response.statusText} - ${errorText}`);
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    console.log(`[TTS] ✓ Audio generated successfully: ${audioBuffer.length} bytes`);

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": 'attachment; filename="speech.mp3"',
        "Content-Length": audioBuffer.length.toString(),
      },
    });

  } catch (error: any) {
    console.error("[TTS] Generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate speech" },
      { status: 500 }
    );
  }
}
