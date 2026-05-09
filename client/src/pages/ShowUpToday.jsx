import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

/**
 * ShowUpToday - Manage sports availability for today
 * Users can indicate which sports they're available for and when
 */
function ShowUpToday() {
  const navigate = useNavigate();

  // ============ Form State ============
  const [sportId, setSportId] = useState("");
  const [availabilityDate, setAvailabilityDate] = useState(getTodayDate());
  const [timeSlot, setTimeSlot] = useState("evening");
  const [isAvailable, setIsAvailable] = useState(true);

  // ============ Data State ============
  const [sports, setSports] = useState([]);
  const [myAvailabilities, setMyAvailabilities] = useState([]);

  // ============ UI State ============
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ============ Effects ============
  useEffect(() => {
    fetchSports();
    fetchMyAvailabilities();
  }, []);

  // ============ Data Fetching ============
  /**
   * Fetch available sports from backend
   */
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

  /**
   * Fetch user's availability history
   */
  async function fetchMyAvailabilities() {
    try {
      const data = await apiRequest("/availabilities/me");
      setMyAvailabilities(data.availabilities);
    } catch (err) {
      setError(err.message);
    }
  }

  // ============ Form Handlers ============
  /**
   * Handle availability selection - only update status for the selected date
   */
  async function handleAvailabilityToggle(value) {
    setError("");
    setMessage("");
    setLoading(true);

    try {
      await apiRequest("/availabilities/show-up-today", {
        method: "POST",
        body: JSON.stringify({
          sportId: Number(sportId),
          availabilityDate,
          timeSlot,
          isAvailable: value,
        }),
      });

      // Find and update the existing entry in the list or add a new one
      setMyAvailabilities((prevAvailabilities) => {
        const existingIndex = prevAvailabilities.findIndex(
          (item) =>
            item.sport_id === Number(sportId) &&
            item.availability_date === availabilityDate &&
            item.time_slot === timeSlot
        );

        if (existingIndex >= 0) {
          // Update existing entry
          const updated = [...prevAvailabilities];
          updated[existingIndex] = {
            ...updated[existingIndex],
            is_available: value,
          };
          return updated;
        } else {
          // Add new entry (for today)
          const selectedSport = sports.find((s) => s.id === Number(sportId));
          return [
            ...prevAvailabilities,
            {
              id: Date.now(), // temporary ID
              sport_id: Number(sportId),
              sport_name: selectedSport?.name || "Unknown",
              availability_date: availabilityDate,
              time_slot: timeSlot,
              is_available: value,
            },
          ];
        }
      });

      // Generate success message
      if (!value) {
        setMessage(
          "No worries. We saved that you are not available for this slot."
        );
      } else {
        setMessage(
          "Nice! You are available for this slot."
        );
      }

      // Update local form state
      setIsAvailable(value);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Submit availability form (from form submission)
   */
  async function handleSubmit(e) {
    e.preventDefault();
    await handleAvailabilityToggle(isAvailable);
  }

  /**
   * Handle clicking on a history item to toggle its availability
   */
  async function handleHistoryItemClick(item) {
    setError("");
    setMessage("");
    setLoading(true);

    const newAvailableState = !item.is_available;

    try {
      await apiRequest("/availabilities/show-up-today", {
        method: "POST",
        body: JSON.stringify({
          sportId: Number(item.sport_id),
          availabilityDate: item.availability_date,
          timeSlot: item.time_slot,
          isAvailable: newAvailableState,
        }),
      });

      // Update the item directly in the list instead of refetching
      setMyAvailabilities((prevAvailabilities) =>
        prevAvailabilities.map((availability) =>
          availability.id === item.id
            ? { ...availability, is_available: newAvailableState }
            : availability
        )
      );

      // Generate success message
      if (!newAvailableState) {
        setMessage(
          `${item.sport_name} on ${new Date(
            item.availability_date
          ).toLocaleDateString()} changed to unavailable.`
        );
      } else {
        setMessage(
          `${item.sport_name} on ${new Date(
            item.availability_date
          ).toLocaleDateString()} changed to available.`
        );
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ============ Render ============
  return (
    <div className="showup-page">
      <div className="showup-container">
        {/* ===== Header ===== */}
        <div className="showup-header">
          <button
            className="back-button"
            onClick={() => navigate("/dashboard")}
            aria-label="Back to dashboard"
          >
            ← Back to dashboard
          </button>
        </div>

        {/* ===== Main Form Card ===== */}
        <div className="showup-main-card">
          {/* Header Section */}
          <div className="showup-header-section">
            <p className="eyebrow">ShowUp2Move</p>
            <h1>ShowUpToday?</h1>
            <p className="showup-subtitle">
              Tell us what sport you are available for and we will use it for
              smart group matching.
            </p>
          </div>

          {/* Messages Section */}
          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}
          {message && (
            <div className="alert alert-success" role="status">
              {message}
            </div>
          )}

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="showup-form">
            {/* Sport Selection */}
            <div className="form-group">
              <label htmlFor="sport">Sport</label>
              <select
                id="sport"
                value={sportId}
                onChange={(e) => setSportId(e.target.value)}
                required
              >
                {sports.map((sport) => (
                  <option key={sport.id} value={sport.id}>
                    {sport.name} ({sport.min_players}-{sport.max_players}{" "}
                    players)
                  </option>
                ))}
              </select>
            </div>

            {/* Date Selection */}
            <div className="form-group">
              <label htmlFor="date">Date</label>
              <input
                id="date"
                type="date"
                value={availabilityDate}
                onChange={(e) => setAvailabilityDate(e.target.value)}
                required
              />
            </div>

            {/* Time Slot Selection */}
            <div className="form-group">
              <label htmlFor="timeSlot">Time slot</label>
              <select
                id="timeSlot"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                required
              >
                <option value="morning">🌅 Morning</option>
                <option value="afternoon">🌤️ Afternoon</option>
                <option value="evening">🌆 Evening</option>
                <option value="night">🌙 Night</option>
              </select>
            </div>

            {/* Availability Toggle */}
            <div className="form-group">
              <label>Availability</label>
              <div className="availability-toggle">
                <button
                  type="button"
                  className={`toggle-button ${
                    isAvailable ? "toggle-active" : ""
                  }`}
                  onClick={() => handleAvailabilityToggle(true)}
                  aria-pressed={isAvailable}
                >
                  ✓ Yes, I want to move
                </button>

                <button
                  type="button"
                  className={`toggle-button ${
                    !isAvailable ? "toggle-active danger" : ""
                  }`}
                  onClick={() => handleAvailabilityToggle(false)}
                  aria-pressed={!isAvailable}
                >
                  ✕ Not this time
                </button>
              </div>
            </div>

            {/* Status Display */}
            <div className="selected-availability-status">
              <span>Status:</span>
              <strong
                className={
                  isAvailable ? "available-text" : "unavailable-text"
                }
              >
                {isAvailable
                  ? "✓ Available for matching"
                  : "✕ Not available for this slot"}
              </strong>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="submit-button"
            >
              {loading
                ? "⏳ Saving..."
                : isAvailable
                ? "✓ Save as available"
                : "✕ Save as not available"}
            </button>
          </form>
        </div>

        {/* ===== Availability History Card ===== */}
        <div className="showup-history-card">
          <h2>My availability history</h2>

          {myAvailabilities.length === 0 ? (
            <p className="empty-state">
              No availability saved yet. Start by submitting your first status above!
            </p>
          ) : (
            <div className="availability-list">
              {myAvailabilities.map((item) => (
                <div
                  key={item.id}
                  className="availability-item"
                  onClick={() => handleHistoryItemClick(item)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleHistoryItemClick(item);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  title="Click to toggle availability"
                >
                  <div className="availability-item-info">
                    <strong className="availability-sport">
                      {item.sport_name}
                    </strong>
                    <p className="availability-date-time">
                      {new Date(
                        item.availability_date
                      ).toLocaleDateString()} · {item.time_slot}
                    </p>
                  </div>

                  <span
                    className={`status-badge ${
                      item.is_available
                        ? "status-available"
                        : "status-unavailable"
                    }`}
                  >
                    {item.is_available ? "✓ Available" : "✕ Unavailable"}
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