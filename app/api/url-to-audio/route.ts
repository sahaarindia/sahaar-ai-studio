import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function extractTextFromURL(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    
    $('script, style, nav, footer, header, iframe').remove();
    
    let text = '';
    $('article, main, .content, .post, p, h1, h2, h3, h4, h5, h6').each((_, element) => {
      text += $(element).text() + ' ';
    });
    
    if (text.trim().length < 100) {
      text = $('body').text();
    }
    
    return text.replace(/\s+/g, ' ').trim();
  } catch (error) {
    console.error('URL extraction error:', error);
    throw new Error('Failed to extract text from URL. Please check if URL is accessible.');
  }
}

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF. File might be corrupted or password-protected.');
  }
}

async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('DOCX extraction error:', error);
    throw new Error('Failed to extract text from DOCX. File might be corrupted.');
  }
}

function extractTextFromTXT(buffer: Buffer): string {
  return buffer.toString('utf-8');
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const url = formData.get('url') as string;
    const file = formData.get('file') as File;
    const voiceId = formData.get('voiceId') as string;
    const modelId = formData.get('modelId') as string;

    console.log('Processing request with voice:', voiceId);

    let text = '';

    if (url) {
      console.log('Extracting text from URL:', url);
      text = await extractTextFromURL(url);
    } else if (file) {
      console.log('Extracting text from file:', file.name);
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = file.name.toLowerCase();
      
      if (fileName.endsWith('.pdf')) {
        text = await extractTextFromPDF(buffer);
      } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
        text = await extractTextFromDOCX(buffer);
      } else if (fileName.endsWith('.txt')) {
        text = extractTextFromTXT(buffer);
      } else {
        return NextResponse.json(
          { error: 'Unsupported file format. Please use PDF, DOCX, or TXT.' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Please provide a URL or file' },
        { status: 400 }
      );
    }

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'No text could be extracted. Please check your source.' },
        { status: 400 }
      );
    }

    // Limit text length
    const maxChars = 5000;
    if (text.length > maxChars) {
      console.log(`Text too long (${text.length} chars), truncating to ${maxChars}`);
      text = text.substring(0, maxChars) + '...';
    }

    console.log(`Extracted ${text.length} characters, generating audio with voice ${voiceId}...`);

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 }
      );
    }

    // Generate audio
    const elevenLabsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: modelId || 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text();
      console.error('ElevenLabs API error:', errorText);
      
      // Parse error message
      try {
        const errorJson = JSON.parse(errorText);
        return NextResponse.json(
          { error: `Voice error: ${errorJson.detail?.message || errorJson.message || 'Voice not available'}` },
          { status: 500 }
        );
      } catch {
        return NextResponse.json(
          { error: 'This voice is not available. Please try another voice.' },
          { status: 500 }
        );
      }
    }

    const audioBuffer = await elevenLabsResponse.arrayBuffer();
    console.log('Audio generated successfully, size:', audioBuffer.byteLength);
    
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'attachment; filename="url-to-audio.mp3"',
      },
    });

  } catch (error) {
    console.error('Error in url-to-audio API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process request' },
      { status: 500 }
    );
  }
}
