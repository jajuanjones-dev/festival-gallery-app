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
  },
