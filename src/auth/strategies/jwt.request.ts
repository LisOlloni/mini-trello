import { Request } from 'express';

export interface JwtRequest extends Request {
  user: {
    sub: string; // id e user-it
    email: string;
    sessionId: string;
  };
}
