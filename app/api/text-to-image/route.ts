import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface TextToImageRequest {
  prompt: string;
  model: 'stable-diffusion' | 'dall-e-3' | 'auto';
  size: '512x512' | '768x768' | '1024x1024' | '1344x768' | '768x1344' | '1920x1080' | '1080x1920';
  quality?: 'standard' | 'hd';
  style?: 'natural' | 'vivid';
  distance?: number;
  consistent?: boolean;
}

async function enhancePromptWithAI(userPrompt: string, distance: number = 2.5): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return enhancePromptBasic(userPrompt, distance);
  }

  try {
    let distanceDescription = '';
    let qualityFocus = '';
    
    if (distance <= 1.5) {
      distanceDescription = 'close-up shot, intimate distance, detailed view';
      qualityFocus = 'extreme detail on subject, macro level clarity, every texture visible, facial pores and skin details visible, ultra-sharp foreground';
    } else if (distance <= 3) {
      distanceDescription = 'medium shot, conversational distance, balanced framing';
      qualityFocus = 'clear subject details, facial features sharp and defined, balanced focus throughout, professional portrait quality';
    } else if (distance <= 6) {
      distanceDescription = 'wide shot, environmental context, full scene';
      qualityFocus = 'maintain facial clarity even at distance, all subjects clearly visible and identifiable, no loss of detail in background, sharp from foreground to background';
    } else {
      distanceDescription = 'establishing shot, landscape view, expansive scene';
      qualityFocus = 'ultra-wide angle maintaining sharpness, distant subjects still recognizable, architectural precision, panoramic clarity, environmental detail preserved';
    }

    const systemContent = `You are an expert professional photographer and prompt engineer for AI image generation. Transform user prompts into technically perfect prompts optimized for the specified camera distance.

CRITICAL DISTANCE OPTIMIZATION:

CAMERA DISTANCE: ${distance} meters - ${distanceDescription}

QUALITY FOCUS FOR THIS DISTANCE: ${qualityFocus}

MANDATORY ELEMENTS (Always include):

1. DISTANCE-SPECIFIC CLARITY:
- Close (0-1.5m): "extreme close-up detail, macro-level sharpness, every texture visible, intimate view"
- Medium (1.5-3m): "medium shot maintaining facial clarity, professional portrait sharpness, balanced detail"
- Wide (3-6m): "wide angle preserving facial recognition, all subjects clearly identifiable, no detail loss at distance"
- Very Wide (6m+): "ultra-wide maintaining subject clarity, distant elements sharp and recognizable, panoramic precision"

2. UNIVERSAL QUALITY: "everything in crystal clear sharp focus, no blur anywhere, front-to-back sharpness, high depth of field ensuring all elements visible, 8k ultra detailed"

3. CAMERA & COMPOSITION:
- Shot from ${distance} meters
- Appropriate framing for distance
- Professional composition
- Balanced exposure

4. LIGHTING: "professional lighting setup, even illumination, no harsh shadows, natural or studio lighting, clear visibility of all elements"

5. FACES (When people present): "realistic human faces clearly visible and sharp even at ${distance}m distance, natural skin tones, detailed facial features recognizable, clear eyes, proper proportions, no distortion"

6. BACKGROUND: "clear detailed background, visible surroundings, contextual environment sharp and defined"

OUTPUT: Enhanced prompt only, max 100 words, natural language. Focus on maintaining quality at the specified distance.

Now enhance this prompt:`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemContent
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 180
    });

    const enhanced = response.choices[0]?.message?.content?.trim() || userPrompt;
    console.log('🎨 Original:', userPrompt);
    console.log('📏 Distance:', distance, 'meters');
    console.log('🎯 Quality Focus:', qualityFocus);
    console.log('🤖 AI-Enhanced:', enhanced);
    return enhanced;
  } catch (error) {
    console.error('AI enhancement failed, using basic:', error);
    return enhancePromptBasic(userPrompt, distance);
  }
}

