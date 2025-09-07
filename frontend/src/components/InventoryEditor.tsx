import { useEffect, useState, useRef } from "react";
import type { Inventory } from "../types";
import { useLocalStorageWithUser } from "../hooks/useLocalStorageWithUser";
import { useAuth } from "../hooks/useAuth";
import { EditableHeader } from "./EditableHeader";
import type { Item } from "../types";
import { ItemModal } from "./ItemModal";
import { useTranslation } from "react-i18next";
import { useInventory } from "@/hooks/useInventory";
import { useItems } from "@/hooks/useItems";
import { AccessSettings } from "./AccessSettings";
import type { ConflictError } from "../types";

function InventoryEditor({
  inventoryId,
  isGuest = false,
}: {
  inventoryId: string;
  isGuest?: boolean;
}) {
  const { save } = useLocalStorageWithUser();
  const { session, isLoading: authLoading } = useAuth();
  const { t } = useTranslation();

  const [isConflict, setIsConflict] = useState(false);
  const [latestData, setLatestData] = useState<Inventory | null>(null);
  const [data, setData] = useState<Partial<Inventory>>({
    id: inventoryId,
    title: "",
    description: "",
    updatedAt: "",
  });
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const isEditingRef = useRef(false);

  const {
    inventory,
    loadingInventory,
    inventoryError,
    updateInventoryAsync,
    isUpdating,
  } = useInventory(inventoryId);

  const { items, loadingItems, itemsError, addItem, isAdding, updateItem } =
    useItems(inventoryId);

  useEffect(() => {
    if (inventory) {
      setData((prev) => {
        return {
          ...inventory,
          title: prev.title || inventory.title,
          description: prev.description || inventory.description,
          permissions: inventory.permissions,
          version: inventory.version,
        };
      });
    }
  }, [inventory]);

  const canEdit = !isGuest && !!inventory?.permissions?.canEdit;
  const canEditItems = !isGuest && !!inventory?.permissions?.canEditItems;

  const isCreatorOrAdmin =
    inventory?.creatorId === session?.user?.id ||
    session?.user?.role === "ADMIN";

  useEffect(() => {
    if (!canEdit || isUpdating) return;

    const interval = setInterval(async () => {
      if (!isEditingRef.current && data.id) {
        try {
          await updateInventoryAsync(data);
        } catch (error: unknown) {
          if (
            error instanceof Error &&
            "status" in error &&
            error.status === 409 &&
            "currentVersion" in error
          ) {
            const conflictError = error as ConflictError;
            if (inventory) {
              setLatestData({
                ...inventory,
                version: conflictError.currentVersion as number,
              });
              setIsConflict(true);
            }
          }
          console.error("Auto-save failed:", (error as Error).message);
        }
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [data, canEdit, updateInventoryAsync, isUpdating, inventory]);

  const resolveConflict = () => {
    if (!latestData) return;

    setData((prev) => ({
      ...latestData,
      title: prev.title,
      description: prev.description,
      version: latestData.version,
    }));

    setIsConflict(false);
    setLatestData(null);
  };

  const handleAddItem = () => {
    const customId = prompt(t("enterItemId"));
    if (customId) {
      addItem({ customId });
    }
  };

  const handleItemClick = (item: Item) => {
    save("lastInventoryId", inventoryId);
    setSelectedItem(item);
  };

  const handleItemSave = (updatedData: Partial<Item>) => {
    updateItem({
      inventoryId,
      itemId: selectedItem!.id,
      data: updatedData,
    });
    setSelectedItem(null);
  };

  const handleSaveWithConflictHandling = async ({
    title,
    description,
  }: {
    title: string;
    description: string;
  }) => {
    const newData = { ...data, title, description };
    setData(newData);

    try {
      await updateInventoryAsync(newData);
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        "status" in error &&
        error.status === 409 &&
        "currentVersion" in error
      ) {
        const conflictError = error as ConflictError;
        if (inventory) {
          setLatestData({
            ...inventory,
            version: conflictError.currentVersion as number,
          });
          setIsConflict(true);
        }
      } else {
        alert(`Error: ${(error as Error).message}`);
      }
    }
  };

  if (authLoading || loadingInventory) {
    return <div className="p-5 text-center">{t("loadingInventory")}</div>;
  }

  if (inventoryError || !inventory) {
    return <div className="p-5 text-red-600">{t("failedToLoadInventory")}</div>;
  }

  if (itemsError) {
    console.error("Failed to load items:", itemsError);
  }

  if (isConflict) {
    return (
      <div className="bg-yellow-300 p-5 my-2.5 rounded-md">
        <p>{t("inventoryConflict")}</p>
        <button onClick={resolveConflict} className="px-3 py-2 cursor-pointer">
          {t("mergeChanges")}
        </button>
      </div>
    );
  }

  return (
    <div className="p-5 font-sans max-w-6xl mx-auto w-full">
      <EditableHeader
        title={data.title || ""}
        description={data.description ?? ""}
        canEdit={canEdit}
        onSave={handleSaveWithConflictHandling}
        onEditingChange={(editing) => (isEditingRef.current = editing)}
      />

      <p className="text-sm text-gray-500 mb-6">
        {t("version")}: {data.version}
      </p>

      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">{t("items")}</h3>
          {canEditItems && (
            <button
              onClick={handleAddItem}
              disabled={isAdding}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-70"
            >
              {isAdding ? t("adding") : t("addItem")}
            </button>
          )}
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-500">
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">{t("customId")}</th>
              <th className="px-3 py-2">{t("string1")}</th>
              <th className="px-3 py-2">{t("int1")}</th>
              <th className="px-3 py-2">{t("bool1")}</th>
            </tr>
          </thead>
          <tbody>
            {loadingItems ? (
              <tr>
                <td colSpan={5} className="text-center py-4 text-gray-500">
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    {t("loadingItems")}...
                  </span>
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="hover:bg-gray-400 cursor-pointer"
                >
                  <td className="px-3 py-2 text-xs text-gray-500">
                    {item.id.slice(0, 8)}...
                  </td>
                  <td className="px-3 py-2">{item.customId}</td>
                  <td className="px-3 py-2">{item.string1 || "-"}</td>
                  <td className="px-3 py-2">{item.int1 || "-"}</td>
                  <td className="px-3 py-2 text-center">
                    {item.bool1 ? "✅" : "❌"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <ItemModal
          item={selectedItem || ({} as Item)}
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          onSave={handleItemSave}
          canEdit={canEditItems}
        />
      </div>
      {isCreatorOrAdmin && (
        <AccessSettings
          inventoryId={inventoryId}
          isPublic={!!inventory.isPublic}
          canEdit={true}
          version={inventory.version}
          onUpdate={(updated) => setData((prev) => ({ ...prev, ...updated }))}
        />
      )}
    </div>
  );
}

export default InventoryEditor;
