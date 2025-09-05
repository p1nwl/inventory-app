import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ProfileData } from "../types";
import { fetchProfile } from "../api/profile";
import { createInventory } from "../api/inventory";
import { useLocalStorageWithUser } from "../hooks/useLocalStorageWithUser";
import { useTranslation } from "react-i18next";

function ProfilePage() {
  const { session, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { save } = useLocalStorageWithUser();
  const { t } = useTranslation();

  const {
    data: profile,
    isLoading,
    error,
    refetch,
  } = useQuery<ProfileData, Error>({
    queryKey: ["profile"],
    queryFn: fetchProfile,
    enabled: !!session,
    refetchOnMount: "always",
  });

  const createMutation = useMutation({
    mutationFn: (title: string) => createInventory({ title, description: "" }),
    onSuccess: (newInventory) => {
      alert(`Inventory "${newInventory.title}" created!`);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error: Error) => {
      alert(`Erorr: ${error.message}`);
    },
  });

  const handleCreateInventory = () => {
    const title = prompt("Enter inventory title");
    if (title && title.trim()) {
      createMutation.mutate(title.trim());
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-600">{t("checkingSession")}</div>
      </div>
    );
  }

  if (!session) return <Navigate to="/login" />;

  if (isLoading)
    return <div className="p-5 text-center">{t("loadingProfile")}</div>;

  if (error) {
    return (
      <div className="p-5 text-red-600">
        {t("failedToLoadProfile")}.{" "}
        <button onClick={() => refetch()} className="text-blue-600 underline">
          {t("retry")}
        </button>
      </div>
    );
  }

  if (!profile) return <div className="p-5">{t("noProfileData")}</div>;

  return (
    <div className="p-5 font-sans">
      <h1 className="text-2xl font-bold mb-4">{t("personalPage")}</h1>

      <button
        onClick={handleCreateInventory}
        className="px-5 py-2.5 bg-green-600 text-white border-none rounded cursor-pointer mb-6"
        aria-label={t("createInventory")}
      >
        + {t("createInventory")}
      </button>

      <h2 className="text-xl font-semibold mb-2">{t("myInventories")}</h2>
      {profile.myInventories.length === 0 ? (
        <p>{t("noMyInventories")}</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300 mb-8">
          <thead>
            <tr className="bg-gray-700">
              <th className="border border-gray-300 px-4 py-2">ID</th>
              <th className="border border-gray-300 px-4 py-2">
                {t("table.title")}
              </th>
              <th className="border border-gray-300 px-4 py-2">
                {t("table.description")}
              </th>
              <th className="border border-gray-300 px-4 py-2">
                {t("table.lastUpdated")}
              </th>
            </tr>
          </thead>
          <tbody>
            {profile.myInventories.map((inv) => (
              <tr
                onClick={() => {
                  if (session) {
                    save(`lastInventoryId_${session.user.id}`, inv.id);
                  }
                  navigate(`/inventory/${inv.id}`);
                }}
                key={inv.id}
                className="hover:bg-gray-500"
              >
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

      <h2 className="text-xl font-semibold mb-2">
        {t("accessibleInventories")}
      </h2>
      {profile.accessibleInventories.length === 0 ? (
        <p>{t("noAccessibleInventories")}</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-700">
              <th className="border border-gray-300 px-4 py-2">ID</th>
              <th className="border border-gray-300 px-4 py-2">
                {t("table.title")}
              </th>
              <th className="border border-gray-300 px-4 py-2">
                {t("creator")}
              </th>
              <th className="border border-gray-300 px-4 py-2">
                {t("table.lastUpdated")}
              </th>
            </tr>
          </thead>
          <tbody>
            {profile.accessibleInventories.map((inv) => (
              <tr
                onClick={() => {
                  if (session) {
                    save(`lastInventoryId_${session.user.id}`, inv.id);
                  }
                  navigate(`/inventory/${inv.id}`);
                }}
                key={inv.id}
                className="hover:bg-gray-500"
              >
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
