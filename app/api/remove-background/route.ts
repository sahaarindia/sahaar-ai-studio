import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { readFile } from 'fs/promises';

const execPromise = promisify(exec);

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  let inputPath: string | null = null;
  let outputPath: string | null = null;

  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image too large (max 10MB)' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    console.log(`[RemoveBackground] Processing ${file.name} (${file.size} bytes)`);

    const timestamp = Date.now();
    const inputExt = path.extname(file.name) || '.jpg';
    inputPath = `/tmp/input-${timestamp}${inputExt}`;
    outputPath = `/tmp/output-${timestamp}.png`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(inputPath, buffer);

    // SIMPLE: Just model, no heavy post-processing
    const command = `source ~/rembg-venv/bin/activate && rembg i -m u2net_human_seg "${inputPath}" "${outputPath}"`;
    
    console.log('[RemoveBackground] Simple mode - preserving quality');
    
    await execPromise(command, {
      shell: '/bin/bash',
      timeout: 45000,
    });

    const outputBuffer = await readFile(outputPath);
    
    await unlink(inputPath);
    await unlink(outputPath);

    console.log(`[RemoveBackground] ✓ Success: ${outputBuffer.length} bytes`);

    return new NextResponse(outputBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': outputBuffer.length.toString(),
      },
    });

  } catch (error: any) {
    console.error('[RemoveBackground] Error:', error);

    if (inputPath) {
      try { await unlink(inputPath); } catch {}
    }
    if (outputPath) {
      try { await unlink(outputPath); } catch {}
    }

    return NextResponse.json(
      { 
        error: error.message || 'Failed to remove background',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
