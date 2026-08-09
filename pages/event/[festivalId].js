import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

const REFRESH_MS = 15 * 60 * 1000;

function pad(n) {
  return String(n).padStart(2, "0");
}

function groupByQuarterHour(photos) {
  const groups = {};
  for (const photo of photos) {
    const hour = Number(photo.timestamp.slice(11, 13));
    const minute = Number(photo.timestamp.slice(14, 16));
    const blockStartMin = Math.floor(minute / 15) * 15;
    let endHour = hour;
    let endMin = blockStartMin + 15;
    if (endMin === 60) {
      endMin = 0;
      endHour = hour + 1;
    }
    const label = `${pad(hour)}:${pad(blockStartMin)} - ${pad(endHour)}:${pad(endMin)}`;
    if (!groups[label]) groups[label] = [];
    groups[label].push(photo);
  }
  return groups;
}

export default function EventGallery() {
  const router = useRouter();
  const { festivalId } = router.query;

  const [festival, setFestival] = useState(null);
  const [activeDate, setActiveDate] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    if (!festivalId) return;
    fetch(`/api/photos/${festivalId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setFestival(data.festival);
          setActiveDate(data.festival.dates[0]);
        }
        setLoading(false);
      });
  }, [festivalId]);

  useEffect(() => {
    if (!festivalId || !activeDate) return;

    let cancelled = false;

    function loadPhotos(showSpinner) {
      if (showSpinner) setLoading(true);
      fetch(`/api/photos/${festivalId}?date=${activeDate}`)
        .then((res) => res.json())
        .then((data) => {
          if (cancelled) return;
          setPhotos(data.photos || []);
          setLoading(false);
        });
    }

    loadPhotos(true);
    const interval = setInterval(() => loadPhotos(false), REFRESH_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [festivalId, activeDate]);

  const timeBlocks = useMemo(() => groupByQuarterHour(photos), [photos]);

  function toggleSelect(photoId) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(photoId) ? next.delete(photoId) : next.add(photoId);
      return next;
    });
  }

  async function handleCheckout() {
    setCheckingOut(true);
    const selectedIds = photos.filter((p) => selected.has(p.id)).map((p) => p.id);

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ festivalId, selectedIds }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setError(data.error || "Checkout failed - try again.");
      setCheckingOut(false);
    }
  }

  if (error) {
    return (
      <div className="page">
        <div className="wordmark">Eternal Flame Photos</div>
        <h1 className="hero-title">We couldn't find that event</h1>
        <p className="hero-sub">{error}</p>
      </div>
    );
  }

  if (!festival) {
    return (
      <div className="page">
        <p className="hero-sub">Loading...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="gallery-header">
        <div>
          <div className="wordmark" style={{ marginBottom: "0.25rem" }}>
            Eternal Flame Photos
          </div>
          <p className="hero-sub" style={{ textAlign: "left", margin: 0 }}>
            {festival.displayName}
          </p>
        </div>
      </div>

      <div className="date-tabs">
        {festival.dates.map((d) => (
          <button
            key={d}
            className={`date-tab ${d === activeDate ? "active" : ""}`}
            onClick={() => setActiveDate(d)}
          >
            {d}
          </button>
        ))}
      </div>

      {loading && <p className="hero-sub">Loading photos...</p>}

      {!loading && photos.length === 0 && (
        <p className="hero-sub">No photos posted for this day yet - check back soon.</p>
      )}

      {!loading &&
        Object.entries(timeBlocks)
          .sort()
          .map(([blockLabel, blockPhotos]) => (
            <div key={blockLabel} className="hour-block">
              <h2 className="hour-label">{blockLabel}</h2>
              <div className="gallery-grid">
                {blockPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className={`photo-card ${selected.has(photo.id) ? "selected" : ""}`}
                    onClick={() => toggleSelect(photo.id)}
                  >
                    <img
                      src={photo.previewUrl}
                      alt=""
                      draggable={false}
                      onContextMenu={(e) => e.preventDefault()}
                    />
                    <div className="check">{selected.has(photo.id) ? "✓" : ""}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}

      {selected.size > 0 && (
        <div className="checkout-bar">
          <span>
            {selected.size} photo{selected.size !== 1 ? "s" : ""} selected
          </span>
          <button className="button" onClick={handleCheckout} disabled={checkingOut}>
            {checkingOut ? "Redirecting to checkout..." : "Get your photos"}
          </button>
        </div>
      )}
    </div>
  );
}
