import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  readTime: string;
  type: 'website' | 'youtube';
}

export async function POST(request: NextRequest) {
  try {
    const { topic } = await request.json();
    
    if (!topic || topic.trim().length < 3) {
      return NextResponse.json(
        { error: 'Please provide a valid topic (minimum 3 characters)' },
        { status: 400 }
      );
    }

    console.log(`[Find URLs] Searching for: ${topic}`);

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a research assistant. Generate 10-12 relevant sources for a given topic, including BOTH websites and YouTube videos.

IMPORTANT: 
- Include 5-6 website articles (news, blogs, research papers)
- Include 5-6 YouTube videos (educational content, tutorials, documentaries)
- Use real, authoritative domain names
- For YouTube, use format: https://youtube.com/watch?v=VIDEOID

Return a valid JSON object with "results" array:
{
  "results": [
    {
      "title": "Article or video title",
      "url": "https://website.com/article OR https://youtube.com/watch?v=xxx",
      "snippet": "Brief 2-3 sentence description",
      "source": "Website Name or Channel Name",
      "readTime": "5 min" (for websites) or "15 min video" (for YouTube),
      "type": "website" or "youtube"
    }
  ]
}

Guidelines:
- Mix websites and YouTube videos equally
- Websites: techcrunch.com, wired.com, mit.edu, nature.com, bbc.com, theverge.com, medium.com, etc.
- YouTube: Popular educational channels, verified sources, quality content
- Provide informative descriptions
- For videos, indicate duration (e.g., "15 min video")
- Focus on relevant, high-quality sources
- NO social media posts or low-quality content`
        },
        {
          role: 'user',
          content: `Find 10-12 relevant sources (mix of websites and YouTube videos) about: "${topic}"

Include both article URLs and YouTube video URLs with educational/informative content.`
        }
      ],
      temperature: 0.8,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response from AI');
    }

    let parsed;
    try {
      parsed = JSON.parse(response);
    } catch (parseError) {
      console.error('Parse error:', parseError);
      throw new Error('Failed to parse AI response');
    }

    const results = parsed.results || [];

    if (results.length === 0) {
      throw new Error('No sources found for this topic');
    }

    // Auto-detect type if not specified
    const processedResults = results.map((result: any) => ({
      ...result,
      type: result.type || (result.url?.includes('youtube.com') || result.url?.includes('youtu.be') ? 'youtube' : 'website')
    }));

    console.log(`[Find URLs] Generated ${processedResults.length} sources (websites + YouTube)`);

    return NextResponse.json({
      results: processedResults.slice(0, 12),
      count: processedResults.length,
      topic: topic
    });

  } catch (error: any) {
    console.error('[Find URLs] Error:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to find sources',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
