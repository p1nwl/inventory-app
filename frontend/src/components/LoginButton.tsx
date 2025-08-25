const AUTH_URL = import.meta.env.VITE_AUTH_URL;
function LoginButton() {
  const handleGoogleLogin = () => {
    window.location.href = `${AUTH_URL}/api/auth/signin/google`;
  };

  const handleFacebookLogin = () => {
    window.location.href = `${AUTH_URL}/api/auth/signin/facebook`;
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h3>Login with:</h3>
      <button
        onClick={handleGoogleLogin}
        style={{
          padding: "10px 20px",
          margin: "0 10px",
          background: "#4285F4",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Google
      </button>
      <button
        onClick={handleFacebookLogin}
        style={{
          padding: "10px 20px",
          margin: "0 10px",
          background: "#1877F2",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Facebook
      </button>
    </div>
  );
}

export default LoginButton;
