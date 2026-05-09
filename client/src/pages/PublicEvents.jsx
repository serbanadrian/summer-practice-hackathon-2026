import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";

function PublicEvents() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchPublicEvents();
  }, []);

  async function fetchPublicEvents() {
    try {
      const data = await apiRequest("/events/public");
      setEvents(data.events);
    } catch (err) {
      setError(err.message);
    }
  }

  async function joinEvent(eventId) {
    setError("");
    setMessage("");

    try {
      await apiRequest(`/events/${eventId}/join`, {
        method: "POST",
      });

      setMessage("You joined the event. Check My Events.");
      await fetchPublicEvents();
    } catch (err) {
      setError(err.message);
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
            <p className="eyebrow">Join events</p>
            <h1>Public sports events</h1>
            <p>
              Browse manually created or open events and join the ones that fit
              your schedule.
            </p>
          </div>

          <button onClick={() => navigate("/create-event")}>
            Create event
          </button>
        </div>

        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}

        {events.length === 0 ? (
          <div className="empty-card">
            <h2>No public events yet</h2>
            <p>Create the first manual event and invite others to join.</p>
          </div>
        ) : (
          <div className="events-grid">
            {events.map((event) => (
              <div key={event.id} className="event-card">
                <h2>{event.title}</h2>
                <p className="small-muted">{event.sport_name}</p>

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
                </div>

                <div className="button-row">
                  <button onClick={() => joinEvent(event.id)}>
                    Join event
                  </button>

                  <button
                    className="secondary-button"
                    onClick={() => navigate(`/events/${event.id}`)}
                  >
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PublicEvents;