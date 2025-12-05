/**
 * Delivery Service
 * Handles email and Slack delivery of meeting minutes
 */

import sgMail from '@sendgrid/mail';
import { WebClient } from '@slack/web-api';
import { env } from '../config/env';
import { db } from '../config/database';
import { DeliveryType, DeliveryStatus } from '@prisma/client';
import { EmailDeliveryDTO, SlackDeliveryDTO } from '../types';
import { logger } from '../utils/logger';

export class DeliveryService {
  private slackClient?: WebClient;

  constructor() {
    // Initialize SendGrid
    sgMail.setApiKey(env.sendgrid.apiKey);

    // Initialize Slack if token is provided
    if (env.slack.botToken) {
      this.slackClient = new WebClient(env.slack.botToken);
    }
  }

  /**
   * Send meeting minutes via email
   */
  async sendEmail(data: EmailDeliveryDTO): Promise<void> {
    // Create delivery record
    const delivery = await db.delivery.create({
      data: {
        meetingId: data.meetingId,
        type: DeliveryType.EMAIL,
        recipient: data.recipient,
        subject: data.subject,
        content: data.content,
        status: DeliveryStatus.PENDING,
      },
    });

    try {
      const msg = {
        to: data.recipient,
        from: {
          email: env.sendgrid.fromEmail,
          name: env.sendgrid.fromName,
        },
        subject: data.subject,
        html: data.content,
      };

      await sgMail.send(msg);

      // Update delivery status
      await db.delivery.update({
        where: { id: delivery.id },
        data: {
          status: DeliveryStatus.SENT,
          sentAt: new Date(),
        },
      });

      logger.info('Email sent successfully', {
        deliveryId: delivery.id,
        recipient: data.recipient,
      });
    } catch (error: any) {
      logger.error('Failed to send email', {
        deliveryId: delivery.id,
        error: error.message,
      });

      // Update delivery status
      await db.delivery.update({
        where: { id: delivery.id },
        data: {
          status: DeliveryStatus.FAILED,
          errorMessage: error.message,
          retryCount: { increment: 1 },
        },
      });

      throw error;
    }
  }

  /**
   * Send meeting minutes via Slack
   */
  async sendSlack(data: SlackDeliveryDTO): Promise<void> {
    if (!this.slackClient) {
      throw new Error('Slack is not configured');
    }

    // Create delivery record
    const delivery = await db.delivery.create({
      data: {
        meetingId: data.meetingId,
        type: DeliveryType.SLACK,
        recipient: data.channel,
        content: data.message,
        status: DeliveryStatus.PENDING,
      },
    });

    try {
      await this.slackClient.chat.postMessage({
        channel: data.channel,
        text: data.message,
        mrkdwn: true,
      });

      // Update delivery status
      await db.delivery.update({
        where: { id: delivery.id },
        data: {
          status: DeliveryStatus.SENT,
          sentAt: new Date(),
        },
      });

      logger.info('Slack message sent successfully', {
        deliveryId: delivery.id,
        channel: data.channel,
      });
    } catch (error: any) {
      logger.error('Failed to send Slack message', {
        deliveryId: delivery.id,
        error: error.message,
      });

      // Update delivery status
      await db.delivery.update({
        where: { id: delivery.id },
        data: {
          status: DeliveryStatus.FAILED,
          errorMessage: error.message,
          retryCount: { increment: 1 },
        },
      });

      throw error;
    }
  }

  /**
   * Retry failed deliveries
   */
  async retryFailedDeliveries(maxRetries = 3): Promise<void> {
    const failedDeliveries = await db.delivery.findMany({
      where: {
        status: DeliveryStatus.FAILED,
        retryCount: {
          lt: maxRetries,
        },
      },
      include: {
        meeting: true,
      },
    });

    logger.info(`Retrying ${failedDeliveries.length} failed deliveries`);

    for (const delivery of failedDeliveries) {
      try {
        if (delivery.type === DeliveryType.EMAIL) {
          await this.sendEmail({
            meetingId: delivery.meetingId,
            recipient: delivery.recipient,
            subject: delivery.subject || 'Meeting Minutes',
            content: delivery.content || '',
          });
        } else if (delivery.type === DeliveryType.SLACK) {
          await this.sendSlack({
            meetingId: delivery.meetingId,
            channel: delivery.recipient,
            message: delivery.content || '',
          });
        }
      } catch (error) {
        logger.error('Retry failed', { deliveryId: delivery.id, error });
      }
    }
  }

  /**
   * Format meeting minutes for email
   */
  formatEmailContent(meeting: any): string {
    let html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background-color: #4A90E2; color: white; padding: 20px; }
            .content { padding: 20px; }
            .section { margin-bottom: 30px; }
            .section h2 { color: #4A90E2; border-bottom: 2px solid #4A90E2; padding-bottom: 10px; }
            .action-item { background-color: #f4f4f4; padding: 10px; margin: 5px 0; border-left: 4px solid #4A90E2; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Meeting Minutes: ${meeting.title}</h1>
            <p>Date: ${new Date(meeting.startTime).toLocaleString()}</p>
          </div>
          <div class="content">
    `;

    if (meeting.description) {
      html += `
        <div class="section">
          <h2>Description</h2>
          <p>${meeting.description}</p>
        </div>
      `;
    }

    if (meeting.participants && meeting.participants.length > 0) {
      html += `
        <div class="section">
          <h2>Participants</h2>
          <ul>
            ${meeting.participants.map((p: any) => `<li>${p.name}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    if (meeting.transcript) {
      html += `
        <div class="section">
          <h2>Transcript</h2>
          <p>${meeting.transcript}</p>
        </div>
      `;
    }

    if (meeting.summary) {
      html += `
        <div class="section">
          <h2>Summary</h2>
          <p>${meeting.summary}</p>
        </div>
      `;
    }

    if (meeting.actionItems && meeting.actionItems.length > 0) {
      html += `
        <div class="section">
          <h2>Action Items</h2>
          ${meeting.actionItems.map((item: any) => `
            <div class="action-item">
              <strong>${item.description}</strong>
              ${item.assignee ? `<br>Assigned to: ${item.assignee}` : ''}
              ${item.dueDate ? `<br>Due: ${new Date(item.dueDate).toLocaleDateString()}` : ''}
            </div>
          `).join('')}
        </div>
      `;
    }

    html += `
          </div>
        </body>
      </html>
    `;

    return html;
  }

  /**
   * Format meeting minutes for Slack
   */
  formatSlackContent(meeting: any): string {
    let message = `*Meeting Minutes: ${meeting.title}*\n`;
    message += `Date: ${new Date(meeting.startTime).toLocaleString()}\n\n`;

    if (meeting.description) {
      message += `*Description:*\n${meeting.description}\n\n`;
    }

    if (meeting.participants && meeting.participants.length > 0) {
      message += `*Participants:*\n`;
      meeting.participants.forEach((p: any) => {
        message += `• ${p.name}\n`;
      });
      message += '\n';
    }

    if (meeting.summary) {
      message += `*Summary:*\n${meeting.summary}\n\n`;
    }

    if (meeting.actionItems && meeting.actionItems.length > 0) {
      message += `*Action Items:*\n`;
      meeting.actionItems.forEach((item: any) => {
        message += `• ${item.description}`;
        if (item.assignee) message += ` (${item.assignee})`;
        message += '\n';
      });
    }

    return message;
  }
}
