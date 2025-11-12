import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Please provide text to check' },
        { status: 400 }
      );
    }

    if (text.length > 10000) {
      return NextResponse.json(
        { error: 'Text too long. Maximum 10,000 characters allowed.' },
        { status: 400 }
      );
    }

    console.log(`[Grammar Checker] Processing ${text.length} characters`);

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert grammar and style checker. Analyze the provided text and return a JSON object with:

{
  "correctedText": "The fully corrected version of the text",
  "errors": [
    {
      "type": "grammar|spelling|punctuation|style",
      "original": "the incorrect text",
      "suggestion": "the correct version",
      "explanation": "brief explanation of the error",
      "position": "approximate position in text"
    }
  ],
  "score": 85,
  "summary": "Brief summary of issues found"
}

Rules:
- Detect grammar errors, spelling mistakes, punctuation issues, and style improvements
- Provide clear explanations for each error
- Score from 0-100 (100 = perfect)
- Return ONLY valid JSON, no other text`
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.3,
      max_tokens: 2500,
      response_format: { type: "json_object" }
    });

    const result = completion.choices[0]?.message?.content?.trim();

    if (!result) {
      throw new Error('Failed to analyze text');
    }

    const analysis = JSON.parse(result);

    console.log(`[Grammar Checker] ✓ Found ${analysis.errors?.length || 0} issues`);

    return NextResponse.json({
      ...analysis,
      originalText: text,
      wordCount: text.split(/\s+/).length,
    });

  } catch (error: any) {
    console.error('[Grammar Checker] Error:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to check grammar',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
