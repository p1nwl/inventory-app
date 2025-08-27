import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import type { Inventory } from "../types";
import { useAuth } from "../hooks/useAuth";

interface ProfileData {
  myInventories: Inventory[];
  accessibleInventories: Inventory[];
}

const API_URL = import.meta.env.VITE_API_URL;

function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const { session, isLoading: authLoading } = useAuth();

  useEffect(() => {
    const controller = new AbortController();

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/api/profile`, {
          signal: controller.signal,
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          if (!controller.signal.aborted) {
            setProfile(data);
          }
        } else {
          alert("Failed to load data. Please sign in again.");
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => controller.abort();
  }, []);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div key="loading" className="text-lg text-gray-600">
          Checking session...
        </div>
      </div>
    );
  }
  if (!session) return <Navigate to="/login" />;

  const handleCreateInventory = async () => {
    const title = prompt("Enter inventory title:");
    if (!title || title.trim() === "") return;

    try {
      const res = await fetch(`${API_URL}/api/inventories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ title: title.trim() }),
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
      const controller = new AbortController();

      try {
        const res = await fetch(`${API_URL}/api/profile`, {
          signal: controller.signal,
          credentials: "include",
        });
        if (res.ok && !controller.signal.aborted) {
          const data = await res.json();
          setProfile(data);
        }
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Error refreshing profile:", error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }
  };

  if (loading) return <div className="p-5 text-center">Loading...</div>;
  if (!profile) return <div className="p-5">No profile data.</div>;

  return (
    <div className="p-5 font-sans">
      <h1 className="text-2xl font-bold mb-4">Personal Page</h1>

      <button
        onClick={handleCreateInventory}
        className="px-5 py-2.5 bg-green-600 text-white border-none rounded cursor-pointer mb-6"
        aria-label="Create new inventory"
      >
        + Create New Inventory
      </button>

      <h2 className="text-xl font-semibold mb-2">My Inventories</h2>
      {profile.myInventories.length === 0 ? (
        <p>You haven’t created any inventories yet</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300 mb-8">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-left">ID</th>
              <th className="border border-gray-300 px-4 py-2 text-left">
                Title
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left">
                Description
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left">
                Last Updated
              </th>
            </tr>
          </thead>
          <tbody>
            {profile.myInventories.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2">{inv.id}</td>
                <td className="border border-gray-300 px-4 py-2">
                  {inv.title}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {inv.description || "-"}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {new Date(inv.updatedAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 className="text-xl font-semibold mb-2">Accessible Inventories</h2>
      {profile.accessibleInventories.length === 0 ? (
        <p>You don’t have access to other inventories</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-left">ID</th>
              <th className="border border-gray-300 px-4 py-2 text-left">
                Title
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left">
                Creator
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left">
                Last Updated
              </th>
            </tr>
          </thead>
          <tbody>
            {profile.accessibleInventories.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2">{inv.id}</td>
                <td className="border border-gray-300 px-4 py-2">
                  {inv.title}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {inv.creator.name} ({inv.creator.email})
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {new Date(inv.updatedAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ProfilePage;
