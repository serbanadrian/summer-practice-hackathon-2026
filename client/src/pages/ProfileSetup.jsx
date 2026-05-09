import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";
import { useAuth } from "../context/AuthContext";

function ProfileSetup() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [sports, setSports] = useState([]);
  const [selectedSports, setSelectedSports] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchSports() {
      try {
        const data = await apiRequest("/sports");
        setSports(data.sports);
      } catch (err) {
        setError(err.message);
      }
    }

    fetchSports();
  }, []);

  function toggleSport(sportId) {
    setSelectedSports((prev) => {
      const updated = { ...prev };

      if (updated[sportId]) {
        delete updated[sportId];
      } else {
        updated[sportId] = "beginner";
      }

      return updated;
    });
  }

  function changeSkillLevel(sportId, skillLevel) {
    setSelectedSports((prev) => ({
      ...prev,
      [sportId]: skillLevel,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const sportsPayload = Object.entries(selectedSports).map(
        ([sportId, skillLevel]) => ({
          sportId: Number(sportId),
          skillLevel,
        })
      );

      await apiRequest("/users/profile", {
        method: "PUT",
        body: JSON.stringify({
          description,
          city,
          sports: sportsPayload,
        }),
      });

      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="profile-page">
      <div className="profile-card">
        <h1>Set up your profile</h1>
        <p>
          Tell us what you like to play so we can match you with the right
          people.
        </p>

        {user && <p className="small-muted">Logged in as {user.email}</p>}

        {error && <p className="error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <label>Short description</label>
          <textarea
            placeholder="Example: I enjoy casual football after work and weekend tennis."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="4"
          />

          <label>City</label>
          <input
            type="text"
            placeholder="Timișoara"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
          />

          <label>Sports preferences</label>

          <div className="sports-grid">
            {sports.map((sport) => {
              const isSelected = selectedSports[sport.id];

              return (
                <div
                  key={sport.id}
                  className={`sport-option ${isSelected ? "selected" : ""}`}
                >
                  <div className="sport-top-row">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={!!isSelected}
                        onChange={() => toggleSport(sport.id)}
                      />
                      <span>{sport.name}</span>
                    </label>
                  </div>

                  <p className="small-muted">
                    Group size: {sport.min_players}-{sport.max_players}
                  </p>

                  {isSelected && (
                    <select
                      value={selectedSports[sport.id]}
                      onChange={(e) =>
                        changeSkillLevel(sport.id, e.target.value)
                      }
                    >
                      <option value="beginner">Beginner</option>
                      <option value="casual">Casual</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  )}
                </div>
              );
            })}
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save profile"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ProfileSetup;