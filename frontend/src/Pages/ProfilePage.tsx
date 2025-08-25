import { useEffect, useState } from "react";
import type { Inventory } from "../types";

interface ProfileData {
  myInventories: Inventory[];
  accessibleInventories: Inventory[];
}

const API_URL = import.meta.env.VITE_API_URL;

function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/api/profile`, {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      } else {
        alert("Failed to load data. Please sign in again.");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInventory = async () => {
    const title = prompt("Enter inventory title:");
    if (!title) return;

    try {
      const res = await fetch(`${API_URL}/api/inventories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ title }),
      });

      if (res.ok) {
        const newInventory = await res.json();
        alert(`Inventory "${newInventory.title}" created!`);
      } else {
        const error = await res.text();
        alert(`Error: ${error}`);
      }
    } catch (error) {
      console.error("Error creating inventory:", error);
      alert("Network error. Please try again later.");
    } finally {
      fetchProfile();
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!profile) return <div>No profile data. Please log in.</div>;

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Personal Page</h1>

      <button
        onClick={handleCreateInventory}
        style={{
          padding: "10px 20px",
          background: "#28a745",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          marginBottom: "20px",
        }}
      >
        + Create New Inventory
      </button>
      <h2>My Inventories</h2>
      {profile.myInventories.length === 0 ? (
        <p>You haven’t created any inventories yet</p>
      ) : (
        <table
          border={1}
          cellPadding="10"
          style={{ width: "100%", marginBottom: "30px" }}
        >
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Description</th>
              <th>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {profile.myInventories.map((inv) => (
              <tr key={inv.id}>
                <td>{inv.id}</td>
                <td>{inv.title}</td>
                <td>{inv.description || "-"}</td>
                <td>{new Date(inv.updatedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Accessible Inventories</h2>
      {profile.accessibleInventories.length === 0 ? (
        <p>You don’t have access to other inventories</p>
      ) : (
        <table border={1} cellPadding="10" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Creator</th>
              <th>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {profile.accessibleInventories.map((inv) => (
              <tr key={inv.id}>
                <td>{inv.id}</td>
                <td>{inv.title}</td>
                <td>
                  {inv.creator.name} ({inv.creator.email})
                </td>
                <td>{new Date(inv.updatedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ProfilePage;
