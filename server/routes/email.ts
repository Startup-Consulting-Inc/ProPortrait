import { Router, Request, Response } from 'express';
import { Resend } from 'resend';

const router = Router();

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/email/capture
router.post('/capture', async (req: Request, res: Response) => {
  const { email, source } = req.body as { email?: string; source?: string };

  if (!email || !EMAIL_RE.test(email)) {
    res.status(400).json({ error: 'Invalid email address' });
    return;
  }

  console.log(`[email] Captured: ${email} (source: ${source ?? 'unknown'})`);

  if (resend) {
    const from = process.env.RESEND_FROM_EMAIL || 'hello@proportrait.ai';
    const admin = process.env.ADMIN_EMAIL;

    try {
      // Welcome email to the user
      await resend.emails.send({
        from,
        to: email,
        subject: 'Your ProPortrait AI tips are here ✨',
        html: `
          <h2>Thanks for trying ProPortrait AI!</h2>
          <p>Here are a few tips to get the best results:</p>
          <ul>
            <li><strong>Use a well-lit, forward-facing photo</strong> — the AI works best with clear facial features.</li>
            <li><strong>Enable Identity Locks</strong> to preserve your eye color, skin tone, and hair exactly.</li>
            <li><strong>Try the Naturalness slider</strong> — lower values prevent the "airbrushed" look.</li>
            <li><strong>Use Expression Presets</strong> to dial in the exact micro-expression for your use case.</li>
          </ul>
          <p>Questions? Just reply to this email.</p>
        `,
      });

      // Admin notification
      if (admin) {
        await resend.emails.send({
          from,
          to: admin,
          subject: `New ProPortrait lead: ${email}`,
          html: `<p>New email captured from source: <strong>${source ?? 'unknown'}</strong></p><p>Email: ${email}</p>`,
        });
      }
    } catch (err) {
      console.error('[email] Resend error:', err);
      // Don't fail the request — email is best-effort
    }
  }

  res.json({ ok: true });
});

export default router;
