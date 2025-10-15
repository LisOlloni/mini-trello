import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    sessionId: string;
  };

  task: {
    id: string;

    title: string;

    description: string;
  };
}
