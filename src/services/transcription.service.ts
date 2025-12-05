/**
 * Transcription Service
 * Handles real-time transcription using Deepgram
 */

import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import { env } from '../config/env';
import { MeetingRepository } from '../repositories/meeting.repository';
import { TranscriptionConfig, TranscriptionResult } from '../types';
import { logger } from '../utils/logger';
import { EventEmitter } from 'events';

export class TranscriptionService extends EventEmitter {
  private deepgram: ReturnType<typeof createClient>;
  private meetingRepository: MeetingRepository;
  private activeConnections: Map<string, any>;

  constructor() {
    super();
    this.deepgram = createClient(env.deepgram.apiKey);
    this.meetingRepository = new MeetingRepository();
    this.activeConnections = new Map();
  }

  /**
   * Start live transcription for a meeting
   */
  async startLiveTranscription(
    meetingId: string,
    config?: TranscriptionConfig,
  ): Promise<any> {
    try {
      // Default configuration
      const transcriptionConfig = {
        model: config?.model || 'nova-2',
        language: config?.language || 'en',
        punctuate: config?.punctuate !== false,
        diarize: config?.diarize !== false,
        smart_format: config?.smart_format !== false,
        interim_results: true,
        endpointing: 300,
      };

      // Create live transcription connection
      const connection = this.deepgram.listen.live(transcriptionConfig);

      // Store connection
      this.activeConnections.set(meetingId, connection);

      // Set up event handlers
      connection.on(LiveTranscriptionEvents.Open, () => {
        logger.info('Transcription connection opened', { meetingId });
        this.emit('transcription:started', { meetingId });
      });

      connection.on(LiveTranscriptionEvents.Transcript, (data: any) => {
        const transcript = data.channel?.alternatives?.[0]?.transcript;
        if (transcript) {
          logger.debug('Received transcript', { meetingId, transcript });
          this.emit('transcription:data', {
            meetingId,
            transcript,
            isFinal: data.is_final,
            confidence: data.channel?.alternatives?.[0]?.confidence,
          });
        }
      });

      connection.on(LiveTranscriptionEvents.Error, (error: any) => {
        logger.error('Transcription error', { meetingId, error });
        this.emit('transcription:error', { meetingId, error });
      });

      connection.on(LiveTranscriptionEvents.Close, () => {
        logger.info('Transcription connection closed', { meetingId });
        this.activeConnections.delete(meetingId);
        this.emit('transcription:ended', { meetingId });
      });

      return connection;
    } catch (error) {
      logger.error('Failed to start transcription', { meetingId, error });
      throw error;
    }
  }

  /**
   * Send audio data to active transcription
   */
  async sendAudio(meetingId: string, audioData: Buffer): Promise<void> {
    const connection = this.activeConnections.get(meetingId);
    if (!connection) {
      throw new Error('No active transcription for this meeting');
    }

    try {
      connection.send(audioData);
    } catch (error) {
      logger.error('Failed to send audio data', { meetingId, error });
      throw error;
    }
  }

  /**
   * Stop live transcription
   */
  async stopLiveTranscription(meetingId: string): Promise<void> {
    const connection = this.activeConnections.get(meetingId);
    if (connection) {
      try {
        connection.finish();
        this.activeConnections.delete(meetingId);
        logger.info('Transcription stopped', { meetingId });
      } catch (error) {
        logger.error('Failed to stop transcription', { meetingId, error });
        throw error;
      }
    }
  }

  /**
   * Transcribe pre-recorded audio file
   */
  async transcribeAudioFile(
    audioBuffer: Buffer,
    config?: TranscriptionConfig,
  ): Promise<TranscriptionResult> {
    try {
      const transcriptionConfig = {
        model: config?.model || 'nova-2',
        language: config?.language || 'en',
        punctuate: config?.punctuate !== false,
        diarize: config?.diarize !== false,
        smart_format: config?.smart_format !== false,
      };

      const { result, error } = await this.deepgram.listen.prerecorded.transcribeFile(
        audioBuffer,
        transcriptionConfig,
      );

      if (error) {
        throw error;
      }

      const transcript =
        result.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
      const confidence =
        result.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0;

      return {
        transcript,
        confidence,
        words: result.results?.channels?.[0]?.alternatives?.[0]?.words,
        utterances: result.results?.utterances,
      };
    } catch (error) {
      logger.error('Failed to transcribe audio file', { error });
      throw error;
    }
  }

  /**
   * Save transcript to meeting
   */
  async saveTranscript(
    meetingId: string,
    transcript: string,
    transcriptionId?: string,
  ): Promise<void> {
    try {
      await this.meetingRepository.setTranscript(
        meetingId,
        transcript,
        transcriptionId,
      );
      logger.info('Transcript saved', { meetingId });
    } catch (error) {
      logger.error('Failed to save transcript', { meetingId, error });
      throw error;
    }
  }

  /**
   * Get active transcription status
   */
  isTranscriptionActive(meetingId: string): boolean {
    return this.activeConnections.has(meetingId);
  }

  /**
   * Clean up all active connections
   */
  async cleanup(): Promise<void> {
    for (const [meetingId, connection] of this.activeConnections.entries()) {
      try {
        connection.finish();
        logger.info('Cleaned up transcription connection', { meetingId });
      } catch (error) {
        logger.error('Failed to cleanup transcription', { meetingId, error });
      }
    }
    this.activeConnections.clear();
  }
}
