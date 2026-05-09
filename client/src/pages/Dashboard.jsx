import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1>ShowUp2Move</h1>
          <p>Smart sports matching for spontaneous activities.</p>
        </div>

        <button onClick={handleLogout}>Logout</button>
      </header>

      <main className="dashboard-content">
        <h2>Hello, {user?.name || "friend"} 👋</h2>

        <section className="showup-card">
          <h3>ShowUpToday?</h3>
          <p>
            Are you available for a sport activity today? Tell us your sport and
            preferred time slot.
          </p>

          <div className="button-row">
            <button onClick={() => navigate("/show-up-today")}>
              Yes, I want to move
            </button>

            <button
              className="secondary-button"
              onClick={() => navigate("/profile-setup")}
            >
              Edit profile
            </button>

            <button
              className="secondary-button"
              onClick={() => navigate("/events")}
            >
              View matched events
            </button>
          </div>
        </section>

        <section className="showup-card">
          <h3>Smart matching</h3>
          <p>
            Once enough users are available for the same sport, date, time slot
            and city, ShowUp2Move creates a group and assigns a captain.
          </p>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;