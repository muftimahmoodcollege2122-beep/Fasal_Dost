// ─────────────────────────────────────────────────────────────────────────────
// server/core/mailer.ts
// Real Email Dispatcher for OTP Verification & Farmer Notifications
// ─────────────────────────────────────────────────────────────────────────────

import nodemailer, { type Transporter } from 'nodemailer';

let transporter: Transporter | null = null;

export function hasConfiguredSmtp(): boolean {
  return Boolean(
    (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) ||
    (process.env.SMTP_HOST && process.env.SMTP_USER)
  );
}

export async function getTransporter(): Promise<Transporter> {
  if (transporter) return transporter;

  const gmailUser = (process.env.GMAIL_USER || process.env.SMTP_USER || '').trim();
  const rawPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || '';
  const gmailPass = rawPass.replace(/\s+/g, '');

  // 1. Gmail SMTP with App Password (port 465 SSL)
  if (gmailUser && gmailPass && (process.env.GMAIL_USER || gmailUser.includes('@gmail.com') || process.env.SMTP_HOST?.includes('gmail'))) {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });
    console.log('[Mailer] Initialized Gmail SMTP for:', gmailUser);
    return transporter;
  }

  // 2. Check for configured generic SMTP server
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: gmailPass,
      },
    });
    console.log('[Mailer] Initialized custom SMTP server:', process.env.SMTP_HOST);
    return transporter;
  }

  // 3. Fallback to standard high-deliverability test account (Ethereal) for instant verification
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('[Mailer] Initialized sandbox SMTP with account:', testAccount.user);
    return transporter;
  } catch (err) {
    console.warn('[Mailer] Could not create Ethereal test account, using JSON direct transport:', err);
    transporter = nodemailer.createTransport({
      jsonTransport: true,
    });
    return transporter;
  }
}

export async function sendOtpEmail(toEmail: string, otpCode: string, farmerName?: string): Promise<{ success: boolean; isCustomSmtp: boolean; previewUrl?: string | false }> {
  const isCustomSmtp = hasConfiguredSmtp();
  try {
    const mailer = await getTransporter();
    const name = farmerName || 'Farmer';
    const fromAddress = process.env.SMTP_FROM || '"FasalDost Security" <no-reply@fasaldost.com>';

    const info = await mailer.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: `${otpCode} is your FasalDost Email Verification Code`,
      text: `Hello ${name},\n\nYour 6-digit FasalDost email verification code is: ${otpCode}\n\nThis code will expire in 10 minutes. If you did not request this code, please ignore this email.\n\n— The FasalDost Agriculture Team`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; padding: 24px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 12px; border-radius: 12px; font-size: 20px; font-weight: bold;">
              🌱 FasalDost
            </div>
            <h2 style="color: #0f172a; margin-top: 16px; margin-bottom: 4px; font-size: 20px;">Email Verification Code</h2>
            <p style="color: #64748b; font-size: 13px; margin-top: 0;">Protecting your farm data against bots & unauthorized accounts</p>
          </div>
          
          <p style="color: #334155; font-size: 14px; line-height: 1.5;">
            Hello <strong>${name}</strong>,
          </p>
          <p style="color: #334155; font-size: 14px; line-height: 1.5;">
            Please use the following genuine 6-digit verification code to confirm your email address and complete your account registration:
          </p>
          
          <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; text-align: center; padding: 20px; margin: 24px 0;">
            <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0f172a;">
              ${otpCode}
            </span>
          </div>

          <p style="color: #64748b; font-size: 12px; line-height: 1.5;">
            ⏰ <strong>Expiry:</strong> This code is valid for 10 minutes only.<br />
            🔒 <strong>Security Notice:</strong> Never share this OTP with anyone. FasalDost staff will never ask for your verification code.
          </p>

          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
          
          <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
            © ${new Date().getFullYear()} FasalDost Agricultural Intelligence Platform. All rights reserved.
          </p>
        </div>
      `,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`[Mailer] OTP email sent FROM: ${fromAddress} -> TO RECIPIENT: ${toEmail}`);
    console.log(`[Mailer] Envelope:`, info.envelope, `Message ID:`, info.messageId);
    if (previewUrl) {
      console.log(`[Mailer] Preview URL: ${previewUrl}`);
    }

    return {
      success: true,
      isCustomSmtp,
      previewUrl,
    };
  } catch (error) {
    console.error(`[Mailer] Error sending OTP email to ${toEmail}:`, error);
    throw error;
  }
}