function enhancePromptBasic(userPrompt: string, distance: number = 2.5): string {
  const prompt = userPrompt.toLowerCase();
  
  let distanceDesc = '';
  let qualityBoost = '';
  
  if (distance <= 1.5) {
    distanceDesc = ', extreme close-up from ' + distance + ' meters, macro detail';
    qualityBoost = ', ultra-sharp foreground, every texture visible, intimate view';
  } else if (distance <= 3) {
    distanceDesc = ', medium shot from ' + distance + ' meters, balanced framing';
    qualityBoost = ', facial features sharp and defined, professional portrait quality';
  } else if (distance <= 6) {
    distanceDesc = ', wide shot from ' + distance + ' meters, full scene';
    qualityBoost = ', maintain facial clarity at distance, all subjects clearly visible and identifiable';
  } else {
    distanceDesc = ', establishing shot from ' + distance + ' meters, expansive view';
    qualityBoost = ', ultra-wide maintaining sharpness, distant subjects recognizable, panoramic clarity';
  }
  
  let enhancement = distanceDesc + qualityBoost + ', everything in crystal clear focus, no blur, clear background, detailed surroundings, photorealistic 8k';
  
  if (/person|people|man|woman|couple|portrait|face|student/i.test(prompt)) {
    if (distance > 3) {
      enhancement += ', faces clearly visible and sharp even at ' + distance + 'm distance, each person identifiable';
    } else {
      enhancement += ', detailed faces, natural skin tones, clear eyes';
    }
  } else if (/interior|room|shop|cafe|kitchen|indoor|classroom/i.test(prompt)) {
    enhancement += ', professional interior photography, warm lighting, all elements sharp';
  } else if (/landscape|mountain|sunset|nature|forest|beach/i.test(prompt)) {
    enhancement += ', professional landscape photography, golden hour lighting, sharp from foreground to infinity';
  }
  
  return userPrompt + enhancement;
}

function needsDallEForSure(prompt: string): boolean {
  const lowerPrompt = prompt.toLowerCase();
  const hasMultiplePeople = /(\d+|several|many|group of)\s*(people|persons|students|friends|team|family)/i.test(prompt);
  const needsPerfectFaces = /passport photo|id photo|professional headshot|linkedin photo|profile picture/i.test(prompt);
  const complexPortrait = /detailed portrait|close-up portrait|facial expression|looking directly at camera/i.test(prompt);
  return (hasMultiplePeople || needsPerfectFaces || complexPortrait);
}

