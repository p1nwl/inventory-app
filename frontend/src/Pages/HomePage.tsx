import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Inventory } from "../types";
import { useAuth } from "../hooks/useAuth";
import { useLocalStorageWithUser } from "../hooks/useLocalStorageWithUser";

const API_URL = import.meta.env.VITE_API_URL;

export default function HomePage() {
  const { session, isLoading } = useAuth();
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const navigate = useNavigate();
  const { save, get } = useLocalStorageWithUser();

  useEffect(() => {
    const controller = new AbortController();

    const fetchInventories = async () => {
      try {
        const res = await fetch(`${API_URL}/api/inventories`, {
          signal: controller.signal,
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          if (!controller.signal.aborted) {
            setInventories(data);
          }
        }
      } catch (error) {
        if (error instanceof Error) {
          if (error.name !== "AbortError") {
            console.error("Failed to fetch inventories", error);
          } else {
            console.log("Fetch aborted");
          }
        }
      }
    };
    fetchInventories();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (session) {
      const lastViewedId = get<string>("lastInventoryId", "");
      if (lastViewedId) {
        navigate(`/inventory/${lastViewedId}`);
      }
    }
  }, [session, navigate, get]);

  if (isLoading) {
    return <div className="p-5 text-center">Loading inventories...</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold">Your Inventories</h2>
      {inventories.length === 0 ? (
        <p>No inventories yet. Create one in your profile.</p>
      ) : (
        <table className="w-full border-collapse mt-2.5">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-2.5">Title</th>
              <th className="text-left p-2.5">Description</th>
              <th className="text-left p-2.5">Owner</th>
              <th className="text-left p-2.5">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {inventories.map((inv) => (
              <tr
                key={inv.id}
                onClick={() => {
                  if (session) {
                    save(`lastInventoryId_${session.user.id}`, inv.id);
                  }
                  navigate(`/inventory/${inv.id}`);
                }}
                className="cursor-pointer transition-colors duration-200 hover:bg-gray-50"
              >
                <td
                  className={`p-2.5 ${
                    inv.id === get<string>("lastInventoryId", "")
                      ? "font-bold"
                      : "font-normal"
                  }`}
                >
                  {inv.title}
                </td>
                <td className="p-2.5">{inv.description || "-"}</td>
                <td className="p-2.5">{inv.creator.name}</td>
                <td className="p-2.5">
                  {new Date(inv.updatedAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
