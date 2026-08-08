import { NextResponse } from 'next/server';
import { anthropic, VISION_MODEL } from '@/lib/anthropic';
import { verifyIdToken } from '@/lib/verifyAuth';
import { INFLUENCER_STAGES } from '@/lib/types';

const MAX_IMAGES = 8;
const STATUS_VALUES = [...INFLUENCER_STAGES, 'declined'];

export async function POST(req: Request) {
  const uid = await verifyIdToken(req);
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Extraction is not configured on the server.' }, { status: 503 });
  }

  const { images, currentStatus } = await req.json();
  if (!Array.isArray(images) || images.length === 0) {
    return NextResponse.json({ error: 'No images provided' }, { status: 400 });
  }
  if (images.length > MAX_IMAGES) {
    return NextResponse.json({ error: `Too many screenshots — max ${MAX_IMAGES} at once.` }, { status: 400 });
  }

  try {
    const message = await anthropic.messages.create({
      model: VISION_MODEL,
      max_tokens: 768,
      tools: [
        {
          name: 'extract_conversation',
          description:
            'Summarize one or more chat/DM screenshots between a brand and an influencer, and pull out any contact/logistics details or pipeline-stage signal mentioned in them.',
          input_schema: {
            type: 'object',
            properties: {
              summary: {
                type: 'string',
                description:
                  'A concise 1-4 sentence summary of what was discussed across all the visible messages, written from the brand\'s perspective (e.g. "Sent the rate card, they asked for two extra reels"). If the screenshots are sequential parts of one longer conversation, summarize it as a single continuous thread.',
              },
              nextFollowUp: {
                type: 'string',
                description:
                  'If a specific future date is mentioned for following up or a deadline, return it as YYYY-MM-DD. Empty string if no date is mentioned.',
              },
              email: {
                type: 'string',
                description: 'Email address the influencer shared in this conversation, if any. Empty string if none visible.',
              },
              phone: {
                type: 'string',
                description: 'Phone number the influencer shared in this conversation, if any. Empty string if none visible.',
              },
              shippingAddress: {
                type: 'string',
                description:
                  'Full shipping/delivery address the influencer shared (street, city, state, pincode — whatever is visible), if any. Empty string if none visible.',
              },
              suggestedStatus: {
                type: 'string',
                enum: ['', ...STATUS_VALUES],
                description:
                  `The pipeline stage this conversation implies the influencer should now be at, one of: ${STATUS_VALUES.join(', ')}. ` +
                  `Their current stage is "${currentStatus || 'unknown'}" — only suggest a change if this conversation clearly moves them forward (e.g. they agree to terms → confirmed, brand ships product or content goes live → content_live, payment is sent/confirmed → paid) or they clearly decline/drop out → declined. Return an empty string if nothing in this conversation implies a stage change.`,
              },
            },
            required: ['summary', 'nextFollowUp', 'email', 'phone', 'shippingAddress', 'suggestedStatus'],
          },
        },
      ],
      tool_choice: { type: 'tool', name: 'extract_conversation' },
      messages: [
        {
          role: 'user',
          content: [
            ...images.map((img: { base64: string; mediaType: string }) => ({
              type: 'image' as const,
              source: {
                type: 'base64' as const,
                media_type: img.mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: img.base64,
              },
            })),
            {
              type: 'text' as const,
              text:
                images.length > 1
                  ? `Summarize these ${images.length} chat screenshots for a CRM log entry, and extract any contact details, shipping address, or pipeline-stage signal. They may be sequential scrolls of the same conversation — read them together as one thread, in the order given.`
                  : 'Summarize this chat screenshot for a CRM log entry, and extract any contact details, shipping address, or pipeline-stage signal.',
            },
          ],
        },
      ],
    });

    const toolUse = message.content.find((b) => b.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') {
      return NextResponse.json({ error: 'Could not summarize those screenshots.' }, { status: 502 });
    }
    return NextResponse.json(toolUse.input);
  } catch (err) {
    console.error('extract-conversation failed', err);
    return NextResponse.json({ error: 'Extraction failed.' }, { status: 502 });
  }
}
