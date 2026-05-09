import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../services/api";

function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);

  const [venues, setVenues] = useState([]);
  const [loadingVenues, setLoadingVenues] = useState(false);

  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [customLocation, setCustomLocation] = useState("");
  const [customAddress, setCustomAddress] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [savingCustomLocation, setSavingCustomLocation] = useState(false);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchEvent();
    fetchMessages();
    fetchLocationSuggestions();

    const intervalId = setInterval(() => {
      fetchMessages();
      fetchLocationSuggestions();
    }, 3000);

    return () => clearInterval(intervalId);
  }, [id]);

  async function fetchEvent() {
    try {
      const data = await apiRequest(`/events/${id}`);

      setEvent(data.event);
      setParticipants(data.participants);

      await fetchVenuesForEvent(data.event);
    } catch (err) {
      setError(err.message);
    }
  }

  async function fetchVenuesForEvent(eventData) {
    if (!eventData?.city || !eventData?.sport_id) {
      return;
    }

    setLoadingVenues(true);

    try {
      const data = await apiRequest(
        `/venues?sportId=${eventData.sport_id}&city=${encodeURIComponent(
          eventData.city
        )}`
      );

      setVenues(data.venues);
    } catch (err) {
      console.error("Fetch venues error:", err.message);
    } finally {
      setLoadingVenues(false);
    }
  }

  async function fetchLocationSuggestions() {
    try {
      const data = await apiRequest(`/events/${id}/location-suggestions`);
      setLocationSuggestions(data.suggestions);
    } catch (err) {
      console.error("Fetch location suggestions error:", err.message);
    }
  }

  async function fetchMessages() {
    try {
      const data = await apiRequest(`/events/${id}/messages`);
      setMessages(data.messages);
    } catch (err) {
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

  async function suggestVenue(venue) {
    setError("");
    setMessage("");

    try {
      await apiRequest(`/events/${id}/location-suggestions`, {
        method: "POST",
        body: JSON.stringify({
          name: venue.name,
          address: venue.address,
          pricePerHour: venue.price_per_hour,
        }),
      });

      setMessage(`Suggested location: ${venue.name}`);
      await fetchLocationSuggestions();
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveCustomLocationSuggestion(e) {
    e.preventDefault();

    if (!customLocation.trim()) {
      setError("Please enter a location suggestion.");
      return;
    }

    setError("");
    setMessage("");
    setSavingCustomLocation(true);

    try {
      await apiRequest(`/events/${id}/location-suggestions`, {
        method: "POST",
        body: JSON.stringify({
          name: customLocation.trim(),
          address: customAddress.trim(),
          pricePerHour: customPrice,
        }),
      });

      setMessage(`Custom suggestion added: ${customLocation.trim()}`);
      setCustomLocation("");
      setCustomAddress("");
      setCustomPrice("");
      await fetchLocationSuggestions();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingCustomLocation(false);
    }
  }

  async function chooseFinalLocation(suggestionId) {
    setError("");
    setMessage("");

    try {
      await apiRequest(
        `/events/${id}/location-suggestions/${suggestionId}/choose`,
        {
          method: "PATCH",
        }
      );

      setMessage("Final location selected.");
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
              <strong>Final location:</strong>{" "}
              {event.location_name || "Location to be decided"}
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
          <h2>Location coordination</h2>
          <p className="small-muted centered-text">
            Suggest venues, review group proposals, then choose a final location
            for the event.
          </p>

          <div className="location-coordination-layout">
            <div className="location-column">
              <h3>Venue suggestions</h3>
              <p className="small-muted">
                Suggested locations based on sport and city.
              </p>

              {loadingVenues ? (
                <p>Loading venues...</p>
              ) : venues.length === 0 ? (
                <p className="small-muted">
                  No venue suggestions found for this sport and city.
                </p>
              ) : (
                <div className="venues-list-compact">
                  {venues.map((venue) => (
                    <div key={venue.id} className="venue-card compact">
                      <h4>{venue.name}</h4>

                      <p className="small-muted">
                        {venue.address || "No address available"}
                      </p>

                      <p>
                        <strong>Price:</strong>{" "}
                        {Number(venue.price_per_hour) === 0
                          ? "Free"
                          : `${venue.price_per_hour} RON/hour`}
                      </p>

                      <button onClick={() => suggestVenue(venue)}>
                        Suggest this venue
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="location-column">
              <h3>Group location suggestions</h3>
              <p className="small-muted">
                Proposals added by event participants.
              </p>

              {locationSuggestions.length === 0 ? (
                <div className="empty-suggestions-box">
                  <p className="small-muted">No location suggestions yet.</p>
                </div>
              ) : (
                <div className="location-suggestions-list compact">
                  {locationSuggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className="location-suggestion-item"
                    >
                      <div>
                        <strong>{suggestion.name}</strong>

                        <p>{suggestion.address || "No address provided"}</p>

                        <p>
                          <strong>Price:</strong>{" "}
                          {suggestion.price_per_hour === null
                            ? "Not provided"
                            : Number(suggestion.price_per_hour) === 0
                            ? "Free"
                            : `${suggestion.price_per_hour} RON/hour`}
                        </p>

                        <p className="small-muted">
                          Suggested by {suggestion.suggested_by}
                        </p>
                      </div>

                      <button
                        className="secondary-button"
                        onClick={() => chooseFinalLocation(suggestion.id)}
                      >
                        Choose final
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="event-details-card">
          <h2>Add custom suggestion</h2>
          <p className="small-muted centered-text">
            Add a location proposal for the group.
          </p>

          <div className="custom-suggestion-card">
            <form
              onSubmit={saveCustomLocationSuggestion}
              className="custom-location-form-vertical"
            >
              <input
                type="text"
                placeholder="Location name"
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
              />

              <input
                type="text"
                placeholder="Address/details, optional"
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
              />

              <input
                type="number"
                placeholder="Price/hour, optional"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                min="0"
              />

              <button type="submit" disabled={savingCustomLocation}>
                {savingCustomLocation ? "Adding..." : "Add suggestion"}
              </button>
            </form>
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
          <p className="small-muted centered-text">
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