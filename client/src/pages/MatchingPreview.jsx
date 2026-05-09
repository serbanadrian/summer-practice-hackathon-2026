import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";

function MatchingPreview() {
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loadingMatching, setLoadingMatching] = useState(false);

  useEffect(() => {
    fetchPreview();
  }, []);

  async function fetchPreview() {
    try {
      const data = await apiRequest("/matching/preview");
      setGroups(data.groups);
    } catch (err) {
      setError(err.message);
    }
  }

  async function runMatching() {
    setError("");
    setMessage("");
    setLoadingMatching(true);

    try {
      const data = await apiRequest("/matching/run", {
        method: "POST",
      });

      if (data.createdCount === 0) {
        setMessage("No full groups yet. Keep inviting players.");
      } else {
        setMessage(`${data.createdCount} event(s) created successfully.`);
      }

      await fetchPreview();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMatching(false);
    }
  }

  return (
    <div className="events-page">
      <div className="events-container">
        <button className="back-button" onClick={() => navigate("/dashboard")}>
          ← Back to dashboard
        </button>

        <div className="events-header-card">
          <div>
            <p className="eyebrow">Matching preview</p>
            <h1>Available groups</h1>
            <p>
              See possible groups before they are complete and find out how many
              players are still needed.
            </p>
          </div>

          <button onClick={runMatching} disabled={loadingMatching}>
            {loadingMatching ? "Matching..." : "Create ready events"}
          </button>
        </div>

        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}

        {groups.length === 0 ? (
          <div className="empty-card">
            <h2>No availability yet</h2>
            <p>
              Ask users to press ShowUpToday first, then this page will show
              potential groups.
            </p>
          </div>
        ) : (
          <div className="events-grid">
            {groups.map((group) => {
              const progressPercent = Math.min(
                (group.available_count / group.min_players) * 100,
                100
              );

              return (
                <div
                  key={`${group.sport_id}-${group.availability_date}-${group.time_slot}-${group.city}`}
                  className="event-card"
                >
                  <div>
                    <h2>{group.sport_name}</h2>
                    <p className="small-muted">
                      {new Date(group.availability_date).toLocaleDateString()} ·{" "}
                      {group.time_slot} · {group.city}
                    </p>
                  </div>

                  <div className="match-progress">
                    <div className="match-progress-top">
                      <strong>
                        {group.available_count}/{group.min_players} minimum
                      </strong>

                      <span
                        className={
                          group.is_ready
                            ? "status-available"
                            : "status-unavailable"
                        }
                      >
                        {group.is_ready ? "Ready" : "Waiting"}
                      </span>
                    </div>

                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    {group.is_ready ? (
                      <p className="small-muted">
                        Enough players to create an event. Max group size:{" "}
                        {group.max_players}.
                      </p>
                    ) : (
                      <p className="small-muted">
                        Need {group.missing_players} more player
                        {group.missing_players === 1 ? "" : "s"}.
                      </p>
                    )}
                  </div>

                  <div className="participants-list compact">
                    {group.users.map((user) => (
                      <div key={user.user_id} className="participant-item">
                        <div>
                          <strong>{user.name}</strong>
                          <p>{user.city || "No city set"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MatchingPreview;