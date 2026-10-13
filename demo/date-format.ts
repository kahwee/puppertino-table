// Fixed demo locale/zone keep the rendered date deterministic during hydration.
// Real applications choose their user's locale and time zone.
const dateFormat = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'America/Los_Angeles',
});
const timeFormat = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'America/Los_Angeles',
});
export function formatDateTime(value: Date) {
  return `${dateFormat.format(value)} at ${timeFormat.format(value)}`;
}
