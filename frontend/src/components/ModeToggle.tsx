import { useTheme } from "@/hooks/useTheme";
import { SunIcon, MoonIcon } from "lucide-react";

export function ModeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center text-white hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      aria-label="Toggle theme"
    >
      <SunIcon
        className={`h-5 w-5 transition-transform duration-300 ${
          theme === "DARK" ? "scale-0 opacity-0" : "scale-100 opacity-100"
        }`}
      />
      <MoonIcon
        className={`absolute h-5 w-5 transition-transform duration-300 ${
          theme === "LIGHT" ? "scale-0 opacity-0" : "scale-100 opacity-100"
        }`}
      />
    </button>
  );
}
