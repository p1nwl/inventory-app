import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { useLocalStorageWithUser } from "../hooks/useLocalStorageWithUser";
import { useQuery } from "@tanstack/react-query";
import { fetchInventories } from "../api/inventory";
import i18n from "../i18n";

export default function HomePage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { save } = useLocalStorageWithUser();

  const {
    data: inventories = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["inventories"],
    queryFn: fetchInventories,
    refetchOnMount: "always",
  });

  if (isLoading) {
    return (
      <div className="p-5 text-center">{i18n.t("loadingInventories")}</div>
    );
  }

  if (error) {
    console.error("Failed to load inventories:", error);
    return (
      <div className="p-5 text-red-600">
        {i18n.t("failedToLoadInventories")}.{" "}
        <button onClick={() => refetch()} className="text-blue-600 underline">
          i18n.t("retry")
        </button>
      </div>
    );
  }

  const visibleInventories = inventories.filter(
    (inv) => inv.permissions.canView
  );

  return (
    <div>
      <h2 className="text-xl font-semibold">{i18n.t("allInventories")}</h2>
      {visibleInventories.length === 0 ? (
        <p>{i18n.t("noInventories")}</p>
      ) : (
        <table className="w-full border-collapse mt-2.5">
          <thead>
            <tr className="bg-gray-700">
              <th className="p-2.5">{i18n.t("table.title")}</th>
              <th className="p-2.5">{i18n.t("table.description")}</th>
              <th className="p-2.5">{i18n.t("table.owner")}</th>
              <th className="p-2.5">{i18n.t("table.lastUpdated")}</th>
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
                <td className="p-2.5">{inv.title}</td>
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
