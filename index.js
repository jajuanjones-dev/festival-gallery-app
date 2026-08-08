import Link from "next/link";
import { getActiveFestivals, getPastFestivals } from "../lib/festivals";

export default function Home() {
  const active = getActiveFestivals();
  const past = getPastFestivals();

  return (
    <div className="page">
      <div className="wordmark">Eternal Flame Photos</div>
      <h1 className="hero-title">Find your photos from the festival</h1>
      <p className="hero-sub">
        Browse by day and time to spot yourself, then download the ones you want.
      </p>

      <div className="festival-list">
        {active.length === 0 && (
          <p className="hero-sub">No events are live right now - check back soon.</p>
        )}
        {active.map((f) => (
          <Link key={f.festivalId} href={`/event/${f.festivalId}`} className="festival-card">
            <span className="festival-name">{f.displayName}</span>
            <span className="festival-dates">{f.dates.join(" · ")}</span>
          </Link>
        ))}
      </div>

      {past.length > 0 && (
        <div className="past-events">
          <h2 className="section-label">Past events</h2>
          <div className="festival-list">
            {past.map((f) => (
              <Link
                key={f.festivalId}
                href={`/event/${f.festivalId}`}
                className="festival-card past"
              >
                <span className="festival-name">{f.displayName}</span>
                <span className="festival-dates">{f.dates.join(" · ")}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
