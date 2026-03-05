declare namespace Express {
  interface Request {
    auth: {
      mode: 'firebase' | 'anonymous';
      uid?: string;
      email?: string;
      isPro: boolean;
      isAdmin: boolean;
      sessionId?: string; // anonymous only
    };
  }
}
