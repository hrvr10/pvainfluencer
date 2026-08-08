import { NextResponse } from 'next/server';
import { anthropic, VISION_MODEL } from '@/lib/anthropic';
import { verifyIdToken } from '@/lib/verifyAuth';

export async function POST(req: Request) {
  const uid = await verifyIdToken(req);
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Extraction is not configured on the server.' }, { status: 503 });
  }

  const { imageBase64, mediaType } = await req.json();
  if (!imageBase64) {
    return NextResponse.json({ error: 'No image provided' }, { status: 400 });
  }

  try {
    const message = await anthropic.messages.create({
      model: VISION_MODEL,
      max_tokens: 512,
      tools: [
        {
          name: 'extract_conversation',
          description: 'Summarize a chat/DM screenshot between a brand and an influencer.',
          input_schema: {
            type: 'object',
            properties: {
              summary: {
                type: 'string',
                description:
                  'A concise 1-3 sentence summary of what was discussed in the visible messages, written from the brand\'s perspective (e.g. "Sent the rate card, they asked for two extra reels").',
              },
              nextFollowUp: {
                type: 'string',
                description:
                  'If a specific future date is mentioned for following up or a deadline, return it as YYYY-MM-DD. Empty string if no date is mentioned.',
              },
            },
            required: ['summary', 'nextFollowUp'],
          },
        },
      ],
      tool_choice: { type: 'tool', name: 'extract_conversation' },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
            { type: 'text', text: 'Summarize this chat screenshot for a CRM log entry.' },
          ],
        },
      ],
    });

    const toolUse = message.content.find((b) => b.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') {
      return NextResponse.json({ error: 'Could not summarize that image.' }, { status: 502 });
    }
    return NextResponse.json(toolUse.input);
  } catch (err) {
    console.error('extract-conversation failed', err);
    return NextResponse.json({ error: 'Extraction failed.' }, { status: 502 });
  }
}
