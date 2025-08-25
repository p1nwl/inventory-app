import { useEffect } from "react";
import LoginButton from "../components/LoginButton";

function LoginPage() {
  useEffect(() => {}, []);

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h2>Welcome</h2>
      <p>Please log in to manage your inventories</p>

      <div>
        <LoginButton></LoginButton>
      </div>
    </div>
  );
}

export default LoginPage;
