import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../services/api";

function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchEvent();
    fetchMessages();

    const intervalId = setInterval(() => {
      fetchMessages();
    }, 3000);

    return () => clearInterval(intervalId);
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

  async function fetchMessages() {
    try {
      const data = await apiRequest(`/events/${id}/messages`);
      setMessages(data.messages);
    } catch (err) {
      // Nu suprascriem mereu eroarea principală ca să nu deranjeze polling-ul.
      console.error("Fetch messages error:", err.message);
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

  async function sendMessage(e) {
    e.preventDefault();

    if (!newMessage.trim()) {
      return;
    }

    setError("");
    setSendingMessage(true);

    try {
      await apiRequest(`/events/${id}/messages`, {
        method: "POST",
        body: JSON.stringify({
          content: newMessage,
        }),
      });

      setNewMessage("");
      await fetchMessages();
    } catch (err) {
      setError(err.message);
    } finally {
      setSendingMessage(false);
    }
  }

  if (!event) {
    return (
      <div className="events-page">
        <div className="events-container">
          <button className="back-button" onClick={() => navigate("/events")}>
            ← Back to events
          </button>

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

          {participants.length === 0 ? (
            <p className="small-muted">No participants yet.</p>
          ) : (
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
          )}
        </div>

        <div className="event-details-card">
          <h2>Group chat</h2>
          <p className="small-muted">
            Coordinate location, time and final confirmations with your group.
          </p>

          <div className="chat-box">
            {messages.length === 0 ? (
              <p className="small-muted">
                No messages yet. Start the conversation.
              </p>
            ) : (
              messages.map((chatMessage) => (
                <div key={chatMessage.id} className="chat-message">
                  <div className="chat-message-header">
                    <strong>{chatMessage.user_name}</strong>
                    <span>
                      {new Date(chatMessage.created_at).toLocaleString()}
                    </span>
                  </div>

                  <p>{chatMessage.content}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={sendMessage} className="chat-form">
            <input
              type="text"
              placeholder="Write a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />

            <button type="submit" disabled={sendingMessage}>
              {sendingMessage ? "Sending..." : "Send"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EventDetails;