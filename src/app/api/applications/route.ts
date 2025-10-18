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

    if (webhookUrl) {
      try {
        logger.info('Sending application webhook');

        const applicant = session?.user?.name || 'Unknown user';
        let content = `Application submitted successfully!`;

        const embedFields: Array<{ name: string; value: string; inline: boolean }> = [
          { name: 'Type', value: type, inline: true },
          { name: 'Interest', value: interest, inline: true },
        ];

        if (about) {
          embedFields.push({
            name: 'About',
            value: about.length > 1024 ? about.slice(0, 1021) + '…' : about,
            inline: false,
          });
        }

        if (interviewAvailability) {
          const interviewUnix = Math.floor(interviewAvailability.getTime() / 1000);
          const interviewPretty = format(
            interviewAvailability,
            "EEEE, MMMM d, yyyy 'at' h:mm a"
          );
          const interviewDisplay = `<t:${interviewUnix}:F> (${interviewPretty})`;

          // Add a friendly line to the plain content too
          content += ` Interview target: ${interviewPretty}.`;

          embedFields.push({
            name: 'Interview Target',
            value: interviewDisplay,
            inline: false,
          });
        }

        await postToDiscord(
          {
            content,
            embeds: [
              {
                title: 'Application Submitted',
                description: `Applicant: **${applicant}**`,
                color: 0x00b894,
                timestamp: new Date().toISOString(),
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
