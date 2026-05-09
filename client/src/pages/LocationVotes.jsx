import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../services/api";

function LocationVotes() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvent();
    fetchSuggestions();

    const intervalId = setInterval(() => {
      fetchSuggestions();
    }, 3000);

    return () => clearInterval(intervalId);
  }, [id]);

  async function fetchEvent() {
    try {
      const data = await apiRequest(`/events/${id}`);
      setEvent(data.event);
    } catch (err) {
      setError(err.message);
    }
  }

  async function fetchSuggestions() {
    try {
      const data = await apiRequest(`/events/${id}/location-suggestions`);
      setSuggestions(data.suggestions);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function voteForLocation(suggestionId) {
    setError("");
    setMessage("");

    try {
      await apiRequest(
        `/events/${id}/location-suggestions/${suggestionId}/vote`,
        {
          method: "POST",
        }
      );

      setMessage("Vote added.");
      await fetchSuggestions();
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeVoteFromLocation(suggestionId) {
    setError("");
    setMessage("");

    try {
      await apiRequest(
        `/events/${id}/location-suggestions/${suggestionId}/vote`,
        {
          method: "DELETE",
        }
      );

      setMessage("Vote removed.");
      await fetchSuggestions();
    } catch (err) {
      setError(err.message);
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
      await fetchSuggestions();
    } catch (err) {
      setError(err.message);
    }
  }

  const sortedSuggestions = [...suggestions].sort(
    (a, b) => b.vote_count - a.vote_count
  );

  return (
    <div className="events-page">
      <div className="events-container">
        <button
          className="back-button"
          onClick={() => navigate(`/events/${id}`)}
        >
          ← Back to event
        </button>

        <div className="event-details-card">
          <p className="eyebrow">Location voting</p>
          <h1>Vote for the event location</h1>

          {event && (
            <p className="small-muted centered-text">
              {event.title} · Current final location:{" "}
              <strong>{event.location_name || "Location to be decided"}</strong>
            </p>
          )}

          {error && <p className="error">{error}</p>}
          {message && <p className="success">{message}</p>}
        </div>

        {loading ? (
          <div className="empty-card">
            <p>Loading votes...</p>
          </div>
        ) : sortedSuggestions.length === 0 ? (
          <div className="empty-card">
            <h2>No location suggestions yet</h2>
            <p>
              Go back to the event page and add or suggest a location first.
            </p>
          </div>
        ) : (
          <div className="votes-list">
            {sortedSuggestions.map((suggestion, index) => (
              <div key={suggestion.id} className="vote-card">
                <div className="vote-rank">#{index + 1}</div>

                <div className="vote-card-content">
                  <h2>{suggestion.name}</h2>

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

                <div className="vote-card-actions">
                  <span className="vote-count-large">
                    {suggestion.vote_count}
                    <small>
                      vote{suggestion.vote_count === 1 ? "" : "s"}
                    </small>
                  </span>

                  {suggestion.voted_by_me ? (
                    <button
                      className="secondary-button"
                      onClick={() => removeVoteFromLocation(suggestion.id)}
                    >
                      Remove vote
                    </button>
                  ) : (
                    <button onClick={() => voteForLocation(suggestion.id)}>
                      Vote
                    </button>
                  )}

                  <button
                    className="secondary-button"
                    onClick={() => chooseFinalLocation(suggestion.id)}
                  >
                    Choose final
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

export default LocationVotes;