import { useContext } from "react";
import AuthContext from "../context/AuthContext.js";
import type { Session } from "../types/index.js";

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export type AuthContextType = {
  session: Session | null;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
};
