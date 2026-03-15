declare namespace Express {
  interface Request {
    auth: {
      mode: 'firebase' | 'anonymous';
      uid?: string;
      email?: string;
      isAdmin: boolean;
      hdCredits?: number;
      platformCredits?: number;
      sessionId?: string; // anonymous only
    };
  }
}
