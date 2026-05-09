import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function ShowUpToday() {
  const navigate = useNavigate();

  const [sports, setSports] = useState([]);
  const [sportId, setSportId] = useState("");
  const [availabilityDate, setAvailabilityDate] = useState(getTodayDate());
  const [timeSlot, setTimeSlot] = useState("evening");
  const [isAvailable, setIsAvailable] = useState(true);

  const [myAvailabilities, setMyAvailabilities] = useState([]);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSports();
    fetchMyAvailabilities();
  }, []);

  async function fetchSports() {
    try {
      const data = await apiRequest("/sports");
      setSports(data.sports);

      if (data.sports.length > 0) {
        setSportId(String(data.sports[0].id));
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function fetchMyAvailabilities() {
    try {
      const data = await apiRequest("/availabilities/me");
      setMyAvailabilities(data.availabilities);
    } catch (err) {
      setError(err.message);
    }
  }

  function chooseAvailability(value) {
    setIsAvailable(value);
    setError("");
    setMessage("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const data = await apiRequest("/availabilities/show-up-today", {
        method: "POST",
        body: JSON.stringify({
          sportId: Number(sportId),
          availabilityDate,
          timeSlot,
          isAvailable,
        }),
      });

      if (!isAvailable) {
        setMessage(
          "No worries. We saved that you are not available for this slot."
        );
      } else if (data.createdCount > 0) {
        setMessage(
          `Great! ${data.createdCount} event(s) were created automatically. Check your matched events.`
        );
      } else {
        setMessage(
          "Nice! You are available. Not enough players yet, but you now appear in matching preview."
        );
      }

      await fetchMyAvailabilities();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="showup-page">
      <div className="showup-container">
        <button className="back-button" onClick={() => navigate("/dashboard")}>
          ← Back to dashboard
        </button>

        <div className="showup-main-card">
          <div>
            <p className="eyebrow">ShowUp2Move</p>
            <h1>ShowUpToday?</h1>
            <p>
              Tell us what sport you are available for and we will use it for
              smart group matching.
            </p>
          </div>

          {error && <p className="error">{error}</p>}
          {message && <p className="success">{message}</p>}

          <form onSubmit={handleSubmit}>
            <label>Sport</label>
            <select
              value={sportId}
              onChange={(e) => setSportId(e.target.value)}
              required
            >
              {sports.map((sport) => (
                <option key={sport.id} value={sport.id}>
                  {sport.name} ({sport.min_players}-{sport.max_players} players)
                </option>
              ))}
            </select>

            <label>Date</label>
            <input
              type="date"
              value={availabilityDate}
              onChange={(e) => setAvailabilityDate(e.target.value)}
              required
            />

            <label>Time slot</label>
            <select
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              required
            >
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
              <option value="night">Night</option>
            </select>

            <label>Availability</label>

            <div className="availability-toggle">
              <button
                type="button"
                className={isAvailable ? "toggle-active" : "toggle-button"}
                onClick={() => chooseAvailability(true)}
              >
                Yes, I want to move
              </button>

              <button
                type="button"
                className={
                  !isAvailable ? "toggle-active danger" : "toggle-button"
                }
                onClick={() => chooseAvailability(false)}
              >
                Not this time
              </button>
            </div>

            <div className="selected-availability-status">
              <span>Selected status:</span>

              <strong
                className={isAvailable ? "available-text" : "unavailable-text"}
              >
                {isAvailable
                  ? "Available for matching"
                  : "Not available for this slot"}
              </strong>
            </div>

            <button type="submit" disabled={loading}>
              {loading
                ? "Saving..."
                : isAvailable
                ? "Save as available"
                : "Save as not available"}
            </button>
          </form>
        </div>

        <div className="showup-history-card">
          <h2>My availability history</h2>

          {myAvailabilities.length === 0 ? (
            <p className="small-muted">No availability saved yet.</p>
          ) : (
            <div className="availability-list">
              {myAvailabilities.map((item) => (
                <div key={item.id} className="availability-item">
                  <div>
                    <strong>{item.sport_name}</strong>
                    <p>
                      {new Date(item.availability_date).toLocaleDateString()} ·{" "}
                      {item.time_slot}
                    </p>
                  </div>

                  <span
                    className={
                      item.is_available
                        ? "status-available"
                        : "status-unavailable"
                    }
                  >
                    {item.is_available ? "Available" : "Unavailable"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ShowUpToday;