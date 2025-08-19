export async function getSession() {
  const res = await fetch("http://localhost:3001/api/auth/session");
  return res.ok ? await res.json() : null;
}
