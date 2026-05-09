import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function CreateEvent() {
  const navigate = useNavigate();

  const [sports, setSports] = useState([]);
  const [sportId, setSportId] = useState("");
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState(getTodayDate());
  const [timeSlot, setTimeSlot] = useState("evening");
  const [city, setCity] = useState("");
  const [locationName, setLocationName] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSports();
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

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const data = await apiRequest("/events", {
        method: "POST",
        body: JSON.stringify({
          sportId: Number(sportId),
          title,
          eventDate,
          timeSlot,
          city,
          locationName,
        }),
      });

      setMessage("Event created successfully.");
      navigate(`/events/${data.event.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="events-page">
      <div className="events-container">
        <button className="back-button" onClick={() => navigate("/dashboard")}>
          ← Back to dashboard
        </button>

        <div className="event-details-card">
          <p className="eyebrow">Manual event</p>
          <h1>Create a sports event</h1>
          <p className="small-muted">
            Create an event manually and let other people join it.
          </p>

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

            <label>Title</label>
            <input
              type="text"
              placeholder="Example: Casual tennis after classes"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <label>Date</label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
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

            <label>City</label>
            <input
              type="text"
              placeholder="Timisoara"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />

            <label>Location</label>
            <input
              type="text"
              placeholder="Baza Sportivă / Park / To be decided"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
            />

            <button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create event"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateEvent;