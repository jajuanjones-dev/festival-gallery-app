// Edit this after each festival. Keeping it as a plain config file instead of a
// database table means updating it is a one-line git commit + redeploy, no
// separate admin panel to build or maintain.
export const festivals = [
  {
    festivalId: "2026-07-16-riverfest",
    displayName: "Riverfest 2026",
    dates: ["2026-07-16", "2026-07-17"],
    status: "active", // "active" shows on the homepage, "archived" is still reachable by direct link
  },
  // {
  //   festivalId: "2026-08-02-sunsetmusicfest",
  //   displayName: "Sunset Music Fest 2026",
  //   dates: ["2026-08-02"],
  //   status: "active",
  // },
];

export function getActiveFestivals() {
  return festivals
    .filter((f) => f.status === "active")
    .sort((a, b) => b.dates[0].localeCompare(a.dates[0])); // most recent first
}

export function getPastFestivals() {
  return festivals
    .filter((f) => f.status === "archived")
    .sort((a, b) => b.dates[0].localeCompare(a.dates[0])); // most recent first
}

export function getFestival(festivalId) {
  return festivals.find((f) => f.festivalId === festivalId);
}
