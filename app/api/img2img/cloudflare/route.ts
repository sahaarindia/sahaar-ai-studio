import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const {
      prompt,
      mainImageUrl,
      imageUrl,
      strength = 0.7,  // ✅ Increased default strength
      num_steps = 20,  // ✅ Fixed to max 20
      guidance = 7.5,
      seed,
    } = await req.json();

    // Support both field names
    const actualImageUrl = mainImageUrl || imageUrl;

    if (!prompt || !actualImageUrl) {
      return NextResponse.json(
        { error: 'Prompt and image URL required' },
        { status: 400 }
      );
    }

    console.log('☁️ Cloudflare Workers AI (img2img)');
    console.log('📝 Prompt:', prompt);
    console.log('🖼️ Image URL:', actualImageUrl);
    console.log('⚡ Strength:', strength);
    console.log('🔢 Steps:', num_steps);

    const endpoint =
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}` +
      `/ai/run/@cf/runwayml/stable-diffusion-v1-5-img2img`;

    // Fetch image and convert to array
    const imgResponse = await fetch(actualImageUrl);
    if (!imgResponse.ok) {
      throw new Error('Failed to fetch image from URL');
    }

    const imageBuffer = await imgResponse.arrayBuffer();
    const imageArray = Array.from(new Uint8Array(imageBuffer));

    const payload: Record<string, any> = {
      prompt,
      image: imageArray,
      strength: Math.min(Math.max(strength, 0.1), 0.9), // ✅ Clamp between 0.1-0.9
      num_steps: Math.min(num_steps || 20, 20), // ✅ Ensure max 20
      guidance,
    };

    if (seed !== undefined) payload.seed = seed;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      console.error('❌ Cloudflare failed:', response.status, errorBody.slice(0, 200));
      throw new Error(`Cloudflare API error: ${response.status}`);
    }

    // Convert response to base64
    const imageBuffer2 = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer2).toString('base64');
    const dataUrl = `data:image/png;base64,${base64Image}`;

    console.log('✅ Cloudflare success!');
    console.log('📦 Image size:', (base64Image.length / 1024).toFixed(2), 'KB');

    return NextResponse.json({
      imageUrl: dataUrl,
      provider: 'cloudflare'
    });

  } catch (e: any) {
    console.error('❌ Cloudflare error:', e);
    return NextResponse.json(
      { error: e?.message || 'Cloudflare img2img failed' },
      { status: 500 }
    );
  }
}
