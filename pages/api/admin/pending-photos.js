import { listFolderImages } from "../../../lib/drive";
import { getProcessedDriveIds } from "../../../lib/d1";
import { isAuthorized } from "../../../lib/adminAuth";

export default async function handler(req, res) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (req.method !== "GET") {
    return res.status(405).end();
  }

  const [files, processedIds] = await Promise.all([
    listFolderImages(),
    getProcessedDriveIds(),
  ]);

  const pending = files.filter((f) => !processedIds.has(f.id));

  res.status(200).json({ pending });
}
