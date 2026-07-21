// Builds a Google Calendar "Add to calendar" URL. Pure function, no deps, no
// network, no auth. When clicked, Google Calendar opens with the event
// prefilled; the user saves it to their own calendar. Used in the #bookings
// Discord embed on booking confirmation.

type CalendarLinkOptions = {
  title: string;
  details: string;
  location?: string;
  startISO: string;        // e.g. "2026-07-20T14:30" (booking.scheduled_at)
  durationMinutes: number;
};

// Google expects UTC basic format: YYYYMMDDTHHMMSSZ
function toGoogleUTC(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function googleCalendarUrl(opts: CalendarLinkOptions): string {
  const start = new Date(opts.startISO);
  const end = new Date(start.getTime() + opts.durationMinutes * 60_000);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: opts.title,
    dates: `${toGoogleUTC(start)}/${toGoogleUTC(end)}`,
    details: opts.details,
  });
  if (opts.location) params.set("location", opts.location);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
