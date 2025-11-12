import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DEFAULT_TOPICS = [
  "AI और Machine Learning का भविष्य",
  "Digital India और E-governance",
  "Startup Ecosystem in India",
  "Cricket ki popularity aur IPL",
  "Indian Education System में सुधार",
  "Social Media का impact युवाओं पर",
  "Climate Change और Environment",
  "Healthcare और Medical Technology",
  "Cryptocurrency और Blockchain",
  "Indian Cinema का evolution",
  "Remote Work और Future of Jobs",
  "5G Technology और इसके फायदे"
];

const LENGTH_CONFIG = {
  short: {
    exchanges: "4-6",
    duration: "~1 minute",
    words: "150-200",
    maxTokens: 400
  },
  medium: {
    exchanges: "6-8",
    duration: "~2 minutes",
    words: "250-350",
    maxTokens: 600
  },
  long: {
    exchanges: "10-12",
    duration: "~3-4 minutes",
    words: "450-600",
    maxTokens: 900
  },
  extralong: {
    exchanges: "40-50",
    duration: "~20 minutes",
    words: "3000-4000",
    maxTokens: 4000
  }
};

export async function POST(req: NextRequest) {
  try {
    const { topic, length = "long" } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const selectedTopic = topic?.trim() || DEFAULT_TOPICS[Math.floor(Math.random() * DEFAULT_TOPICS.length)];
    const config = LENGTH_CONFIG[length as keyof typeof LENGTH_CONFIG];

    console.log(`[GPT] Topic: ${selectedTopic}`);
    console.log(`[GPT] Length: ${length} (${config.exchanges} exchanges, ${config.words} words)`);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional podcast script writer. Create engaging Hindi/English podcast scripts with natural conversation.

CRITICAL FORMATTING RULES:
- Use ONLY this format: "Host: dialogue" and "Guest: dialogue"
- You can also use custom names: "Ravi: dialogue" or "Character 1: dialogue"
- DO NOT use markdown (no **, *, _, #, etc.)
- DO NOT use special characters (no [], (), {}, <>, ~, \`, |, ^, +, =)
- DO NOT use emojis or emoticons
- Keep text clean and simple - only letters, numbers, basic punctuation (. , ! ?)

CRITICAL STARTING RULE:
- ALWAYS start the podcast with "Host:" speaking first
- The very first line MUST be "Host: [greeting/introduction]"
- Guest speaks second
- Then alternate between Host and Guest

CONTENT REQUIREMENTS:
- Script length: ${length.toUpperCase()} (${config.exchanges} exchanges)
- Target duration: ${config.duration}
- Word count: ${config.words} words
- Mix Hindi and English naturally (Hinglish style)
- Make it conversational and engaging
- Each exchange should be 2-4 sentences
- Include appropriate greeting and closing based on length
- Be contextual and knowledgeable about the topic

MANDATORY FORMAT - FIRST 3 LINES EXAMPLE:
Host: नमस्ते दोस्तों! आज हम ${selectedTopic} के बारे में बात करेंगे।
Guest: बहुत interesting topic है! मुझे खुशी है यहाँ आकर।
Host: तो आपकी क्या राय है इस बारे में?
...
[Continue for ${config.exchanges} exchanges, always alternating Host and Guest]

REMEMBER: 
- NO special characters, NO markdown, ONLY clean text!
- ALWAYS start with "Host:" first!`
        },
        {
          role: "user",
          content: `Create a ${length} podcast script (${config.exchanges} exchanges, ${config.words} words) about: ${selectedTopic}

IMPORTANT: 
1. Start with "Host:" speaking first (greeting/introduction)
2. Then "Guest:" responds
3. Alternate between them
4. Use clean format with "Name: dialogue" structure
5. No special characters or markdown

Begin with Host introducing the topic!`
        }
      ],
      temperature: 0.8,
      max_tokens: config.maxTokens,
    });

    let script = completion.choices[0].message.content || "";
    
    // Verify script starts with Host
    const lines = script.split('\n').filter(line => line.trim());
    if (lines.length > 0 && lines[0]) {
      const firstLine = lines[0].trim();
      // Check if first line starts with "Host:"
      if (!firstLine.toLowerCase().startsWith('host:')) {
        console.warn('[GPT] Script did not start with Host, fixing...');
        // Prepend a Host greeting
        const greeting = `Host: नमस्ते दोस्तों! आज हम ${selectedTopic} के बारे में बात करेंगे।\n`;
        script = greeting + script;
      }
    }
    
    console.log(`[GPT] ✓ Generated: ${script.length} chars`);
    console.log(`[GPT] First line: ${script.split('\n')[0]}`);
    console.log(`[GPT] Tokens: ${completion.usage?.total_tokens || 0}`);

    return NextResponse.json({ 
      script,
      topicUsed: selectedTopic,
      estimatedDuration: config.duration,
      tokensUsed: completion.usage?.total_tokens || 0,
      length: length
    });

  } catch (error: any) {
    console.error("[GPT] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate script" },
      { status: 500 }
    );
  }
}
