import { Test, TestingModule } from '@nestjs/testing';
import { SubmissionGateway } from './submission.gateway';
import { Server, Socket } from 'socket.io';

describe('SubmissionGateway', () => {
  let gateway: SubmissionGateway;
  let mockServer: jest.Mocked<Server>;
  let mockSocket: jest.Mocked<Socket>;

  beforeEach(async () => {
    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as any;

    mockSocket = {
      id: 'socket-123',
      handshake: {
        auth: { userId: 'user-123' },
      },
      disconnect: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [SubmissionGateway],
    }).compile();

    gateway = module.get<SubmissionGateway>(SubmissionGateway);
    gateway.server = mockServer;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should add user connection when userId is provided', () => {
      gateway.handleConnection(mockSocket);

      expect(gateway['userConnections'].has('user-123')).toBe(true);
      expect(gateway['userConnections'].get('user-123')).toContain(
        'socket-123',
      );
    });

    it('should append socket to existing user connections', () => {
      const firstSocket = mockSocket;
      const secondSocket = {
        id: 'socket-456',
        handshake: { auth: { userId: 'user-123' } },
      } as any;

      gateway.handleConnection(firstSocket);
      gateway.handleConnection(secondSocket);

      const userSockets = gateway['userConnections'].get('user-123');
      expect(userSockets).toHaveLength(2);
      expect(userSockets).toContain('socket-123');
      expect(userSockets).toContain('socket-456');
    });

    it('should disconnect socket if no userId provided', () => {
      const socketWithoutUserId = {
        id: 'socket-789',
        handshake: { auth: {} },
        disconnect: jest.fn(),
      } as any;

      gateway.handleConnection(socketWithoutUserId);

      expect(socketWithoutUserId.disconnect).toHaveBeenCalled();
      expect(gateway['userConnections'].has('')).toBe(false);
    });
  });

  describe('handleDisconnect', () => {
    it('should remove socket from user connections', () => {
      gateway.handleConnection(mockSocket);
      expect(gateway['userConnections'].get('user-123')).toHaveLength(1);

      gateway.handleDisconnect(mockSocket);
      expect(gateway['userConnections'].get('user-123')).toHaveLength(0);
    });

    it('should handle disconnect with no userId', () => {
      const socketWithoutUserId = {
        id: 'socket-789',
        handshake: { auth: {} },
      } as any;

      expect(() => {
        gateway.handleDisconnect(socketWithoutUserId);
      }).not.toThrow();
    });

    it('should handle disconnect for unknown user', () => {
      const socketUnknownUser = {
        id: 'socket-999',
        handshake: { auth: { userId: 'unknown-user' } },
      } as any;

      expect(() => {
        gateway.handleDisconnect(socketUnknownUser);
      }).not.toThrow();
    });

    it('should remove only specific socket id from connections', () => {
      const firstSocket = mockSocket;
      const secondSocket = {
        id: 'socket-456',
        handshake: { auth: { userId: 'user-123' } },
      } as any;

      gateway.handleConnection(firstSocket);
      gateway.handleConnection(secondSocket);

      gateway.handleDisconnect(firstSocket);

      const userSockets = gateway['userConnections'].get('user-123');
      expect(userSockets).toHaveLength(1);
      expect(userSockets).toContain('socket-456');
      expect(userSockets).not.toContain('socket-123');
    });
  });

  describe('notifyAttemptUpdate', () => {
    it('should emit attempt_update event to all user sockets', () => {
      gateway.handleConnection(mockSocket);

      const updateData = {
        status: 'queued',
        message: 'Waiting in queue',
        queuePosition: 2,
        queueSize: 5,
        estimatedWaitTime: 2500,
      };

      gateway.notifyAttemptUpdate('user-123', 'attempt-1', updateData);

      expect(mockServer.to).toHaveBeenCalledWith('socket-123');
      expect(mockServer.emit).toHaveBeenCalledWith(
        'attempt_update',
        expect.objectContaining({
          attemptId: 'attempt-1',
          status: 'queued',
          message: 'Waiting in queue',
          queuePosition: 2,
          queueSize: 5,
          estimatedWaitTime: 2500,
        }),
      );
    });

    it('should emit test results when included in data', () => {
      gateway.handleConnection(mockSocket);

      const updateData = {
        status: 'success',
        passedTests: 8,
        failedTests: 2,
        totalTests: 10,
        executionTime: 125,
        memoryUsed: 42,
      };

      gateway.notifyAttemptUpdate('user-123', 'attempt-1', updateData);

      expect(mockServer.emit).toHaveBeenCalledWith(
        'attempt_update',
        expect.objectContaining({
          passedTests: 8,
          failedTests: 2,
          totalTests: 10,
          executionTime: 125,
          memoryUsed: 42,
        }),
      );
    });

    it('should emit error message when included', () => {
      gateway.handleConnection(mockSocket);

      const updateData = {
        status: 'error',
        errorMessage: 'Compilation failed',
      };

      gateway.notifyAttemptUpdate('user-123', 'attempt-1', updateData);

      expect(mockServer.emit).toHaveBeenCalledWith(
        'attempt_update',
        expect.objectContaining({
          errorMessage: 'Compilation failed',
        }),
      );
    });

    it('should not emit if user has no active connections', () => {
      const updateData = { status: 'queued', message: 'Waiting' };

      gateway.notifyAttemptUpdate('unknown-user', 'attempt-1', updateData);

      expect(mockServer.emit).not.toHaveBeenCalled();
    });

    it('should emit to multiple sockets for the same user', () => {
      const firstSocket = mockSocket;
      const secondSocket = {
        id: 'socket-456',
        handshake: { auth: { userId: 'user-123' } },
      } as any;

      gateway.handleConnection(firstSocket);
      gateway.handleConnection(secondSocket);

      const updateData = { status: 'success' };
      gateway.notifyAttemptUpdate('user-123', 'attempt-1', updateData);

      expect(mockServer.to).toHaveBeenCalledWith('socket-123');
      expect(mockServer.to).toHaveBeenCalledWith('socket-456');
      expect(mockServer.emit).toHaveBeenCalledTimes(2);
    });
  });

  describe('notifyTestResult', () => {
    it('should emit test_result event to user sockets', () => {
      gateway.handleConnection(mockSocket);

      const testResult = {
        testIndex: 0,
        passed: true,
        input: { nums: [2, 7], target: 9 },
        expectedOutput: [0, 1],
        actualOutput: [0, 1],
      };

      gateway.notifyTestResult('user-123', 'attempt-1', testResult);

      expect(mockServer.to).toHaveBeenCalledWith('socket-123');
      expect(mockServer.emit).toHaveBeenCalledWith(
        'test_result',
        expect.objectContaining({
          attemptId: 'attempt-1',
          ...testResult,
        }),
      );
    });

    it('should not emit if user has no active connections', () => {
      const testResult = { testIndex: 0, passed: true };

      gateway.notifyTestResult('unknown-user', 'attempt-1', testResult);

      expect(mockServer.emit).not.toHaveBeenCalled();
    });

    it('should emit to all sockets of a user', () => {
      const firstSocket = mockSocket;
      const secondSocket = {
        id: 'socket-456',
        handshake: { auth: { userId: 'user-123' } },
      } as any;

      gateway.handleConnection(firstSocket);
      gateway.handleConnection(secondSocket);

      gateway.notifyTestResult('user-123', 'attempt-1', { passed: true });

      expect(mockServer.to).toHaveBeenCalledTimes(2);
      expect(mockServer.emit).toHaveBeenCalledTimes(2);
    });
  });
});
