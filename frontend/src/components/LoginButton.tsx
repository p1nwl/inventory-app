import { AUTH_URL } from "../types";

function LoginButton() {
  const handleGoogleLogin = () => {
    try {
      window.location.href = `${AUTH_URL}/api/auth/signin/google`;
    } catch (error) {
      console.error("Failed to redirect to Google login", error);
      alert("Unable to redirect to Google login. Please try again.");
    }
  };

  const handleFacebookLogin = () => {
    try {
      window.location.href = `${AUTH_URL}/api/auth/signin/facebook`;
    } catch (error) {
      console.error("Failed to redirect to Facebook login", error);
      alert("Unable to redirect to Facebook login. Please try again.");
    }
  };

  return (
    <div className="mt-6 space-y-4">
      <h3 className="text-lg font-medium text-gray-700">Login with:</h3>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          onClick={handleGoogleLogin}
          aria-label="Login with Google"
          className="flex-1 rounded-lg bg-blue-600 px-5 py-3 text-white shadow-md transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Google
        </button>
        <button
          onClick={handleFacebookLogin}
          aria-label="Login with Facebook"
          className="flex-1 rounded-lg bg-blue-800 px-5 py-3 text-white shadow-md transition-all hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2"
        >
          Facebook
        </button>
      </div>
    </div>
  );
}

export default LoginButton;
