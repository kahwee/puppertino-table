// The demo uses a fixed locale and explicit zone for hydration-safe formatting.
const dateFormats = new Map<string, { date: Intl.DateTimeFormat; time: Intl.DateTimeFormat }>();
export function formatDateTime(value: Date, timeZone = 'America/Los_Angeles') {
  let format = dateFormats.get(timeZone);
  if (!format) {
    format = {
      date: new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone,
      }),
      time: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone }),
    };
    dateFormats.set(timeZone, format);
  }
  return `${format.date.format(value)} at ${format.time.format(value)}`;
}
