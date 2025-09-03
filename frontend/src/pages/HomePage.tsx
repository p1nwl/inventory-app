import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { useLocalStorageWithUser } from "../hooks/useLocalStorageWithUser";
import { useQuery } from "@tanstack/react-query";
import { fetchInventories } from "../api/inventory";
import { useTranslation } from "react-i18next";
import type { Inventory, Item } from "@/types/index.js";
import { fetchAllItems } from "@/api/items.js";

export default function HomePage({ isGuest = false }: { isGuest?: boolean }) {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { save } = useLocalStorageWithUser();
  const { t } = useTranslation();

  const {
    data: inventories = [],
    isLoading: loadingInventories,
    error: inventoryError,
  } = useQuery({
    queryKey: ["inventories"],
    queryFn: fetchInventories,
    refetchOnMount: "always",
  });

  const { data: allItems = [], isLoading: loadingItems } = useQuery({
    queryKey: ["allItems"],
    queryFn: fetchAllItems,
  });

  const handleInventoryClick = (inv: Inventory) => {
    if (session) {
      save(`lastInventoryId_${session.user.id}`, inv.id);
    }
    navigate(`/inventory/${inv.id}`);
  };

  const handleItemClick = (item: Item) => {
    if (session) {
      save(`lastInventoryId_${session.user.id}`, item.inventoryId);
    }
    navigate(`/inventory/${item.inventoryId}`);
  };

  const visibleInventories = inventories.filter(
    (inv) => inv.permissions?.canView
  );

  return (
    <div className="p-5 space-y-8">
      <section>
        <h2 className="text-xl font-semibold mb-4">{t("allInventories")}</h2>
        {loadingInventories ? (
          <p>{t("loading")}...</p>
        ) : inventoryError ? (
          <p>{t("failedToLoadInventories")}</p>
        ) : visibleInventories.length === 0 ? (
          <p>{t("noInventories")}</p>
        ) : (
          <div className="bg-gray-600 rounded-lg overflow-hidden shadow-sm">
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-gray-700 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 font-medium">
                      {t("table.title")}
                    </th>
                    <th className="px-3 py-2 font-medium">
                      {t("table.owner")}
                    </th>
                    <th className="px-3 py-2 font-medium">
                      {t("table.lastUpdated")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleInventories.map((inv) => (
                    <tr
                      key={inv.id}
                      onClick={() => handleInventoryClick(inv)}
                      className="cursor-pointer hover:bg-gray-500 transition-colors"
                    >
                      <td className="px-3 py-2 font-medium">{inv.title}</td>
                      <td className="px-3 py-2">{inv.creator.name}</td>
                      <td className="px-3 py-2 text-sm">
                        {new Date(inv.updatedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">{t("allItems")}</h2>
        {loadingItems ? (
          <p className="">{t("loadingItems")}...</p>
        ) : allItems.length === 0 ? (
          <p className="">{t("noItemsFound")}</p>
        ) : (
          <div className="bg-gray-600 rounded-lg overflow-hidden shadow-sm">
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-gray-700 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 font-medium">{t("id")}</th>
                    <th className="px-3 py-2 font-medium">{t("customId")}</th>
                    <th className="px-3 py-2 font-medium">{t("string1")}</th>
                    <th className="px-3 py-2 font-medium">{t("int1")}</th>
                    <th className="px-3 py-2 font-medium">{t("bool1")}</th>
                  </tr>
                </thead>
                <tbody>
                  {allItems.slice(0, 20).map((item: Item) => (
                    <tr
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className="cursor-pointer hover:bg-gray-500 transition-colors"
                    >
                      <td className="px-3 py-2 text-xs">
                        {item.id.slice(0, 8)}...
                      </td>
                      <td className="px-3 py-2">{item.customId}</td>
                      <td className="px-3 py-2">{item.string1 || "-"}</td>
                      <td className="px-3 py-2">{item.int1 || "-"}</td>
                      <td className="px-3 py-2 text-center">
                        {item.bool1 ? "✅" : "❌"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {isGuest && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-800">
            🔐 {t("guestViewInfo")}{" "}
            <button
              onClick={() => (window.location.href = "/login")}
              className="text-blue-600 underline font-medium"
            >
              {t("signInToEdit")}
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
