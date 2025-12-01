import { Resend } from 'resend';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

// Email template styling
const EMAIL_STYLES = {
  container: 'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;',
  header: 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;',
  logo: 'color: white; font-size: 28px; font-weight: bold; margin: 0;',
  body: 'background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;',
  footer: 'background: #f9fafb; padding: 20px; text-align: center; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;',
  button: 'display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;',
  muted: 'color: #6b7280; font-size: 14px;',
  link: 'color: #667eea; text-decoration: none;',
};

export class EmailService {
  private from: string;
  private resend: Resend | null = null;

  constructor() {
    this.from = process.env.EMAIL_FROM || 'SkillSync AI <noreply@skillsync.ai>';

    if (process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
      console.log('[EMAIL SERVICE] Resend configured');
    } else {
      console.log('[EMAIL SERVICE] No RESEND_API_KEY - emails will be logged only');
    }
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string }> {
    try {
      const from = options.from || this.from;

      if (this.resend) {
        const { data, error } = await this.resend.emails.send({
          from,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
          replyTo: options.replyTo,
        });

        if (error) {
          console.error('[EMAIL SERVICE] Resend error:', error);
          throw new Error(error.message);
        }

        console.log('[EMAIL SERVICE] Email sent:', { to: options.to, subject: options.subject, messageId: data?.id });
        return { success: true, messageId: data?.id };
      } else {
        // Development mode - just log
        console.log('[EMAIL SERVICE] (DEV MODE)', {
          timestamp: new Date().toISOString(),
          to: options.to,
          subject: options.subject,
          from,
        });
        return { success: true, messageId: 'dev-mode' };
      }
    } catch (error) {
      console.error('[EMAIL SERVICE] Failed to send email:', error);
      throw error;
    }
  }

