import { useEffect } from "react";

function App() {
  useEffect(() => {
    fetch("https://inventory-backend.onrender.com/api/hello")
      .then((res) => res.json())
      .then((data) => console.log("Backend says:", data.message))
      .catch((err) => console.error("Fetch error:", err));
  }, []);

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        padding: "20px",
        textAlign: "center",
      }}
    >
      <h1>Hello, World!</h1>
    </div>
  );
}

export default App;
