import React, { useEffect, useState, useRef } from "react";
import type { Inventory } from "../types";
import { useLocalStorageWithUser } from "../hooks/useLocalStorageWithUser";
import { useAuth } from "../hooks/useAuth.js";
import { EditableHeader } from "./EditableHeader";
import type { Item } from "../types";
import { ItemModal } from "./ItemModal";
import { useTranslation } from "react-i18next";
import { useInventory } from "@/hooks/useInventory.js";
import { useItems } from "@/hooks/useItems.js";

interface InventoryEditorProps {
  inventoryId: string;
}

const InventoryEditor = ({
  inventoryId,
}: InventoryEditorProps): React.JSX.Element => {
  const { save } = useLocalStorageWithUser();
  const { isLoading: authLoading } = useAuth();
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
    updateInventory,
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

  const canEdit = !!inventory?.permissions?.canEdit;
  const canEditItems = !!inventory?.permissions?.canEditItems;

  useEffect(() => {
    if (!canEdit || isUpdating) return;

    const interval = setInterval(() => {
      if (!isEditingRef.current && data.id) {
        updateInventory(data);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [data, canEdit, updateInventory, isUpdating]);

  const resolveConflict = () => {
    if (!latestData) return;

    setData((prev) => ({
      ...latestData,
      title: prev.title,
      description: prev.description,
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
    <div className="p-5 font-sans max-w-4xl mx-auto">
      <EditableHeader
        title={data.title || ""}
        description={data.description ?? ""}
        canEdit={canEdit}
        onSave={({ title, description }) => {
          const newData = { ...data, title, description };
          setData(newData);
          updateInventory(newData);
        }}
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
          {loadingItems ? (
            <p className="text-center py-4 text-gray-500">
              {t("loadingItems")}...
            </p>
          ) : (
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="hover:bg-gray-600 cursor-pointer"
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
              ))}
            </tbody>
          )}
        </table>
        <ItemModal
          item={selectedItem || ({} as Item)}
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          onSave={handleItemSave}
          canEdit={canEditItems}
        />
      </div>
    </div>
  );
};

export default InventoryEditor;
