import crypto from "crypto";
import { createEvent } from "../../../lib/d1";
import { isAuthorized } from "../../../lib/adminAuth";

export default async function handler(req, res) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { displayName } = req.body;
  if (!displayName || !displayName.trim()) {
    return res.status(400).json({ error: "A gallery name is required." });
  }

  const slug = displayName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const id = `${slug}-${crypto.randomUUID().slice(0, 8)}`;

  const event = await createEvent(id, displayName.trim());
  res.status(200).json({ festivalId: event.id, displayName: event.display_name });
}
