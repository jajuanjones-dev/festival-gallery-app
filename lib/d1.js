// Talks to Cloudflare D1 over its HTTP API - no server-side SDK needed,
// just plain fetch calls with an API token.
const D1_QUERY_URL = `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/d1/database/${process.env.CF_D1_DATABASE_ID}/query`;

async function d1Query(sql, params = []) {
  const res = await fetch(D1_QUERY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.CF_API_TOKEN}`,
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
