import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useParams,
  useLocation,
  useNavigate,
} from "react-router-dom";
import "./App.css";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import InventoryEditor from "./components/InventoryEditor";
import Header from "./components/Header";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";
import { saveToStorage, getFromStorage } from "./utils/storage";

function RouteTracker() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, isLoading: authLoading } = useAuth();

  useEffect(() => {
    saveToStorage("lastVisitedPath", location.pathname + location.search);
  }, [location]);

  useEffect(() => {
    if (!authLoading) {
      const lastVisitedPath = getFromStorage("lastVisitedPath", "");

      if (session && lastVisitedPath && lastVisitedPath !== "/login") {
        navigate(lastVisitedPath);
      }

      if (!session && window.location.pathname !== "/login") {
        saveToStorage("redirectAfterLogin", window.location.pathname);
        navigate("/login");
      }
    }
  }, [session, authLoading, navigate]);

  return null;
}

function DynamicInventoryEditor() {
  const { id } = useParams<{ id: string }>();
  if (!id) {
    return <div className="p-5 text-red-600">Inventory not found</div>;
  }
  return <InventoryEditor inventoryId={id} />;
}

function AppContent() {
  const { session, isLoading: authLoading } = useAuth();

  if (authLoading)
    return <div className="p-5 text-center">Loading session...</div>;

  return (
    <div className="min-h-screen">
      {session && <Header key={session?.user.id} />}

      <div className="px-5">
        <Routes>
          <Route
            path="/"
            element={session ? <HomePage /> : <Navigate to="/login" />}
          />
          <Route
            path="/profile"
            element={session ? <ProfilePage /> : <Navigate to="/login" />}
          />
          <Route
            path="/inventory/:id"
            element={
              session ? <DynamicInventoryEditor /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/login"
            element={!session ? <LoginPage /> : <Navigate to="/" />}
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <RouteTracker />
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
