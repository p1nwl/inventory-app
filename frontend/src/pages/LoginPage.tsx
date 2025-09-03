import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginButton from "../components/LoginButton";
import { getFromStorage, removeFromStorage } from "../utils/storage";
import { useAuth } from "../hooks/useAuth.js";
import { useTranslation } from "react-i18next";

function LoginPage() {
  const navigate = useNavigate();
  const { session, isLoading } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    if (session) {
      const redirectPath = getFromStorage("redirectAfterLogin", "") || "/";
      removeFromStorage("redirectAfterLogin");
      navigate(redirectPath);
    }
  }, [session, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div key="loading" className="text-lg text-gray-600">
          {t("checkingSession")}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg transition-all duration-300 hover:shadow-xl">
        <h2 className="mb-2 text-3xl font-bold text-gray-800">
          {t("welcome")}
        </h2>
        <p className="mb-6 text-gray-600">{t("loginPrompt")}</p>
        <LoginButton />
      </div>
    </div>
  );
}

export default LoginPage;
