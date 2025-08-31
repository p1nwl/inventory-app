import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useLocalStorageWithUser } from "../hooks/useLocalStorageWithUser";
import { useQuery } from "@tanstack/react-query";
import { fetchInventories } from "../api/inventory";
import { canViewInventory } from "../utils/permissions";
import type { User, Inventory } from "../utils/permissions";

export default function HomePage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { save, get } = useLocalStorageWithUser();
  const user: User | null = session
    ? { id: session.user.id, role: session.user.role }
    : null;

  const {
    data: inventories = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["inventories"],
    queryFn: fetchInventories,
  });

  const visibleInventories = inventories.filter((inv: Inventory) =>
    canViewInventory(user, inv)
  );

  if (isLoading) {
    return <div className="p-5 text-center">Loading inventories...</div>;
  }

  if (error) {
    console.error("Failed to load inventories:", error);
    return (
      <div className="p-5 text-red-600">
        Failed to load inventories.{" "}
        <button onClick={() => refetch()} className="text-blue-600 underline">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold">All Inventories</h2>
      {visibleInventories.length === 0 ? (
        <p>No inventories yet.</p>
      ) : (
        <table className="w-full border-collapse mt-2.5">
          <thead>
            <tr className="bg-gray-700">
              <th className="p-2.5">Title</th>
              <th className="p-2.5">Description</th>
              <th className="p-2.5">Owner</th>
              <th className="p-2.5">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {visibleInventories.map((inv) => (
              <tr
                key={inv.id}
                onClick={() => {
                  if (session) {
                    save(`lastInventoryId_${session.user.id}`, inv.id);
                  }
                  navigate(`/inventory/${inv.id}`);
                }}
                className="cursor-pointer transition-colors duration-200 hover:bg-gray-400"
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
