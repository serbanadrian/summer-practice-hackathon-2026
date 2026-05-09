import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProfileSetup from "./pages/ProfileSetup";
import ShowUpToday from "./pages/ShowUpToday";
import MyEvents from "./pages/MyEvents";
import EventDetails from "./pages/EventDetails";
import MatchingPreview from "./pages/MatchingPreview";
import CreateEvent from "./pages/CreateEvent";
import PublicEvents from "./pages/PublicEvents";

import "./App.css";

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/profile-setup"
        element={
          <ProtectedRoute>
            <ProfileSetup />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/show-up-today"
        element={
          <ProtectedRoute>
            <ShowUpToday />
          </ProtectedRoute>
        }
      />

      <Route
        path="/events"
        element={
          <ProtectedRoute>
            <MyEvents />
          </ProtectedRoute>
        }
      />

      <Route
        path="/events/:id"
        element={
         <ProtectedRoute>
           <EventDetails />
         </ProtectedRoute>
       }
      /> 
      <Route
        path="/matching-preview"
        element={
         <ProtectedRoute>
            <MatchingPreview />
          </ProtectedRoute>
  }
      /> 
      <Route
        path="/create-event"
        element={
          <ProtectedRoute>
            <CreateEvent />
          </ProtectedRoute>
        }
      />

      <Route
        path="/public-events"
        element={
          <ProtectedRoute>
            <PublicEvents />
          </ProtectedRoute>
        }
      />          
    </Routes>
  );
}

export default App;