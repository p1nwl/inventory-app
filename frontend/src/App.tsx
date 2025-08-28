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

function RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    saveToStorage("lastVisitedPath", location.pathname + location.search);
  }, [location]);

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
  console.log("🔄 AppContent render", { session, authLoading });

  if (authLoading)
    return <div className="p-5 text-center">Loading session...</div>;

  if (!session) return <LoginPage />;

  return (
    <div className="min-h-screen">
      <Header />
      <div>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/inventory/:id" element={<DynamicInventoryEditor />} />
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
