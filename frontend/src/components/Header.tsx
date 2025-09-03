import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth.js";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage.js";
import { ModeToggle } from "@/components/ModeToggle";
import { AUTH_URL } from "@/types";

export default function Header() {
  const navigate = useNavigate();
  const { session, isLoading, signOut } = useAuth();
  const { t, i18n } = useTranslation();
  const { mutate: changeLanguage } = useLanguage();

  if (isLoading) {
    return (
      <header className="bg-gray-800 text-white p-4 flex justify-between items-center mb-5 shadow-md">
        <h1 className="m-0">📦 {t("appName")}</h1>
        <div
          key="loading"
          className="animate-pulse bg-gray-600 h-6 w-24 rounded"
        ></div>
      </header>
    );
  }

  return (
    <header className="bg-gray-800 text-white p-4 flex justify-between items-center shadow-md">
      <h1
        className="m-0 cursor-pointer hover:text-gray-300 transition-colors"
        onClick={() => navigate("/")}
      >
        📦 {t("appName")}
      </h1>
      <div className="flex items-center gap-4">
        <select
          value={i18n.language}
          onChange={(e) => changeLanguage(e.target.value)}
          className="bg-gray-700 text-white px-2 py-1 rounded-md"
        >
          <option value="en">EN</option>
          <option value="ru">RU</option>
        </select>

        <ModeToggle />
        {session ? (
          <>
            <span>
              {t("hello")}, <strong>{session.user.name}</strong>
            </span>
            <nav>
              <button
                onClick={() => navigate("/profile")}
                className="bg-transparent border border-white text-white px-2.5 py-1 rounded-md cursor-pointer hover:bg-white/10 transition-colors"
              >
                {t("myProfile")}
              </button>
            </nav>
            <button
              onClick={signOut}
              className="bg-red-600 text-white border-none px-2.5 py-1 rounded-md cursor-pointer hover:bg-red-700 transition-colors"
            >
              {t("signOut")}
            </button>
          </>
        ) : (
          <button
            onClick={() =>
              (window.location.href = `${AUTH_URL}/api/auth/signin`)
            }
            className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors"
          >
            {t("signIn")}
          </button>
        )}
      </div>
    </header>
  );
}