  private wrapInTemplate(content: string, preheader?: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${preheader ? `<span style="display:none;font-size:1px;color:#fff;max-height:0;">${preheader}</span>` : ''}
</head>
<body style="margin: 0; padding: 20px; background: #f3f4f6;">
  <div style="${EMAIL_STYLES.container}">
    <div style="${EMAIL_STYLES.header}">
      <h1 style="${EMAIL_STYLES.logo}">SkillSync AI</h1>
    </div>
    <div style="${EMAIL_STYLES.body}">
      ${content}
    </div>
    <div style="${EMAIL_STYLES.footer}">
      <p style="${EMAIL_STYLES.muted}">
        © ${new Date().getFullYear()} SkillSync AI. All rights reserved.
      </p>
      <p style="${EMAIL_STYLES.muted}">
        <a href="%UNSUBSCRIBE_URL%" style="${EMAIL_STYLES.link}">Unsubscribe</a> ·
        <a href="${process.env.VITE_API_URL || 'https://skillsync.ai'}/privacy" style="${EMAIL_STYLES.link}">Privacy Policy</a>
      </p>
    </div>
  </div>
</body>
</html>`;
  }

  async sendNotificationEmail(
    to: string,
    title: string,
    message: string,
    actionUrl?: string,
    actionText?: string
  ): Promise<void> {
    const baseUrl = process.env.VITE_API_URL || 'https://skillsync.ai';
    const content = `
      <h2 style="color: #1f2937; margin: 0 0 20px 0;">${title}</h2>
      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">${message}</p>
      ${actionUrl ? `
        <p style="text-align: center; margin: 30px 0;">
          <a href="${baseUrl}${actionUrl}" style="${EMAIL_STYLES.button}">${actionText || 'View Details'}</a>
        </p>
      ` : ''}
    `;

    await this.sendEmail({
      to,
      subject: title,
      html: this.wrapInTemplate(content, message.substring(0, 100)),
      text: `${title}\n\n${message}${actionUrl ? `\n\nView details: ${baseUrl}${actionUrl}` : ''}`,
    });
  }

  async sendWelcomeEmail(to: string, firstName: string, role: 'job_seeker' | 'employer'): Promise<void> {
    const baseUrl = process.env.VITE_API_URL || 'https://skillsync.ai';
    const dashboardUrl = role === 'employer' ? '/employer/dashboard' : '/job-seeker/dashboard';

    const roleSpecificContent = role === 'employer'
      ? `
        <ul style="color: #4b5563; line-height: 1.8;">
          <li>Post your first job in minutes</li>
          <li>Let AI match you with qualified candidates</li>
          <li>Streamline your hiring process</li>
          <li>Access powerful analytics and insights</li>
        </ul>
      `
      : `
        <ul style="color: #4b5563; line-height: 1.8;">
          <li>Complete your profile to improve matches</li>
          <li>Upload your resume for AI analysis</li>
          <li>Get personalized job recommendations</li>
          <li>Track all your applications in one place</li>
        </ul>
      `;

    const content = `
      <h2 style="color: #1f2937; margin: 0 0 20px 0;">Welcome to SkillSync AI, ${firstName}! 🎉</h2>
      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
        We're thrilled to have you join our community. SkillSync AI uses cutting-edge artificial intelligence
        to ${role === 'employer' ? 'help you find the perfect candidates' : 'match you with your dream job'}.
      </p>
      <p style="color: #1f2937; font-weight: 600; margin: 20px 0 10px 0;">Here's how to get started:</p>
      ${roleSpecificContent}
      <p style="text-align: center; margin: 30px 0;">
        <a href="${baseUrl}${dashboardUrl}" style="${EMAIL_STYLES.button}">Go to Dashboard</a>
      </p>
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        Need help? Reply to this email or visit our <a href="${baseUrl}/faq" style="${EMAIL_STYLES.link}">FAQ page</a>.
      </p>
    `;

    await this.sendEmail({
      to,
      subject: `Welcome to SkillSync AI, ${firstName}!`,
      html: this.wrapInTemplate(content, `Welcome ${firstName}! Start your journey with SkillSync AI.`),
      text: `Welcome to SkillSync AI, ${firstName}!\n\nWe're excited to have you on board. Visit ${baseUrl}${dashboardUrl} to get started.`,
    });
  }

  async sendApplicationStatusEmail(
    to: string,
    candidateName: string,
    jobTitle: string,
    companyName: string,
    status: string,
    additionalMessage?: string
  ): Promise<void> {
    const baseUrl = process.env.VITE_API_URL || 'https://skillsync.ai';

    const statusConfig: Record<string, { emoji: string; title: string; message: string; color: string }> = {
      applied: {
        emoji: '📨',
        title: 'Application Received',
        message: `Your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been successfully submitted. We'll notify you of any updates.`,
        color: '#3b82f6',
      },
      screening: {
        emoji: '🔍',
        title: 'Application Under Review',
        message: `Great news! Your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> is being reviewed by the hiring team.`,
        color: '#8b5cf6',
      },
      interview: {
        emoji: '🎯',
        title: 'Interview Invitation',
        message: `Congratulations! <strong>${companyName}</strong> would like to interview you for the <strong>${jobTitle}</strong> position.`,
        color: '#10b981',
      },
      offer: {
        emoji: '🎉',
        title: 'Job Offer Received',
        message: `Amazing news! You've received a job offer for <strong>${jobTitle}</strong> at <strong>${companyName}</strong>!`,
        color: '#f59e0b',
      },
      hired: {
        emoji: '🏆',
        title: 'Congratulations - You\'re Hired!',
        message: `Welcome aboard! You've been officially hired as <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.`,
        color: '#10b981',
      },
      rejected: {
        emoji: '📝',
        title: 'Application Update',
        message: `Thank you for your interest in the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>. After careful consideration, they've decided to move forward with other candidates.`,
        color: '#6b7280',
      },
    };

    const config = statusConfig[status] || {
      emoji: '📋',
      title: 'Application Update',
      message: `Your application status for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been updated to: ${status}`,
      color: '#6b7280',
    };

    const content = `
      <div style="text-align: center; font-size: 48px; margin-bottom: 20px;">${config.emoji}</div>
      <h2 style="color: ${config.color}; margin: 0 0 20px 0; text-align: center;">${config.title}</h2>
      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">Hi ${candidateName},</p>
      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">${config.message}</p>
      ${additionalMessage ? `<p style="color: #4b5563; line-height: 1.6; margin: 20px 0; padding: 15px; background: #f9fafb; border-radius: 6px;">${additionalMessage}</p>` : ''}
      <p style="text-align: center; margin: 30px 0;">
        <a href="${baseUrl}/job-seeker/applications" style="${EMAIL_STYLES.button}">View Application</a>
      </p>
    `;

    await this.sendEmail({
      to,
      subject: `${config.emoji} ${config.title} - ${jobTitle} at ${companyName}`,
      html: this.wrapInTemplate(content, `${config.title}: ${jobTitle} at ${companyName}`),
      text: `${config.title}\n\nHi ${candidateName},\n\n${config.message.replace(/<[^>]*>/g, '')}`,
    });
  }

  async sendInterviewScheduledEmail(
    to: string,
    candidateName: string,
    jobTitle: string,
    companyName: string,
    interviewDate: Date,
    interviewType: string,
    location?: string,
    meetingLink?: string,
    interviewerNames?: string[],
    notes?: string
  ): Promise<void> {
    const baseUrl = process.env.VITE_API_URL || 'https://skillsync.ai';
    const formattedDate = interviewDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const formattedTime = interviewDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });

    const locationInfo = interviewType === 'video' || interviewType === 'phone'
      ? meetingLink ? `<a href="${meetingLink}" style="${EMAIL_STYLES.link}">${meetingLink}</a>` : 'Link will be provided'
      : location || 'To be confirmed';

    const content = `
      <div style="text-align: center; font-size: 48px; margin-bottom: 20px;">📅</div>
      <h2 style="color: #1f2937; margin: 0 0 20px 0; text-align: center;">Interview Scheduled</h2>
      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">Hi ${candidateName},</p>
      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
        Your interview for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been scheduled.
      </p>

      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; width: 120px;">📆 Date:</td>
            <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">🕐 Time:</td>
            <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${formattedTime}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">📍 ${interviewType === 'video' ? 'Meeting' : interviewType === 'phone' ? 'Call' : 'Location'}:</td>
            <td style="padding: 8px 0; color: #1f2937;">${locationInfo}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">💼 Type:</td>
            <td style="padding: 8px 0; color: #1f2937;">${interviewType.charAt(0).toUpperCase() + interviewType.slice(1)} Interview</td>
          </tr>
          ${interviewerNames?.length ? `
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">👤 With:</td>
            <td style="padding: 8px 0; color: #1f2937;">${interviewerNames.join(', ')}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      ${notes ? `<p style="color: #4b5563; line-height: 1.6; margin: 20px 0;"><strong>Additional Notes:</strong><br>${notes}</p>` : ''}

      <p style="text-align: center; margin: 30px 0;">
        <a href="${baseUrl}/job-seeker/interviews" style="${EMAIL_STYLES.button}">View Interview Details</a>
      </p>

      <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
        Need to reschedule? Please contact the hiring team as soon as possible.
      </p>
    `;

    await this.sendEmail({
      to,
      subject: `📅 Interview Scheduled: ${jobTitle} at ${companyName} - ${formattedDate}`,
      html: this.wrapInTemplate(content, `Your interview for ${jobTitle} is scheduled for ${formattedDate}`),
      text: `Interview Scheduled\n\nHi ${candidateName},\n\nYour interview for ${jobTitle} at ${companyName} has been scheduled.\n\nDate: ${formattedDate}\nTime: ${formattedTime}\nType: ${interviewType}\n\nGood luck!`,
    });
  }

  async sendPasswordResetEmail(to: string, resetToken: string, firstName?: string): Promise<void> {
    const baseUrl = process.env.VITE_API_URL || 'https://skillsync.ai';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    const content = `
      <h2 style="color: #1f2937; margin: 0 0 20px 0;">Reset Your Password</h2>
      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
        ${firstName ? `Hi ${firstName},` : 'Hi,'}
      </p>
      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
        We received a request to reset your password. Click the button below to create a new password:
      </p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="${EMAIL_STYLES.button}">Reset Password</a>
      </p>
      <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
        This link will expire in 24 hours. If you didn't request a password reset, you can safely ignore this email.
      </p>
      <p style="color: #6b7280; font-size: 14px; margin-top: 10px;">
        Or copy this link: <a href="${resetUrl}" style="${EMAIL_STYLES.link}">${resetUrl}</a>
      </p>
    `;

    await this.sendEmail({
      to,
      subject: 'Reset Your SkillSync AI Password',
      html: this.wrapInTemplate(content, 'Reset your password for SkillSync AI'),
      text: `Reset Your Password\n\nWe received a request to reset your password.\n\nClick this link to reset: ${resetUrl}\n\nThis link expires in 24 hours.`,
    });
  }

  async sendWeeklyDigestEmail(
    to: string,
    firstName: string,
    digest: {
      newJobMatches: number;
      applicationUpdates: number;
      upcomingInterviews: { jobTitle: string; company: string; date: Date }[];
      topMatches: { jobTitle: string; company: string; matchScore: number }[];
      profileCompletion?: number;
    }
  ): Promise<void> {
    const baseUrl = process.env.VITE_API_URL || 'https://skillsync.ai';

    const interviewsList = digest.upcomingInterviews.length > 0
      ? digest.upcomingInterviews.map(i => `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${i.jobTitle}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${i.company}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${i.date.toLocaleDateString()}</td>
          </tr>
        `).join('')
      : '<tr><td colspan="3" style="padding: 20px; text-align: center; color: #6b7280;">No upcoming interviews</td></tr>';

    const matchesList = digest.topMatches.length > 0
      ? digest.topMatches.map(m => `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${m.jobTitle}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${m.company}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
              <span style="background: ${m.matchScore >= 80 ? '#10b981' : m.matchScore >= 60 ? '#f59e0b' : '#6b7280'}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${m.matchScore}%</span>
            </td>
          </tr>
        `).join('')
      : '<tr><td colspan="3" style="padding: 20px; text-align: center; color: #6b7280;">No new matches this week</td></tr>';

    const content = `
      <h2 style="color: #1f2937; margin: 0 0 20px 0;">Your Weekly Job Search Update 📊</h2>
      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">Hi ${firstName},</p>
      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
        Here's what happened this week on SkillSync AI:
      </p>

      <!-- Stats Cards -->
      <div style="display: flex; gap: 15px; margin: 20px 0;">
        <div style="flex: 1; background: #eff6ff; padding: 20px; border-radius: 8px; text-align: center;">
          <div style="font-size: 32px; font-weight: bold; color: #3b82f6;">${digest.newJobMatches}</div>
          <div style="color: #1e40af; font-size: 14px;">New Matches</div>
        </div>
        <div style="flex: 1; background: #f0fdf4; padding: 20px; border-radius: 8px; text-align: center;">
          <div style="font-size: 32px; font-weight: bold; color: #10b981;">${digest.applicationUpdates}</div>
          <div style="color: #047857; font-size: 14px;">App Updates</div>
        </div>
        <div style="flex: 1; background: #fef3c7; padding: 20px; border-radius: 8px; text-align: center;">
          <div style="font-size: 32px; font-weight: bold; color: #f59e0b;">${digest.upcomingInterviews.length}</div>
          <div style="color: #b45309; font-size: 14px;">Interviews</div>
        </div>
      </div>

      ${digest.upcomingInterviews.length > 0 ? `
      <h3 style="color: #1f2937; margin: 30px 0 15px 0;">📅 Upcoming Interviews</h3>
      <table style="width: 100%; border-collapse: collapse; background: #f9fafb; border-radius: 8px;">
        <thead>
          <tr style="background: #e5e7eb;">
            <th style="padding: 10px; text-align: left;">Position</th>
            <th style="padding: 10px; text-align: left;">Company</th>
            <th style="padding: 10px; text-align: left;">Date</th>
          </tr>
        </thead>
        <tbody>${interviewsList}</tbody>
      </table>
      ` : ''}

      <h3 style="color: #1f2937; margin: 30px 0 15px 0;">🎯 Top Job Matches</h3>
      <table style="width: 100%; border-collapse: collapse; background: #f9fafb; border-radius: 8px;">
        <thead>
          <tr style="background: #e5e7eb;">
            <th style="padding: 10px; text-align: left;">Position</th>
            <th style="padding: 10px; text-align: left;">Company</th>
            <th style="padding: 10px; text-align: left;">Match</th>
          </tr>
        </thead>
        <tbody>${matchesList}</tbody>
      </table>

      ${digest.profileCompletion && digest.profileCompletion < 100 ? `
      <div style="background: #fef3c7; padding: 15px 20px; border-radius: 8px; margin: 30px 0;">
        <p style="margin: 0; color: #92400e;">
          <strong>💡 Tip:</strong> Your profile is ${digest.profileCompletion}% complete.
          <a href="${baseUrl}/job-seeker/profile" style="${EMAIL_STYLES.link}">Complete it now</a> to get better job matches!
        </p>
      </div>
      ` : ''}

      <p style="text-align: center; margin: 30px 0;">
        <a href="${baseUrl}/job-seeker/dashboard" style="${EMAIL_STYLES.button}">View All Opportunities</a>
      </p>
    `;

    await this.sendEmail({
      to,
      subject: `📊 Your Weekly Update: ${digest.newJobMatches} new matches, ${digest.upcomingInterviews.length} interviews`,
      html: this.wrapInTemplate(content, `${digest.newJobMatches} new job matches and ${digest.applicationUpdates} application updates this week`),
      text: `Your Weekly Job Search Update\n\nHi ${firstName},\n\nThis week: ${digest.newJobMatches} new job matches, ${digest.applicationUpdates} application updates, ${digest.upcomingInterviews.length} upcoming interviews.\n\nVisit ${baseUrl}/job-seeker/dashboard to see more.`,
    });
  }

  async sendInvoiceEmail(
    to: string,
    firstName: string,
    invoiceDetails: {
      invoiceNumber: string;
      amount: number;
      currency: string;
      date: Date;
      planName: string;
      invoiceUrl?: string;
    }
  ): Promise<void> {
    const baseUrl = process.env.VITE_API_URL || 'https://skillsync.ai';
    const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency: invoiceDetails.currency }).format(invoiceDetails.amount / 100);

    const content = `
      <h2 style="color: #1f2937; margin: 0 0 20px 0;">Payment Receipt 🧾</h2>
      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">Hi ${firstName},</p>
      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
        Thank you for your payment. Here are the details:
      </p>

      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Invoice #:</td>
            <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${invoiceDetails.invoiceNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Date:</td>
            <td style="padding: 8px 0; color: #1f2937;">${invoiceDetails.date.toLocaleDateString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Plan:</td>
            <td style="padding: 8px 0; color: #1f2937;">${invoiceDetails.planName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 18px;">Amount Paid:</td>
            <td style="padding: 8px 0; color: #10b981; font-weight: 700; font-size: 18px;">${formattedAmount}</td>
          </tr>
        </table>
      </div>

      ${invoiceDetails.invoiceUrl ? `
      <p style="text-align: center; margin: 30px 0;">
        <a href="${invoiceDetails.invoiceUrl}" style="${EMAIL_STYLES.button}">Download Invoice PDF</a>
      </p>
      ` : ''}

      <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
        Manage your subscription in the <a href="${baseUrl}/employer/billing" style="${EMAIL_STYLES.link}">Billing Settings</a>.
      </p>
    `;

    await this.sendEmail({
      to,
      subject: `Payment Receipt - Invoice #${invoiceDetails.invoiceNumber}`,
      html: this.wrapInTemplate(content, `Payment of ${formattedAmount} received for ${invoiceDetails.planName}`),
      text: `Payment Receipt\n\nInvoice #${invoiceDetails.invoiceNumber}\nAmount: ${formattedAmount}\nPlan: ${invoiceDetails.planName}\nDate: ${invoiceDetails.date.toLocaleDateString()}`,
    });
  }
}

export const emailService = new EmailService();
