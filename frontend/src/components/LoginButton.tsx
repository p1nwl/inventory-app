import { AUTH_URL } from "../types";
import { useTranslation } from "react-i18next";

function LoginButton() {
  const { t } = useTranslation();
  const handleLogin = () => {
    try {
      window.location.href = `${AUTH_URL}/api/auth/signin`;
    } catch (error) {
      console.error("Failed to redirect to login", error);
      alert(t("loginError"));
    }
  };

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          onClick={handleLogin}
          aria-label={t("loginWithGoogle")}
          className="flex-1 rounded-lg bg-blue-600 px-5 py-3 text-white shadow-md transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {t("Enter")}
        </button>
      </div>
    </div>
  );
}

export default LoginButton;
