import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { to, subject, html } = await request.json();

    if (!to || !subject || !html) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Configura o transportador do Nodemailer usando o Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD, // App Password do Gmail
      },
    });

    // Envia o e-mail
    const info = await transporter.sendMail({
      from: `"Master Delivery Express" <${process.env.SMTP_EMAIL}>`,
      to,
      subject,
      html,
    });

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error('Erro ao enviar e-mail:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
