import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { ENCOUNTER_SYSTEM_PROMPT } from '@/lib/protocols';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const transcript = formData.get('transcript') as string | null;

    if (!transcript || !transcript.trim()) {
      return NextResponse.json(
        { error: 'No transcript provided. Please record your encounter or enter text manually.' },
        { status: 400 }
      );
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: ENCOUNTER_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Here is a transcript from a simulated EMS patient encounter. Please provide your full analysis:\n\n${transcript}`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'Unexpected response type' }, { status: 500 });
    }

    return NextResponse.json({ analysis: content.text });
  } catch (error) {
    console.error('Analyze encounter API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze encounter' },
      { status: 500 }
    );
  }
}
