import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

// ✅ Smart prompt processing function
function processUserPrompt(prompt: string, hasReferenceImage: boolean): string {
  let processedPrompt = prompt;
  
  // ✅ Background replacement enhancement
  if (prompt.toLowerCase().includes('background') || 
      prompt.toLowerCase().includes('replace') ||
      prompt.toLowerCase().includes('change background') ||
      prompt.toLowerCase().includes('new background')) {
    processedPrompt = `${prompt}, keep main subject unchanged, seamless blending, professional lighting, natural appearance`;
  }
  
  // ✅ Style conversion enhancement
  if (prompt.toLowerCase().includes('style') || 
      prompt.toLowerCase().includes('convert') ||
      prompt.toLowerCase().includes('transform') ||
      prompt.toLowerCase().includes('make it')) {
    processedPrompt = `${prompt}, high quality, detailed, artistic composition, professional result`;
  }
  
  // ✅ Art/Media specific enhancement
  if (prompt.toLowerCase().includes('painting') || 
      prompt.toLowerCase().includes('oil') ||
      prompt.toLowerCase().includes('watercolor') ||
      prompt.toLowerCase().includes('sketch')) {
    processedPrompt = `${prompt}, traditional art style, detailed brushstrokes, artistic masterpiece`;
  }
  
  // ✅ Anime/Cartoon enhancement
  if (prompt.toLowerCase().includes('anime') || 
      prompt.toLowerCase().includes('cartoon') ||
      prompt.toLowerCase().includes('manga')) {
    processedPrompt = `${prompt}, anime style, clean lines, vibrant colors, Japanese animation style`;
  }
  
  // ✅ Person/Face enhancement
  if (prompt.toLowerCase().includes('person') || 
      prompt.toLowerCase().includes('face') ||
      prompt.toLowerCase().includes('people') ||
      prompt.toLowerCase().includes('someone')) {
    processedPrompt = `${prompt}, maintain facial features, natural expression, preserve identity`;
  }
  
  // ✅ Professional/Corporate enhancement
  if (prompt.toLowerCase().includes('professional') || 
      prompt.toLowerCase().includes('office') ||
      prompt.toLowerCase().includes('corporate') ||
      prompt.toLowerCase().includes('business')) {
    processedPrompt = `${prompt}, professional setting, clean background, business appropriate, high quality`;
  }
  
  // ✅ Nature/Outdoor enhancement
  if (prompt.toLowerCase().includes('beach') || 
      prompt.toLowerCase().includes('mountain') ||
      prompt.toLowerCase().includes('forest') ||
      prompt.toLowerCase().includes('nature') ||
      prompt.toLowerCase().includes('outdoor')) {
    processedPrompt = `${prompt}, natural lighting, beautiful scenery, realistic landscape`;
  }
  
  // ✅ Reference image integration
  if (hasReferenceImage) {
    processedPrompt = `${processedPrompt}, use reference image as guidance for style and composition`;
  }
  
  return processedPrompt;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    // ✅ Extract and validate form data
    const mainImage = formData.get('mainImage') as File;
    const prompt = formData.get('prompt') as string;
    const strengthValue = formData.get('strength') as string;
    const style = formData.get('style') as string;
    const tier = formData.get('tier') as string;

    // ✅ Convert strength from percentage to decimal
    const strength = parseInt(strengthValue || '35') / 100;
    
    // ✅ Clamp strength between 0.1 and 0.9
    const clampedStrength = Math.min(Math.max(strength, 0.1), 0.9);

    if (!mainImage || !prompt) {
      return NextResponse.json(
        { error: 'Main image and prompt are required' },
        { status: 400 }
      );
    }

    console.log('🎨 Image-to-Image transformation started');
    console.log('📝 Original Prompt:', prompt);
    console.log('⚡ Strength:', clampedStrength);
    console.log('🎭 Style:', style);
    console.log('💎 Tier:', tier);

    // ✅ Upload main image
    const mainImageUrl = await uploadImage(mainImage, 'main');

    // ✅ Handle reference images
    const referenceImages: string[] = [];
    const maxReferences = tier === 'premium' ? 3 : 1;

    for (let i = 0; i < maxReferences; i++) {
      const refImage = formData.get(`referenceImage${i}`) as File;
      if (refImage) {
        const refUrl = await uploadImage(refImage, `ref${i}`);
        referenceImages.push(refUrl);
      }
    }

    console.log('📸 Main image uploaded:', mainImageUrl);
    console.log('🖼️ Reference images:', referenceImages.length);

    // ✅ Smart prompt enhancement based on user input
    const enhancedPrompt = processUserPrompt(prompt, referenceImages.length > 0);
    
    // ✅ Add style if specified
    let finalPrompt = enhancedPrompt;
    if (style && style !== 'auto') {
      finalPrompt = `${enhancedPrompt}, ${style} style`;
    }

    console.log('✨ Enhanced Prompt:', finalPrompt);

    // ✅ Try Cloudflare first
    try {
      console.log('☁️ Trying Cloudflare API...');
      const cloudflareResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/img2img/cloudflare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          mainImageUrl,
          strength: clampedStrength,
          num_steps: 20,
          guidance: 7.5
        }),
      });

      if (cloudflareResponse.ok) {
        const result = await cloudflareResponse.json();
        console.log('✅ Cloudflare success');
        return NextResponse.json({
          success: true,
          imageUrl: result.imageUrl,
          provider: 'cloudflare'
        });
      }
    } catch (error) {
      console.log('⚠️ Cloudflare failed:', error);
    }

    // ✅ Fallback to Pollinations
    console.log('🔄 Trying Pollinations API...');
    const pollinationsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/img2img/pollinations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: finalPrompt,
        mainImageUrl,
        strength: clampedStrength,
        width: 1024,
        height: 1024,
        model: 'turbo'
      }),
    });

    if (pollinationsResponse.ok) {
      const result = await pollinationsResponse.json();
      console.log('✅ Pollinations success');
      return NextResponse.json({
        success: true,
        imageUrl: result.imageUrl,
        provider: 'pollinations'
      });
    }

    throw new Error('Both APIs failed');

  } catch (error: any) {
    console.error('❌ Main API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// ✅ Upload helper function
async function uploadImage(file: File, prefix: string): Promise<string> {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${prefix}-${timestamp}-${file.name}`;
    const filepath = path.join(uploadsDir, filename);

    // Save file
    await writeFile(filepath, buffer);

    // Return public URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://193.203.162.129:3000';
    return `${baseUrl}/uploads/${filename}`;
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error('Failed to upload image');
  }
}
