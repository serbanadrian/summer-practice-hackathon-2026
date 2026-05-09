import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";

function MyEvents() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loadingMatching, setLoadingMatching] = useState(false);

  useEffect(() => {
    fetchMyEvents();
  }, []);

  async function fetchMyEvents() {
    try {
      const data = await apiRequest("/events/me");
      setEvents(data.events);
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
        setMessage("No new groups created yet. Maybe not enough available users.");
      } else {
        setMessage(`${data.createdCount} new event(s) created.`);
      }

      await fetchMyEvents();
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
            <p className="eyebrow">Smart matching</p>
            <h1>My matched events</h1>
            <p>
              Run the matching engine and see automatically generated sports
              groups.
            </p>
          </div>

          <button onClick={runMatching} disabled={loadingMatching}>
            {loadingMatching ? "Matching..." : "Run matching"}
          </button>
        </div>

        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}

        {events.length === 0 ? (
          <div className="empty-card">
            <h2>No events yet</h2>
            <p>
              Mark yourself as available using ShowUpToday, then run matching.
            </p>
          </div>
        ) : (
          <div className="events-grid">
            {events.map((event) => (
              <div key={event.id} className="event-card">
                <div>
                  <h2>{event.title}</h2>
                  <p className="small-muted">{event.sport_name}</p>
                </div>

                <div className="event-info">
                  <p>
                    <strong>Date:</strong>{" "}
                    {new Date(event.event_date).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Time:</strong> {event.time_slot}
                  </p>
                  <p>
                    <strong>City:</strong> {event.city || "Not set"}
                  </p>
                  <p>
                    <strong>Location:</strong> {event.location_name}
                  </p>
                  <p>
                    <strong>Captain:</strong>{" "}
                    {event.captain_name || "Not assigned"}
                  </p>
                  <p>
                    <strong>Players:</strong> {event.participants_count}/
                    {event.max_players}
                  </p>
                  <p>
                    <strong>My status:</strong> {event.my_status}
                  </p>
                </div>

                <button onClick={() => navigate(`/events/${event.id}`)}>
                  View event
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyEvents;