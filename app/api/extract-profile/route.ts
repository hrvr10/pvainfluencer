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
          name: 'extract_profile',
          description: 'Extract influencer profile details visible in a social media profile screenshot.',
          input_schema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Display name shown on the profile. Empty string if not visible.' },
              handle: { type: 'string', description: 'Username/handle, including the leading @. Empty string if not visible.' },
              platform: {
                type: 'string',
                enum: ['instagram', 'youtube', 'tiktok', 'twitter', 'other'],
                description: 'Which platform this screenshot is from, based on UI style.',
              },
              followers: {
                type: 'number',
                description: 'Follower count as a plain integer, converting abbreviations like 12.4K or 1.2M. 0 if not visible.',
              },
              niche: {
                type: 'string',
                description: 'A short 1-3 word guess at content niche/category based on the bio. Empty string if unclear.',
              },
            },
            required: ['name', 'handle', 'platform', 'followers', 'niche'],
          },
        },
      ],
      tool_choice: { type: 'tool', name: 'extract_profile' },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
            { type: 'text', text: 'Extract the influencer profile details from this screenshot.' },
          ],
        },
      ],
    });

    const toolUse = message.content.find((b) => b.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') {
      return NextResponse.json({ error: 'Could not extract details from that image.' }, { status: 502 });
    }
    return NextResponse.json(toolUse.input);
  } catch (err) {
    console.error('extract-profile failed', err);
    return NextResponse.json({ error: 'Extraction failed.' }, { status: 502 });
  }
}
