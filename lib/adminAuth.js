export function isAuthorized(req) {
  const provided = req.headers["x-admin-secret"];
  const expected = process.env.ADMIN_SECRET;
  return Boolean(expected) && provided === expected;
}
