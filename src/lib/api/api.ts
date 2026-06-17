export async function updateSettings(data: any) {
  const res = await fetch("http://localhost:8000/settings", {
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
  const res = await fetch("http://localhost:8000/settings");

  if (!res.ok) throw new Error("Failed to fetch settings");
  return res.json();
}

