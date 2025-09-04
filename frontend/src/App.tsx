import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useParams,
  useLocation,
} from "react-router-dom";
import "./App.css";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import InventoryEditor from "./components/InventoryEditor";
import Header from "./components/Header";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";
import { saveToStorage } from "./utils/storage";
import { useTranslation } from "react-i18next";

function RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    saveToStorage("lastVisitedPath", location.pathname + location.search);
  }, [location]);

  return null;
}

function DynamicInventoryEditor({ isGuest }: { isGuest: boolean }) {
  const { id } = useParams<{ id: string }>();
  if (!id) {
    return <div className="p-5 text-red-600">Inventory not found</div>;
  }
  return <InventoryEditor isGuest={isGuest} inventoryId={id} />;
}

function AppContent() {
  const { session, isLoading: authLoading } = useAuth();
  const { i18n } = useTranslation();
  if (authLoading)
    return <div className="p-5 text-center">Loading session...</div>;

  return (
    <div key={i18n.language} className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 grid">
        <Routes>
          <Route path="/" element={<HomePage isGuest={!session} />} />
          <Route
            path="/profile"
            element={session ? <ProfilePage /> : <Navigate to="/login" />}
          />
          <Route
            path="/inventory/:id"
            element={<DynamicInventoryEditor isGuest={!session} />}
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
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
