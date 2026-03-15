declare namespace Express {
  interface Request {
    auth: {
      mode: 'firebase' | 'anonymous';
      uid?: string;
      email?: string;
      isPro: boolean;
      isAdmin: boolean;
      tier: 'free' | 'basic' | 'plus';
      hdCredits?: number;
      platformCredits?: number;
      sessionId?: string; // anonymous only
    };
  }
}
