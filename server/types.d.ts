declare namespace Express {
  interface Request {
    auth: {
      mode: 'firebase' | 'anonymous';
      uid?: string;
      email?: string;
      isPro: boolean;
      isAdmin: boolean;
      tier: 'free' | 'creator' | 'pro' | 'max';
      sessionId?: string; // anonymous only
    };
  }
}
