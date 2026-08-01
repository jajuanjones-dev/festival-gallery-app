const D1_QUERY_URL = `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/d1/database/${process.env.CF_D1_DATABASE_ID}/query`;

async function d1Query(sql, params = []) {
  const token = process.env.CF_API_TOKEN || "";
  const accountId = process.env.CF_ACCOUNT_ID || "";
  const dbId = process.env.CF_D1_DATABASE_ID || "";

  console.log("DEBUG accountId length:", accountId.length, "value:", JSON.stringify(accountId));
  console.log("DEBUG dbId length:", dbId.length, "value:", JSON.stringify(dbId));
  console.log("DEBUG token length:", token.length, "first6:", token.slice(0, 6), "last4:", token.slice(-4));
  console.log("DEBUG token has whitespace:", /\s/.test(token));

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
