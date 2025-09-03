import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { updateTheme } from "../api/profile";
import type { ProfileData } from "../types";

export const useTheme = () => {
  const queryClient = useQueryClient();
  const [theme, setTheme] = useState<"LIGHT" | "DARK">("LIGHT");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "LIGHT" | "DARK";
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    const initialTheme = savedTheme || (systemPrefersDark ? "DARK" : "LIGHT");
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const applyTheme = (theme: "LIGHT" | "DARK") => {
    if (theme === "DARK") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === "LIGHT" ? "DARK" : "LIGHT";
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem("theme", newTheme);

    try {
      await updateTheme(newTheme);
      queryClient.setQueryData<ProfileData>(["profile"], (old) =>
        old
          ? {
              ...old,
              myInventories: old.myInventories.map((inv) => ({
                ...inv,
                permissions: inv.permissions,
              })),
              accessibleInventories: old.accessibleInventories.map((inv) => ({
                ...inv,
                permissions: inv.permissions,
              })),
            }
          : old
      );
    } catch (error) {
      console.error("Failed to save theme to server", error);
    }
  };

  return { theme, toggleTheme };
};
