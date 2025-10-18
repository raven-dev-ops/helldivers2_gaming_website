// src/app/api/applications/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getAuthOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/dbConnect';
import UserApplicationModel from '@/models/UserApplication';
import mongoose from 'mongoose';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { postToDiscord } from '@/lib/discordWebhook';
import { format } from 'date-fns';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const userApplicationSchema = z.object({
  type: z.string({ required_error: 'type is required' }).min(1, 'type is required'),
  interest: z.string({ required_error: 'interest is required' }).min(1, 'interest is required'),
  about: z.string().optional(),
  interviewAvailability: z.coerce.date().optional(),
});

// Narrower helper so we don't need NextAuth module augmentation for user.id
function getUserId(user: unknown): string | null {
  if (user && typeof user === 'object' && 'id' in (user as any)) {
    const id = (user as any).id;
    return typeof id === 'string' ? id : null;
  }
  return null;
}

export async function POST(request: Request) {
  const session = await getServerSession(getAuthOptions());

  const userIdStr = getUserId(session?.user);
  if (!userIdStr || !mongoose.Types.ObjectId.isValid(userIdStr)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const json = await request.json();
    const parsed = userApplicationSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Validation Error', errors: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { type, interest, about, interviewAvailability } = parsed.data;

    await dbConnect();

    const userId = new mongoose.Types.ObjectId(userIdStr);
    const app = new UserApplicationModel({
      userId,
      type,
      interest,
      about,
      interviewAvailability,
    });

    await app.save();

    const webhookUrl = process.env.DISCORD_APPLICATION_WEBHOOK_URL;
    const webhookUsername = process.env.DISCORD_APPLICATION_WEBHOOK_USERNAME?.trim();
    const webhookAvatarUrl = process.env.DISCORD_APPLICATION_WEBHOOK_AVATAR_URL?.trim();
    const webhookThreadId = process.env.DISCORD_APPLICATION_WEBHOOK_THREAD_ID?.trim();

    if (webhookUrl) {
      try {
        logger.info('Sending application webhook');

        const applicant = session?.user?.name || 'Unknown user';
        const truncate = (s: string, max: number) => (s.length > max ? s.slice(0, Math.max(0, max - 1)) + '…' : s);
        const asBlock = (s: string, max: number) => '```\n' + truncate(s, max) + '\n```';

        const embedFields: Array<{ name: string; value: string; inline?: boolean }> = [
          { name: 'Type', value: type, inline: true },
        ];

        if (interviewAvailability) {
          const interviewUnix = Math.floor(interviewAvailability.getTime() / 1000);
          const interviewPretty = format(interviewAvailability, "EEE, MMM d, yyyy h:mm a");
          embedFields.push({ name: 'Interview', value: `<t:${interviewUnix}:F> (${interviewPretty})`, inline: true });
        }

        embedFields.push({ name: 'Interest', value: asBlock(interest, 1000) });
        if (about) embedFields.push({ name: 'About', value: asBlock(about, 1000) });

        await postToDiscord(
          {
            username: webhookUsername || undefined,
            avatar_url: webhookAvatarUrl || undefined,
            thread_id: webhookThreadId || undefined,
            content: 'New application received.',
            embeds: [
              {
                title: 'Moderator Application',
                description: `Applicant: **${applicant}**\nApplication ID: \`${String(app._id)}\``,
                color: 0xfacc15,
                timestamp: new Date().toISOString(),
                footer: { text: 'Mod Academy • via website' },
                fields: embedFields,
              },
            ],
          },
          { webhookUrlOverride: webhookUrl },
        );
      } catch (err) {
        logger.error('Failed to send application webhook:', err);
      }
    } else {
      logger.warn('DISCORD_APPLICATION_WEBHOOK_URL not set');
    }

    return NextResponse.json(
      { message: 'Application submitted successfully!' },
      { status: 201 },
    );
  } catch (error) {
    logger.error('User application error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 },
    );
  }
}

