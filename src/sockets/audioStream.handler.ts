/**
 * Audio Stream WebSocket Handler
 * Handles real-time audio streaming and transcription
 */

import { Server, Socket } from 'socket.io';
import { TranscriptionService } from '../services/transcription.service';
import { MeetingRepository } from '../repositories/meeting.repository';
import { logger } from '../utils/logger';
import { verifyToken } from '../utils/jwt';
import { AudioStreamConfig } from '../types';

export class AudioStreamHandler {
  private transcriptionService: TranscriptionService;
  private meetingRepository: MeetingRepository;
  private transcriptBuffers: Map<string, string[]>;

  constructor() {
    this.transcriptionService = new TranscriptionService();
    this.meetingRepository = new MeetingRepository();
    this.transcriptBuffers = new Map();

    // Listen to transcription events
    this.transcriptionService.on('transcription:data', (data) => {
      this.handleTranscriptionData(data);
    });

    this.transcriptionService.on('transcription:error', (data) => {
      logger.error('Transcription error', data);
    });
  }

  /**
   * Initialize WebSocket handlers
   */
  initializeHandlers(io: Server): void {
    io.on('connection', (socket: Socket) => {
      logger.info('Client connected', { socketId: socket.id });

      // Authenticate socket connection
      this.authenticateSocket(socket);

      // Handle audio stream start
      socket.on('stream:start', (data: AudioStreamConfig) => {
        this.handleStreamStart(socket, data);
      });

      // Handle audio data
      socket.on('stream:audio', async (data: { meetingId: string; audio: Buffer }) => {
        await this.handleAudioData(socket, data);
      });

      // Handle stream stop
      socket.on('stream:stop', (data: { meetingId: string }) => {
        this.handleStreamStop(socket, data);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      // Handle errors
      socket.on('error', (error) => {
        logger.error('Socket error', { socketId: socket.id, error });
      });
    });
  }

  /**
   * Authenticate socket connection
   */
  private authenticateSocket(socket: Socket): void {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        socket.emit('error', { message: 'Authentication required' });
        socket.disconnect();
        return;
      }

      const payload = verifyToken(token);
      (socket as any).userId = payload.userId;
      logger.info('Socket authenticated', {
        socketId: socket.id,
        userId: payload.userId,
      });
    } catch (error) {
      logger.error('Socket authentication failed', { socketId: socket.id, error });
      socket.emit('error', { message: 'Invalid token' });
      socket.disconnect();
    }
  }

  /**
   * Handle stream start
   */
  private async handleStreamStart(
    socket: Socket,
    config: AudioStreamConfig,
  ): Promise<void> {
    try {
      const userId = (socket as any).userId;
      const { meetingId } = config;

      logger.info('Starting audio stream', { socketId: socket.id, meetingId });

      // Verify meeting ownership
      const meeting = await this.meetingRepository.findById(meetingId);
      if (!meeting || meeting.userId !== userId) {
        socket.emit('stream:error', { message: 'Meeting not found or unauthorized' });
        return;
      }

      // Initialize transcript buffer
      this.transcriptBuffers.set(meetingId, []);

      // Start transcription
      await this.transcriptionService.startLiveTranscription(meetingId);

      // Join meeting room
      socket.join(`meeting:${meetingId}`);

      socket.emit('stream:started', { meetingId });
      logger.info('Audio stream started', { socketId: socket.id, meetingId });
    } catch (error) {
      logger.error('Failed to start stream', { socketId: socket.id, error });
      socket.emit('stream:error', { message: 'Failed to start stream' });
    }
  }

  /**
   * Handle incoming audio data
   */
  private async handleAudioData(
    socket: Socket,
    data: { meetingId: string; audio: Buffer },
  ): Promise<void> {
    try {
      const { meetingId, audio } = data;

      // Send audio to transcription service
      await this.transcriptionService.sendAudio(meetingId, audio);
    } catch (error) {
      logger.error('Failed to process audio data', {
        socketId: socket.id,
        error,
      });
      socket.emit('stream:error', { message: 'Failed to process audio' });
    }
  }

  /**
   * Handle transcription data from Deepgram
   */
  private handleTranscriptionData(data: any): void {
    const { meetingId, transcript, isFinal, confidence } = data;

    // Add to buffer if final
    if (isFinal) {
      const buffer = this.transcriptBuffers.get(meetingId) || [];
      buffer.push(transcript);
      this.transcriptBuffers.set(meetingId, buffer);
    }

    // Emit to all clients in the meeting room
    const io = (global as any).io as Server;
    io.to(`meeting:${meetingId}`).emit('transcription:update', {
      transcript,
      isFinal,
      confidence,
    });
  }

  /**
   * Handle stream stop
   */
  private async handleStreamStop(
    socket: Socket,
    data: { meetingId: string },
  ): Promise<void> {
    try {
      const { meetingId } = data;

      logger.info('Stopping audio stream', { socketId: socket.id, meetingId });

      // Stop transcription
      await this.transcriptionService.stopLiveTranscription(meetingId);

      // Save full transcript
      const buffer = this.transcriptBuffers.get(meetingId) || [];
      const fullTranscript = buffer.join(' ');

      if (fullTranscript) {
        await this.transcriptionService.saveTranscript(meetingId, fullTranscript);
      }

      // Clean up buffer
      this.transcriptBuffers.delete(meetingId);

      // Leave meeting room
      socket.leave(`meeting:${meetingId}`);

      socket.emit('stream:stopped', { meetingId, transcript: fullTranscript });
      logger.info('Audio stream stopped', { socketId: socket.id, meetingId });
    } catch (error) {
      logger.error('Failed to stop stream', { socketId: socket.id, error });
      socket.emit('stream:error', { message: 'Failed to stop stream' });
    }
  }

  /**
   * Handle client disconnect
   */
  private handleDisconnect(socket: Socket): void {
    logger.info('Client disconnected', { socketId: socket.id });
    // Clean up any active streams for this socket
  }

  /**
   * Clean up on shutdown
   */
  async cleanup(): Promise<void> {
    await this.transcriptionService.cleanup();
    this.transcriptBuffers.clear();
  }
}
