import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'File required' }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const safeName = (file.name || 'image')
      .replace(/[^a-z0-9._-]/gi, '_')
      .toLowerCase();

    const dir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(dir, { recursive: true });

    const filename = `${Date.now()}_${safeName}`;
    await fs.writeFile(path.join(dir, filename), bytes);

    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const url = `${base}/uploads/${filename}`;

    console.log('✅ File uploaded:', url);

    return NextResponse.json({ url, filename });
  } catch (e: any) {
    console.error('❌ Upload failed:', e);
    return NextResponse.json(
      { error: e?.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
