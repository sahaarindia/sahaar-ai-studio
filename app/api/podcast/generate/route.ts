import { NextRequest, NextResponse } from "next/server";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const MODEL_ID = "eleven_multilingual_v2";

async function generateAudio(text: string, voiceId: string): Promise<Buffer> {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY || "",
      },
      body: JSON.stringify({
        text: text,
        model_id: MODEL_ID,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API error: ${response.statusText} - ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function cleanText(text: string): string {
  // Remove special characters that might disturb audio
  return text
    .replace(/\*\*/g, '') // Remove bold markdown
    .replace(/\*/g, '')   // Remove italic markdown
    .replace(/\_\_/g, '') // Remove underline
    .replace(/\_/g, '')   // Remove underscore
    .replace(/\#/g, '')   // Remove hash
    .replace(/\[/g, '')   // Remove brackets
    .replace(/\]/g, '')
    .replace(/\(/g, '')   // Remove parentheses  
    .replace(/\)/g, '')
    .replace(/\{/g, '')   // Remove braces
    .replace(/\}/g, '')
    .replace(/\</g, '')   // Remove angle brackets
    .replace(/\>/g, '')
    .replace(/\~/g, '')   // Remove tilde
    .replace(/\`/g, '')   // Remove backticks
    .replace(/\|/g, '')   // Remove pipe
    .replace(/\^/g, '')   // Remove caret
    .replace(/\+/g, '')   // Remove plus
    .replace(/\=/g, '')   // Remove equals
    .trim();
}

function parseScript(script: string): Array<{speaker: string, text: string}> {
  const lines = script.split('\n').filter(line => line.trim());
  const segments: Array<{speaker: string, text: string}> = [];
  
  for (const line of lines) {
    // Flexible regex to match "AnyName: dialogue"
    const match = line.match(/^([^:]+):\s*(.+)$/);
    
    if (match) {
      const speaker = match[1].trim();
      let dialogue = match[2].trim();
      
      // Clean text of special characters
      dialogue = cleanText(dialogue);
      
      if (dialogue) {
        segments.push({
          speaker: speaker,
          text: dialogue
        });
      }
    }
  }
  
  return segments;
}

function mapSpeakerToVoice(speaker: string, hostVoiceId: string, guestVoiceId: string): string {
  const normalizedSpeaker = speaker.toLowerCase().trim();
  
  console.log(`[Voice Mapping] Speaker: "${speaker}" → Normalized: "${normalizedSpeaker}"`);
  
  // Check for "Host" or "होस्ट"
  if (normalizedSpeaker.includes('host') || normalizedSpeaker.includes('होस्ट')) {
    console.log(`[Voice Mapping] → Host Voice: ${hostVoiceId}`);
    return hostVoiceId;
  }
  
  // Check for "Guest" or "गेस्ट"
  if (normalizedSpeaker.includes('guest') || normalizedSpeaker.includes('गेस्ट')) {
    console.log(`[Voice Mapping] → Guest Voice: ${guestVoiceId}`);
    return guestVoiceId;
  }
  
  // For Character 1, use Host voice
  if (normalizedSpeaker.includes('character 1') || normalizedSpeaker === '1') {
    console.log(`[Voice Mapping] → Character 1 → Host Voice: ${hostVoiceId}`);
    return hostVoiceId;
  }
  
  // For Character 2, use Guest voice
  if (normalizedSpeaker.includes('character 2') || normalizedSpeaker === '2') {
    console.log(`[Voice Mapping] → Character 2 → Guest Voice: ${guestVoiceId}`);
    return guestVoiceId;
  }
  
  // Alternate between voices for unknown characters
  const hash = speaker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const selectedVoice = hash % 2 === 0 ? hostVoiceId : guestVoiceId;
  console.log(`[Voice Mapping] → Unknown speaker, hash-based → ${selectedVoice}`);
  return selectedVoice;
}

async function mergeAudioBuffers(buffers: Buffer[]): Promise<Buffer> {
  // Simple concatenation - works for MP3
  return Buffer.concat(buffers);
}

export async function POST(req: NextRequest) {
  try {
    const { script, hostVoiceId, guestVoiceId } = await req.json();

    if (!script || !hostVoiceId || !guestVoiceId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!ELEVENLABS_API_KEY) {
      return NextResponse.json(
        { error: "ElevenLabs API key not configured" },
        { status: 500 }
      );
    }

    console.log("=".repeat(60));
    console.log("🎙️ PODCAST GENERATION STARTED");
    console.log("=".repeat(60));
    console.log(`📝 Host Voice ID: ${hostVoiceId}`);
    console.log(`👤 Guest Voice ID: ${guestVoiceId}`);
    console.log("=".repeat(60));
    
    // Parse script with flexible speaker names
    const segments = parseScript(script);
    
    if (segments.length === 0) {
      return NextResponse.json(
        { error: "No valid dialogue segments found in script. Use format: 'Name: dialogue'" },
        { status: 400 }
      );
    }

    console.log(`📋 Parsed ${segments.length} segments from script`);
    console.log("=".repeat(60));

    const audioBuffers: Buffer[] = [];

    // Generate audio for each segment
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const voiceId = mapSpeakerToVoice(segment.speaker, hostVoiceId, guestVoiceId);
      
      console.log(`\n🎬 Segment ${i + 1}/${segments.length}:`);
      console.log(`   Speaker: ${segment.speaker}`);
      console.log(`   Voice ID: ${voiceId}`);
      console.log(`   Text: ${segment.text.substring(0, 50)}...`);

      try {
        const audioBuffer = await generateAudio(segment.text, voiceId);
        audioBuffers.push(audioBuffer);
        console.log(`   ✅ Generated: ${audioBuffer.length} bytes`);
      } catch (error) {
        console.error(`   ❌ Failed:`, error);
        throw error;
      }
    }

    // Merge all audio buffers
    console.log("\n" + "=".repeat(60));
    console.log("🔗 Merging audio segments...");
    const finalAudio = await mergeAudioBuffers(audioBuffers);
    
    console.log(`✅ PODCAST COMPLETE: ${finalAudio.length} bytes`);
    console.log("=".repeat(60));

    return new Response(finalAudio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": finalAudio.length.toString(),
      },
    });

  } catch (error: any) {
    console.error("❌ Podcast generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate podcast" },
      { status: 500 }
    );
  }
}
