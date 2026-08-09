import { getOrCreateTodayEvent } from "../../../lib/d1";
import { isAuthorized } from "../../../lib/adminAuth";

export default async function handler(req, res) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (req.method !== "GET") {
    return res.status(405).end();
  }

  const event = await getOrCreateTodayEvent();
  res.status(200).json({
    festivalId: event.id,
    displayName: event.display_name,
  });
}
