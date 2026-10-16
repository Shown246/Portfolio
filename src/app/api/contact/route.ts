import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    const recipientEmail = process.env.CONTACT_EMAIL || 'onboarding@resend.dev';

    if (!apiKey) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY is not configured in .env.local' },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);

    const data = await resend.emails.send({
      from: 'Portfolio Contact <onboarding@resend.dev>',
      to: recipientEmail,
      subject: `New Portfolio Message from ${name}`,
      replyTo: email,
      html: `
        <div style="font-family: monospace, sans-serif; background: #0b0b0e; color: #e8e8e8; padding: 24px; border-radius: 8px;">
          <h2 style="color: #dc143c; margin-top: 0;">Portfolio Contact Message</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <hr style="border: 0.5px solid #222; margin: 16px 0;" />
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap; background: #14141a; padding: 16px; border-radius: 4px; border: 0.5px solid #333;">${message}</p>
        </div>
      `,
    });

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, id: data.data?.id });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
