import { useEffect, useState } from "react";
import InventoryEditor from "./components/InventoryEditor";
import type { Session } from "./types";

function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        setSession(data);
      } else {
        setSession(null);
      }
    } catch (err) {
      console.error("Failed to fetch session", err);
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
    } catch (err) {
      console.error("Sign out failed", err);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Inventory Management App</h1>

      {!session ? (
        <div>
          <p>Log in to start managing inventories</p>
          <button
            onClick={() =>
              (window.location.href =
                "http://localhost:3001/api/auth/signin/google")
            }
            style={{
              padding: "10px 20px",
              margin: "0 10px",
              background: "#4285F4",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Sign in with Google
          </button>
          <button
            onClick={() =>
              (window.location.href =
                "http://localhost:3001/api/auth/signin/facebook")
            }
            style={{
              padding: "10px 20px",
              margin: "0 10px",
              background: "#1877F2",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Sign in with Facebook
          </button>
        </div>
      ) : (
        <div>
          <p>
            Hello, <strong>{session.user.name}</strong>! (
            <button
              onClick={handleSignOut}
              style={{
                color: "red",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              Sign out
            </button>
            )
          </p>
          <InventoryEditor inventoryId="clx91m2n30000a1b2c3d4e5f" />
        </div>
      )}
    </div>
  );
}

export default App;
