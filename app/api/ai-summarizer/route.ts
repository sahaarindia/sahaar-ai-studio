import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { OpenAI } from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// YouTube transcript extraction
async function extractYouTubeTranscript(url: string): Promise<string> {
  try {
    // Extract video ID from URL
    const videoIdMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (!videoIdMatch) {
      throw new Error('Invalid YouTube URL');
    }
    
    const videoId = videoIdMatch[1];
    
    // Use youtube-transcript package
    const { YoutubeTranscript } = await import('youtube-transcript');
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    
    // Combine all transcript segments
    const text = transcript.map((item: any) => item.text).join(' ');
    return text;
    
  } catch (error: any) {
    console.error('YouTube transcript error:', error);
    if (error.message?.includes('Transcript is disabled')) {
      throw new Error('This video does not have captions/subtitles available');
    }
    throw new Error('Failed to extract YouTube transcript. Video may be private or captions may be disabled.');
  }
}

// Extract text from URL
async function extractTextFromURL(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Remove unwanted elements
    $('script, style, nav, footer, header, iframe, ads, .ad, .advertisement').remove();
    
    // Try to get main content
    let text = '';
    const contentSelectors = ['article', 'main', '.content', '.post-content', '.entry-content', '.article-body'];
    
    for (const selector of contentSelectors) {
      const content = $(selector).text();
      if (content && content.length > 100) {
        text = content;
        break;
      }
    }
    
    // Fallback to body
    if (!text || text.length < 100) {
      text = $('body').text();
    }
    
    // Clean up whitespace
    return text.replace(/\s+/g, ' ').trim();
    
  } catch (error) {
    console.error('URL extraction error:', error);
    throw new Error('Failed to extract text from URL. Please check if the URL is accessible.');
  }
}

// Extract text from PDF
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF. File might be corrupted or password-protected.');
  }
}

// Extract text from DOCX
async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('DOCX extraction error:', error);
    throw new Error('Failed to extract text from DOCX. File might be corrupted.');
  }
}

// Extract text from TXT
function extractTextFromTXT(buffer: Buffer): string {
  return buffer.toString('utf-8');
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const targetWords = parseInt(formData.get('targetWords') as string) || 500;
    
    console.log('[AI Summarizer] Starting extraction...');
    
    // Extract text from all sources
    const extractedTexts: string[] = [];
    const sourceTypes: string[] = [];
    
    // Process all form data entries
    for (const [key, value] of formData.entries()) {
      try {
        if (key.startsWith('url_') && typeof value === 'string') {
          console.log(`[AI Summarizer] Extracting from URL: ${value}`);
          const text = await extractTextFromURL(value);
          extractedTexts.push(text);
          sourceTypes.push('URL');
          
        } else if (key.startsWith('youtube_') && typeof value === 'string') {
          console.log(`[AI Summarizer] Extracting YouTube transcript: ${value}`);
          const text = await extractYouTubeTranscript(value);
          extractedTexts.push(text);
          sourceTypes.push('YouTube');
          
        } else if (key.startsWith('text_') && typeof value === 'string') {
          console.log('[AI Summarizer] Processing text input');
          extractedTexts.push(value);
          sourceTypes.push('Text');
          
        } else if (key.startsWith('file_') && value instanceof File) {
          console.log(`[AI Summarizer] Processing file: ${value.name}`);
          const buffer = Buffer.from(await value.arrayBuffer());
          const fileName = value.name.toLowerCase();
          
          let text = '';
          if (fileName.endsWith('.pdf')) {
            text = await extractTextFromPDF(buffer);
            sourceTypes.push('PDF');
          } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
            text = await extractTextFromDOCX(buffer);
            sourceTypes.push('DOCX');
          } else if (fileName.endsWith('.txt')) {
            text = extractTextFromTXT(buffer);
            sourceTypes.push('TXT');
          }
          
          if (text) extractedTexts.push(text);
        }
      } catch (error) {
        console.error(`Error processing ${key}:`, error);
        // Continue with other sources even if one fails
      }
    }
    
    if (extractedTexts.length === 0) {
      return NextResponse.json(
        { error: 'No text could be extracted from provided sources' },
        { status: 400 }
      );
    }
    
    // Combine all extracted texts
    const combinedText = extractedTexts.join('\n\n---\n\n');
    console.log(`[AI Summarizer] Combined text length: ${combinedText.length} characters from ${extractedTexts.length} sources`);
    
    // Limit input text (OpenAI has token limits)
    const maxChars = 50000; // ~12,500 words
    const textToSummarize = combinedText.length > maxChars 
      ? combinedText.substring(0, maxChars) + '...[truncated]'
      : combinedText;
    
    // Generate summary using OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    console.log(`[AI Summarizer] Generating ${targetWords}-word summary...`);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo-16k',
      messages: [
        {
          role: 'system',
          content: `You are an expert summarizer. Create a comprehensive, well-structured summary of approximately ${targetWords} words. 
          
Guidelines:
- Be concise but informative
- Maintain key facts and important details
- Use clear, professional language
- Organize information logically
- Target length: ${targetWords} words (±10%)
- If multiple sources are provided, synthesize information cohesively`
        },
        {
          role: 'user',
          content: `Please summarize the following text in approximately ${targetWords} words:\n\n${textToSummarize}`
        }
      ],
      temperature: 0.7,
      max_tokens: Math.ceil(targetWords * 1.5), // Allow some buffer
    });
    
    const summary = completion.choices[0]?.message?.content || '';
    
    if (!summary) {
      throw new Error('Failed to generate summary');
    }
    
    console.log(`[AI Summarizer] ✓ Summary generated: ${summary.split(' ').length} words`);
    
    return NextResponse.json({
      summary,
      sourceCount: extractedTexts.length,
      sourceTypes,
      wordCount: summary.split(' ').length,
      originalLength: combinedText.length,
    });
    
  } catch (error: any) {
    console.error('[AI Summarizer] Error:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to generate summary',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
