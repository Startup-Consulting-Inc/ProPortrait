import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { Resend } from 'resend';

const router = Router();

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTACT_REASONS = ['general', 'support', 'billing', 'partnership', 'feature', 'bug', 'other'] as const;

type ContactReason = (typeof CONTACT_REASONS)[number];

const CONTACT_REASON_LABELS: Record<ContactReason, string> = {
  general: 'General question',
  support: 'Product support',
  billing: 'Billing or account',
  partnership: 'Partnership',
  feature: 'Feature request',
  bug: 'Bug report',
  other: 'Other',
};

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many contact requests. Please wait a bit before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

function readTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

router.post('/', contactLimiter, async (req: Request, res: Response) => {
  const name = readTrimmedString(req.body?.name);
  const email = readTrimmedString(req.body?.email).toLowerCase();
  const company = readTrimmedString(req.body?.company);
  const reason = readTrimmedString(req.body?.reason) as ContactReason;
  const message = readTrimmedString(req.body?.message);

  if (name.length < 2 || name.length > 100) {
    res.status(400).json({ error: 'Please enter a name between 2 and 100 characters.' });
    return;
  }

  if (!email || email.length > 160 || !EMAIL_RE.test(email)) {
    res.status(400).json({ error: 'Please enter a valid email address.' });
    return;
  }

  if (company.length > 120) {
    res.status(400).json({ error: 'Company must be 120 characters or less.' });
    return;
  }

  if (!CONTACT_REASONS.includes(reason)) {
    res.status(400).json({ error: 'Please choose a valid contact reason.' });
    return;
  }

  if (message.length < 10 || message.length > 2000) {
    res.status(400).json({ error: 'Message must be between 10 and 2000 characters.' });
    return;
  }

  const reasonLabel = CONTACT_REASON_LABELS[reason];
  const payload = {
    name,
    email,
    company: company || null,
    reason,
    reasonLabel,
    message,
    source: 'contact-page',
  };

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeCompany = escapeHtml(company || 'Not provided');
  const safeReasonLabel = escapeHtml(reasonLabel);
  const safeMessage = escapeHtml(message);

  console.log('[contact] Submission received:', payload);

  if (resend) {
    const from = process.env.RESEND_FROM_EMAIL || 'hello@portrait.ai-biz.app';
    const admin = process.env.ADMIN_EMAIL;

    try {
      if (admin) {
        await resend.emails.send({
          from,
          to: admin,
          replyTo: email,
          subject: `[Contact] ${reasonLabel} from ${name}`,
          html: `
            <h2>New ProPortrait contact request</h2>
            <p><strong>Name:</strong> ${safeName}</p>
            <p><strong>Email:</strong> ${safeEmail}</p>
            <p><strong>Company:</strong> ${safeCompany}</p>
            <p><strong>Reason:</strong> ${safeReasonLabel}</p>
            <p><strong>Source:</strong> contact-page</p>
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap;">${safeMessage}</p>
          `,
        });
      }

      await resend.emails.send({
        from,
        to: email,
        subject: 'We received your ProPortrait message',
        html: `
          <h2>Thanks for contacting ProPortrait AI</h2>
          <p>We received your message and will follow up as soon as possible.</p>
          <p><strong>Reason:</strong> ${safeReasonLabel}</p>
          <p><strong>Your message:</strong></p>
          <p style="white-space: pre-wrap;">${safeMessage}</p>
        `,
      });
    } catch (error) {
      console.error('[contact] Resend error:', error);
    }
  }

  res.json({ ok: true });
});

export default router;
