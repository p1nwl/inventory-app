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
