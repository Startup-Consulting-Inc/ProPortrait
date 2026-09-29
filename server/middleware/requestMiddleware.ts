import express, { type Express } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const DEFAULT_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://portrait.ai-biz.app',
  'https://proportrait.ai',
  'https://portrait-7b01d.web.app',
  'https://portrait-7b01d.firebaseapp.com',
];

export function configureRequestMiddleware(app: Express, corsOrigin = process.env.CORS_ORIGIN): void {
  const configuredOrigins = corsOrigin?.split(',').map(origin => origin.trim()).filter(Boolean);

  // Handle preflight before authentication, rate limits, and body-parser errors.
  app.use(cors({
    origin: configuredOrigins?.length ? configuredOrigins : DEFAULT_ORIGINS,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  }));

  // Stripe signature verification requires the original bytes before express.json().
  app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
  app.use(cookieParser());
  app.use(express.json({ limit: '25mb' }));
}
