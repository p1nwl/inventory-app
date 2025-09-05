import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAccessList,
  addAccess,
  removeAccess,
  updatePublic,
  updateAccess,
} from "../api/inventory";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import type { InventoryUserAccess, AccessLevel } from "../types";

interface AccessSettingsProps {
  inventoryId: string;
  isPublic: boolean;
  canEdit: boolean;
  version: number;
  onUpdate: (updated: Partial<{ isPublic: boolean; version: number }>) => void;
}

export function AccessSettings({
  inventoryId,
  isPublic,
  canEdit,
  version,
  onUpdate,
}: AccessSettingsProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [publicEnabled, setPublicEnabled] = useState(isPublic);
  const [email, setEmail] = useState("");
  const [level, setLevel] = useState<AccessLevel>("VIEWER");

  const { data: accessList = [], refetch } = useQuery<InventoryUserAccess[]>({
    queryKey: ["access", inventoryId],
    queryFn: () => fetchAccessList(inventoryId),
    enabled: canEdit && !publicEnabled,
  });

  const updatePublicMutation = useMutation({
    mutationFn: (nextPublic: boolean) =>
      updatePublic(inventoryId, nextPublic, version),
    onSuccess: (updated) => {
      setPublicEnabled(updated.isPublic);
      onUpdate(updated);
      queryClient.setQueryData(["inventory", inventoryId], updated);
      queryClient.invalidateQueries({ queryKey: ["access", inventoryId] });
    },
    onError: (error: unknown) => {
      console.error("Failed to update public status", error);
      alert(t("updateError"));
      setPublicEnabled(isPublic);
    },
  });

  const addMutation = useMutation({
    mutationFn: () => addAccess(inventoryId, email.trim(), level),
    onSuccess: () => {
      setEmail("");
      refetch();
    },
    onError: (e) => {
      alert(e?.message || t("failedToAddUser"));
    },
  });

  const updateAccessMutation = useMutation({
    mutationFn: ({
      userId,
      accessLevel,
    }: {
      userId: string;
      accessLevel: AccessLevel;
    }) => updateAccess(inventoryId, userId, accessLevel),
    onSuccess: () => refetch(),
    onError: (e) => {
      alert(e?.message || t("failedToUpdateAccess"));
    },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeAccess(inventoryId, userId),
    onSuccess: () => refetch(),
    onError: () => alert(t("failedToRemoveUser")),
  });

  return (
    <div className="mt-8 p-4 rounded-lg">
      <h3 className="text-lg font-medium mb-4">{t("accessSettings")}</h3>

      <div className="flex items-center gap-3 mb-6">
        <label className="flex items-center cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={publicEnabled}
              onChange={(e) => {
                const checked = e.target.checked;
                setPublicEnabled(checked);
                updatePublicMutation.mutate(checked);
              }}
              className="sr-only"
              disabled={!canEdit || updatePublicMutation.isPending}
            />
            <div
              className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
                publicEnabled ? "bg-blue-600" : "bg-gray-300"
              } ${updatePublicMutation.isPending ? "opacity-60" : ""}`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
                  publicEnabled ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </div>
          </div>
          <span className="ml-3 text-sm font-medium">{t("makePublic")}</span>
        </label>
        <span className="text-xs text-gray-500">
          {t("publicInventoryHint")}
        </span>
      </div>

      {!publicEnabled && (
        <>
          <div className="mb-4 flex gap-2">
            <input
              type="email"
              placeholder={t("userEmail")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded"
            />
            <Select
              value={level}
              onValueChange={(value) => setLevel(value as AccessLevel)}
            >
              <SelectTrigger className="px-3 py-2 border rounded w-[160px]">
                <SelectValue placeholder={t("selectRole")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VIEWER">{t("viewer")}</SelectItem>
                <SelectItem value="EDITOR">{t("editor")}</SelectItem>
              </SelectContent>
            </Select>
            <button
              onClick={() => addMutation.mutate()}
              disabled={addMutation.isPending || !email.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-70"
            >
              {addMutation.isPending ? t("adding") : t("add")}
            </button>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500">
                <th>{t("user")}</th>
                <th>{t("email")}</th>
                <th>{t("role")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {accessList.map((item) => (
                <tr key={item.id} className="border-t">
                  <td>{item.user.name || "No name"}</td>
                  <td>{item.user.email}</td>
                  <td>
                    <Select
                      defaultValue={item.accessLevel}
                      onValueChange={(value) =>
                        updateAccessMutation.mutate({
                          userId: item.userId,
                          accessLevel: value as AccessLevel,
                        })
                      }
                      disabled={updateAccessMutation.isPending}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder={t("selectRole")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VIEWER">{t("viewer")}</SelectItem>
                        <SelectItem value="EDITOR">{t("editor")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td>
                    <button
                      onClick={() => removeMutation.mutate(item.userId)}
                      className="text-red-600 hover:underline"
                    >
                      {t("remove")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {publicEnabled && (
        <div className="text-sm text-blue-700 bg-blue-50 p-3 rounded">
          🔐 {t("publicInventoryDescription")}
        </div>
      )}
    </div>
  );
}
