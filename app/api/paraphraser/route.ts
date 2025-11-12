import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const stylePrompts = {
  professional: "Rewrite this text in a professional and business-appropriate tone. Use formal language and maintain clarity.",
  casual: "Rewrite this text in a casual, conversational tone. Make it sound friendly and relaxed.",
  academic: "Rewrite this text in an academic and scholarly tone. Use formal language and precise terminology.",
  creative: "Rewrite this text in a creative and engaging way. Use vivid language and interesting expressions.",
  simple: "Rewrite this text in simple, easy-to-understand language. Make it clear for everyone to understand.",
  formal: "Rewrite this text in a highly formal tone. Use sophisticated vocabulary and proper grammar."
};

export async function POST(request: NextRequest) {
  try {
    const { text, style = 'professional' } = await request.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Please provide text to paraphrase' },
        { status: 400 }
      );
    }

    if (text.length > 10000) {
      return NextResponse.json(
        { error: 'Text too long. Maximum 10,000 characters allowed.' },
        { status: 400 }
      );
    }

    console.log(`[Paraphraser] Processing ${text.length} characters in ${style} style`);

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const stylePrompt = stylePrompts[style as keyof typeof stylePrompts] || stylePrompts.professional;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert text paraphraser. ${stylePrompt}

Rules:
- Maintain the original meaning
- Keep the same length approximately
- Use different words and sentence structures
- Ensure grammatical correctness
- Return only the paraphrased text, no explanations`
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.8,
      max_tokens: 2000,
    });

    const paraphrasedText = completion.choices[0]?.message?.content?.trim();

    if (!paraphrasedText) {
      throw new Error('Failed to generate paraphrased text');
    }

    console.log(`[Paraphraser] ✓ Generated ${paraphrasedText.length} characters`);

    return NextResponse.json({
      original: text,
      paraphrased: paraphrasedText,
      style: style,
      originalWordCount: text.split(/\s+/).length,
      paraphrasedWordCount: paraphrasedText.split(/\s+/).length,
    });

  } catch (error: any) {
    console.error('[Paraphraser] Error:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to paraphrase text',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
