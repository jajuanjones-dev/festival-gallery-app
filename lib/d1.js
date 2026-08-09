import { todayEventDate, formatDisplayDate } from "./time";

const D1_QUERY_URL = `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/d1/database/${process.env.CF_D1_DATABASE_ID}/query`;

async function d1Query(sql, params = []) {
  const token = process.env.CF_API_TOKEN || "";

  const res = await fetch(D1_QUERY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql, params }),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(`D1 query failed: ${JSON.stringify(data.errors)}`);
  }
  return data.result[0].results;
}

export async function getPhotosByFestivalAndDate(festivalId, date) {
  if (date) {
    return d1Query(
      "SELECT * FROM photos WHERE festival_id = ? AND timestamp LIKE ? ORDER BY timestamp",
      [festivalId, `${date}%`]
    );
  }
  return d1Query("SELECT * FROM photos WHERE festival_id = ? ORDER BY timestamp", [festivalId]);
}

export async function getPhotoById(id) {
  const rows = await d1Query("SELECT * FROM photos WHERE id = ?", [id]);
  return rows[0];
}

export async function markPurchased(id) {
  await d1Query("UPDATE photos SET purchased = 1 WHERE id = ?", [id]);
}

export async function insertPhoto({ id, festivalId, timestamp, previewKey, enhancedKey }) {
  await d1Query(
    "INSERT INTO photos (id, festival_id, timestamp, preview_key, enhanced_key, purchased) VALUES (?, ?, ?, ?, ?, 0)",
    [id, festivalId, timestamp, previewKey, enhancedKey]
  );
}

export async function getProcessedDriveIds() {
  const rows = await d1Query("SELECT drive_file_id FROM drive_imports", []);
  return new Set(rows.map((r) => r.drive_file_id));
}

export async function markDriveFileProcessed(driveFileId, photoId) {
  await d1Query(
    "INSERT INTO drive_imports (drive_file_id, photo_id, imported_at) VALUES (?, ?, ?)",
    [driveFileId, photoId, new Date().toISOString()]
  );
}

export async function getOrCreateTodayEvent() {
  const today = todayEventDate();
  const existing = await getEvent(today);
  if (existing) return existing;

  const displayName = `Event - ${formatDisplayDate(today)}`;
  const createdAt = new Date().toISOString();
  try {
    await d1Query(
      "INSERT INTO events (id, display_name, status, created_at) VALUES (?, ?, 'active', ?)",
      [today, displayName, createdAt]
    );
    return { id: today, display_name: displayName, status: "active", created_at: createdAt };
  } catch (err) {
    const retry = await getEvent(today);
    if (retry) return retry;
    throw err;
  }
}

export async function getEvent(id) {
  const rows = await d1Query("SELECT * FROM events WHERE id = ?", [id]);
  return rows[0];
}

export async function getActiveEvents() {
  return d1Query("SELECT * FROM events WHERE status = 'active' ORDER BY id DESC", []);
}

export async function getPastEvents() {
  return d1Query("SELECT * FROM events WHERE status = 'archived' ORDER BY id DESC", []);
}

export async function renameEvent(id, displayName) {
  await d1Query("UPDATE events SET display_name = ? WHERE id = ?", [displayName, id]);
}

export async function getDatesForEvent(eventId) {
  const rows = await d1Query(
    "SELECT DISTINCT substr(timestamp, 1, 10) as d FROM photos WHERE festival_id = ? ORDER BY d",
    [eventId]
  );
  return rows.map((r) => r.d);
}
