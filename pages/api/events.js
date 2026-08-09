import { getActiveEvents, getPastEvents, getDatesForEvent } from "../../lib/d1";

async function shape(events) {
  return Promise.all(
    events.map(async (e) => ({
      festivalId: e.id,
      displayName: e.display_name,
      dates: await getDatesForEvent(e.id),
    }))
  );
}

export default async function handler(req, res) {
  const [active, past] = await Promise.all([getActiveEvents(), getPastEvents()]);

  res.status(200).json({
    active: await shape(active),
    past: await shape(past),
  });
}
