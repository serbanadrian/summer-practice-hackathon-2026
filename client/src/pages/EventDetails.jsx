import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../services/api";

function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchEvent();
  }, [id]);

  async function fetchEvent() {
    try {
      const data = await apiRequest(`/events/${id}`);
      setEvent(data.event);
      setParticipants(data.participants);
    } catch (err) {
      setError(err.message);
    }
  }

  async function updateParticipation(status) {
    setError("");
    setMessage("");

    try {
      await apiRequest(`/events/${id}/participation`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      setMessage(`Participation marked as ${status}.`);
      await fetchEvent();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!event) {
    return (
      <div className="events-page">
        <div className="events-container">
          {error ? <p className="error">{error}</p> : <p>Loading event...</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="events-page">
      <div className="events-container">
        <button className="back-button" onClick={() => navigate("/events")}>
          ← Back to events
        </button>

        <div className="event-details-card">
          <p className="eyebrow">Event details</p>
          <h1>{event.title}</h1>

          {error && <p className="error">{error}</p>}
          {message && <p className="success">{message}</p>}

          <div className="event-info">
            <p>
              <strong>Sport:</strong> {event.sport_name}
            </p>
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
              <strong>Captain:</strong> {event.captain_name || "Not assigned"}
            </p>
            <p>
              <strong>Status:</strong> {event.status}
            </p>
          </div>

          <div className="button-row">
            <button onClick={() => updateParticipation("confirmed")}>
              Confirm participation
            </button>
            <button
              className="secondary-button"
              onClick={() => updateParticipation("declined")}
            >
              Decline
            </button>
          </div>
        </div>

        <div className="event-details-card">
          <h2>Participants</h2>

          <div className="participants-list">
            {participants.map((participant) => (
              <div key={participant.id} className="participant-item">
                <div>
                  <strong>{participant.name}</strong>
                  <p>{participant.city || "No city set"}</p>
                </div>

                <span className="status-pill">{participant.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventDetails;