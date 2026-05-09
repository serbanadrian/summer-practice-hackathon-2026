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
            Are you available for a sport activity today? Tell us your sport,
            date and preferred time slot.
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
          </div>
        </section>

        <section className="showup-card">
          <h3>Smart matching</h3>
          <p>
            Preview potential groups before they are complete, see how many
            players are still needed, then create ready events automatically.
          </p>

          <div className="button-row">
            <button onClick={() => navigate("/matching-preview")}>
              Matching preview
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
          <h3>How it works</h3>

          <div className="dashboard-steps">
            <div className="dashboard-step">
              <span>1</span>
              <div>
                <strong>Create your profile</strong>
                <p>Add your city, sports and skill level.</p>
              </div>
            </div>

            <div className="dashboard-step">
              <span>2</span>
              <div>
                <strong>Press ShowUpToday</strong>
                <p>Tell the app when and what you want to play.</p>
              </div>
            </div>

            <div className="dashboard-step">
              <span>3</span>
              <div>
                <strong>Get matched</strong>
                <p>The app groups compatible players and assigns a captain.</p>
              </div>
            </div>

            <div className="dashboard-step">
              <span>4</span>
              <div>
                <strong>Coordinate and play</strong>
                <p>Use the event page and group chat to organize details.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;