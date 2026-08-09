import { renameEvent } from "../../../lib/d1";
import { isAuthorized } from "../../../lib/adminAuth";

export default async function handler(req, res) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { festivalId, displayName } = req.body;
  const trimmed = (displayName || "").trim();

  if (!festivalId || !trimmed) {
    return res.status(400).json({ error: "Name can't be empty." });
  }

  await renameEvent(festivalId, trimmed);
  res.status(200).json({ ok: true, displayName: trimmed });
}
