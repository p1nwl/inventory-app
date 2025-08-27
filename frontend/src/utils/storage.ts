export function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to save to localStorage: ${key}`, error);
  }
}

export function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Failed to read from localStorage: ${key}`, error);
    return defaultValue;
  }
}

export function removeFromStorage(key: string): void {
  localStorage.removeItem(key);
}

export function clearUserStorage(userId: string) {
  const keys = Object.keys(localStorage);
  keys.forEach((key) => {
    if (key.includes(`_${userId}`)) {
      removeFromStorage(key);
    }
  });
}
