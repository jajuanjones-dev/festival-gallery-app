import { getActiveEvents, updateEventOrder } from "../../../lib/d1";
import { isAuthorized } from "../../../lib/adminAuth";

export default async function handler(req, res) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { festivalId, direction } = req.body;
  if (!festivalId || !["up", "down"].includes(direction)) {
    return res.status(400).json({ error: "festivalId and direction ('up' or 'down') are required" });
  }

  const events = await getActiveEvents();
  const index = events.findIndex((e) => e.id === festivalId);
  if (index === -1) {
    return res.status(404).json({ error: "Event not found" });
  }

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= events.length) {
    return res.status(200).json({ status: "no-op" });
  }

  const current = events[index];
  const swapWith = events[swapIndex];
  const currentOrder = current.sort_order || 0;
  const swapOrder = swapWith.sort_order || 0;

  await Promise.all([
    updateEventOrder(current.id, swapOrder),
    updateEventOrder(swapWith.id, currentOrder),
  ]);

  res.status(200).json({ status: "reordered" });
}
