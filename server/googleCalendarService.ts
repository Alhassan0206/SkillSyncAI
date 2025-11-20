import type { IntegrationConfig } from "@shared/schema";
import type { CalendarEvent } from "./interviewService";

export class GoogleCalendarService {
  private async getAccessToken(config: IntegrationConfig): Promise<string> {
    const accessToken = (config.config as any)?.accessToken || (config.config as any)?.apiKey;
    
    if (!accessToken) {
      throw new Error("Google Calendar access token not configured. Please set up OAuth 2.0 authentication and store the access token in the integration config.");
    }
    
    return accessToken;
  }

  async createEvent(
    config: IntegrationConfig,
    event: CalendarEvent
  ): Promise<{ eventId: string; meetingUrl?: string }> {
    try {
      const accessToken = await this.getAccessToken(config);
      const calendarId = (config.config as any)?.calendarId || 'primary';

      const googleEvent = {
        summary: event.title,
        description: event.description,
        start: {
          dateTime: event.startTime.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: event.endTime.toISOString(),
          timeZone: 'UTC',
        },
        attendees: event.attendees.map(email => ({ email })),
        location: event.location,
        conferenceData: event.meetingUrl ? {
          conferenceSolution: {
            key: { type: 'hangoutsMeet' }
          },
          createRequest: {
            requestId: `skillsync-${Date.now()}`,
          }
        } : undefined,
      };

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?conferenceDataVersion=1`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(googleEvent),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Google Calendar API error:', errorText);
        throw new Error(`Failed to create calendar event: ${response.statusText}`);
      }

      const createdEvent = await response.json();
      
      return {
        eventId: createdEvent.id,
        meetingUrl: createdEvent.hangoutLink || event.meetingUrl,
      };
    } catch (error) {
      console.error('Error creating Google Calendar event:', error);
      throw error;
    }
  }

  async updateEvent(
    config: IntegrationConfig,
    eventId: string,
    event: Partial<CalendarEvent>
  ): Promise<void> {
    try {
      const accessToken = await this.getAccessToken(config);
      const calendarId = (config.config as any)?.calendarId || 'primary';

      const updateData: any = {};
      
      if (event.title) updateData.summary = event.title;
      if (event.description) updateData.description = event.description;
      if (event.startTime) {
        updateData.start = {
          dateTime: event.startTime.toISOString(),
          timeZone: 'UTC',
        };
      }
      if (event.endTime) {
        updateData.end = {
          dateTime: event.endTime.toISOString(),
          timeZone: 'UTC',
        };
      }
      if (event.attendees) {
        updateData.attendees = event.attendees.map(email => ({ email }));
      }
      if (event.location) updateData.location = event.location;

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update calendar event: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error updating Google Calendar event:', error);
      throw error;
    }
  }

  async deleteEvent(
    config: IntegrationConfig,
    eventId: string
  ): Promise<void> {
    try {
      const accessToken = await this.getAccessToken(config);
      const calendarId = (config.config as any)?.calendarId || 'primary';

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok && response.status !== 404) {
        throw new Error(`Failed to delete calendar event: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting Google Calendar event:', error);
      throw error;
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();
