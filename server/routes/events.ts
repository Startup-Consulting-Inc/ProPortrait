import { Router, type Request, type Response } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore } from '../lib/firebase.js';

// ── Event tracker ─────────────────────────────────────────────────────────────

export const eventsRouter = Router();

function categorizeEvent(event: string): string {
  if (event.startsWith('step_')) return 'step';
  if (event.startsWith('upload_') || event === 'photo_uploaded') return 'upload';
  if (event.startsWith('generation_')) return 'generation';
  if (event.startsWith('edit_')) return 'edit';
  if (
    event.startsWith('export_') ||
    event === 'portrait_downloaded' ||
    event === 'platform_downloaded' ||
    event === 'all_platforms_downloaded'
  ) return 'export';
  if (
    event.startsWith('style_') ||
    event.startsWith('expression_') ||
    event.startsWith('identity_') ||
    event.startsWith('naturalness_') ||
    event.startsWith('likeness_') ||
    event.startsWith('variations_') ||
    event.startsWith('blemish_') ||
    event.startsWith('mode_')
  ) return 'style_selection';
  return 'ui';
}

// POST /api/events/track
eventsRouter.post('/track', (req: Request, res: Response) => {
  // Respond immediately — this is fire-and-forget from the client
  res.json({ ok: true });

  const { event, properties, timestamp } = req.body as {
    event?: string;
    properties?: Record<string, unknown>;
    timestamp?: number;
  };

  if (!event || typeof event !== 'string') return;

  const userId = req.auth?.uid ?? null;
  const sessionId = req.auth?.sessionId ?? (req.cookies as Record<string, string>)?.pp_session ?? null;
  const today = new Date().toISOString().slice(0, 10);

  const db = adminFirestore();

  // Write event to time-series collection (fire-and-forget)
  db.collection('events').add({
    userId,
    sessionId,
    eventName: event,
    eventType: categorizeEvent(event),
    properties: properties ?? {},
    timestamp: FieldValue.serverTimestamp(),
    clientTimestamp: timestamp ? new Date(timestamp) : null,
    date: today,
  }).catch(() => {});

  // For anonymous users: update aggregate counters in anonymous_sessions
  if (sessionId && !userId) {
    const updates: Record<string, unknown> = {
      lastActiveAt: FieldValue.serverTimestamp(),
    };
    if (event === 'photo_uploaded') updates.totalUploads = FieldValue.increment(1);
    else if (event === 'generation_completed') updates.totalGenerations = FieldValue.increment(1);
    else if (event === 'edit_completed') updates.totalEdits = FieldValue.increment(1);
    else if (
      event === 'portrait_downloaded' ||
      event === 'platform_downloaded' ||
      event === 'all_platforms_downloaded'
    ) updates.totalExports = FieldValue.increment(1);

    if (event === 'step_viewed' && typeof properties?.step === 'number') {
      updates[`stepsReached.step${properties.step as number}`] = true;
    }

    db.collection('anonymous_sessions').doc(sessionId).set(
      { sessionId, ...updates },
      { merge: true },
    ).catch(() => {});
  }
});

// ── Settings snapshot ─────────────────────────────────────────────────────────

export const settingsRouter = Router();

// POST /api/settings/snapshot
settingsRouter.post('/snapshot', async (req: Request, res: Response) => {
  const { settings, reason, previousSettings } = req.body as {
    settings?: Record<string, unknown>;
    reason?: string;
    previousSettings?: Record<string, unknown>;
  };

  if (!settings || !reason) {
    res.status(400).json({ error: 'Missing settings or reason' });
    return;
  }

  const userId = req.auth?.uid ?? null;
  const sessionId = req.auth?.sessionId ?? (req.cookies as Record<string, string>)?.pp_session ?? null;
  const today = new Date().toISOString().slice(0, 10);

  try {
    const docRef = await adminFirestore().collection('settings_history').add({
      userId,
      sessionId,
      settings,
      capturedAt: FieldValue.serverTimestamp(),
      reason,
      previousSettings: previousSettings ?? null,
      date: today,
    });
    res.json({ ok: true, snapshotId: docRef.id });
  } catch {
    res.status(500).json({ error: 'Failed to save snapshot' });
  }
});

// GET /api/settings/last — most recent snapshot for this session/user
settingsRouter.get('/last', async (req: Request, res: Response) => {
  const userId = req.auth?.uid ?? null;
  const sessionId = req.auth?.sessionId ?? (req.cookies as Record<string, string>)?.pp_session ?? null;

  if (!userId && !sessionId) {
    res.json({ found: false });
    return;
  }

  try {
    const db = adminFirestore();
    let query: FirebaseFirestore.Query = db
      .collection('settings_history')
      .orderBy('capturedAt', 'desc')
      .limit(1);

    if (userId) {
      query = query.where('userId', '==', userId);
    } else if (sessionId) {
      query = query.where('sessionId', '==', sessionId);
    }

    const snap = await query.get();
    if (snap.empty) {
      res.json({ found: false });
      return;
    }

    const doc = snap.docs[0];
    const data = doc.data();
    res.json({
      found: true,
      snapshotId: doc.id,
      settings: data.settings as Record<string, unknown>,
      capturedAt: data.capturedAt as unknown,
      reason: data.reason as string,
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});
