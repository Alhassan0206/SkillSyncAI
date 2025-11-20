import type { IntegrationConfig, Application, Interview, User } from "@shared/schema";
import type { IStorage } from "./storage";

interface SlackMessage {
  channel: string;
  text?: string;
  blocks?: any[];
  thread_ts?: string;
}

interface SlackAttachment {
  color: string;
  title: string;
  text: string;
  fields?: Array<{
    title: string;
    value: string;
    short: boolean;
  }>;
  footer?: string;
  ts?: number;
}

export class SlackService {
  constructor(private storage: IStorage) {}

  private async sendMessage(
    webhookUrl: string,
    message: SlackMessage
  ): Promise<void> {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Slack API error:', errorText);
        throw new Error(`Failed to send Slack message: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error sending Slack message:', error);
      throw error;
    }
  }

  async sendApplicationStatusNotification(
    tenantId: string,
    application: Application,
    oldStatus: string,
    newStatus: string,
    jobSeeker: User,
    changedBy: User
  ): Promise<void> {
    const config = await this.getSlackConfig(tenantId);
    if (!config) return;

    const webhookUrl = (config.config as any)?.webhookUrl;
    if (!webhookUrl) return;

    const statusEmojis: Record<string, string> = {
      applied: '📝',
      interview: '💼',
      offer: '🎉',
      hired: '✅',
      rejected: '❌',
    };

    const statusColors: Record<string, string> = {
      applied: '#3498db',
      interview: '#f39c12',
      offer: '#27ae60',
      hired: '#2ecc71',
      rejected: '#95a5a6',
    };

    const candidateName = `${jobSeeker.firstName || ''} ${jobSeeker.lastName || ''}`.trim() || jobSeeker.email || 'Candidate';
    const changedByName = `${changedBy.firstName || ''} ${changedBy.lastName || ''}`.trim() || changedBy.email || 'System';

    const message: SlackMessage = {
      channel: (config.config as any)?.channelId || '#hiring',
      text: `${statusEmojis[newStatus] || '📌'} Application Status Update`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${statusEmojis[newStatus] || '📌'} Application Status Changed`,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Candidate:*\n${candidateName}`,
            },
            {
              type: 'mrkdwn',
              text: `*Status:*\n${oldStatus} → *${newStatus}*`,
            },
            {
              type: 'mrkdwn',
              text: `*Changed By:*\n${changedByName}`,
            },
            {
              type: 'mrkdwn',
              text: `*Time:*\n<!date^${Math.floor(Date.now() / 1000)}^{date_short_pretty} at {time}|${new Date().toLocaleString()}>`,
            },
          ],
        },
        {
          type: 'divider',
        },
      ],
    };

    await this.sendMessage(webhookUrl, message);
  }

  async sendInterviewScheduledNotification(
    tenantId: string,
    interview: Interview,
    application: Application,
    jobSeeker: User,
    interviewer: User
  ): Promise<void> {
    const config = await this.getSlackConfig(tenantId);
    if (!config) return;

    const webhookUrl = (config.config as any)?.webhookUrl;
    if (!webhookUrl) return;

    const candidateName = `${jobSeeker.firstName || ''} ${jobSeeker.lastName || ''}`.trim() || jobSeeker.email || 'Candidate';
    const interviewerName = `${interviewer.firstName || ''} ${interviewer.lastName || ''}`.trim() || interviewer.email || 'Interviewer';
    const interviewDate = new Date(interview.scheduledAt);

    const message: SlackMessage = {
      channel: (config.config as any)?.channelId || '#hiring',
      text: `🗓️ New Interview Scheduled`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🗓️ Interview Scheduled',
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Candidate:*\n${candidateName}`,
            },
            {
              type: 'mrkdwn',
              text: `*Interviewer:*\n${interviewerName}`,
            },
            {
              type: 'mrkdwn',
              text: `*Type:*\n${interview.interviewType}`,
            },
            {
              type: 'mrkdwn',
              text: `*Duration:*\n${interview.duration} minutes`,
            },
            {
              type: 'mrkdwn',
              text: `*Date & Time:*\n<!date^${Math.floor(interviewDate.getTime() / 1000)}^{date_long_pretty} at {time}|${interviewDate.toLocaleString()}>`,
            },
            {
              type: 'mrkdwn',
              text: `*Location:*\n${interview.location || interview.meetingUrl || 'TBD'}`,
            },
          ],
        },
      ],
    };

    if (interview.notes) {
      message.blocks!.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Notes:*\n${interview.notes}`,
        },
      });
    }

    message.blocks!.push({
      type: 'divider',
    });

    await this.sendMessage(webhookUrl, message);
  }

  async sendDailyDigest(tenantId: string): Promise<void> {
    const config = await this.getSlackConfig(tenantId);
    if (!config) return;

    const webhookUrl = (config.config as any)?.webhookUrl;
    if (!webhookUrl) return;

    const allApplications = await this.storage.getAllApplications();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayApplications = allApplications.filter(app => {
      const createdAt = new Date(app.createdAt);
      return createdAt >= today;
    });

    const interviews = await this.storage.getInterviews();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    const upcomingInterviews = interviews.filter(interview => {
      const scheduledAt = new Date(interview.scheduledAt);
      return scheduledAt >= tomorrow && scheduledAt < dayAfterTomorrow;
    });

    const statusCounts = allApplications.reduce((acc, app) => {
      const status = app.status || 'applied';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const message: SlackMessage = {
      channel: (config.config as any)?.channelId || '#hiring',
      text: '📊 Daily Hiring Digest',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '📊 Daily Hiring Digest',
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Here's your daily summary for ${today.toLocaleDateString()}`,
          },
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*New Applications Today:*\n${todayApplications.length}`,
            },
            {
              type: 'mrkdwn',
              text: `*Interviews Tomorrow:*\n${upcomingInterviews.length}`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Pipeline Status:*\n` +
              `• Applied: ${statusCounts.applied || 0}\n` +
              `• Interview: ${statusCounts.interview || 0}\n` +
              `• Offer: ${statusCounts.offer || 0}\n` +
              `• Hired: ${statusCounts.hired || 0}`,
          },
        },
        {
          type: 'divider',
        },
      ],
    };

    await this.sendMessage(webhookUrl, message);
  }

  private async getSlackConfig(tenantId: string): Promise<IntegrationConfig | undefined> {
    const configs = await this.storage.getIntegrationConfigs(tenantId, 'slack');
    return configs.find(c => c.isEnabled);
  }

  async testConnection(config: IntegrationConfig): Promise<boolean> {
    const webhookUrl = (config.config as any)?.webhookUrl;
    if (!webhookUrl) {
      throw new Error('Webhook URL not configured');
    }

    try {
      await this.sendMessage(webhookUrl, {
        channel: (config.config as any)?.channelId || '#hiring',
        text: '✅ SkillSync AI integration test successful!',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '✅ *SkillSync AI Integration Test*\n\nYour Slack integration is working correctly! You will receive hiring notifications in this channel.',
            },
          },
        ],
      });
      return true;
    } catch (error) {
      console.error('Slack connection test failed:', error);
      return false;
    }
  }
}