async function generateWithPollinations(prompt: string, size: string, consistent: boolean = true): Promise<string> {
  const maxLength = 450;
  let finalPrompt = prompt;
  
  if (prompt.length > maxLength) {
    console.log('⚠️ Prompt too long, trimming to', maxLength, 'chars');
    finalPrompt = prompt.substring(0, maxLength);
  }
  
  const qualityBoost = ', RAW photo, 8k uhd, dslr, high quality, film grain, sharp focus, physically-based rendering, extreme detail description, professional, vivid colors, bokeh';
  const negativePrompt = 'blurry, soft, low quality, low resolution, distorted, ugly, bad anatomy, poorly drawn, amateur, watermark, text, logo, signature, jpeg artifacts, compression, noise, grainy, oversaturated, plastic, cartoon, 3d render, anime, painting, illustration';
  
  const enhancedPrompt = finalPrompt + qualityBoost;
  const encoded = encodeURIComponent(enhancedPrompt);
  const negEncoded = encodeURIComponent(negativePrompt);
  const [w, h] = size.split('x').map(Number);
  
  let seedValue = -1;
  if (consistent) {
    seedValue = Math.abs(Array.from(finalPrompt).reduce((hash, char) => {
      return ((hash << 5) - hash) + char.charCodeAt(0);
    }, 0)) % 1000000;
    console.log('🎯 Using consistent seed:', seedValue);
  } else {
    console.log('🎲 Using random seed for variations');
  }
  
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=${w}&height=${h}&nologo=true&enhance=true&model=flux&seed=${seedValue}&negative=${negEncoded}`;
  
  console.log('✅ Using FREE model with quality optimization');
  console.log('📐 Size:', size, `(${w}x${h})`);
  console.log('📏 Enhanced prompt length:', enhancedPrompt.length);
  console.log('🎨 Quality boosters: RAW photo, 8k, sharp focus, professional');
  
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/png,image/jpeg,image/webp,image/*',
        'Accept-Encoding': 'gzip, deflate, br'
      }
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ Pollinations error:', res.status, errorText);
      throw new Error(`Generation failed: ${res.status}`);
    }
    
    const blob = await res.blob();
    const sizeInMB = (blob.size / 1024 / 1024).toFixed(2);
    console.log('✅ Image generated:', blob.size, 'bytes (', sizeInMB, 'MB)');
    
    const buffer = await blob.arrayBuffer();
    const b64 = Buffer.from(buffer).toString('base64');
    
    return `data:image/png;base64,${b64}`;
  } catch (error) {
    console.error('❌ Generation error:', error);
    throw error;
  }
}

async function generateWithDallE(prompt: string, quality: any, style: any): Promise<string> {
  console.log('💰 Using DALL-E 3 (Premium)');
  const res = await openai.images.generate({ 
    model: 'dall-e-3', 
    prompt: prompt, 
    n: 1, 
    size: '1024x1024', 
    quality: quality || 'standard', 
    style: style || 'vivid' 
  });
  const url = res.data[0]?.url;
  if (!url) throw new Error('No image');
  const imgRes = await fetch(url);
  const blob = await imgRes.blob();
  const buffer = await blob.arrayBuffer();
  const b64 = Buffer.from(buffer).toString('base64');
  return `data:image/png;base64,${b64}`;
}

export async function POST(request: NextRequest) {
  try {
    const body: TextToImageRequest = await request.json();
    let { prompt, model, size, quality, style, distance = 2.5, consistent = true } = body;
    
    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Prompt required' }, { status: 400 });
    }
    
    console.log('📸 Camera distance:', distance, 'meters');
    console.log('🎯 Consistent mode:', consistent ? 'ON (same prompt = same image)' : 'OFF (random variations)');
    
    let imageUrl: string;
    let actualModel: string;
    let costEstimate: string;
    let enhancedPrompt: string;
    let strategy: string;
    
    if (model === 'auto') {
      const definitelyNeedsDallE = needsDallEForSure(prompt);
      
      if (definitelyNeedsDallE && process.env.OPENAI_API_KEY) {
        console.log('🎯 Strategy: Complex portrait → DALL-E 3');
        enhancedPrompt = await enhancePromptWithAI(prompt, distance);
        imageUrl = await generateWithDallE(enhancedPrompt, quality, style);
        actualModel = 'dall-e-3';
        costEstimate = quality === 'hd' ? '$0.08' : '$0.04';
        strategy = 'DALL-E 3 (Complex portrait)';
      } else {
        console.log('🎯 Strategy: AI-enhanced → Free model');
        enhancedPrompt = await enhancePromptWithAI(prompt, distance);
        imageUrl = await generateWithPollinations(enhancedPrompt, size, consistent);
        actualModel = 'stable-diffusion-enhanced';
        costEstimate = process.env.OPENAI_API_KEY ? '$0.0003' : '$0.00';
        strategy = 'AI-Enhanced Free';
      }
    } else if (model === 'dall-e-3') {
      enhancedPrompt = await enhancePromptWithAI(prompt, distance);
      imageUrl = await generateWithDallE(enhancedPrompt, quality, style);
      actualModel = 'dall-e-3';
      costEstimate = quality === 'hd' ? '$0.08' : '$0.04';
      strategy = 'DALL-E 3 (Manual)';
    } else {
      enhancedPrompt = await enhancePromptWithAI(prompt, distance);
      imageUrl = await generateWithPollinations(enhancedPrompt, size, consistent);
      actualModel = 'stable-diffusion-enhanced';
      costEstimate = process.env.OPENAI_API_KEY ? '$0.0003' : '$0.00';
      strategy = 'AI-Enhanced Free (Manual)';
    }
    
    return NextResponse.json({ 
      imageUrl, 
      originalPrompt: prompt,
      enhancedPrompt,
      model: actualModel,
      strategy,
      costEstimate,
      distance,
      consistent,
      size 
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
