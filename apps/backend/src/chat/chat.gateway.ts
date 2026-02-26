import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { TransactionsService } from './transactions.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly transactionsService: TransactionsService,
  ) {}

  handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token as string;
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = this.jwtService.verify<{ sub: string }>(token);
      client.data.userId = payload.sub;
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() transactionId: string) {
    client.join(transactionId);
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { transactionId: string; content: string },
  ) {
    const userId = client.data.userId as string;
    if (!userId || !data.content?.trim()) return;

    try {
      const message = await this.transactionsService.saveMessage(
        data.transactionId,
        userId,
        data.content.trim(),
      );
      this.server.to(data.transactionId).emit('new-message', {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        senderFirstName: message.sender.firstName,
        createdAt: message.createdAt,
      });
    } catch {
      // ignore — user not a participant
    }
  }

  notifyRoom(room: string, event: string, data: unknown) {
    this.server.to(room).emit(event, data);
  }
}
