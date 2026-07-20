import { google } from "googleapis";

// Creates events on the coach's Google Calendar via a service account.
// The coach shares their calendar with GOOGLE_SERVICE_ACCOUNT_EMAIL
// ("Make changes to events"), so no per-user OAuth / token refresh is needed.
//
// Fail-soft, like lib/discord.ts: if credentials are missing or the API call
// fails, we return null and never throw, so booking confirmation still works.

const CALENDAR_TIMEZONE = "America/New_York"; // app treats all slot times as EST

type CreateEventOptions = {
  summary: string;
  description: string;
  startISO: string;        // e.g. "2026-07-20T14:30" (from booking.scheduled_at)
  durationMinutes: number;
  attendeeEmail?: string;
  location?: string;
};

function getCalendarClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!email || !rawKey || !calendarId) return null;

  // Private keys are stored with escaped newlines in env vars.
  const privateKey = rawKey.replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/calendar.events"],
  });

  return { calendar: google.calendar({ version: "v3", auth }), calendarId };
}

export async function createCalendarEvent(
  opts: CreateEventOptions,
): Promise<{ id: string; htmlLink: string } | null> {
  const client = getCalendarClient();
  if (!client) return null;

  try {
    const start = new Date(opts.startISO);
    if (isNaN(start.getTime())) return null;
    const end = new Date(start.getTime() + opts.durationMinutes * 60_000);

    const res = await client.calendar.events.insert({
      calendarId: client.calendarId,
      sendUpdates: opts.attendeeEmail ? "all" : "none",
      requestBody: {
        summary: opts.summary,
        description: opts.description,
        location: opts.location,
        start: { dateTime: start.toISOString(), timeZone: CALENDAR_TIMEZONE },
        end: { dateTime: end.toISOString(), timeZone: CALENDAR_TIMEZONE },
        ...(opts.attendeeEmail ? { attendees: [{ email: opts.attendeeEmail }] } : {}),
      },
    });

    const data = res.data;
    if (!data.id) return null;
    return { id: data.id, htmlLink: data.htmlLink ?? "" };
  } catch {
    return null;
  }
}
