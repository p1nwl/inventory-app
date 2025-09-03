import { useAuth } from "./useAuth.js";
import {
  saveToStorage,
  getFromStorage,
  removeFromStorage,
} from "../utils/storage";

export function useLocalStorageWithUser() {
  const { session } = useAuth();
  const userId = session?.user.id || "anonymous";

  const save = <T>(key: string, data: T): void => {
    saveToStorage(`${key}_${userId}`, data);
  };

  const get = <T>(key: string, defaultValue: T): T => {
    return getFromStorage(`${key}_${userId}`, defaultValue);
  };

  const remove = (key: string): void => {
    removeFromStorage(`${key}_${userId}`);
  };

  return {
    save,
    get,
    remove,
    userId,
  };
}
