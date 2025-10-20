import { Request } from 'express';
import { UserRole } from 'generated/prisma';

export interface JwtRequest extends Request {
  user: {
    sub: string; // id e user-it
    email: string;
    sessionId: string;
    roles?: UserRole[]; // opsionale, nëse përdor rolet për guards
  };
}
