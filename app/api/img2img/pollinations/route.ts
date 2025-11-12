import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const {
      prompt,
      mainImageUrl,
      imageUrl,
      strength = 0.7, // ✅ Increased default
      width = 1024,
      height = 1024,
      model = 'turbo'
    } = await req.json();

    const actualImageUrl = mainImageUrl || imageUrl;

    if (!prompt || !actualImageUrl) {
      return NextResponse.json(
        { error: 'Prompt and image URL required' },
        { status: 400 }
      );
    }

    console.log('🎨 Pollinations API called');
    console.log('📝 Prompt:', prompt);
    console.log('🖼️ Main Image:', actualImageUrl);
    console.log('⚡ Strength:', strength);

    // ✅ Enhanced prompt handling
    let enhancedPrompt = prompt;
    if (prompt.toLowerCase().includes('transform') || 
        prompt.toLowerCase().includes('convert') ||
        prompt.toLowerCase().includes('change')) {
      enhancedPrompt = `${prompt}, high quality, detailed, artistic style`;
    }

    console.log('✨ Enhanced prompt:', enhancedPrompt);

    // ✅ Build Pollinations URL with proper parameters
    const params = new URLSearchParams({
      prompt: enhancedPrompt,
      model: model,
      width: width.toString(),
      height: height.toString(),
      nologo: 'true',
      seed: Date.now().toString(),
      image: actualImageUrl // ✅ Pass the actual image for img2img
    });

    const url = `https://image.pollinations.ai/prompt?${params.toString()}`;

    console.log('🌐 Fetching from Pollinations...');
    console.log('🔗 URL:', url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Pollinations API error: ${response.status}`);
    }

    console.log('📄 Content-Type:', response.headers.get('content-type'));

    // Get image as buffer
    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64Image}`;

    console.log('✅ Pollinations success!');
    console.log('📦 Image size:', (base64Image.length / 1024).toFixed(2), 'KB');

    return NextResponse.json({
      imageUrl: dataUrl,
      provider: 'pollinations'
    });

  } catch (e: any) {
    console.error('❌ Pollinations error:', e);
    return NextResponse.json(
      { error: e?.message || 'Pollinations img2img failed' },
      { status: 500 }
    );
  }
}
