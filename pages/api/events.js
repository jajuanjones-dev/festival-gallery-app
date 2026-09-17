import { getActiveEvents, getPastEvents } from "../../lib/d1";

function shape(events) {
  return events.map((e) => ({
    festivalId: e.id,
    displayName: e.display_name,
    eventDate: e.event_date || "",
    dates: e.event_date ? [e.event_date] : [],
  }));
}

export default async function handler(req, res) {
  const [active, past] = await Promise.all([getActiveEvents(), getPastEvents()]);
  res.status(200).json({
    active: shape(active),
    past: shape(past),
  });
}
