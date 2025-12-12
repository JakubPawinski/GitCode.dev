import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  path: '/socket.io',
})
export class SubmissionGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(SubmissionGateway.name);
  private userConnections = new Map<string, string[]>();

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (!userId) {
      this.logger.warn('No userId provided');
      client.disconnect();
      return;
    }

    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, []);
    }
    this.userConnections.get(userId)!.push(client.id);
    this.logger.log(
      `User ${userId} connected - Total sockets: ${this.userConnections.get(userId)!.length}`,
    );
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (!userId) return;

    const sockets = this.userConnections.get(userId) || [];
    this.userConnections.set(
      userId,
      sockets.filter((id) => id !== client.id),
    );
    this.logger.log(`User ${userId} disconnected`);
  }

  notifyAttemptUpdate(userId: string, attemptId: string, data: any) {
    const sockets = this.userConnections.get(userId) || [];

    if (sockets.length === 0) {
      this.logger.debug(`No sockets for user ${userId}`);
      return;
    }

    sockets.forEach((socketId) => {
      this.server.to(socketId).emit('attempt-update', {
        attemptId,
        status: data.status,
        message: data.message,
        ...(data.queuePosition && {
          queuePosition: data.queuePosition,
          queueSize: data.queueSize,
          estimatedWaitTime: data.estimatedWaitTime,
        }),
        ...(data.passedTests !== undefined && {
          passedTests: data.passedTests,
          failedTests: data.failedTests,
          totalTests: data.totalTests,
          executionTime: data.executionTime,
          memoryUsed: data.memoryUsed,
        }),
        ...(data.errorMessage && { errorMessage: data.errorMessage }),
        ...(data.failedTestsDetails && {
          failedTestsDetails: data.failedTestsDetails,
        }),
      });
    });
  }

  notifyTestResult(userId: string, attemptId: string, result: any) {
    const sockets = this.userConnections.get(userId) || [];

    if (sockets.length === 0) {
      return;
    }

    sockets.forEach((socketId) => {
      this.server.to(socketId).emit('test-result', {
        attemptId,
        ...result,
      });
    });
  }
}
