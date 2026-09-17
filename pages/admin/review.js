import { useEffect, useState, useCallback } from "react";

const POLL_MS = 60 * 1000;

export default function ReviewPage() {
  const [secret, setSecret] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  const [events, setEvents] = useState([]);
  const [festivalId, setFestivalId] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [creating, setCreating] = useState(false);

  const [pending, setPending] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState("");

  const [publishedPhotos, setPublishedPhotos] = useState([]);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("admin_secret");
    if (saved) {
      setSecret(saved);
      setUnlocked(true);
    }
  }, []);

  const authHeaders = useCallback(
    () => ({ "x-admin-secret": secret }),
    [secret]
  );

  function handleAuthFailure() {
    setUnlocked(false);
    sessionStorage.removeItem("admin_secret");
    setMessage("That secret was rejected - check ADMIN_SECRET and try again.");
  }

  const loadEvents = useCallback(async () => {
    const eventsRes = await fetch("/api/events");
    const eventsData = await eventsRes.json();
    return eventsData.active || [];
  }, []);

  useEffect(() => {
    if (!unlocked) return;

    async function init() {
      const activeList = await loadEvents();
      setEvents(activeList);
      if (activeList.length > 0) {
        setFestivalId(activeList[0].festivalId);
        setNameDraft(activeList[0].displayName);
      }
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked]);

  const loadPending = useCallback(async () => {
    if (!unlocked) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/pending-photos", { headers: authHeaders() });
      if (res.status === 401) return handleAuthFailure();
      const data = await res.json();
      setPending(data.pending || []);
    } catch {
      setMessage("Couldn't reach the server - try again.");
    } finally {
      setLoading(false);
    }
  }, [unlocked, authHeaders]);

  useEffect(() => {
    loadPending();
    const interval = setInterval(loadPending, POLL_MS);
    return () => clearInterval(interval);
  }, [loadPending]);

  const loadPublished = useCallback(async () => {
    if (!unlocked || !festivalId) return;
    try {
      const res = await fetch(
        `/api/admin/published-photos?festivalId=${encodeURIComponent(festivalId)}`,
        { headers: authHeaders() }
      );
      if (res.status === 401) return handleAuthFailure();
      const data = await res.json();
      setPublishedPhotos(data.photos || []);
    } catch {
      // non-critical, fail silently
    }
  }, [unlocked, festivalId, authHeaders]);

  useEffect(() => {
    loadPublished();
  }, [loadPublished]);

  function handleUnlock(e) {
    e.preventDefault();
    sessionStorage.setItem("admin_secret", secret);
    setUnlocked(true);
  }

  function handleSwitchEvent(id) {
    setFestivalId(id);
    const found = events.find((e) => e.festivalId === id);
    setNameDraft(found?.displayName || "");
  }

  async function handleSaveName() {
    const trimmed = nameDraft.trim();
    if (!trimmed || !festivalId) return;
    setSavingName(true);
    try {
      const res = await fetch("/api/admin/rename-event", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ festivalId, displayName: trimmed }),
      });
      if (res.status === 401) return handleAuthFailure();
      const data = await res.json();
      setEvents((prev) =>
        prev.map((e) => (e.festivalId === festivalId ? { ...e, displayName: data.displayName } : e))
      );
      setMessage("Gallery name updated.");
    } catch {
      setMessage("Couldn't save the name - try again.");
    } finally {
      setSavingName(false);
    }
  }

  async function handleCreateGallery() {
    const name = window.prompt("Name for the new gallery (e.g. Smith Wedding):");
    if (!name || !name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/create-event", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ displayName: name.trim() }),
      });
      if (res.status === 401) return handleAuthFailure();
      const data = await res.json();
      const newEvent = { festivalId: data.festivalId, displayName: data.displayName };
      setEvents((prev) => [newEvent, ...prev]);
      setFestivalId(newEvent.festivalId);
      setNameDraft(newEvent.displayName);
      setMessage(`Created new gallery: "${newEvent.displayName}"`);
    } catch {
      setMessage("Couldn't create the gallery - try again.");
    } finally {
      setCreating(false);
    }
  }

  async function handleReorder(direction) {
    if (!festivalId || reordering) return;
    setReordering(true);
    try {
      const res = await fetch("/api/admin/reorder-event", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ festivalId, direction }),
      });
      if (res.status === 401) return handleAuthFailure();
      const refreshed = await loadEvents();
      setEvents(refreshed);
      setMessage("Gallery order updated.");
    } catch {
      setMessage("Couldn't reorder - try again.");
    } finally {
      setReordering(false);
    }
  }

  function toggleSelect(fileId) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(fileId) ? next.delete(fileId) : next.add(fileId);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(pending.map((f) => f.id)));
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function handlePublish() {
    if (selected.size === 0 || !festivalId) return;
    setPublishing(true);
    setMessage("");

    const driveFileIds = Array.from(selected);
    try {
      const res = await fetch("/api/admin/publish-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ festivalId, driveFileIds }),
      });
      if (res.status === 401) return handleAuthFailure();
      const data = await res.json();

      const okIds = new Set(
        (data.results || []).filter((r) => r.status === "ok").map((r) => r.fileId)
      );
      const failedCount = (data.results || []).length - okIds.size;

      setPending((prev) => prev.filter((f) => !okIds.has(f.id)));
      setSelected(new Set());
      setMessage(
        failedCount > 0
          ? `Published ${okIds.size}, ${failedCount} failed - check server logs.`
          : `Published ${okIds.size} photo${okIds.size === 1 ? "" : "s"} to "${nameDraft}".`
      );
      loadPublished();
    } catch {
      setMessage("Publish failed - try again with a smaller batch.");
    } finally {
      setPublishing(false);
    }
  }

  async function handleDelete(photoId) {
    if (!window.confirm("Delete this photo? This can't be undone.")) return;
    setDeletingId(photoId);
    try {
      const res = await fetch("/api/admin/delete-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ photoId }),
      });
      if (res.status === 401) return handleAuthFailure();
      setPublishedPhotos((prev) => prev.filter((p) => p.id !== photoId));
      setMessage("Photo deleted.");
    } catch {
      setMessage("Couldn't delete - try again.");
    } finally {
      setDeletingId(null);
    }
  }

  if (!unlocked) {
    return (
      <div className="page">
        <div className="wordmark">Eternal Flame Photos</div>
        <h1 className="hero-title">Admin review</h1>
        <form onSubmit={handleUnlock} style={{ width: "100%", maxWidth: "22rem" }}>
          <input
            type="password"
            placeholder="Admin secret"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            style={{
              width: "100%",
              padding: "0.9rem",
              marginBottom: "0.75rem",
              borderRadius: 6,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
            }}
          />
          <button className="button" type="submit">
            Unlock
          </button>
        </form>
        {message && <p className="error-text">{message}</p>}
      </div>
    );
  }

  return (
    <div className="page">
      <div className="wordmark" style={{ marginBottom: "0.25rem" }}>
        Eternal Flame Photos
      </div>
      <p className="hero-sub" style={{ textAlign: "left", margin: "0 0 1.5rem", alignSelf: "flex-start" }}>
        Review &amp; publish
      </p>

      <div
        style={{
          width: "100%",
          maxWidth: "64rem",
          display: "flex",
          gap: "0.75rem",
          marginBottom: "1rem",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <select
          value={festivalId}
          onChange={(e) => handleSwitchEvent(e.target.value)}
          style={{
            background: "var(--surface)",
            color: "var(--text)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "0.6rem 0.8rem",
          }}
        >
          {events.length === 0 && <option value="">No galleries yet</option>}
          {events.map((e) => (
            <option key={e.festivalId} value={e.festivalId}>
              {e.displayName}
            </option>
          ))}
        </select>

        <button
          className="button"
          style={{ width: "auto" }}
          onClick={handleCreateGallery}
          disabled={creating}
        >
          {creating ? "Creating..." : "+ New Gallery"}
        </button>

        <button
          className="button"
          style={{ width: "auto" }}
          onClick={() => handleReorder("up")}
          disabled={reordering || !festivalId}
          title="Move this gallery up"
        >
          &uarr; Up
        </button>
        <button
          className="button"
          style={{ width: "auto" }}
          onClick={() => handleReorder("down")}
          disabled={reordering || !festivalId}
          title="Move this gallery down"
        >
          &darr; Down
        </button>

        <input
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          placeholder="Gallery name (e.g. Smith Wedding)"
          style={{
            flex: 1,
            minWidth: "12rem",
            background: "var(--surface)",
            color: "var(--text)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "0.6rem 0.8rem",
          }}
        />
        <button
          className="button"
          style={{ width: "auto" }}
          onClick={handleSaveName}
          disabled={savingName || nameDraft.trim() === ""}
        >
          {savingName ? "Saving..." : "Save name"}
        </button>
      </div>

      <div
        className="checkout-bar"
        style={{ position: "static", marginBottom: "1.5rem", marginTop: 0 }}
      >
        <span>
          {loading
            ? "Checking Drive..."
            : `${pending.length} new photo${pending.length === 1 ? "" : "s"} waiting`}
        </span>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="button" style={{ width: "auto" }} onClick={selectAll}>
            Select all
          </button>
          <button className="button" style={{ width: "auto" }} onClick={clearSelection}>
            Clear
          </button>
          <button
            className="button"
            style={{ width: "auto" }}
            onClick={handlePublish}
            disabled={selected.size === 0 || publishing || !festivalId}
          >
            {publishing ? "Publishing..." : `Publish ${selected.size || ""}`}
          </button>
        </div>
      </div>

      {message && <p className="error-text">{message}</p>}

      {!loading && pending.length === 0 && (
        <p className="hero-sub">
          Nothing new since last check - make sure Drive backup is running on your phone.
        </p>
      )}

      <div className="gallery-grid">
        {pending.map((file) => (
          <div
            key={file.id}
            className={`photo-card ${selected.has(file.id) ? "selected" : ""}`}
            onClick={() => toggleSelect(file.id)}
          >
            <img src={file.thumbnailLink} alt="" draggable={false} />
            <div className="check">{selected.has(file.id) ? "✓" : ""}</div>
          </div>
        ))}
      </div>

      <h2 style={{ width: "100%", maxWidth: "64rem", marginTop: "2.5rem" }}>
        Published in this gallery ({publishedPhotos.length})
      </h2>

      {publishedPhotos.length === 0 && (
        <p className="hero-sub">Nothing published in this gallery yet.</p>
      )}

      <div className="gallery-grid">
        {publishedPhotos.map((photo) => (
          <div key={photo.id} className="photo-card" style={{ position: "relative" }}>
            <img src={photo.previewUrl} alt="" draggable={false} />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(photo.id);
              }}
              disabled={deletingId === photo.id}
              style={{
                position: "absolute",
                top: "0.5rem",
                right: "0.5rem",
                background: "rgba(217,105,79,0.9)",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: "2rem",
                height: "2rem",
                cursor: "pointer",
                fontWeight: 700,
              }}
              title="Delete this photo"
            >
              {deletingId === photo.id ? "..." : "✕"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
