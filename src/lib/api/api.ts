export async function updateSettings(data: any) {
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const res = await fetch(`${API_BASE_URL}/settings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to update settings");
  return res.json();
}

export async function getSettings() {
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const res = await fetch(`${API_BASE_URL}/settings`);

  if (!res.ok) throw new Error("Failed to fetch settings");
  return res.json();
}

