export async function getActiveEvents() {
  return d1Query("SELECT * FROM events WHERE status = 'active' ORDER BY sort_order DESC, created_at DESC", []);
}
export async function getPastEvents() {
  return d1Query("SELECT * FROM events WHERE status = 'archived' ORDER BY sort_order DESC, created_at DESC", []);
}
export async function updateEventOrder(id, sortOrder) {
  await d1Query("UPDATE events SET sort_order = ? WHERE id = ?", [sortOrder, id]);
}
export async function getPhotosForEvent(festivalId) {
  return d1Query("SELECT * FROM photos WHERE festival_id = ? ORDER BY timestamp DESC", [festivalId]);
}
export async function deletePhotoRow(id) {
  await d1Query("DELETE FROM photos WHERE id = ?", [id]);
}
