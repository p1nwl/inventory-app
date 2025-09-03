import { API_URL } from "../types";
import type { ProfileData } from "../types";

export const fetchProfile = async (): Promise<ProfileData> => {
  const res = await fetch(`${API_URL}/api/profile`, {
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to fetch profile: ${error}`);
  }

  return res.json();
};

export const handleLanguageChange = async (lang: string) => {
  localStorage.setItem("language", lang);

  try {
    const res = await fetch(`${API_URL}/api/profile/language`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ language: lang }),
    });

    if (!res.ok) {
      return { language: lang };
    }

    return res.json();
  } catch (err) {
    console.error("Failed to save language:", err);
    return { language: lang };
  }
};
