// Centralizes "what day is it" for gallery auto-creation and photo
// timestamps. Servers default to UTC, which would roll a late-night event
// into a second gallery the moment the server clock crosses into UTC's
// next day. Set EVENT_TIMEZONE to wherever you actually shoot (e.g.
// "America/New_York"); defaults to UTC if unset.
const DEFAULT_TZ = "UTC";

function eventTimeZone() {
  return process.env.EVENT_TIMEZONE || DEFAULT_TZ;
}

export function todayEventDate() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: eventTimeZone() }).format(new Date());
}

export function nowEventLocalTimestamp() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: eventTimeZone(),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}:${map.second}`;
}

export function formatDisplayDate(isoDate) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
