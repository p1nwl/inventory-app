import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Header() {
  const navigate = useNavigate();
  const { session, isLoading, signOut } = useAuth();

  if (isLoading) {
    return (
      <header className="bg-gray-800 text-white p-4 flex justify-between items-center mb-5 shadow-md">
        <h1 className="m-0">📦 Inventory App</h1>
        <div
          key="loading"
          className="animate-pulse bg-gray-600 h-6 w-24 rounded"
        ></div>
      </header>
    );
  }

  return (
    <header className="bg-gray-800 text-white p-4 flex justify-between items-center mb-5 shadow-md">
      <h1
        className="m-0 cursor-pointer hover:text-gray-300 transition-colors"
        onClick={() => navigate("/")}
      >
        📦 Inventory App
      </h1>

      {session && (
        <div className="flex items-center gap-4">
          <span>
            Hello, <strong>{session.user.name}</strong>
          </span>
          <nav>
            <button
              onClick={() => navigate("/profile")}
              className="bg-transparent border border-white text-white px-2.5 py-1 rounded-md cursor-pointer hover:bg-white/10 transition-colors"
            >
              My Profile
            </button>
          </nav>
          <button
            onClick={signOut}
            className="bg-red-600 text-white border-none px-2.5 py-1 rounded-md cursor-pointer hover:bg-red-700 transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </header>
  );
}
