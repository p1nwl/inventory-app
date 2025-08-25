import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import InventoryEditor from "./components/InventoryEditor";
import "./App.css";
import type { Session } from "./types";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";

type Params = {
  id: string;
};

const AUTH_URL = import.meta.env.VITE_AUTH_URL;
const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const res = await fetch(`${AUTH_URL}/api/auth/session`, {
        credentials: "include",
      });
      const data = await res.json();
      console.log("Session data:", data);
      if (data && data.user) {
        setSession(data);
      } else {
        setSession(null);
      }
    } catch (error) {
      console.error("Failed to fetch session", error);
      setSession(null);
    }
  };

  return (
    <Router>
      <AppContent session={session} setSession={setSession} />
    </Router>
  );
}

function AppContent({
  session,
  setSession,
}: {
  session: Session | null;
  setSession: (session: Session | null) => void;
}) {
  const navigate = useNavigate();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (session && !redirecting) {
      const redirectHome = async () => {
        try {
          const res = await fetch(`${API_URL}/api/profile`, {
            credentials: "include",
          });
          const data = await res.json();

          const allInventories = [
            ...data.myInventories,
            ...data.accessibleInventories,
          ].sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );

          if (allInventories.length > 0) {
            navigate(`/inventory/${allInventories[0].id}`);
          } else {
            navigate("/profile");
          }
        } catch (err) {
          console.error("Failed to fetch profile for redirect:", err);
          navigate("/profile");
        }
      };

      setRedirecting(true);
      redirectHome();
    }
  }, [session, navigate, redirecting]);

  const handleSignOut = async () => {
    try {
      window.location.href = `${AUTH_URL}/api/auth/signout`;
    } catch (err) {
      console.error("Sign out failed", err);
    } finally {
      setSession(null);
      navigate("/login");
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Inventory Management App</h1>
      {session ? (
        <>
          <p>
            Hello, <strong>{session.user.name}</strong>!
            <button onClick={handleSignOut} className="signOutStyle">
              Sign out
            </button>
          </p>

          <nav className="navBarStyle">
            <Link to="/" className="navButtonStyle">
              Home
            </Link>
            <Link to="/profile" className="navButtonStyle">
              My Profile
            </Link>
          </nav>

          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/inventory/:id" element={<DynamicInventoryEditor />} />
            <Route path="*" element={<NavigateToLogin />} />
          </Routes>
        </>
      ) : (
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<NavigateToLogin />} />
        </Routes>
      )}
    </div>
  );
}

function HomePage() {
  return (
    <div>
      <h2>Start Managing Your Inventory</h2>
      <p>
        Go to{" "}
        <Link to="/profile" style={{ color: "#28a745" }}>
          My Profile
        </Link>{" "}
        to create or access your inventories.
      </p>
    </div>
  );
}

function NavigateToLogin() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/login");
  }, [navigate]);
  return null;
}

function DynamicInventoryEditor() {
  const { id } = useParams<Params>();
  if (!id) return <div>Inventory not found</div>;
  return <InventoryEditor inventoryId={id} />;
}

export default App;
