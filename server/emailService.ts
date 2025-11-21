export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export class EmailService {
  private from: string;

  constructor() {
    this.from = process.env.EMAIL_FROM || 'noreply@skillsync.ai';
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      // In production, integrate with SendGrid, Resend, or other email provider
      // For now, log the email
      console.log('[EMAIL SERVICE]', {
        timestamp: new Date().toISOString(),
        to: options.to,
        subject: options.subject,
        from: options.from || this.from,
      });

      // Real implementation would call external email service:
      // const sgMail = require('@sendgrid/mail');
      // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      // await sgMail.send({
      //   to: options.to,
      //   from: options.from || this.from,
      //   subject: options.subject,
      //   html: options.html,
      //   text: options.text,
      // });
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  async sendNotificationEmail(
    to: string,
    title: string,
    message: string,
    actionUrl?: string
  ): Promise<void> {
    const html = `
      <h2>${title}</h2>
      <p>${message}</p>
      ${actionUrl ? `<a href="${actionUrl}">View Details</a>` : ''}
      <p style="font-size: 12px; color: #666;">
        This is an automated notification from SkillSync AI
      </p>
    `;

    await this.sendEmail({
      to,
      subject: title,
      html,
      text: message,
    });
  }

  async sendApplicationStatusEmail(
    to: string,
    jobTitle: string,
    status: string
  ): Promise<void> {
    const statusMessages: Record<string, string> = {
      applied: 'Your application has been submitted',
      interview: 'You have been invited for an interview',
      offer: 'You have received a job offer',
      hired: 'Congratulations! You have been hired',
      rejected: 'Thank you for your application',
    };

    const message = statusMessages[status] || `Application status: ${status}`;

    await this.sendNotificationEmail(
      to,
      `${jobTitle} - ${message}`,
      message,
      '/dashboard/applications'
    );
  }

  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    const html = `
      <h2>Password Reset Request</h2>
      <p>We received a request to reset your password.</p>
      <p><a href="${resetUrl}">Click here to reset your password</a></p>
      <p>This link will expire in 24 hours.</p>
      <p style="font-size: 12px; color: #666;">
        If you didn't request this, please ignore this email.
      </p>
    `;

    await this.sendEmail({
      to,
      subject: 'Password Reset Request',
      html,
      text: `Reset your password: ${resetUrl}`,
    });
  }

  async sendWelcomeEmail(to: string, firstName: string): Promise<void> {
    const html = `
      <h2>Welcome to SkillSync AI, ${firstName}!</h2>
      <p>We're excited to have you on board.</p>
      <p>Start exploring matched opportunities and connect with top talent.</p>
      <p><a href="${process.env.VITE_API_URL || 'https://skillsync.ai'}/dashboard">Get Started</a></p>
    `;

    await this.sendEmail({
      to,
      subject: 'Welcome to SkillSync AI',
      html,
      text: 'Welcome to SkillSync AI',
    });
  }
}

export const emailService = new EmailService();
