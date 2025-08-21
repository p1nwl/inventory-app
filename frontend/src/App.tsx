import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
} from "react-router-dom";
import InventoryEditor from "./components/InventoryEditor";
import "./App.css";
import type { Session } from "./types";
import ProfilePage from "./Pages/ProfilePage";
import LoginButton from "./components/LoginButton";

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [page, setPage] = useState<"home" | "profile">("home");

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/auth/session", {
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

  const handleSignOut = async () => {
    try {
      await fetch("http://localhost:3001/api/auth/signout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      setSession(null);
      window.location.href = "/login";
    } catch (err) {
      console.error("Sign out failed", err);
    }
  };

  if (!session || !session.user) {
    return (
      <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
        <h1>Inventory Management App</h1>
        <p>Log in to start managing inventories</p>
        <LoginButton />
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Inventory Management App</h1>
      <p>
        Hello,{" "}
        <strong>
          {session.user && session.user.name ? session.user.name : "User"}
        </strong>
        !
        <button onClick={handleSignOut} className="signOutStyle">
          Sign out
        </button>
      </p>

      <nav>
        <button onClick={() => setPage("home")} className="navButtonStyle">
          Home
        </button>
        <button onClick={() => setPage("profile")} className="navButtonStyle">
          My Profile
        </button>
      </nav>

      {page === "home" && (
        <InventoryEditor inventoryId="clx91m2n30000a1b2c3d4e5f" />
      )}
      {page === "profile" && <ProfilePage />}
    </div>
  );
}

export default App;
