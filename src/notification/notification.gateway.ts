/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class NotificationGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  handleConnection(client: Socket) {
    const auth = client.handshake?.auth as Record<string, unknown> | undefined;
    const query = client.handshake?.query as
      | Record<string, unknown>
      | undefined;

    const authUserId =
      typeof auth?.userId === 'string' ? auth.userId : undefined;
    const queryUserId =
      typeof query?.userId === 'string' ? query.userId : undefined;
    const userId = authUserId ?? queryUserId;

    if (userId && userId.length > 0) {
      client.join(`user:${userId}`);
    }
  }

  notifyUser(userId: string, payload: unknown) {
    this.server.to(`user:${userId}`).emit('notification', payload);
  }
}
