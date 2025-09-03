import { AUTH_URL } from "../types";
import { useTranslation } from "react-i18next";

function LoginButton() {
  const { t } = useTranslation();
  const handleGoogleLogin = () => {
    try {
      window.location.href = `${AUTH_URL}/api/auth/signin/google`;
    } catch (error) {
      console.error("Failed to redirect to Google login", error);
      alert(t("loginErrorGoogle"));
    }
  };

  const handleFacebookLogin = () => {
    try {
      window.location.href = `${AUTH_URL}/api/auth/signin/facebook`;
    } catch (error) {
      console.error("Failed to redirect to Facebook login", error);
      alert(t("loginErrorFacebook"));
    }
  };

  return (
    <div className="mt-6 space-y-4">
      <h3 className="text-lg font-medium text-gray-700">{t("loginWith")}</h3>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          onClick={handleGoogleLogin}
          aria-label={t("loginWithGoogle")}
          className="flex-1 rounded-lg bg-blue-600 px-5 py-3 text-white shadow-md transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {t("google")}
        </button>
        <button
          onClick={handleFacebookLogin}
          aria-label={t("loginWithFacebook")}
          className="flex-1 rounded-lg bg-blue-800 px-5 py-3 text-white shadow-md transition-all hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2"
        >
          {t("facebook")}
        </button>
      </div>
    </div>
  );
}

export default LoginButton;
